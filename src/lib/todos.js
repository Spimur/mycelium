import { addDays, endOfDay, startOfDay } from 'date-fns'

// Stufen für Priorität (Wichtigkeit) und Dringlichkeit: 0 = keine, 1 = niedrig, 2 = mittel, 3 = hoch
export const LEVELS = [
  { value: 0, label: 'Keine', color: null },
  { value: 1, label: 'Niedrig', color: '#8C8A80' },
  { value: 2, label: 'Mittel', color: '#D69A3A' },
  { value: 3, label: 'Hoch', color: '#C8553D' },
]

export const levelOf = (value) => LEVELS[value ?? 0] ?? LEVELS[0]

export const isOverdue = (todo, now = Date.now()) => !todo.done && todo.due != null && endOfDay(todo.due) < now

// Überfällige oder bald fällige Aufgaben gelten in der Matrix automatisch als dringend
export const isUrgent = (todo, now = Date.now()) =>
  (todo.urgency ?? 0) >= 2 || (!todo.done && todo.due != null && todo.due < endOfDay(addDays(now, 1)).getTime())

export const isImportant = (todo) => (todo.priority ?? 0) >= 2

export const DUE_FILTERS = [
  { value: 'all', label: 'Alle Termine' },
  { value: 'overdue', label: 'Überfällig' },
  { value: 'today', label: 'Heute fällig' },
  { value: 'week', label: 'Nächste 7 Tage' },
  { value: 'none', label: 'Ohne Datum' },
]

export function matchesDue(todo, filter, now = Date.now()) {
  if (filter === 'all') return true
  if (filter === 'none') return todo.due == null
  if (todo.due == null) return false
  if (filter === 'overdue') return isOverdue(todo, now)
  if (filter === 'today') return todo.due <= endOfDay(now).getTime()
  return todo.due < endOfDay(addDays(startOfDay(now), 6)).getTime()
}

export const SORTS = [
  { value: 'smart', label: 'Empfohlen' },
  { value: 'due', label: 'Fälligkeit' },
  { value: 'priority', label: 'Priorität' },
  { value: 'urgency', label: 'Dringlichkeit' },
  { value: 'created', label: 'Neueste zuerst' },
]

// "Empfohlen": Überfälliges zuerst, dann nach Wichtigkeit + Dringlichkeit, dann nach Datum
const score = (t, now) => (isOverdue(t, now) ? 10 : 0) + (t.priority ?? 0) * 2 + (isUrgent(t, now) ? 3 : (t.urgency ?? 0))
const byDue = (a, b) => (a.due ?? Infinity) - (b.due ?? Infinity)

export function sortTodos(list, sort, now = Date.now()) {
  const sorted = [...list]
  const tie = (a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)
  const cmp = {
    smart: (a, b) => score(b, now) - score(a, now) || byDue(a, b) || tie(a, b),
    due: (a, b) => byDue(a, b) || (b.priority ?? 0) - (a.priority ?? 0) || tie(a, b),
    priority: (a, b) => (b.priority ?? 0) - (a.priority ?? 0) || byDue(a, b) || tie(a, b),
    urgency: (a, b) => (b.urgency ?? 0) - (a.urgency ?? 0) || byDue(a, b) || tie(a, b),
    created: tie,
  }[sort]
  return sorted.sort(cmp)
}
