import { useState } from 'react'
import { Check, Eye, EyeOff, Plus, X } from 'lucide-react'
import { useWorkspace } from '../lib/workspace'
import { PALETTE, colorHex } from '../lib/palette'
import { UNTAGGED } from '../lib/calendar'
import { t } from '../lib/i18n'
import { Swatches, cx } from './ui'

export function TagChip({ tag, onRemove, small, className }) {
  const hex = colorHex(tag.color)
  return (
    <span
      style={{ background: `color-mix(in srgb, ${hex} 16%, transparent)`, color: `color-mix(in srgb, ${hex} 70%, var(--c-ink))` }}
      className={cx(
        'inline-flex max-w-full items-center gap-1 rounded-full font-medium whitespace-nowrap',
        small ? 'h-[18px] px-1.5 text-[10.5px]' : 'h-6 px-2 text-[12px]',
        className,
      )}
    >
      <span className="size-1.5 shrink-0 rounded-full" style={{ background: hex }} />
      <span className="truncate">{tag.name}</span>
      {onRemove && (
        <button type="button" onClick={onRemove} className="-mr-0.5 opacity-60 hover:opacity-100" aria-label={t('Entfernen')}>
          <X size={11} />
        </button>
      )}
    </span>
  )
}

/** Kurze Tag-Liste für Zeilen und Karten */
export function TagList({ ids, small = true, max = 3 }) {
  const { tags } = useWorkspace()
  const own = tags.filter((tag) => ids?.includes(tag.id))
  if (!own.length) return null
  return (
    <span className="inline-flex min-w-0 flex-wrap items-center gap-1">
      {own.slice(0, max).map((tag) => (
        <TagChip key={tag.id} tag={tag} small={small} />
      ))}
      {own.length > max && <span className="text-[10.5px] text-faint">+{own.length - max}</span>}
    </span>
  )
}

// Erste noch unbenutzte Farbe, damit sich Tags auf einen Blick unterscheiden
const nextColor = (used) => (PALETTE.find((c) => !used.includes(c.id)) ?? PALETTE[used.length % PALETTE.length]).id

/** Formular zum Anlegen eines Tags (Name + Farbe) */
export function NewTagForm({ onCreated, onCancel, autoFocus = true }) {
  const { saveTag, tags } = useWorkspace()
  const [name, setName] = useState('')
  const [color, setColor] = useState(() => nextColor(tags.map((tag) => tag.color)))
  const submit = () => {
    if (!name.trim()) return
    const id = saveTag(null, { name: name.trim(), color })
    onCreated?.(id)
    setName('')
    setColor(nextColor([...tags.map((tag) => tag.color), color]))
  }
  return (
    <div className="space-y-2.5 rounded-lg border border-line p-3">
      <div className="flex gap-2">
        <input
          autoFocus={autoFocus}
          className="field h-8 py-0 text-[13px]"
          placeholder={t('Name des Tags, z. B. Uni')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              submit()
            }
            if (e.key === 'Escape') {
              e.stopPropagation()
              onCancel?.()
            }
          }}
        />
        <button
          type="button"
          disabled={!name.trim()}
          onClick={submit}
          className="h-8 shrink-0 rounded-md bg-accent px-3 text-[13px] text-white disabled:opacity-40"
        >
          {t('Anlegen')}
        </button>
      </div>
      <Swatches value={color} onChange={setColor} size="size-5" />
    </div>
  )
}

/** Auswahl mehrerer Tags inkl. neuen Tag anlegen */
export function TagPicker({ value = [], onChange }) {
  const { tags } = useWorkspace()
  const [creating, setCreating] = useState(false)
  const toggle = (id) => onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id])

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => {
          const on = value.includes(tag.id)
          const hex = colorHex(tag.color)
          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggle(tag.id)}
              style={on ? { background: `color-mix(in srgb, ${hex} 20%, transparent)`, borderColor: hex } : undefined}
              className={cx(
                'flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[12.5px] transition-colors',
                on ? 'text-ink' : 'border-line-strong text-muted hover:text-ink',
              )}
            >
              {on ? <Check size={12} style={{ color: hex }} /> : <span className="size-2 rounded-full" style={{ background: hex }} />}
              {tag.name}
            </button>
          )
        })}
        {!creating && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="flex h-7 items-center gap-1 rounded-full border border-dashed border-line-strong px-2.5 text-[12.5px] text-muted hover:border-accent hover:text-accent-ink"
          >
            <Plus size={12} /> {t('Neuer Tag')}
          </button>
        )}
      </div>
      {creating && (
        <NewTagForm
          onCreated={(id) => {
            onChange([...value, id])
            setCreating(false)
          }}
          onCancel={() => setCreating(false)}
        />
      )}
    </div>
  )
}

/** Ein-/Ausblenden von Tags (Kalender). hidden: Set von Tag-IDs, inkl. UNTAGGED */
export function TagFilter({ hidden, onChange }) {
  const { tags } = useWorkspace()
  const toggle = (id) => {
    const next = new Set(hidden)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onChange(next)
  }
  // Nur diesen Tag zeigen
  const solo = (id) => onChange(new Set([...tags.map((tag) => tag.id), UNTAGGED].filter((x) => x !== id)))

  const row = (id, name, hex) => {
    const off = hidden.has(id)
    return (
      <div key={id} className="group flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-hover">
        <button type="button" onClick={() => toggle(id)} className="flex min-w-0 flex-1 items-center gap-2 text-left text-[13px]">
          <span
            className={cx('grid size-4 shrink-0 place-items-center rounded-[4px] border transition-colors')}
            style={off ? { borderColor: 'var(--c-line-strong)' } : { background: hex, borderColor: hex }}
          >
            {!off && <Check size={11} strokeWidth={3} className="text-white" />}
          </span>
          <span className={cx('truncate', off && 'text-faint line-through')}>{name}</span>
        </button>
        <button
          type="button"
          onClick={() => solo(id)}
          title={t('Nur diesen anzeigen')}
          className="text-[11px] text-faint opacity-0 group-hover:opacity-100 hover:text-ink [@media(hover:none)]:hidden"
        >
          {t('nur')}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-0.5">
      {tags.map((tag) => row(tag.id, tag.name, colorHex(tag.color)))}
      {row(UNTAGGED, t('Ohne Tag'), 'var(--c-faint)')}
      <div className="flex gap-3 px-1.5 pt-1.5 text-[11.5px]">
        <button type="button" onClick={() => onChange(new Set())} className="flex items-center gap-1 text-muted hover:text-ink">
          <Eye size={12} /> {t('Alle')}
        </button>
        <button
          type="button"
          onClick={() => onChange(new Set([...tags.map((tag) => tag.id), UNTAGGED]))}
          className="flex items-center gap-1 text-muted hover:text-ink"
        >
          <EyeOff size={12} /> {t('Keine')}
        </button>
      </div>
    </div>
  )
}
