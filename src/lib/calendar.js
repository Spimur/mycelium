import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  differenceInCalendarDays,
  endOfDay,
  format,
  isSameDay,
  startOfDay,
  startOfWeek,
} from 'date-fns'
import { dateLocale, t } from './i18n'

export const WEEK_OPTS = { weekStartsOn: 1 }

// Labels sind deutsche Schlüssel und werden beim Anzeigen mit t() übersetzt
export const REPEAT_OPTIONS = [
  { value: 'none', label: 'Nie' },
  { value: 'daily', label: 'Täglich' },
  { value: 'weekly', label: 'Wöchentlich' },
  { value: 'monthly', label: 'Monatlich' },
  { value: 'yearly', label: 'Jährlich' },
]

const STEP = { daily: addDays, weekly: addWeeks, monthly: addMonths, yearly: addYears }

// Ganztägige Termine enden am Ende ihres letzten Tages
const effectiveEnd = (ev, end) => (ev.allDay ? endOfDay(end).getTime() : end)

/**
 * Löst Termine (inkl. Wiederholungen) in einzelne Vorkommen im Bereich [from, to) auf.
 * Jedes Vorkommen hat start/end als Zeitstempel und eventId für das Original.
 */
export function occurrences(events, from, to) {
  const out = []
  const fromMs = +from
  const toMs = +to
  for (const ev of events) {
    const duration = Math.max(0, ev.end - ev.start)
    const push = (start) => {
      const end = start + duration
      if (start < toMs && effectiveEnd(ev, end) > fromMs) {
        out.push({ ...ev, eventId: ev.id, key: `${ev.id}:${start}`, start, end, occurrenceOf: ev.start })
      }
    }
    if (!ev.repeat || ev.repeat === 'none') {
      push(ev.start)
      continue
    }
    const step = STEP[ev.repeat]
    const until = ev.repeatUntil ? endOfDay(ev.repeatUntil).getTime() : Infinity
    let n = 0
    // Bei täglichen/wöchentlichen Serien direkt in die Nähe des Bereichs springen
    if (ev.repeat === 'daily' || ev.repeat === 'weekly') {
      const days = differenceInCalendarDays(from, ev.start) - Math.ceil(duration / 86_400_000) - 1
      n = Math.max(0, Math.floor(days / (ev.repeat === 'daily' ? 1 : 7)))
    }
    for (let guard = 0; guard < 1000; guard++, n++) {
      const start = step(ev.start, n).getTime()
      if (start >= toMs || start > until) break
      push(start)
    }
  }
  return out.sort((a, b) => a.start - b.start || b.end - b.start - (a.end - a.start))
}

export const occursOnDay = (occ, day) => occ.start <= endOfDay(day).getTime() && effectiveEnd(occ, occ.end) > startOfDay(day).getTime()

/** Verteilt sich überschneidende Termine eines Tages auf Spalten (für Wochen-/Tagesansicht). */
export function layoutDay(occs) {
  const sorted = [...occs].sort((a, b) => a.start - b.start || b.end - a.end)
  const result = []
  let cluster = []
  let clusterEnd = -Infinity

  const flush = () => {
    const columns = []
    for (const occ of cluster) {
      let col = columns.findIndex((end) => end <= occ.start)
      if (col === -1) col = columns.push(0) - 1
      columns[col] = Math.max(occ.end, occ.start + 20 * 60_000)
      result.push({ occ, col })
    }
    result.slice(-cluster.length).forEach((r) => (r.cols = columns.length))
    cluster = []
  }

  for (const occ of sorted) {
    if (occ.start >= clusterEnd && cluster.length) flush()
    cluster.push(occ)
    clusterEnd = Math.max(clusterEnd, occ.end, occ.start + 20 * 60_000)
  }
  if (cluster.length) flush()
  return result
}

export function monthGrid(date) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1)
  const start = startOfWeek(first, WEEK_OPTS)
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0)
  const weeks = Math.ceil((differenceInCalendarDays(last, start) + 1) / 7)
  return Array.from({ length: weeks * 7 }, (_, i) => addDays(start, i))
}

/** Datum formatieren. Das Muster ist ein deutsches Muster und wird pro Sprache übersetzt (siehe en.js). */
export const fmt = (d, pattern) => format(d, t(pattern), { locale: dateLocale() })

export const timeLabel = (ms) => format(ms, 'HH:mm')

export function rangeLabel(occ) {
  if (occ.allDay) {
    return isSameDay(occ.start, occ.end) ? t('Ganztägig') : `${fmt(occ.start, 'd. MMM')} – ${fmt(occ.end, 'd. MMM')}`
  }
  if (isSameDay(occ.start, occ.end)) return `${timeLabel(occ.start)} – ${timeLabel(occ.end)}`
  return `${fmt(occ.start, 'd. MMM HH:mm')} – ${fmt(occ.end, 'd. MMM HH:mm')}`
}

export const toDateInput = (ms) => format(ms, 'yyyy-MM-dd')
export const toTimeInput = (ms) => format(ms, 'HH:mm')

// ---------- Tag-Filter (pro Gerät gespeichert) ----------

const HIDDEN_KEY = 'mycelium:hidden-tags'
export const UNTAGGED = '__none'

export function readHiddenTags() {
  try {
    return new Set(JSON.parse(localStorage.getItem(HIDDEN_KEY) || '[]'))
  } catch {
    return new Set()
  }
}

export function writeHiddenTags(set) {
  try {
    localStorage.setItem(HIDDEN_KEY, JSON.stringify([...set]))
  } catch {
    /* privater Modus */
  }
}

/** Ein Termin ist sichtbar, wenn mindestens einer seiner (existierenden) Tags sichtbar ist. */
export function isVisible(item, hidden, tagIds) {
  const own = (item.tagIds ?? []).filter((id) => tagIds.has(id))
  if (!own.length) return !hidden.has(UNTAGGED)
  return own.some((id) => !hidden.has(id))
}
export function fromInputs(date, time = '00:00') {
  const [y, m, d] = date.split('-').map(Number)
  const [h, min] = time.split(':').map(Number)
  return new Date(y, m - 1, d, h || 0, min || 0).getTime()
}
