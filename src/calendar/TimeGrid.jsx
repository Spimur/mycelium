import { useEffect, useRef, useState } from 'react'
import { endOfDay, isToday, startOfDay } from 'date-fns'
import { Repeat } from 'lucide-react'
import { fmt, layoutDay, occursOnDay, timeLabel } from '../lib/calendar'
import { eventStyle } from '../lib/palette'
import { t } from '../lib/i18n'
import { cx } from '../components/ui'
import { EventChip } from './shared'

const HOUR_H = 52
const SNAP = 15 * 60_000
const MIN = 60_000

const snap = (ms) => Math.round(ms / SNAP) * SNAP

function NowLine({ day }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(t)
  }, [])
  if (!isToday(day)) return null
  const top = ((now - startOfDay(now).getTime()) / 3_600_000) * HOUR_H
  return (
    <div className="pointer-events-none absolute inset-x-0 z-20" style={{ top }}>
      <div className="absolute -top-[4.5px] -left-[5px] size-[9px] rounded-full bg-accent" />
      <div className="h-[1.5px] bg-accent" />
    </div>
  )
}

/**
 * Wochen- bzw. Tagesansicht. days: Array von Datumswerten (1 oder 7).
 * onCreate({start, end, allDay}) / onOpen(occ) / onMove(occ, newStart, newEnd)
 */
