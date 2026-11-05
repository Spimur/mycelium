import { useState } from 'react'
import { AlignLeft, MapPin, Repeat, Tag, Trash2 } from 'lucide-react'
import { useWorkspace } from '../lib/workspace'
import { colorHex } from '../lib/palette'
import { REPEAT_OPTIONS, fromInputs, toDateInput, toTimeInput } from '../lib/calendar'
import { t } from '../lib/i18n'
import { Button, ConfirmDialog, Modal, Swatches, cx } from '../components/ui'
import { TagPicker } from '../components/Tags'

function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm select-none">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cx('relative h-5 w-9 rounded-full transition-colors', checked ? 'bg-accent' : 'bg-line-strong')}
      >
        <span
          className={cx(
            'absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow transition-transform',
            checked && 'translate-x-4',
          )}
        />
      </button>
      {label}
    </label>
  )
}

/**
 * draft: { id?, title, start, end, allDay, color, location, notes, repeat, repeatUntil, tagIds }
 * Für ein bestehendes Vorkommen einer Serie wird immer die ganze Serie bearbeitet.
 */
export default function EventModal({ draft, onClose }) {
  const { saveEvent, deleteEvent, events } = useWorkspace()
  const original = draft.id ? events.find((e) => e.id === draft.id) : null
  const base = original ?? draft

  const [title, setTitle] = useState(base.title ?? '')
  const [color, setColor] = useState(base.color ?? 'violet')
  const [allDay, setAllDay] = useState(Boolean(base.allDay))
  const [startDate, setStartDate] = useState(toDateInput(base.start))
  const [startTime, setStartTime] = useState(toTimeInput(base.start))
  const [endDate, setEndDate] = useState(toDateInput(base.end))
  const [endTime, setEndTime] = useState(toTimeInput(base.end))
  const [location, setLocation] = useState(base.location ?? '')
  const [notes, setNotes] = useState(base.notes ?? '')
  const [repeat, setRepeat] = useState(base.repeat ?? 'none')
  const [repeatUntil, setRepeatUntil] = useState(base.repeatUntil ? toDateInput(base.repeatUntil) : '')
  const [tagIds, setTagIds] = useState(base.tagIds ?? [])
  const [confirm, setConfirm] = useState(false)

  const start = allDay ? fromInputs(startDate) : fromInputs(startDate, startTime)
  const end = allDay ? fromInputs(endDate) : fromInputs(endDate, endTime)
  const invalid = !startDate || !endDate || end < start
  const isSeries = base.repeat && base.repeat !== 'none'

  // Startänderung verschiebt das Ende mit, damit die Dauer erhalten bleibt
  const changeStart = (date, time) => {
    const duration = end - start
    const nextStart = allDay ? fromInputs(date) : fromInputs(date, time)
    const nextEnd = nextStart + Math.max(duration, 0)
    setStartDate(date)
    setStartTime(time)
    setEndDate(toDateInput(nextEnd))
    setEndTime(toTimeInput(nextEnd))
  }

  const save = (e) => {
    e?.preventDefault()
    if (invalid) return
    saveEvent(draft.id ?? null, {
      title: title.trim(),
      color,
      allDay,
      start,
      end: allDay ? end : Math.max(end, start + 15 * 60_000),
      location: location.trim(),
      notes: notes.trim(),
      repeat,
      repeatUntil: repeat !== 'none' && repeatUntil ? fromInputs(repeatUntil) : null,
      tagIds,
    })
    onClose()
  }

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
          <Button variant="primary" disabled={invalid} onClick={save}>
            {draft.id ? t('Speichern') : t('Erstellen')}
          </Button>
        </>
      }
    >
      <form onSubmit={save} className="space-y-5 pt-5">
        <div className="flex items-start gap-3">
          <span className="mt-3 size-3 shrink-0 rounded-full" style={{ background: colorHex(color) }} />
          <input
            autoFocus={!draft.id}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('Titel des Termins')}
            className="w-full bg-transparent font-display text-3xl tracking-tight outline-none placeholder:text-faint"
          />
        </div>

        <Swatches value={color} onChange={setColor} />

        <div className="space-y-3 rounded-lg border border-line p-3.5">
          <Toggle checked={allDay} onChange={setAllDay} label={t('Ganztägig')} />
          <div className="grid grid-cols-[2.6rem_1fr_auto] items-center gap-2">
            <span className="label">{t('Von')}</span>
            <input type="date" className="field" value={startDate} onChange={(e) => changeStart(e.target.value, startTime)} />
            {!allDay && (
              <input type="time" className="field w-28" value={startTime} onChange={(e) => changeStart(startDate, e.target.value)} />
            )}
            <span className="label">{t('Bis')}</span>
            <input type="date" className="field" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            {!allDay && <input type="time" className="field w-28" value={endTime} onChange={(e) => setEndTime(e.target.value)} />}
          </div>
          {invalid && <p className="text-xs text-danger">{t('Das Ende liegt vor dem Beginn.')}</p>}
        </div>

        <div className="flex items-start gap-2.5">
          <Tag size={15} className="mt-1.5 shrink-0 text-faint" />
          <div className="min-w-0 flex-1">
            <TagPicker value={tagIds} onChange={setTagIds} />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-2.5">
            <Repeat size={15} className="shrink-0 text-faint" />
            <select className="field" value={repeat} onChange={(e) => setRepeat(e.target.value)}>
              {REPEAT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.value === 'none' ? t('Keine Wiederholung') : t(o.label)}
                </option>
              ))}
            </select>
          </label>
          {repeat !== 'none' && (
            <label className="flex items-center gap-2.5">
              <span className="label shrink-0">{t('bis')}</span>
              <input
                type="date"
                className="field"
                value={repeatUntil}
                min={startDate}
                onChange={(e) => setRepeatUntil(e.target.value)}
              />
            </label>
          )}
        </div>

        <label className="flex items-center gap-2.5">
          <MapPin size={15} className="shrink-0 text-faint" />
          <input className="field" placeholder={t('Ort')} value={location} onChange={(e) => setLocation(e.target.value)} />
        </label>
        <label className="flex items-start gap-2.5">
          <AlignLeft size={15} className="mt-2.5 shrink-0 text-faint" />
          <textarea
            className="field min-h-20 resize-y"
            placeholder={t('Notizen')}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>
        {isSeries && draft.id && <p className="text-xs text-faint">{t('Änderungen gelten für alle Termine dieser Serie.')}</p>}
        <button type="submit" hidden />
      </form>

      <ConfirmDialog
        open={confirm}
        title={t('Termin löschen?')}
        message={isSeries ? t('Die ganze Serie wird gelöscht.') : t('Das kann nicht rückgängig gemacht werden.')}
        onConfirm={() => {
          deleteEvent(draft.id)
          onClose()
        }}
        onClose={() => setConfirm(false)}
      />
    </Modal>
  )
}
