import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  endOfWeek,
  isSameMonth,
  isValid,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from 'date-fns'
import { ChevronLeft, ChevronRight, Filter, Plus } from 'lucide-react'
import { useWorkspace } from '../lib/workspace'
import {
  WEEK_OPTS,
  fmt,
  isVisible,
  monthGrid,
  occurrences,
  rangeLabel,
  readHiddenTags,
  writeHiddenTags,
} from '../lib/calendar'
import { colorHex } from '../lib/palette'
import { t } from '../lib/i18n'
import { PageHeader } from '../components/Layout'
import { TagFilter } from '../components/Tags'
import { Button, IconButton, Kbd, Popover, Segmented, cx } from '../components/ui'
import TimeGrid from './TimeGrid'
import MonthView from './MonthView'
import AgendaView, { AGENDA_DAYS } from './AgendaView'
import YearView from './YearView'
import EventModal from './EventModal'
import { MiniMonth } from './shared'

const VIEWS = [
  { value: 'day', label: 'Tag', key: 'd' },
  { value: 'week', label: 'Woche', key: 'w' },
  { value: 'month', label: 'Monat', key: 'm' },
  { value: 'year', label: 'Jahr', key: 'y' },
  { value: 'agenda', label: 'Liste', key: 'l' },
]

const STEP = {
  day: (d, n) => addDays(d, n),
  week: (d, n) => addWeeks(d, n),
  month: (d, n) => addMonths(d, n),
  year: (d, n) => addYears(d, n),
  agenda: (d, n) => addDays(d, n * 28),
}

function rangeFor(view, cursor) {
  switch (view) {
    case 'day':
      return [startOfDay(cursor), addDays(startOfDay(cursor), 1)]
    case 'week':
      return [startOfWeek(cursor, WEEK_OPTS), addDays(endOfWeek(cursor, WEEK_OPTS), 1)]
    case 'month': {
      const grid = monthGrid(cursor)
      return [grid[0], addDays(grid.at(-1), 1)]
    }
    case 'year':
      return [startOfYear(cursor), addYears(startOfYear(cursor), 1)]
    default:
      return [startOfDay(cursor), addDays(startOfDay(cursor), AGENDA_DAYS)]
  }
}

function titleFor(view, cursor) {
  if (view === 'day') return { main: fmt(cursor, 'd. MMMM'), sub: fmt(cursor, 'EEEE, yyyy') }
  if (view === 'week') {
    const s = startOfWeek(cursor, WEEK_OPTS)
    const e = endOfWeek(cursor, WEEK_OPTS)
    return {
      main: isSameMonth(s, e) ? fmt(s, 'MMMM') : `${fmt(s, 'MMM')} – ${fmt(e, 'MMM')}`,
      sub: `${t('KW')} ${fmt(cursor, 'I')} · ${fmt(e, 'yyyy')}`,
    }
  }
  if (view === 'year') return { main: fmt(cursor, 'yyyy'), sub: t('Jahresübersicht') }
  if (view === 'agenda') return { main: t('Demnächst'), sub: t('ab {date}', { date: fmt(cursor, 'd. MMMM yyyy') }) }
  return { main: fmt(cursor, 'MMMM'), sub: fmt(cursor, 'yyyy') }
}

const defaultView = () => (window.innerWidth < 640 ? 'day' : 'week')

function nextFullHour() {
  const d = new Date()
  d.setHours(d.getHours() + 1, 0, 0, 0)
  return d.getTime()
}