export default function TimeGrid({ days, occs, onCreate, onOpen, onMove, onPickDay }) {
  const scrollRef = useRef(null)
  const colsRef = useRef(null)
  const [preview, setPreview] = useState(null) // { kind, occ?, start, end }

  useEffect(() => {
    // Beim Öffnen zur aktuellen Uhrzeit bzw. auf 7 Uhr scrollen
    const hasToday = days.some((d) => isToday(d))
    const hour = hasToday ? Math.max(0, new Date().getHours() - 2) : 7
    scrollRef.current.scrollTop = hour * HOUR_H
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days.length])

  const allDay = occs.filter((o) => o.allDay || o.end - o.start >= 86_400_000)
  const timed = occs.filter((o) => !allDay.includes(o))

  // Zeitpunkt unter dem Mauszeiger
  const pointToTime = (clientX, clientY) => {
    const r = colsRef.current.getBoundingClientRect()
    const col = Math.min(days.length - 1, Math.max(0, Math.floor(((clientX - r.left) / r.width) * days.length)))
    const minutes = ((clientY - r.top) / HOUR_H) * 60
    return startOfDay(days[col]).getTime() + Math.min(24 * 60, Math.max(0, minutes)) * MIN
  }

  const track = (e, onMoveFn, onUp) => {
    const move = (ev) => onMoveFn(ev)
    const up = (ev) => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      onUp(ev)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  // Auf freie Fläche ziehen: neuen Termin aufspannen
  const onGridPointerDown = (e) => {
    if (e.button !== 0 || e.target !== e.currentTarget) return
    if (e.pointerType === 'touch') return // auf Touch-Geräten scrollen; Antippen erzeugt einen Termin (onClick)
    e.preventDefault()
    const anchor = snap(pointToTime(e.clientX, e.clientY) - SNAP / 2)
    let current = { kind: 'create', start: anchor, end: anchor + SNAP * 2 }
    setPreview(current)
    track(
      e,
      (ev) => {
        const t = snap(pointToTime(ev.clientX, ev.clientY))
        current = t >= anchor + SNAP ? { kind: 'create', start: anchor, end: t } : { kind: 'create', start: Math.min(t, anchor), end: anchor + SNAP }
        setPreview(current)
      },
      () => {
        setPreview(null)
        const span = current.end - current.start
        onCreate({ start: current.start, end: span <= SNAP * 2 ? current.start + 60 * MIN : current.end, allDay: false })
      },
    )
  }

  const onGridClick = (e) => {
    if (e.target !== e.currentTarget || e.nativeEvent.pointerType !== 'touch') return
    const start = Math.floor(pointToTime(e.clientX, e.clientY) / (30 * MIN)) * 30 * MIN
    onCreate({ start, end: start + 60 * MIN, allDay: false })
  }

  // Termin verschieben oder (am unteren Rand) verlängern
  const onEventPointerDown = (e, occ, mode) => {
    if (e.button !== 0) return
    e.stopPropagation()
    if (e.pointerType === 'touch' && mode === 'move') return // Antippen öffnet den Termin
    e.preventDefault()
    const grab = pointToTime(e.clientX, e.clientY)
    const duration = occ.end - occ.start
    let moved = false
    let current = null
    track(
      e,
      (ev) => {
        const t = pointToTime(ev.clientX, ev.clientY)
        if (!moved && Math.abs(t - grab) < 8 * MIN && Math.abs(ev.clientX - e.clientX) < 6) return
        moved = true
        if (mode === 'move') {
          const start = snap(occ.start + (t - grab))
          current = { kind: 'move', occ, start, end: start + duration }
        } else {
          current = { kind: 'move', occ, start: occ.start, end: Math.max(occ.start + SNAP, snap(t)) }
        }
        setPreview(current)
      },
      () => {
        setPreview(null)
        if (!moved) return onOpen(occ)
        if (current && (current.start !== occ.start || current.end !== occ.end)) onMove(occ, current.start, current.end)
      },
    )
  }

  const blockStyle = (start, end, day) => {
    const dayStart = startOfDay(day).getTime()
    const s = Math.max(start, dayStart)
    const e = Math.min(end, endOfDay(day).getTime() + 1)
    return {
      top: ((s - dayStart) / 3_600_000) * HOUR_H,
      height: Math.max(((e - s) / 3_600_000) * HOUR_H - 2, 18),
    }
  }

  const showWeekday = days.length > 1

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Kopfzeile mit Tagen und Ganztagsterminen */}
      <div className="flex max-h-[40%] overflow-y-auto border-b border-line [scrollbar-gutter:stable]">
        <div className="w-14 shrink-0" />
        <div className="grid flex-1" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}>
          {days.map((day) => {
            const dayAllDay = allDay.filter((o) => occursOnDay(o, day))
            return (
              <div key={+day} className="min-w-0 border-l border-line px-1 pb-1.5">
                <button
                  onClick={() => onPickDay(day)}
                  className={cx('flex w-full items-baseline gap-1.5 px-1 pt-2 pb-1.5', showWeekday ? 'justify-center' : 'justify-start')}
                >
                  <span className="label">{fmt(day, showWeekday ? 'EEE' : 'EEEE')}</span>
                  <span
                    className={cx(
                      'grid h-7 min-w-7 place-items-center rounded-full px-1 font-display text-xl',
                      isToday(day) && 'bg-accent text-white',
                    )}
                  >
                    {fmt(day, 'd')}
                  </span>
                </button>
                <div className="space-y-0.5">
                  {dayAllDay.map((o) => (
                    <EventChip key={o.key} occ={o} onClick={onOpen} continued={startOfDay(o.start) < startOfDay(day)} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Stundenraster */}
      <div ref={scrollRef} className="relative min-h-0 flex-1 overflow-y-auto [scrollbar-gutter:stable]">
        <div className="flex" style={{ height: 24 * HOUR_H }}>
          <div className="relative w-14 shrink-0">
            {Array.from({ length: 23 }, (_, i) => (
              <span
                key={i}
                className="absolute right-2 -translate-y-1/2 font-mono text-[10.5px] text-faint"
                style={{ top: (i + 1) * HOUR_H }}
              >
                {String(i + 1).padStart(2, '0')}:00
              </span>
            ))}
          </div>
          <div
            ref={colsRef}
            className="relative grid flex-1"
            style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}
          >
            {/* Stundenlinien */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage: `linear-gradient(to bottom, var(--c-line) 1px, transparent 1px), linear-gradient(to bottom, transparent ${HOUR_H / 2}px, color-mix(in srgb, var(--c-line) 45%, transparent) ${HOUR_H / 2}px, transparent ${HOUR_H / 2 + 1}px)`,
                backgroundSize: `100% ${HOUR_H}px`,
              }}
            />
            {days.map((day) => {
              const dayOccs = timed.filter((o) => occursOnDay(o, day))
              const placed = layoutDay(dayOccs)
              return (
                <div
                  key={+day}
                  onPointerDown={onGridPointerDown}
                  onClick={onGridClick}
                  className={cx('relative border-l border-line', isToday(day) && 'bg-accent/[0.035]')}
                >
                  {placed.map(({ occ, col, cols }) => {
                    const dragging = preview?.kind === 'move' && preview.occ.key === occ.key
                    const { top, height } = blockStyle(occ.start, occ.end, day)
                    const short = height < 36
                    return (
                      <div
                        key={occ.key}
                        onPointerDown={(e) => onEventPointerDown(e, occ, 'move')}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (e.nativeEvent.pointerType === 'touch') onOpen(occ)
                        }}
                        style={{
                          ...eventStyle(occ.color),
                          top,
                          height,
                          left: `calc(${(col / cols) * 100}% + 2px)`,
                          width: `calc(${(1 / cols) * 100}% - 4px)`,
                        }}
                        className={cx(
                          'group absolute z-10 cursor-pointer overflow-hidden rounded-[5px] border-l-[3px] px-1.5 text-[12px] leading-tight text-ink shadow-sm shadow-black/10 select-none hover:z-20 hover:brightness-110',
                          short ? 'flex items-center gap-1.5 py-0' : 'py-1',
                          dragging && 'opacity-30',
                        )}
                      >
                        <div className="truncate font-medium">{occ.title || t('Ohne Titel')}</div>
                        <div className={cx('truncate font-mono text-[10.5px] text-muted', short && 'shrink-0')}>
                          {timeLabel(occ.start)}
                          {!short && ` – ${timeLabel(occ.end)}`}
                          {occ.repeat && occ.repeat !== 'none' && <Repeat size={9} className="ml-1 inline" />}
                        </div>
                        {!short && occ.location && <div className="truncate text-[11px] text-faint">{occ.location}</div>}
                        <div
                          onPointerDown={(e) => onEventPointerDown(e, occ, 'resize')}
                          className="absolute inset-x-0 bottom-0 h-2 cursor-ns-resize"
                        />
                      </div>
                    )
                  })}

                  {preview && occursOnDay(preview, day) && (
                    <div
                      style={{
                        ...eventStyle(preview.occ?.color ?? 'violet'),
                        ...blockStyle(preview.start, preview.end, day),
                      }}
                      className="pointer-events-none absolute inset-x-0.5 z-30 rounded-[5px] border-l-[3px] px-1.5 py-1 text-[12px] text-ink shadow-lg ring-1 ring-accent/50"
                    >
                      <div className="truncate font-medium">{preview.occ?.title || t('Neuer Termin')}</div>
                      <div className="font-mono text-[10.5px] text-muted">
                        {timeLabel(preview.start)} – {timeLabel(preview.end)}
                      </div>
                    </div>
                  )}
                  <NowLine day={day} />
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
