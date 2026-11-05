/* eslint-disable react-refresh/only-export-components -- TipTap-Erweiterungen/Hooks neben ihren Komponenten */
import { useEffect, useRef, useState } from 'react'
import { Node, NodeViewWrapper, ReactNodeViewRenderer, mergeAttributes } from '@tiptap/react'
import { AlignCenter, AlignLeft, AlignRight, ImageOff, Trash2 } from 'lucide-react'
import { useWorkspace } from '../lib/workspace'
import { loadAsset } from '../lib/images'
import { isSafeImageSrc } from '../lib/urls'
import { cx } from '../components/ui'

// Ereignisse in Elementen mit data-stop-pm bekommt ProseMirror nicht zu sehen
export const stopInsideControls = ({ event }) => Boolean(event.target?.closest?.('[data-stop-pm]'))

function ImageView({ node, updateAttributes, deleteNode, selected, editor }) {
  const { uid } = useWorkspace()
  const { assetId, src, width, align } = node.attrs
  const [loaded, setLoaded] = useState({ id: null, data: null, failed: false })
  const frameRef = useRef(null)
  const [liveWidth, setLiveWidth] = useState(null)

  useEffect(() => {
    if (!assetId) return
    let alive = true
    loadAsset(uid, assetId)
      .then((data) => alive && setLoaded({ id: assetId, data, failed: !data }))
      .catch(() => alive && setLoaded({ id: assetId, data: null, failed: true }))
    return () => {
      alive = false
    }
  }, [uid, assetId])

  const url = src || (loaded.id === assetId ? loaded.data : null)
  const failed = !src && loaded.id === assetId && loaded.failed
  const shownWidth = liveWidth ?? width
  const editable = editor.isEditable

  const startResize = (e, side) => {
    e.preventDefault()
    e.stopPropagation()
    const container = frameRef.current.parentElement.getBoundingClientRect()
    const frame = frameRef.current.getBoundingClientRect()
    const startX = e.clientX
    let next = width
    const move = (ev) => {
      const delta = (ev.clientX - startX) * (side === 'right' ? 1 : -1) * (align === 'center' ? 2 : 1)
      next = Math.round(Math.min(100, Math.max(15, ((frame.width + delta) / container.width) * 100)))
      setLiveWidth(next)
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      setLiveWidth(null)
      updateAttributes({ width: next })
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  return (
    <NodeViewWrapper
      className={cx(
        'my-5 flex',
        align === 'left' && 'justify-start',
        align === 'center' && 'justify-center',
        align === 'right' && 'justify-end',
      )}
    >
      <figure ref={frameRef} data-node-frame style={{ width: `${shownWidth}%` }} className="group relative rounded-md">
        {url ? (
          <img src={url} alt="" draggable={false} className="block w-full rounded-md" />
        ) : failed ? (
          <div className="grid aspect-video place-items-center rounded-md border border-dashed border-line-strong text-faint">
            <ImageOff size={22} />
          </div>
        ) : (
          <div className="aspect-video animate-pulse rounded-md bg-hover" />
        )}

        {editable && (
          <>
            {['left', 'right'].map((side) => (
              <div
                key={side}
                data-stop-pm
                onPointerDown={(e) => startResize(e, side)}
                className={cx(
                  'absolute top-1/2 h-12 w-1.5 -translate-y-1/2 cursor-ew-resize rounded-full bg-ink/70 opacity-0 shadow transition-opacity group-hover:opacity-100',
                  side === 'left' ? 'left-1.5' : 'right-1.5',
                  selected && 'opacity-100',
                )}
              />
            ))}
            {selected && (
              <div
                data-stop-pm
                className="animate-rise absolute top-2 left-1/2 flex -translate-x-1/2 items-center gap-0.5 rounded-lg border border-line-strong bg-raised p-0.5 shadow-lg"
              >
                {[
                  ['left', AlignLeft],
                  ['center', AlignCenter],
                  ['right', AlignRight],
                ].map(([value, Icon]) => (
                  <button
                    key={value}
                    onClick={() => updateAttributes({ align: value })}
                    className={cx(
                      'grid size-7 place-items-center rounded-md',
                      align === value ? 'bg-accent/15 text-accent-ink' : 'text-muted hover:bg-hover',
                    )}
                  >
                    <Icon size={14} />
                  </button>
                ))}
                <span className="px-1.5 font-mono text-[11px] text-faint">{shownWidth}%</span>
                <button onClick={deleteNode} className="grid size-7 place-items-center rounded-md text-danger hover:bg-danger/10">
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </>
        )}
      </figure>
    </NodeViewWrapper>
  )
}

export const ImageBlock = Node.create({
  name: 'imageBlock',
  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      assetId: { default: null },
      src: { default: null },
      width: { default: 100 },
      align: { default: 'center' },
    }
  },

  parseHTML() {
    // Eingefügte fremde Bilder nur über HTTPS (kein http, kein javascript: o. Ä.)
    return [
      {
        tag: 'img[src]',
        getAttrs: (el) => (isSafeImageSrc(el.getAttribute('src')) ? { src: el.getAttribute('src') } : false),
      },
    ]
  },

  renderHTML({ node }) {
    return ['img', mergeAttributes({ src: node.attrs.src ?? '', 'data-asset': node.attrs.assetId ?? '' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageView, { stopEvent: stopInsideControls })
  },
})
