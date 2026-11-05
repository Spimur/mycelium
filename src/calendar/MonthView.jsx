import { useState } from 'react'
import { differenceInCalendarDays, isSameMonth, isToday, startOfDay } from 'date-fns'
import { colorHex } from '../lib/palette'
import { fmt, monthGrid, occursOnDay } from '../lib/calendar'
import { t } from '../lib/i18n'
import { cx } from '../components/ui'
import { EventChip } from './shared'

const MAX_CHIPS = 3

export default function MonthView({ cursor, occs, onCreate, onOpen, onMove, onPickDay }) {
  const days = monthGrid(cursor)
  const weeks = days.length / 7
  const [dragKey, setDragKey] = useState(null)
  const [overDay, setOverDay] = useState(null)

  const drop = (day) => {
    const occ = occs.find((o) => o.key === dragKey)
    setDragKey(null)
    setOverDay(null)
    if (!occ) return
    const delta = differenceInCalendarDays(day, occ.start)
    if (!delta) return
    const shift = (ms) => {
      const d = new Date(ms)
      d.setDate(d.getDate() + delta)
      return d.getTime()
    }
    onMove(occ, shift(occ.start), shift(occ.end))
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="grid grid-cols-7 border-b border-line">
        {days.slice(0, 7).map((d) => (
          <div key={+d} className="label px-2 py-2 text-center sm:text-left">
            <span className="sm:hidden">{fmt(d, 'EEEEE')}</span>
            <span className="max-sm:hidden">{fmt(d, 'EEE')}</span>
          </div>
        ))}
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-7" style={{ gridTemplateRows: `repeat(${weeks}, minmax(0, 1fr))` }}>
        {days.map((day) => {
          const dayOccs = occs.filter((o) => occursOnDay(o, day))
          const inMonth = isSameMonth(day, cursor)
          const hidden = dayOccs.length - MAX_CHIPS
          return (
            <div
              key={+day}
              onClick={() => onCreate({ day })}
              onDragOver={(e) => {
                if (!dragKey) return
                e.preventDefault()
                setOverDay(+day)
              }}
              onDrop={(e) => {
                e.preventDefault()
                drop(day)
              }}
              className={cx(
                'group relative min-h-0 cursor-pointer overflow-hidden border-r border-b border-line p-1 transition-colors [&:nth-child(7n)]:border-r-0',
                !inMonth && 'bg-panel/40',
                overDay === +day && 'bg-accent/10',
                'hover:bg-hover',
              )}
            >
              <div className="mb-0.5 flex items-center justify-between px-0.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onPickDay(day)
                  }}
                  className={cx(
                    'grid h-6 min-w-6 place-items-center rounded-full px-1 text-[12.5px] transition-colors hover:bg-line-strong',
                    !inMonth && 'text-faint',
                    isToday(day) && 'bg-accent font-semibold text-white hover:bg-accent',
                  )}
                >
                  {fmt(day, 'd')}
                </button>
              </div>

              {/* Mobil: nur farbige Punkte */}
              <div className="flex flex-wrap justify-center gap-0.5 sm:hidden">
                {dayOccs.slice(0, 4).map((o) => (
                  <span key={o.key} className="size-1.5 rounded-full" style={{ background: colorHex(o.color) }} />
                ))}
              </div>

              <div className="space-y-0.5 max-sm:hidden">
                {dayOccs.slice(0, MAX_CHIPS).map((o) => (
                  <EventChip
                    key={o.key}
                    occ={o}
                    onClick={onOpen}
                    continued={startOfDay(o.start) < startOfDay(day)}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = 'move'
                      e.dataTransfer.setData('text/plain', o.key)
                      setDragKey(o.key)
                    }}
                  />
                ))}
                {hidden > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onPickDay(day)
                    }}
                    className="w-full rounded px-1.5 text-left text-[11.5px] text-muted hover:text-ink"
                  >
                    {t('+{n} weitere', { n: hidden })}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
