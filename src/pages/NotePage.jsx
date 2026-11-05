import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { MoreHorizontal } from 'lucide-react'
import { dateLocale, intlLocale, t } from '../lib/i18n'
import { useWorkspace } from '../lib/workspace'
import { backend } from '../lib/backend'
import { PageHeader } from '../components/Layout'
import { useNodeMenu } from '../components/NodeMenu'
import { IconButton, cx } from '../components/ui'
import Breadcrumbs from '../components/Breadcrumbs'
import NoteEditor from '../editor/NoteEditor'
import Missing from './Missing'

function TitleInput({ node, onEnter }) {
  const { updateNode } = useWorkspace()
  const [value, setValue] = useState(node.title ?? '')
  const [synced, setSynced] = useState(node.title ?? '')
  const [focused, setFocused] = useState(false)
  const ref = useRef(null)
  const timer = useRef(null)

  // Umbenennungen aus der Sidebar übernehmen, solange hier nicht getippt wird
  if ((node.title ?? '') !== synced && !focused) {
    setSynced(node.title ?? '')
    setValue(node.title ?? '')
  }

  useEffect(() => {
    const el = ref.current
    el.style.height = '0px'
    el.style.height = `${el.scrollHeight}px`
  }, [value])

  useEffect(() => () => clearTimeout(timer.current), [])

  const change = (v) => {
    setValue(v)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      setSynced(v.trim())
      updateNode(node.id, { title: v.trim() })
    }, 400)
  }

  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      placeholder={t('Unbenannte Notiz')}
      autoFocus={!node.title}
      onChange={(e) => change(e.target.value.replace(/\n/g, ''))}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || (e.key === 'ArrowDown' && e.currentTarget.selectionStart === value.length)) {
          e.preventDefault()
          onEnter()
        }
      }}
      className="w-full resize-none overflow-hidden bg-transparent font-display text-4xl leading-tight tracking-tight outline-none placeholder:text-faint sm:text-5xl"
    />
  )
}

function SaveStatus({ status, updatedAt }) {
  const [, tick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 30_000)
    return () => clearInterval(t)
  }, [])
  return (
    <span className="label hidden items-center gap-1.5 sm:flex">
      <span
        className={cx(
          'size-1.5 rounded-full transition-colors',
          status === 'saving' ? 'animate-pulse bg-accent' : status === 'error' ? 'bg-danger' : 'bg-faint',
        )}
      />
      {status === 'saving'
        ? t('Speichert …')
        : status === 'error'
          ? t('Nicht gespeichert')
          : updatedAt
            ? `${t('Gespeichert')} · ${formatDistanceToNow(updatedAt, { locale: dateLocale(), addSuffix: true })}`
            : t('Gespeichert')}
    </span>
  )
}

function Note({ node }) {
  const { uid, updateNode } = useWorkspace()
  const [content, setContent] = useState({ loaded: false, json: null })
  const [status, setStatus] = useState('saved')
  const editorRef = useRef(null)
  const menu = useNodeMenu()

  useEffect(() => {
    let alive = true
    backend
      .get(uid, 'contents', node.id)
      .then((c) => alive && setContent({ loaded: true, json: c?.json ?? null }))
      .catch(() => alive && setContent({ loaded: true, json: null, error: true }))
    return () => {
      alive = false
    }
  }, [uid, node.id])

  const save = (json) => {
    const now = Date.now()
    backend
      .put(uid, 'contents', node.id, { json, updatedAt: now })
      .then(() => setStatus('saved'))
      .catch(() => setStatus('error'))
    updateNode(node.id, {})
  }

  return (
    <>
      <PageHeader
        actions={
          <>
            <SaveStatus status={status} updatedAt={node.updatedAt} />
            <IconButton
              label={t('Mehr')}
              onClick={(e) => {
                const r = e.currentTarget.getBoundingClientRect()
                menu.open(node, { x: r.right, y: r.bottom + 4 })
              }}
            >
              <MoreHorizontal size={17} />
            </IconButton>
          </>
        }
      >
        <Breadcrumbs id={node.id} />
      </PageHeader>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-5 pt-8 sm:px-8 sm:pt-14">
          {node.icon && <div className="mb-3 text-5xl">{node.icon}</div>}
          <TitleInput
            node={node}
            onEnter={() => {
              const editor = editorRef.current
              if (!editor) return
              // Sofort fokussieren (TipTaps focus() wartet einen Frame, Tastendrücke landeten sonst noch im Titel)
              editor.view.focus()
              editor.commands.focus('start')
            }}
          />
          <p className="label mt-3">
            {t('Erstellt')} {node.createdAt ? new Date(node.createdAt).toLocaleDateString(intlLocale(), { dateStyle: 'long' }) : ''}
          </p>
        </div>
        {content.loaded ? (
          <NoteEditor initialJson={content.json} onSave={save} onStatus={setStatus} editorRef={editorRef} />
        ) : (
          <div className="mx-auto max-w-3xl space-y-3 px-5 pt-12 sm:px-8">
            {[92, 80, 86, 40].map((w) => (
              <div key={w} className="h-3.5 animate-pulse rounded bg-hover" style={{ width: `${w}%` }} />
            ))}
          </div>
        )}
      </div>
      {menu.element}
    </>
  )
}

export default function NotePage() {
  const { id } = useParams()
  const { tree, loaded } = useWorkspace()
  const node = tree.byId.get(id)
  if (!loaded.nodes) return null
  if (!node || node.type !== 'note') return <Missing />
  return <Note key={id} node={node} />
}
