/* eslint-disable react-refresh/only-export-components -- TipTap-Erweiterungen/Hooks neben ihren Komponenten */
import { memo, useRef, useState } from 'react'
import { Node, NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react'
import { getStroke } from 'perfect-freehand'
import { Check, Eraser, Grid3x3, Highlighter, PenLine, Pencil, Trash2, Undo2 } from 'lucide-react'
import { t } from '../lib/i18n'
import { cx } from '../components/ui'
import { stopInsideControls } from './ImageBlock'

const VIEW_W = 1000
const COLORS = ['ink', '#8A4FFF', '#C8553D', '#D69A3A', '#7E9F5B', '#5B8DEF']
const SIZES = [3, 6, 12]
const BACKGROUNDS = ['dots', 'lines', 'none']

const colorOf = (c) => (c === 'ink' ? 'var(--c-ink)' : c)

function outlinePath(stroke) {
  const pts = getStroke(stroke.p, {
    size: stroke.t === 'marker' ? stroke.s * 2.6 : stroke.s,
    thinning: stroke.t === 'marker' ? 0 : 0.55,
    smoothing: 0.55,
    streamline: 0.45,
    simulatePressure: !stroke.pr,
    last: true,
  })
  if (!pts.length) return ''
  const d = pts.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length]
      acc.push(x0.toFixed(1), y0.toFixed(1), ((x0 + x1) / 2).toFixed(1), ((y0 + y1) / 2).toFixed(1))
      return acc
    },
    ['M', ...pts[0].map((v) => v.toFixed(1)), 'Q'],
  )
  return d.join(' ') + ' Z'
}

const Stroke = memo(function Stroke({ stroke }) {
  return (
    <path
      d={outlinePath(stroke)}
      fill={colorOf(stroke.c)}
      fillOpacity={stroke.t === 'marker' ? 0.35 : 1}
    />
  )
})

function Background({ type, height }) {
  if (type === 'none') return null
  return (
    <>
      <defs>
        <pattern id="myc-dots" width="25" height="25" patternUnits="userSpaceOnUse">
          <circle cx="12.5" cy="12.5" r="1.3" fill="var(--c-line-strong)" />
        </pattern>
        <pattern id="myc-lines" width="1000" height="32" patternUnits="userSpaceOnUse">
          <line x1="0" y1="31.5" x2="1000" y2="31.5" stroke="var(--c-line-strong)" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width={VIEW_W} height={height} fill={`url(#myc-${type})`} />
    </>
  )
}

