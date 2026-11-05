import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { addDays, formatDistanceToNow, startOfDay } from 'date-fns'
import { ArrowUpRight, CalendarPlus, FilePlus2, FolderPlus, ListPlus } from 'lucide-react'
import { displayNameOf, useAuth } from '../lib/auth'
import { useWorkspace } from '../lib/workspace'
import { colorHex } from '../lib/palette'
import { fmt, occurrences, rangeLabel } from '../lib/calendar'
import { sortTodos } from '../lib/todos'
import { nodeTitle, pathTo } from '../lib/tree'
import { dateLocale, t, tn } from '../lib/i18n'
import { PageHeader } from '../components/Layout'
import { MyceliumBackdrop } from '../components/Mycelium'
import { TodoCheck, TodoMeta } from '../components/TodoParts'
import NodeIcon from '../components/NodeIcon'

function greeting() {
  const h = new Date().getHours()
  if (h < 5) return t('Gute Nacht')
  if (h < 11) return t('Guten Morgen')
  if (h < 17) return t('Guten Tag')
  return t('Guten Abend')
}

function Section({ title, action, children }) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between border-b border-line pb-2">
        <h2 className="label">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

function SectionLink({ to, children }) {
  return (
    <Link to={to} className="flex items-center gap-1 text-xs text-muted hover:text-ink">
      {children} <ArrowUpRight size={12} />
    </Link>
  )
}

