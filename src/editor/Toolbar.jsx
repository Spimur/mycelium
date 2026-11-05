import { useState } from 'react'
import { useEditorState } from '@tiptap/react'
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Baseline,
  Bold,
  CheckSquare,
  ChevronDown,
  Code,
  Highlighter,
  Image,
  Italic,
  Link2,
  List,
  ListOrdered,
  PenTool,
  Quote,
  Redo2,
  Strikethrough,
  Table,
  Underline,
  Undo2,
} from 'lucide-react'
import { PALETTE } from '../lib/palette'
import { safeLinkUrl } from '../lib/urls'
import { t } from '../lib/i18n'
import { leaveBlockSelection } from './selection'
import { IconButton, MenuItem, Popover, cx } from '../components/ui'

const BLOCK_TYPES = [
  { label: 'Text', test: (e) => e.isActive('paragraph'), run: (c) => c.setParagraph() },
  { label: 'Überschrift 1', test: (e) => e.isActive('heading', { level: 1 }), run: (c) => c.setHeading({ level: 1 }) },
  { label: 'Überschrift 2', test: (e) => e.isActive('heading', { level: 2 }), run: (c) => c.setHeading({ level: 2 }) },
  { label: 'Überschrift 3', test: (e) => e.isActive('heading', { level: 3 }), run: (c) => c.setHeading({ level: 3 }) },
  { label: 'Code', test: (e) => e.isActive('codeBlock'), run: (c) => c.setCodeBlock() },
]

const Divider = () => <div className="mx-1 h-5 w-px shrink-0 bg-line" />

function TableBar({ editor }) {
  const btn = (label, run, danger) => (
    <button
      key={label}
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => run(editor.chain().focus()).run()}
      className={cx(
        'h-7 shrink-0 rounded-md px-2 text-[12.5px] whitespace-nowrap',
        danger ? 'text-danger hover:bg-danger/10' : 'text-muted hover:bg-hover hover:text-ink',
      )}
    >
      {t(label)}
    </button>
  )
  return (
    <div className="flex items-center gap-0.5 overflow-x-auto border-t border-line px-2 py-1">
      <span className="label mr-1 shrink-0">{t('Tabelle')}</span>
      {btn('+ Zeile', (c) => c.addRowAfter())}
      {btn('+ Spalte', (c) => c.addColumnAfter())}
      {btn('− Zeile', (c) => c.deleteRow())}
      {btn('− Spalte', (c) => c.deleteColumn())}
      {btn('Kopfzeile', (c) => c.toggleHeaderRow())}
      {btn('Verbinden / Teilen', (c) => c.mergeOrSplit())}
      {btn('Tabelle löschen', (c) => c.deleteTable(), true)}
    </div>
  )
}

