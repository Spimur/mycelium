import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { TableKit } from '@tiptap/extension-table'
import { TaskItem, TaskList } from '@tiptap/extension-list'
import { Highlight } from '@tiptap/extension-highlight'
import { TextAlign } from '@tiptap/extension-text-align'
import { Color, TextStyle } from '@tiptap/extension-text-style'
import { Placeholder } from '@tiptap/extensions'
import { useWorkspace } from '../lib/workspace'
import { uploadImage } from '../lib/images'
import { isSafeLinkUrl } from '../lib/urls'
import { t } from '../lib/i18n'
import { useToast } from '../components/Toast'
import { ImageBlock } from './ImageBlock'
import { DrawingBlock } from './DrawingBlock'
import Toolbar from './Toolbar'
import { leaveBlockSelection } from './selection'
import SlashMenu, { detectSlash } from './SlashMenu'

const SAVE_DELAY = 700

const imageFiles = (list) => [...(list ?? [])].filter((f) => f.type.startsWith('image/'))

/**
 * Editor für eine Notiz. initialJson ist der gespeicherte Inhalt (oder null),
 * onSave bekommt den neuen Inhalt als JSON-String.
 */
export default function NoteEditor({ initialJson, onSave, onStatus, editorRef }) {
  const { uid } = useWorkspace()
  const toast = useToast()
  const [slash, setSlash] = useState(null)
  const slashRef = useRef(null)
  const slashOpen = useRef(false)
  const fileInput = useRef(null)
  const saveTimer = useRef(null)
  const pending = useRef(null)

  // Der Editor wird nur einmal erstellt; seine Callbacks greifen über Refs auf die aktuellen Funktionen zu
  const flushRef = useRef(null)
  const insertImagesRef = useRef(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: 'https',
          // Nur http(s), mailto und tel – auch für eingefügte Inhalte
          isAllowedUri: (url) => isSafeLinkUrl(url),
          shouldAutoLink: (url) => isSafeLinkUrl(url),
        },
      }),
      TableKit.configure({ table: { resizable: true } }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight,
      TextStyle,
      Color,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({
        placeholder: ({ node }) =>
          node.type.name === 'heading' ? t('Überschrift') : t('Schreib los, oder tippe „/“ für Tabellen, Checklisten, Bilder …'),
      }),
      ImageBlock,
      DrawingBlock,
    ],
    content: initialJson ? JSON.parse(initialJson) : '',
    editorProps: {
      attributes: { class: 'prose-myc' },
      handleKeyDown: (_view, event) => (slashOpen.current ? (slashRef.current?.onKeyDown(event) ?? false) : false),
      handlePaste: (_view, event) => {
        const files = imageFiles(event.clipboardData?.files)
        if (!files.length) return false
        insertImagesRef.current(files)
        return true
      },
      handleDrop: (view, event) => {
        const files = imageFiles(event.dataTransfer?.files)
        if (!files.length) return false
        event.preventDefault()
        const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos
        insertImagesRef.current(files, pos)
        return true
      },
      handleClickOn: (_view, _pos, _node, _nodePos, event) => {
        // Links mit Strg/Cmd-Klick öffnen
        const link = event.target.closest?.('a[href]')
        if (link && (event.ctrlKey || event.metaKey) && isSafeLinkUrl(link.href)) {
          window.open(link.href, '_blank', 'noopener,noreferrer')
          return true
        }
        return false
      },
    },
    onUpdate: ({ editor: e }) => {
      pending.current = JSON.stringify(e.getJSON())
      onStatus('saving')
      clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => flushRef.current(), SAVE_DELAY)
    },
    onTransaction: ({ editor: e }) => {
      const next = e.isFocused || slashOpen.current ? detectSlash(e) : null
      slashOpen.current = Boolean(next)
      setSlash((prev) => (!prev && !next ? prev : next))
    },
    onBlur: () => {
      setTimeout(() => {
        slashOpen.current = false
        setSlash(null)
      }, 120)
    },
  })

  const flush = () => {
    clearTimeout(saveTimer.current)
    if (pending.current) {
      onSave(pending.current)
      pending.current = null
    }
  }

  const insertImages = async (files, pos) => {
    for (const file of files) {
      try {
        const assetId = await uploadImage(uid, file)
        const content = { type: 'imageBlock', attrs: { assetId } }
        if (pos != null) editor.chain().insertContentAt(pos, content).run()
        else editor.chain().focus().command(leaveBlockSelection).insertContent(content).run()
      } catch (err) {
        toast(err.message || t('Bild konnte nicht hochgeladen werden.'), { tone: 'error' })
      }
    }
  }

  useLayoutEffect(() => {
    flushRef.current = flush
    insertImagesRef.current = insertImages
  })

  useEffect(() => {
    if (editorRef) editorRef.current = editor
  }, [editor, editorRef])

  // Beim Verlassen der Notiz oder Schliessen des Tabs nichts verlieren
  useEffect(() => {
    const onUnload = () => flushRef.current()
    window.addEventListener('beforeunload', onUnload)
    return () => {
      window.removeEventListener('beforeunload', onUnload)
      flushRef.current()
    }
  }, [])

  const runCommand = (item) => {
    if (!slash) return
    const chain = editor.chain().focus().deleteRange({ from: slash.from, to: slash.to })
    item.run(chain, { pickImage: () => fileInput.current?.click() }).run()
    slashOpen.current = false
    setSlash(null)
  }

  if (!editor) return null

  return (
    <>
      <Toolbar editor={editor} onPickImage={() => fileInput.current?.click()} />
      <div className="mx-auto w-full max-w-3xl px-5 pt-6 sm:px-8">
        <EditorContent editor={editor} />
      </div>
      {slash && <SlashMenu ref={slashRef} slash={slash} onRun={runCommand} />}
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          insertImages(imageFiles(e.target.files))
          e.target.value = ''
        }}
      />
    </>
  )
}