function DrawingView({ node, updateAttributes, deleteNode, editor }) {
  const { strokes, height, bg } = node.attrs
  const [editing, setEditing] = useState(false)
  const [tool, setTool] = useState('pen')
  const [color, setColor] = useState('ink')
  const [size, setSize] = useState(SIZES[1])
  const [current, setCurrent] = useState(null)
  const [erased, setErased] = useState(() => new Set())
  const [liveHeight, setLiveHeight] = useState(null)
  const svgRef = useRef(null)
  const penSeen = useRef(false)
  const drawing = useRef(null)

  const shownHeight = liveHeight ?? height
  const editable = editor.isEditable

  const toPoint = (e) => {
    const r = svgRef.current.getBoundingClientRect()
    const scale = VIEW_W / r.width
    return [
      Math.round((e.clientX - r.left) * scale * 10) / 10,
      Math.round((e.clientY - r.top) * scale * 10) / 10,
      e.pointerType === 'pen' ? Math.round(e.pressure * 100) / 100 : 0.5,
    ]
  }

  const eraseAt = ([x, y]) => {
    const radius = 14
    const hits = strokes.filter(
      (s, i) => !erased.has(i) && s.p.some(([px, py]) => Math.abs(px - x) < radius && Math.abs(py - y) < radius),
    )
    if (!hits.length) return
    setErased((prev) => {
      const next = new Set(prev)
      hits.forEach((s) => next.add(strokes.indexOf(s)))
      return next
    })
  }

  const onPointerDown = (e) => {
    if (!editing) return
    if (e.pointerType === 'pen') penSeen.current = true
    // Handballen auf dem Tablet ignorieren, sobald ein Stift benutzt wurde
    if (e.pointerType === 'touch' && penSeen.current) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    const point = toPoint(e)
    drawing.current = e.pointerId
    if (tool === 'eraser') {
      eraseAt(point)
      return
    }
    setCurrent({ t: tool, c: color, s: size, pr: e.pointerType === 'pen' ? 1 : 0, p: [point] })
  }

  const onPointerMove = (e) => {
    if (drawing.current !== e.pointerId) return
    const events = e.nativeEvent.getCoalescedEvents?.() ?? [e.nativeEvent]
    const points = events.map((ev) => toPoint(ev))
    if (tool === 'eraser') return points.forEach(eraseAt)
    setCurrent((c) => c && { ...c, p: [...c.p, ...points] })
  }

  const onPointerUp = (e) => {
    if (drawing.current !== e.pointerId) return
    drawing.current = null
    if (tool === 'eraser') {
      if (erased.size) {
        updateAttributes({ strokes: strokes.filter((_, i) => !erased.has(i)) })
        setErased(new Set())
      }
      return
    }
    if (current?.p.length) updateAttributes({ strokes: [...strokes, current] })
    setCurrent(null)
  }

  const startResize = (e) => {
    e.preventDefault()
    const r = svgRef.current.getBoundingClientRect()
    const scale = VIEW_W / r.width
    const startY = e.clientY
    let next = height
    const move = (ev) => {
      next = Math.round(Math.min(3000, Math.max(160, height + (ev.clientY - startY) * scale)))
      setLiveHeight(next)
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      setLiveHeight(null)
      updateAttributes({ height: next })
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const toolButton = (id, Icon, label) => (
    <button
      title={label}
      onClick={() => setTool(id)}
      className={cx(
        'grid size-8 place-items-center rounded-md',
        tool === id ? 'bg-accent/15 text-accent-ink' : 'text-muted hover:bg-hover hover:text-ink',
      )}
    >
      <Icon size={16} />
    </button>
  )

  return (
    <NodeViewWrapper className="my-5">
      <div
        data-node-frame
        data-stop-pm={editing ? '' : undefined}
        className={cx(
          'group relative overflow-hidden rounded-lg border transition-colors',
          editing ? 'border-accent/70' : 'border-line hover:border-line-strong',
        )}
        onDoubleClick={() => editable && setEditing(true)}
      >
        {editing && (
          <div
            data-stop-pm
            className="flex flex-wrap items-center gap-0.5 border-b border-line bg-raised/90 px-1.5 py-1 backdrop-blur"
          >
            {toolButton('pen', PenLine, t('Stift'))}
            {toolButton('marker', Highlighter, t('Marker'))}
            {toolButton('eraser', Eraser, t('Radierer'))}
            <div className="mx-1 h-5 w-px bg-line" />
            {COLORS.map((c) => (
              <button
                key={c}
                title={t('Farbe')}
                onClick={() => {
                  setColor(c)
                  if (tool === 'eraser') setTool('pen')
                }}
                className={cx(
                  'grid size-7 place-items-center rounded-md',
                  color === c && tool !== 'eraser' && 'bg-hover',
                )}
              >
                <span
                  className={cx('size-4 rounded-full', color === c && 'ring-2 ring-accent ring-offset-1 ring-offset-raised')}
                  style={{ background: colorOf(c) }}
                />
              </button>
            ))}
            <div className="mx-1 h-5 w-px bg-line" />
            {SIZES.map((s) => (
              <button
                key={s}
                title={t('Strichstärke')}
                onClick={() => setSize(s)}
                className={cx('grid size-7 place-items-center rounded-md', size === s ? 'bg-hover' : 'hover:bg-hover')}
              >
                <span className="rounded-full bg-ink" style={{ width: s / 1.5 + 2, height: s / 1.5 + 2 }} />
              </button>
            ))}
            <div className="mx-1 h-5 w-px bg-line" />
            <button
              title={t('Hintergrund')}
              onClick={() => updateAttributes({ bg: BACKGROUNDS[(BACKGROUNDS.indexOf(bg) + 1) % BACKGROUNDS.length] })}
              className="grid size-8 place-items-center rounded-md text-muted hover:bg-hover hover:text-ink"
            >
              <Grid3x3 size={16} />
            </button>
            <button
              title={t('Letzten Strich entfernen')}
              disabled={!strokes.length}
              onClick={() => updateAttributes({ strokes: strokes.slice(0, -1) })}
              className="grid size-8 place-items-center rounded-md text-muted hover:bg-hover hover:text-ink disabled:opacity-30"
            >
              <Undo2 size={16} />
            </button>
            <button
              title={t('Zeichnung löschen')}
              onClick={deleteNode}
              className="grid size-8 place-items-center rounded-md text-danger hover:bg-danger/10"
            >
              <Trash2 size={16} />
            </button>
            <button
              onClick={() => setEditing(false)}
              className="ml-auto flex h-8 items-center gap-1.5 rounded-md bg-accent px-3 text-[13px] font-medium text-white"
            >
              <Check size={14} /> {t('Fertig')}
            </button>
          </div>
        )}

        <svg
          ref={svgRef}
          viewBox={`0 0 ${VIEW_W} ${shownHeight}`}
          className={cx('block w-full', editing && (tool === 'eraser' ? 'cursor-cell' : 'cursor-crosshair'))}
          style={{ touchAction: editing ? 'none' : 'auto' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <Background type={bg} height={shownHeight} />
          {strokes.map((s, i) => (erased.has(i) ? null : <Stroke key={i} stroke={s} />))}
          {current && <Stroke stroke={current} />}
        </svg>

        {!editing && editable && (
          <button
            data-stop-pm
            onClick={() => setEditing(true)}
            className="absolute top-2 right-2 flex items-center gap-1.5 rounded-md border border-line-strong bg-raised px-2.5 py-1 text-xs text-muted opacity-0 shadow-sm transition-opacity group-hover:opacity-100 hover:text-ink [@media(hover:none)]:opacity-100"
          >
            <Pencil size={12} /> {t('Zeichnen')}
          </button>
        )}
        {!editing && !strokes.length && (
          <p className="pointer-events-none absolute inset-0 grid place-items-center text-sm text-faint">
            {t('Leere Zeichenfläche')}
          </p>
        )}

        {editing && (
          <div
            data-stop-pm
            onPointerDown={startResize}
            className="absolute inset-x-0 bottom-0 flex h-3 cursor-ns-resize items-center justify-center"
          >
            <div className="h-1 w-10 rounded-full bg-line-strong" />
          </div>
        )}
      </div>
    </NodeViewWrapper>
  )
}

export const DrawingBlock = Node.create({
  name: 'drawing',
  group: 'block',
  atom: true,
  draggable: false,
  selectable: true,

  addAttributes() {
    return {
      strokes: {
        default: [],
        parseHTML: (el) => {
          try {
            return JSON.parse(el.getAttribute('data-strokes') || '[]')
          } catch {
            return []
          }
        },
        renderHTML: (attrs) => ({ 'data-strokes': JSON.stringify(attrs.strokes) }),
      },
      height: {
        default: 380,
        parseHTML: (el) => Number(el.getAttribute('data-height')) || 380,
        renderHTML: (attrs) => ({ 'data-height': attrs.height }),
      },
      bg: {
        default: 'dots',
        parseHTML: (el) => el.getAttribute('data-bg') || 'dots',
        renderHTML: (attrs) => ({ 'data-bg': attrs.bg }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-drawing]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', { 'data-drawing': '', ...HTMLAttributes }]
  },

  addNodeView() {
    return ReactNodeViewRenderer(DrawingView, { stopEvent: stopInsideControls })
  },
})