export default function Toolbar({ editor, onPickImage }) {
  const [menu, setMenu] = useState(null) // { type, at }

  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      underline: e.isActive('underline'),
      strike: e.isActive('strike'),
      code: e.isActive('code'),
      highlight: e.isActive('highlight'),
      link: e.isActive('link'),
      bullet: e.isActive('bulletList'),
      ordered: e.isActive('orderedList'),
      task: e.isActive('taskList'),
      quote: e.isActive('blockquote'),
      table: e.isActive('table'),
      align: ['center', 'right'].find((a) => e.isActive({ textAlign: a })) ?? 'left',
      color: e.getAttributes('textStyle').color ?? null,
      block: BLOCK_TYPES.find((b) => b.test(e))?.label ?? 'Text',
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  })

  const chain = () => editor.chain().focus()
  const open = (type) => (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    setMenu({ type, at: { x: r.left, y: r.bottom + 4, top: r.top } })
  }
  const close = () => setMenu(null)

  const tb = (label, Icon, active, run, disabled) => (
    <IconButton
      compact
      label={label}
      active={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => run(chain()).run()}
    >
      <Icon size={16} strokeWidth={1.9} />
    </IconButton>
  )

  const AlignIcon = { left: AlignLeft, center: AlignCenter, right: AlignRight }[s.align]

  return (
    <div className="sticky top-0 z-20 border-b border-line bg-bg/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-3xl items-center gap-0.5 overflow-x-auto px-3 py-1.5 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible sm:px-6">
        {tb(t('Rückgängig'), Undo2, false, (c) => c.undo(), !s.canUndo)}
        {tb(t('Wiederholen'), Redo2, false, (c) => c.redo(), !s.canRedo)}
        <Divider />
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={open('block')}
          className="flex h-8 shrink-0 items-center gap-1 rounded-md px-2 text-[13px] text-muted hover:bg-hover hover:text-ink"
        >
          <span className="w-[86px] truncate text-left">{t(s.block)}</span>
          <ChevronDown size={13} />
        </button>
        <Divider />
        {tb(t('Fett (Strg+B)'), Bold, s.bold, (c) => c.toggleBold())}
        {tb(t('Kursiv (Strg+I)'), Italic, s.italic, (c) => c.toggleItalic())}
        {tb(t('Unterstrichen (Strg+U)'), Underline, s.underline, (c) => c.toggleUnderline())}
        {tb(t('Durchgestrichen'), Strikethrough, s.strike, (c) => c.toggleStrike())}
        {tb(t('Markieren'), Highlighter, s.highlight, (c) => c.toggleHighlight())}
        <IconButton compact label={t('Textfarbe')} onMouseDown={(e) => e.preventDefault()} onClick={open('color')}>
          <Baseline size={16} strokeWidth={1.9} style={s.color ? { color: s.color } : undefined} />
        </IconButton>
        {tb(t('Code'), Code, s.code, (c) => c.toggleCode())}
        <IconButton compact label={t('Link')} active={s.link} onMouseDown={(e) => e.preventDefault()} onClick={open('link')}>
          <Link2 size={16} strokeWidth={1.9} />
        </IconButton>
        <Divider />
        {tb(t('Checkliste'), CheckSquare, s.task, (c) => c.toggleTaskList())}
        {tb(t('Aufzählung'), List, s.bullet, (c) => c.toggleBulletList())}
        {tb(t('Nummerierung'), ListOrdered, s.ordered, (c) => c.toggleOrderedList())}
        {tb(t('Zitat'), Quote, s.quote, (c) => c.toggleBlockquote())}
        <IconButton compact label={t('Ausrichtung')} onMouseDown={(e) => e.preventDefault()} onClick={open('align')}>
          <AlignIcon size={16} strokeWidth={1.9} />
        </IconButton>
        <Divider />
        <IconButton compact label={t('Bild einfügen')} onClick={onPickImage}>
          <Image size={16} strokeWidth={1.9} />
        </IconButton>
        {tb(t('Tabelle einfügen'), Table, false, (c) =>
          c.command(leaveBlockSelection).insertTable({ rows: 3, cols: 3, withHeaderRow: true }),
        )}
        {tb(t('Zeichnung einfügen'), PenTool, false, (c) =>
          c.command(leaveBlockSelection).insertContent({ type: 'drawing' }),
        )}
      </div>
      {s.table && <TableBar editor={editor} />}

      <Popover at={menu?.type === 'block' ? menu.at : null} onClose={close}>
        {BLOCK_TYPES.map((b) => (
          <MenuItem
            key={b.label}
            active={s.block === b.label}
            onClick={() => {
              b.run(chain()).run()
              close()
            }}
          >
            {t(b.label)}
          </MenuItem>
        ))}
      </Popover>

      <Popover at={menu?.type === 'align' ? menu.at : null} onClose={close}>
        {[
          ['left', 'Links', AlignLeft],
          ['center', 'Zentriert', AlignCenter],
          ['right', 'Rechts', AlignRight],
        ].map(([value, label, Icon]) => (
          <MenuItem
            key={value}
            icon={Icon}
            active={s.align === value}
            onClick={() => {
              chain().setTextAlign(value).run()
              close()
            }}
          >
            {t(label)}
          </MenuItem>
        ))}
      </Popover>

      <Popover at={menu?.type === 'color' ? menu.at : null} onClose={close} className="!min-w-0 p-2">
        <div className="grid grid-cols-5 gap-1.5">
          <button
            title={t('Standard')}
            onClick={() => {
              chain().unsetColor().run()
              close()
            }}
            className="grid size-7 place-items-center rounded-md border border-line-strong font-display text-base"
          >
            A
          </button>
          {PALETTE.map((c) => (
            <button
              key={c.id}
              title={t(c.name)}
              onClick={() => {
                chain().setColor(c.hex).run()
                close()
              }}
              className="grid size-7 place-items-center rounded-md font-display text-base hover:bg-hover"
              style={{ color: c.hex }}
            >
              A
            </button>
          ))}
        </div>
      </Popover>

      {menu?.type === 'link' && <LinkPopover editor={editor} at={menu.at} onClose={close} />}
    </div>
  )
}

function LinkPopover({ editor, at, onClose }) {
  const [url, setUrl] = useState(() => editor.getAttributes('link').href ?? '')
  const [invalid, setInvalid] = useState(false)
  const apply = (e) => {
    e.preventDefault()
    const chain = editor.chain().focus().extendMarkRange('link')
    if (!url.trim()) {
      chain.unsetLink().run()
      return onClose()
    }
    const href = safeLinkUrl(url)
    if (!href) return setInvalid(true)
    chain.setLink({ href }).run()
    onClose()
  }
  return (
    <Popover at={at} onClose={onClose} className="w-72 p-2">
      <form onSubmit={apply} className="flex gap-1.5">
        <input
          autoFocus
          className="field h-8 py-0 text-[13px]"
          placeholder="https://…"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value)
            setInvalid(false)
          }}
        />
        <button className="h-8 rounded-md bg-accent px-3 text-[13px] text-white">OK</button>
      </form>
      {invalid && <p className="mt-1.5 px-0.5 text-xs text-danger">{t('Nur Web-, E-Mail- und Telefon-Links sind erlaubt.')}</p>}
    </Popover>
  )
}
