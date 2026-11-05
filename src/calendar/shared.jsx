import { addMonths, isSameDay, isSameMonth, isToday, startOfDay } from 'date-fns'
import { ChevronLeft, ChevronRight, Repeat } from 'lucide-react'
import { eventStyle } from '../lib/palette'
import { fmt, monthGrid, occursOnDay, timeLabel } from '../lib/calendar'
import { t } from '../lib/i18n'
import { cx } from '../components/ui'

/** Kompakter Termin-Chip für Monats- und Ganztagszeilen */
export function EventChip({ occ, onClick, draggable, onDragStart, continued }) {
  return (
    <button
      type="button"
      draggable={draggable}
      onDragStart={onDragStart}
      onClick={(e) => {
        e.stopPropagation()
        onClick(occ)
      }}
      style={eventStyle(occ.color)}
      className={cx(
        'flex w-full min-w-0 items-center gap-1.5 rounded-[4px] border-l-[3px] px-1.5 py-[1px] text-left text-[12px] leading-[18px] text-ink transition-[filter] hover:brightness-110',
        continued && 'opacity-70',
      )}
    >
      {!occ.allDay && !continued && <span className="shrink-0 font-mono text-[10.5px] text-muted">{timeLabel(occ.start)}</span>}
      <span className="truncate">{occ.title || t('Ohne Titel')}</span>
      {occ.repeat && occ.repeat !== 'none' && <Repeat size={10} className="shrink-0 text-faint" />}
    </button>
  )
}

/** Kleiner Monatskalender, z. B. in der Seitenleiste und Jahresansicht */
export function MiniMonth({ month, selected, onSelect, occs = [], onNavigate, compact }) {
  const days = monthGrid(month)
  return (
    <div className="select-none">
      <div className="mb-1.5 flex items-center justify-between">
        <span className={cx('font-medium', compact ? 'text-[13px]' : 'text-sm')}>{fmt(month, 'LLLL yyyy')}</span>
        {onNavigate && (
          <div className="flex">
            <button onClick={() => onNavigate(addMonths(month, -1))} className="grid size-6 place-items-center rounded text-faint hover:bg-hover hover:text-ink">
              <ChevronLeft size={14} />
            </button>
            <button onClick={() => onNavigate(addMonths(month, 1))} className="grid size-6 place-items-center rounded text-faint hover:bg-hover hover:text-ink">
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
      <div className="grid grid-cols-7 text-center">
        {t('MDMDFSS').split('').map((d, i) => (
          <span key={i} className="pb-1 font-mono text-[10px] text-faint">
            {d}
          </span>
        ))}
        {days.map((day) => {
          const inMonth = isSameMonth(day, month)
          const has = inMonth && occs.some((o) => occursOnDay(o, day))
          const isSel = selected && isSameDay(day, selected)
          return (
            <button
              key={+day}
              onClick={() => onSelect(startOfDay(day))}
              className={cx(
                'relative mx-auto grid aspect-square w-full max-w-8 place-items-center rounded-full text-[12px] transition-colors',
                !inMonth && 'text-faint/50',
                inMonth && !isSel && 'hover:bg-hover',
                isToday(day) && !isSel && 'font-semibold text-accent-ink',
                isSel && 'bg-ink text-bg',
              )}
            >
              {fmt(day, 'd')}
              {has && !isSel && <span className="absolute bottom-[3px] size-[3px] rounded-full bg-accent" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