export default function Home() {
  const { user } = useAuth()
  const { nodes, tree, events, todos, createNode, saveTodo } = useWorkspace()
  const navigate = useNavigate()

  const today = startOfDay(new Date()).getTime()
  const agenda = useMemo(() => occurrences(events, today, addDays(today, 7)), [events, today])
  const todays = agenda.filter((o) => o.start < +addDays(today, 1))
  const later = agenda.filter((o) => o.start >= +addDays(today, 1)).slice(0, 5)

  const recent = useMemo(
    () =>
      nodes
        .filter((n) => n.type === 'note')
        .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
        .slice(0, 6),
    [nodes],
  )
  const openTodos = useMemo(() => todos.filter((x) => !x.done), [todos])
  const topTodos = useMemo(() => sortTodos(openTodos, 'smart').slice(0, 5), [openTodos])

  const name = user.displayName ? displayNameOf(user).split(' ')[0] : null
  const notes = nodes.filter((n) => n.type === 'note').length
  const folders = nodes.length - notes

  const summary = [
    todays.length === 0 ? t('Heute ist nichts eingetragen.') : tn(todays.length, 'Heute steht ein Termin an.', 'Heute stehen {n} Termine an.'),
    openTodos.length ? tn(openTodos.length, '{n} Aufgabe ist offen.', '{n} Aufgaben sind offen.') : null,
    t('Dein Myzel umfasst {notes} in {folders}.', {
      notes: tn(notes, '{n} Notiz', '{n} Notizen'),
      folders: tn(folders, '{n} Ordner', '{n} Ordnern'),
    }),
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <>
      <PageHeader />
      <div className="relative min-h-0 flex-1 overflow-y-auto">
        <MyceliumBackdrop
          width={1200}
          height={420}
          seed={11}
          origins={[[1200, 60, 2.9], [1200, 380, -2.8], [900, 0, 2.1]]}
          density={1}
          animate
          className="absolute top-0 right-0 h-[420px] w-full text-ink/[0.13] [mask-image:linear-gradient(to_left,black,transparent_75%)]"
        />

        <div className="relative mx-auto max-w-5xl px-5 pt-10 pb-20 sm:px-10 sm:pt-20">
          <p className="label">{fmt(new Date(), 'EEEE, d. MMMM yyyy')}</p>
          <h1 className="mt-3 font-display text-5xl leading-[1.05] tracking-tight sm:text-6xl">
            {greeting()}
            {name ? `, ${name}` : ''}.
          </h1>
          <p className="mt-3 max-w-lg text-[15px] text-muted">{summary}</p>

          <div className="mt-8 flex flex-wrap gap-2">
            {[
              { label: t('Notiz'), icon: FilePlus2, run: () => navigate(`/n/${createNode({ type: 'note' })}`) },
              { label: t('Ordner'), icon: FolderPlus, run: () => navigate(`/f/${createNode({ type: 'folder' })}`) },
              { label: t('Aufgabe'), icon: ListPlus, run: () => navigate('/todos?new=1') },
              { label: t('Termin'), icon: CalendarPlus, run: () => navigate('/calendar?new=1') },
            ].map((a) => (
              <button
                key={a.label}
                onClick={a.run}
                className="flex h-10 items-center gap-2 rounded-full border border-line-strong bg-bg/70 pr-4 pl-3 text-sm backdrop-blur transition-colors hover:border-accent hover:text-accent-ink"
              >
                <a.icon size={16} strokeWidth={1.75} /> {a.label}
              </button>
            ))}
          </div>

          <div className="mt-14 grid gap-12 md:grid-cols-[1fr_1.15fr]">
            <div className="space-y-12">
              <Section title={t('Heute & diese Woche')} action={<SectionLink to="/calendar">{t('Kalender')}</SectionLink>}>
                {agenda.length === 0 && <p className="py-2 text-sm text-faint">{t('Die nächsten sieben Tage sind frei.')}</p>}
                <div className="space-y-1">
                  {[...todays, ...later].map((o, i) => (
                    <Link
                      key={o.key}
                      to={`/calendar?view=day&date=${fmt(o.start, 'yyyy-MM-dd')}`}
                      className="-mx-2 flex items-center gap-3 rounded-md px-2 py-2 hover:bg-hover"
                    >
                      <span className="w-12 shrink-0 font-mono text-[11px] text-faint">
                        {i < todays.length ? t('heute') : fmt(o.start, 'EEE d.')}
                      </span>
                      <span className="h-7 w-[3px] shrink-0 rounded-full" style={{ background: colorHex(o.color) }} />
                      <span className="min-w-0">
                        <span className="block truncate text-sm">{o.title || t('Ohne Titel')}</span>
                        <span className="block font-mono text-[11px] text-muted">{rangeLabel(o)}</span>
                      </span>
                    </Link>
                  ))}
                </div>
              </Section>

              <Section title={t('Wichtige Aufgaben')} action={<SectionLink to="/todos">{t('Alle Aufgaben')}</SectionLink>}>
                {topTodos.length === 0 && <p className="py-2 text-sm text-faint">{t('Keine offenen Aufgaben.')}</p>}
                <div>
                  {topTodos.map((todo) => (
                    <div key={todo.id} className="-mx-2 flex items-start gap-3 rounded-md px-2 py-2 hover:bg-hover">
                      <span className="mt-[3px]">
                        <TodoCheck checked={false} onChange={() => saveTodo(todo.id, { done: true, doneAt: Date.now() })} />
                      </span>
                      <Link to="/todos" className="min-w-0 flex-1">
                        <span className="block text-sm">{todo.title}</span>
                        <TodoMeta todo={{ ...todo, notes: '' }} />
                      </Link>
                    </div>
                  ))}
                </div>
              </Section>
            </div>

            <Section title={t('Zuletzt bearbeitet')}>
              {recent.length === 0 && <p className="py-2 text-sm text-faint">{t('Noch keine Notizen.')}</p>}
              <div className="grid gap-2 sm:grid-cols-2">
                {recent.map((n) => {
                  const parents = pathTo(tree, n.id).slice(0, -1)
                  return (
                    <Link
                      key={n.id}
                      to={`/n/${n.id}`}
                      className="group flex flex-col justify-between gap-5 rounded-lg border border-line bg-bg/60 p-3.5 transition-colors hover:border-line-strong hover:bg-hover"
                    >
                      <div className="flex items-center gap-2 text-faint">
                        <NodeIcon node={n} size={14} />
                        <span className="truncate text-[11.5px]">
                          {parents.length ? parents.map(nodeTitle).join(' / ') : t('Oberste Ebene')}
                        </span>
                      </div>
                      <div>
                        <div className="truncate text-[15px] font-medium group-hover:text-accent-ink">{nodeTitle(n)}</div>
                        <div className="mt-0.5 text-[11.5px] text-faint">
                          {n.updatedAt && formatDistanceToNow(n.updatedAt, { locale: dateLocale(), addSuffix: true })}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </Section>
          </div>
        </div>
      </div>
    </>
  )
}
