import { addDays, isToday, startOfDay } from 'date-fns'
import { MapPin, Repeat } from 'lucide-react'
import { colorHex } from '../lib/palette'
import { fmt, occursOnDay, rangeLabel } from '../lib/calendar'
import { t } from '../lib/i18n'
import { MyceliumBackdrop } from '../components/Mycelium'
import { TagList } from '../components/Tags'
import { cx } from '../components/ui'

export const AGENDA_DAYS = 42

export default function AgendaView({ start, occs, onOpen, onPickDay }) {
  const days = Array.from({ length: AGENDA_DAYS }, (_, i) => addDays(startOfDay(start), i))
  const groups = days.map((day) => ({ day, items: occs.filter((o) => occursOnDay(o, day)) })).filter((g) => g.items.length)

  if (!groups.length) {
    return (
      <div className="relative grid flex-1 place-items-center overflow-hidden px-6 text-center">
        <MyceliumBackdrop
          width={600}
          height={400}
          seed={21}
          origins={[[300, 400, -1.57]]}
          density={0.8}
          animate
          className="absolute inset-0 size-full text-ink/10"
        />
        <div className="relative">
          <p className="font-display text-3xl">{t('Ruhige Wochen.')}</p>
          <p className="mt-1 text-sm text-muted">{t('In den nächsten sechs Wochen steht nichts an.')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-3xl px-4 py-4 sm:px-8">
        {groups.map(({ day, items }) => (
          <section key={+day} className="flex gap-4 border-b border-line py-4 last:border-0 sm:gap-8">
            <button onClick={() => onPickDay(day)} className="w-14 shrink-0 text-left sm:w-20">
              <div className={cx('font-display text-4xl leading-none', isToday(day) && 'text-accent-ink')}>
                {fmt(day, 'd')}
              </div>
              <div className="label mt-1.5">{fmt(day, 'EEE · MMM')}</div>
            </button>
            <div className="min-w-0 flex-1 space-y-1">
              {items.map((o) => (
                <button
                  key={o.key}
                  onClick={() => onOpen(o)}
                  className="flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-hover"
                >
                  <span className="mt-1.5 size-2.5 shrink-0 rounded-full" style={{ background: colorHex(o.color) }} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{o.title || t('Ohne Titel')}</span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-x-3 text-[12.5px] text-muted">
                      <span className="font-mono text-[11.5px]">{rangeLabel(o)}</span>
                      {o.location && (
                        <span className="flex items-center gap-1">
                          <MapPin size={11} /> {o.location}
                        </span>
                      )}
                      {o.repeat && o.repeat !== 'none' && <Repeat size={11} />}
                      <TagList ids={o.tagIds} />
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
