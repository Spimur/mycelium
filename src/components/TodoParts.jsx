import { useState } from 'react'
import { addDays, differenceInCalendarDays, startOfDay } from 'date-fns'
import { CalendarClock, Check, Flag, Timer, Trash2, X } from 'lucide-react'
import { useWorkspace } from '../lib/workspace'
import { LEVELS, isOverdue, levelOf } from '../lib/todos'
import { fmt, fromInputs, toDateInput } from '../lib/calendar'
import { t } from '../lib/i18n'
import { Button, ConfirmDialog, Modal, cx } from './ui'
import { TagList, TagPicker } from './Tags'

export function TodoCheck({ checked, onChange, size = 18 }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={(e) => {
        e.stopPropagation()
        onChange(!checked)
      }}
      style={{ width: size, height: size }}
      className={cx(
        'grid shrink-0 place-items-center rounded-full border-[1.5px] transition-all',
        checked ? 'border-accent bg-accent text-white' : 'border-faint hover:border-accent hover:bg-accent/10',
      )}
    >
      <Check size={size * 0.6} strokeWidth={3.2} className={cx('transition-transform', checked ? 'scale-100' : 'scale-0')} />
    </button>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function dueLabel(due) {
  const diff = differenceInCalendarDays(due, Date.now())
  if (diff === 0) return t('Heute')
  if (diff === 1) return t('Morgen')
  if (diff === -1) return t('Gestern')
  if (diff > 1 && diff < 7) return fmt(due, 'EEEE')
  return fmt(due, 'd. MMM')
}

/** Kleines Abzeichen für Priorität / Dringlichkeit */
export function LevelBadge({ kind, value }) {
  if (!value) return null
  const level = levelOf(value)
  const Icon = kind === 'priority' ? Flag : Timer
  return (
    <span
      title={`${kind === 'priority' ? t('Priorität') : t('Dringlichkeit')}: ${t(level.label)}`}
      className="inline-flex items-center gap-1 text-[11.5px]"
      style={{ color: level.color }}
    >
      <Icon size={12} strokeWidth={2.2} fill={kind === 'priority' && value === 3 ? level.color : 'none'} />
      <span className="max-sm:hidden">{t(level.label)}</span>
    </span>
  )
}

export function TodoMeta({ todo }) {
  const overdue = isOverdue(todo)
  const hasMeta = todo.due != null || todo.priority || todo.urgency || todo.tagIds?.length || todo.notes
  if (!hasMeta) return null
  return (
    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
      {todo.due != null && (
        <span className={cx('inline-flex items-center gap-1 text-[11.5px]', overdue ? 'text-danger' : 'text-muted')}>
          <CalendarClock size={12} /> {dueLabel(todo.due)}
        </span>
      )}
      <LevelBadge kind="priority" value={todo.priority} />
      <LevelBadge kind="urgency" value={todo.urgency} />
      <TagList ids={todo.tagIds} />
      {todo.notes && <span className="max-w-[16rem] truncate text-[11.5px] text-faint">{todo.notes}</span>}
    </div>
  )
}

export function LevelPicker({ value, onChange }) {
  return (
    <div className="inline-flex rounded-lg border border-line-strong p-0.5">
      {LEVELS.map((l) => (
        <button
          key={l.value}
          type="button"
          onClick={() => onChange(l.value)}
          className={cx(
            'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[13px] transition-colors',
            value === l.value ? 'bg-ink text-bg' : 'text-muted hover:text-ink',
          )}
        >
          {l.color && <span className="size-2 rounded-full" style={{ background: l.color }} />}
          {t(l.label)}
        </button>
      ))}
    </div>
  )
}

/** Dialog zum Erstellen und Bearbeiten einer Aufgabe. draft.id fehlt bei neuen Aufgaben. */
export function TodoModal({ draft, onClose }) {
  const { saveTodo, deleteTodo } = useWorkspace()
  const [title, setTitle] = useState(draft.title ?? '')
  const [notes, setNotes] = useState(draft.notes ?? '')
  const [due, setDue] = useState(draft.due != null ? toDateInput(draft.due) : '')
  const [priority, setPriority] = useState(draft.priority ?? 0)
  const [urgency, setUrgency] = useState(draft.urgency ?? 0)
  const [tagIds, setTagIds] = useState(draft.tagIds ?? [])
  const [done, setDone] = useState(Boolean(draft.done))
  const [confirm, setConfirm] = useState(false)

  const save = (e) => {
    e?.preventDefault()
    if (!title.trim()) return
    saveTodo(draft.id ?? null, {
      title: title.trim(),
      notes: notes.trim(),
      due: due ? fromInputs(due) : null,
      priority,
      urgency,
      tagIds,
      done,
      doneAt: done ? (draft.doneAt ?? Date.now()) : null,
    })
    onClose()
  }

  const quickDue = [
    { label: t('Heute'), days: 0 },
    { label: t('Morgen'), days: 1 },
    { label: t('In einer Woche'), days: 7 },
  ]

  return (
    <Modal
      open
      onClose={onClose}
      width="max-w-lg"
      footer={
        <>
          {draft.id && (
            <Button variant="danger" onClick={() => setConfirm(true)}>
              <Trash2 size={15} /> {t('Löschen')}
            </Button>
          )}
          <div className="flex-1" />
          <Button onClick={onClose}>{t('Abbrechen')}</Button>
          <Button variant="primary" disabled={!title.trim()} onClick={save}>
            {draft.id ? t('Speichern') : t('Erstellen')}
          </Button>
        </>
      }
    >
      <form onSubmit={save} className="space-y-5 pt-5">
        <div className="flex items-start gap-3">
          <span className="mt-2.5">
            <TodoCheck checked={done} onChange={setDone} size={20} />
          </span>
          <input
            autoFocus={!draft.id}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('Was ist zu tun?')}
            className={cx(
              'w-full bg-transparent font-display text-3xl tracking-tight outline-none placeholder:text-faint',
              done && 'text-faint line-through',
            )}
          />
        </div>

        <div className="space-y-2">
          <p className="label flex items-center gap-1.5">
            <Flag size={11} /> {t('Priorität')} <span className="normal-case tracking-normal">· {t('wie wichtig?')}</span>
          </p>
          <LevelPicker value={priority} onChange={setPriority} />
        </div>
        <div className="space-y-2">
          <p className="label flex items-center gap-1.5">
            <Timer size={11} /> {t('Dringlichkeit')} <span className="normal-case tracking-normal">· {t('wie eilig?')}</span>
          </p>
          <LevelPicker value={urgency} onChange={setUrgency} />
        </div>

        <div className="space-y-2">
          <p className="label flex items-center gap-1.5">
            <CalendarClock size={11} /> {t('Fällig am')}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <input type="date" className="field w-44" value={due} onChange={(e) => setDue(e.target.value)} />
            {quickDue.map((q) => (
              <button
                key={q.days}
                type="button"
                onClick={() => setDue(toDateInput(addDays(startOfDay(new Date()), q.days)))}
                className="h-8 rounded-md border border-line px-2.5 text-[12.5px] text-muted hover:border-line-strong hover:text-ink"
              >
                {q.label}
              </button>
            ))}
            {due && (
              <button
                type="button"
                onClick={() => setDue('')}
                className="grid size-8 place-items-center rounded-md text-faint hover:bg-hover hover:text-ink"
                aria-label={t('Datum entfernen')}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <p className="label">{t('Tags')}</p>
          <TagPicker value={tagIds} onChange={setTagIds} />
        </div>

        <textarea
          className="field min-h-20 resize-y"
          placeholder={t('Notizen')}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <button type="submit" hidden />
      </form>

      <ConfirmDialog
        open={confirm}
        title={t('Aufgabe löschen?')}
        message={t('Das kann nicht rückgängig gemacht werden.')}
        onConfirm={() => {
          deleteTodo(draft.id)
          onClose()
        }}
        onClose={() => setConfirm(false)}
      />
    </Modal>
  )
}