export default function CalendarPage() {
  const { events, tags, saveEvent } = useWorkspace()
  const [params, setParams] = useSearchParams()
  const [modal, setModal] = useState(null)
  const [hidden, setHidden] = useState(readHiddenTags)
  const [filterAt, setFilterAt] = useState(null)

  const view = VIEWS.some((v) => v.value === params.get('view')) ? params.get('view') : defaultView()
  const parsed = params.get('date') ? parseISO(params.get('date')) : null
  const cursor = parsed && isValid(parsed) ? parsed : startOfDay(new Date())

  const changeHidden = (next) => {
    setHidden(next)
    writeHiddenTags(next)
  }

  const go = (nextView, nextDate) =>
    setParams((p) => {
      const n = new URLSearchParams(p)
      n.set('view', nextView)
      n.set('date', fmt(nextDate, 'yyyy-MM-dd'))
      n.delete('new')
      return n
    })

  const newDraft = (start, end, allDay = false) => ({
    title: '',
    color: 'violet',
    allDay,
    start,
    end,
    repeat: 'none',
    tagIds: [],
  })

  const createAt = ({ start, end, allDay, day }) => {
    if (day) {
      const s = startOfDay(day).getTime() + 9 * 3_600_000
      return setModal(newDraft(s, s + 3_600_000))
    }
    setModal(newDraft(start, end, allDay))
  }

  const createNow = () => {
    const now = new Date()
    const base = startOfDay(cursor).getTime() + Math.min(22, now.getHours() + 1) * 3_600_000
    setModal(newDraft(base, base + 3_600_000))
  }

  // ?new=1 aus der Befehlspalette / Übersicht
  const wantsNew = params.get('new') === '1'
  if (wantsNew && !modal) {
    const start = nextFullHour()
    setModal(newDraft(start, start + 3_600_000))
  }

  const closeModal = () => {
    setModal(null)
    if (wantsNew)
      setParams((p) => {
        const n = new URLSearchParams(p)
        n.delete('new')
        return n
      })
  }

  const openOcc = (occ) => setModal({ ...occ, id: occ.eventId })

  // Verschieben einer Serie verschiebt alle Termine um denselben Abstand
  const moveOcc = (occ, start, end) => {
    const original = events.find((e) => e.id === occ.eventId)
    if (!original) return
    saveEvent(original.id, {
      start: original.start + (start - occ.start),
      end: original.end + (end - occ.end),
    })
  }

  // Ausgeblendete Tags herausfiltern
  const tagIds = useMemo(() => new Set(tags.map((tag) => tag.id)), [tags])
  const visibleEvents = useMemo(() => events.filter((e) => isVisible(e, hidden, tagIds)), [events, hidden, tagIds])
  const hiddenCount = [...hidden].filter((id) => tagIds.has(id) || id === '__none').length

  const [from, to] = rangeFor(view, cursor)
  const occs = occurrences(visibleEvents, from, to)
  const [sideMonth, setSideMonth] = useState(null)
  const shownSideMonth = sideMonth ?? startOfMonth(cursor)
  const sideMs = shownSideMonth.getTime()
  const sideOccs = useMemo(() => occurrences(visibleEvents, addDays(sideMs, -7), addDays(sideMs, 45)), [visibleEvents, sideMs])
  const today = startOfDay(new Date()).getTime()
  const upcoming = useMemo(() => occurrences(visibleEvents, today, addDays(today, 14)).slice(0, 6), [visibleEvents, today])

  useEffect(() => {
    const onKey = (e) => {
      if (modal || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.target.closest('input, textarea, select, [contenteditable="true"]')) return
      const v = VIEWS.find((x) => x.key === e.key)
      const actions = {
        t: () => go(view, new Date()),
        n: createNow,
        ArrowLeft: () => go(view, STEP[view](cursor, -1)),
        j: () => go(view, STEP[view](cursor, -1)),
        ArrowRight: () => go(view, STEP[view](cursor, 1)),
        k: () => go(view, STEP[view](cursor, 1)),
      }
      const action = v ? () => go(v.value, cursor) : actions[e.key]
      if (!action) return
      // Sonst landet z. B. das "n" gleich im Titelfeld des neuen Termins
      e.preventDefault()
      action()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const { main, sub } = titleFor(view, cursor)
  const pickDay = (day) => go('day', day)

  return (
    <>
      <PageHeader
        actions={
          <Button variant="primary" size="sm" onClick={createNow} className="max-sm:size-8 max-sm:px-0">
            <Plus size={15} /> <span className="max-sm:hidden">{t('Termin')}</span>
          </Button>
        }
      >
        <div className="flex items-baseline gap-2.5 overflow-hidden">
          <h1 className="font-display text-[26px] leading-none whitespace-nowrap">{main}</h1>
          <span className="label truncate max-[400px]:hidden">{sub}</span>
        </div>
      </PageHeader>

      <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 pb-2.5 sm:px-5">
        <div className="flex items-center">
          <IconButton label={t('Zurück')} onClick={() => go(view, STEP[view](cursor, -1))}>
            <ChevronLeft size={17} />
          </IconButton>
          <Button size="sm" variant="outline" onClick={() => go(view, new Date())}>
            {t('Heute')}
          </Button>
          <IconButton label={t('Weiter')} onClick={() => go(view, STEP[view](cursor, 1))}>
            <ChevronRight size={17} />
          </IconButton>
        </div>
        <button
          type="button"
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect()
            setFilterAt({ x: r.left, y: r.bottom + 6, top: r.top })
          }}
          className={cx(
            'flex h-7 items-center gap-1.5 rounded-md px-2 text-[13px] xl:hidden',
            hiddenCount ? 'bg-accent/15 text-accent-ink' : 'text-muted hover:bg-hover hover:text-ink',
          )}
        >
          <Filter size={14} /> {t('Tags')}
          {hiddenCount > 0 && <span className="font-mono text-[10.5px]">−{hiddenCount}</span>}
        </button>
        <div className="flex-1" />
        <Segmented
          value={view}
          onChange={(v) => go(v, cursor)}
          options={VIEWS.map((v) => ({ value: v.value, label: t(v.label) }))}
          className="max-sm:w-full max-sm:[&>button]:flex-1"
        />
      </div>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-64 shrink-0 flex-col gap-8 overflow-y-auto border-r border-line px-5 py-5 xl:flex">
          <MiniMonth
            month={shownSideMonth}
            selected={cursor}
            occs={sideOccs}
            onNavigate={setSideMonth}
            onSelect={(d) => {
              setSideMonth(null)
              go(view === 'year' || view === 'agenda' ? 'day' : view, d)
            }}
          />
          <div>
            <p className="label mb-2">{t('Tags')}</p>
            <div className="-mx-1.5">
              <TagFilter hidden={hidden} onChange={changeHidden} />
            </div>
          </div>
          <div>
            <p className="label mb-3">{t('Nächste 14 Tage')}</p>
            {upcoming.length === 0 && <p className="text-[13px] text-faint">{t('Nichts geplant.')}</p>}
            <div className="space-y-3">
              {upcoming.map((o) => (
                <button key={o.key} onClick={() => openOcc(o)} className="group flex w-full gap-2.5 text-left">
                  <span className="mt-1 h-8 w-[3px] shrink-0 rounded-full" style={{ background: colorHex(o.color) }} />
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] group-hover:text-accent-ink">{o.title || t('Ohne Titel')}</span>
                    <span className="block font-mono text-[10.5px] text-faint">
                      {fmt(o.start, 'EEE d.M.')} · {rangeLabel(o)}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div className="mt-auto space-y-1.5 text-[11.5px] text-faint">
            <p className="label mb-2">{t('Tastenkürzel')}</p>
            <p className="flex justify-between">
              {t('Tag / Woche / Monat')}{' '}
              <span>
                <Kbd>D</Kbd> <Kbd>W</Kbd> <Kbd>M</Kbd>
              </span>
            </p>
            <p className="flex justify-between">
              {t('Jahr / Liste')}{' '}
              <span>
                <Kbd>Y</Kbd> <Kbd>L</Kbd>
              </span>
            </p>
            <p className="flex justify-between">
              {t('Heute / Neuer Termin')}{' '}
              <span>
                <Kbd>T</Kbd> <Kbd>N</Kbd>
              </span>
            </p>
            <p className="flex justify-between">
              {t('Blättern')}{' '}
              <span>
                <Kbd>←</Kbd> <Kbd>→</Kbd>
              </span>
            </p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {(view === 'week' || view === 'day') && (
            <TimeGrid
              days={view === 'day' ? [startOfDay(cursor)] : Array.from({ length: 7 }, (_, i) => addDays(from, i))}
              occs={occs}
              onCreate={createAt}
              onOpen={openOcc}
              onMove={moveOcc}
              onPickDay={pickDay}
            />
          )}
          {view === 'month' && (
            <MonthView cursor={cursor} occs={occs} onCreate={createAt} onOpen={openOcc} onMove={moveOcc} onPickDay={pickDay} />
          )}
          {view === 'year' && <YearView cursor={cursor} occs={occs} onPickDay={pickDay} />}
          {view === 'agenda' && <AgendaView start={cursor} occs={occs} onOpen={openOcc} onPickDay={pickDay} />}
        </div>
      </div>

      <Popover at={filterAt} onClose={() => setFilterAt(null)} className="w-60 p-1.5">
        <p className="label px-1.5 pt-1 pb-1.5">{t('Tags anzeigen')}</p>
        <TagFilter hidden={hidden} onChange={changeHidden} />
      </Popover>

      {modal && <EventModal key={modal.id ?? 'new'} draft={modal} onClose={closeModal} />}
    </>
  )
}
