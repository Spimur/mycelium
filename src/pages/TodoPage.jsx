import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowUpDown, CalendarClock, ChevronRight, Flag, LayoutGrid, List, Plus, Search, SlidersHorizontal, Tag, Timer, Trash2, X } from 'lucide-react'
import { useWorkspace } from '../lib/workspace'
import { DUE_FILTERS, LEVELS, SORTS, isImportant, isUrgent, matchesDue, sortTodos } from '../lib/todos'
import { UNTAGGED } from '../lib/calendar'
import { colorHex } from '../lib/palette'
import { t, tn } from '../lib/i18n'
import { PageHeader } from '../components/Layout'
import { MyceliumBackdrop } from '../components/Mycelium'
import { TodoCheck, TodoMeta, TodoModal } from '../components/TodoParts'
import { ConfirmDialog, MenuItem, Popover, Segmented, cx } from '../components/ui'

const FILTER_KEY = 'mycelium:todo-filters'
const DEFAULT_FILTERS = { q: '', priority: [], urgency: [], due: 'all', tags: [], sort: 'smart', view: 'list' }

function readFilters() {
  try {
    return { ...DEFAULT_FILTERS, ...JSON.parse(localStorage.getItem(FILTER_KEY) || '{}'), q: '' }
  } catch {
    return DEFAULT_FILTERS
  }
}

const toggleIn = (list, value) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value])

function FilterPill({ icon: Icon, label, count, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[12.5px] transition-colors',
        active ? 'border-accent/60 bg-accent/10 text-accent-ink' : 'border-line-strong text-muted hover:text-ink',
      )}
    >
      <Icon size={13} />
      {label}
      {count > 0 && <span className="font-mono text-[10.5px]">{count}</span>}
    </button>
  )
}

function CheckRow({ checked, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-[13.5px] hover:bg-hover"
    >
      <span
        className={cx(
          'grid size-4 shrink-0 place-items-center rounded-[4px] border',
          checked ? 'border-accent bg-accent text-white' : 'border-line-strong',
        )}
      >
        {checked && <span className="size-1.5 rounded-[1px] bg-white" />}
      </span>
      {children}
    </button>
  )
}

function TodoRow({ todo, onOpen, draggable }) {
  const { saveTodo, deleteTodo } = useWorkspace()
  return (
    <div
      draggable={draggable}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/todo', todo.id)
      }}
      onClick={() => onOpen(todo)}
      className="group -mx-2 flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-hover"
    >
      <span className="mt-[3px]">
        <TodoCheck
          checked={Boolean(todo.done)}
          onChange={(done) => saveTodo(todo.id, { done, doneAt: done ? Date.now() : null })}
        />
      </span>
      <div className="min-w-0 flex-1">
        <div className={cx('text-[14.5px] leading-snug', todo.done && 'text-faint line-through')}>{todo.title}</div>
        <TodoMeta todo={todo} />
      </div>
      <button
        type="button"
        aria-label={t('Löschen')}
        onClick={(e) => {
          e.stopPropagation()
          deleteTodo(todo.id)
        }}
        className="grid size-7 shrink-0 place-items-center rounded-md text-faint opacity-0 group-hover:opacity-100 hover:bg-danger/10 hover:text-danger [@media(hover:none)]:hidden"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}

const QUADRANTS = [
  { id: 'do', important: true, urgent: true, title: 'Sofort erledigen', sub: 'wichtig & dringend', color: '#C8553D' },
  { id: 'plan', important: true, urgent: false, title: 'Einplanen', sub: 'wichtig, nicht dringend', color: '#8A4FFF' },
  { id: 'delegate', important: false, urgent: true, title: 'Abgeben oder kurz halten', sub: 'dringend, nicht wichtig', color: '#D69A3A' },
  { id: 'later', important: false, urgent: false, title: 'Später oder streichen', sub: 'weder wichtig noch dringend', color: '#8C8A80' },
]

function Matrix({ todos, onOpen, onCreate }) {
  const { saveTodo } = useWorkspace()
  const [over, setOver] = useState(null)

  // Beim Verschieben werden Priorität und Dringlichkeit passend angehoben oder gesenkt
  const dropInto = (q, id) => {
    const todo = todos.find((x) => x.id === id)
    if (!todo) return
    const priority = q.important ? Math.max(todo.priority ?? 0, 2) : Math.min(todo.priority ?? 0, 1)
    const urgency = q.urgent ? Math.max(todo.urgency ?? 0, 2) : Math.min(todo.urgency ?? 0, 1)
    saveTodo(id, { priority, urgency })
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {QUADRANTS.map((q) => {
        const items = todos.filter((x) => isImportant(x) === q.important && isUrgent(x) === q.urgent)
        return (
          <section
            key={q.id}
            onDragOver={(e) => {
              e.preventDefault()
              setOver(q.id)
            }}
            onDragLeave={() => setOver(null)}
            onDrop={(e) => {
              e.preventDefault()
              setOver(null)
              dropInto(q, e.dataTransfer.getData('text/todo'))
            }}
            className={cx(
              'flex min-h-56 flex-col rounded-xl border p-4 transition-colors',
              over === q.id ? 'border-accent bg-accent/[0.06]' : 'border-line',
            )}
          >
            <div className="mb-2 flex items-start gap-2.5">
              <span className="mt-1.5 h-4 w-[3px] shrink-0 rounded-full" style={{ background: q.color }} />
              <div className="flex-1">
                <h3 className="font-display text-xl leading-tight">{t(q.title)}</h3>
                <p className="label mt-0.5">{t(q.sub)}</p>
              </div>
              <span className="font-mono text-xs text-faint">{items.length}</span>
              <button
                type="button"
                onClick={() => onCreate({ priority: q.important ? 2 : 0, urgency: q.urgent ? 2 : 0 })}
                aria-label={t('Neue Aufgabe')}
                className="grid size-7 place-items-center rounded-md text-faint hover:bg-hover hover:text-ink"
              >
                <Plus size={15} />
              </button>
            </div>
            <div className="flex-1">
              {items.map((todo) => (
                <TodoRow key={todo.id} todo={todo} onOpen={onOpen} draggable />
              ))}
              {items.length === 0 && <p className="py-6 text-center text-[13px] text-faint">{t('Nichts hier.')}</p>}
            </div>
          </section>
        )
      })}
    </div>
  )
}

export default function TodoPage() {
  const { todos, tags, saveTodo, deleteTodos, loaded } = useWorkspace()
  const [filters, setFilters] = useState(readFilters)
  const [menu, setMenu] = useState(null) // { type, at }
  const [modal, setModal] = useState(null)
  const [quick, setQuick] = useState('')
  const [showDone, setShowDone] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const [params, setParams] = useSearchParams()

  // ?new=1 aus der Übersicht / Befehlspalette öffnet direkt den Dialog
  if (params.get('new') === '1' && !modal) setModal({})
  const closeModal = () => {
    setModal(null)
    if (params.get('new')) setParams({}, { replace: true })
  }

  useEffect(() => {
    try {
      localStorage.setItem(FILTER_KEY, JSON.stringify({ ...filters, q: '' }))
    } catch {
      /* privater Modus */
    }
  }, [filters])

  const set = (patch) => setFilters((f) => ({ ...f, ...patch }))
  const openMenu = (type) => (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    setMenu({ type, at: { x: r.left, y: r.bottom + 6, top: r.top } })
  }
  const closeMenu = () => setMenu(null)

  const tagIds = useMemo(() => new Set(tags.map((tag) => tag.id)), [tags])

  // Günstig genug, um bei jedem Render neu zu filtern (und so bleibt "heute fällig" aktuell)
  const filtered = (() => {
    const words = filters.q.toLowerCase().split(/\s+/).filter(Boolean)
    return todos.filter((todo) => {
      if (words.length && !words.every((w) => `${todo.title} ${todo.notes ?? ''}`.toLowerCase().includes(w))) return false
      if (filters.priority.length && !filters.priority.includes(todo.priority ?? 0)) return false
      if (filters.urgency.length && !filters.urgency.includes(todo.urgency ?? 0)) return false
      if (!matchesDue(todo, filters.due)) return false
      if (filters.tags.length) {
        const own = (todo.tagIds ?? []).filter((id) => tagIds.has(id))
        const hit = own.length ? own.some((id) => filters.tags.includes(id)) : filters.tags.includes(UNTAGGED)
        if (!hit) return false
      }
      return true
    })
  })()

  const open = sortTodos(
    filtered.filter((x) => !x.done),
    filters.sort,
  )
  const done = filtered.filter((x) => x.done).sort((a, b) => (b.doneAt ?? 0) - (a.doneAt ?? 0))

  const activeCount =
    (filters.priority.length > 0) + (filters.urgency.length > 0) + (filters.due !== 'all') + (filters.tags.length > 0)

  const addQuick = (e) => {
    e.preventDefault()
    if (!quick.trim()) return
    // Aktive Tag-Filter direkt übernehmen, damit die neue Aufgabe sichtbar bleibt
    saveTodo(null, {
      title: quick.trim(),
      done: false,
      priority: 0,
      urgency: 0,
      due: null,
      notes: '',
      tagIds: filters.tags.filter((id) => id !== UNTAGGED),
    })
    setQuick('')
  }

  const newDraft = (preset = {}) =>
    setModal({ title: quick.trim(), tagIds: filters.tags.filter((id) => id !== UNTAGGED), ...preset })

  return (
    <>
      <PageHeader
        actions={
          <Segmented
            value={filters.view}
            onChange={(view) => set({ view })}
            options={[
              { value: 'list', title: t('Liste'), label: <List size={15} className="my-0.5" /> },
              { value: 'matrix', title: t('Matrix'), label: <LayoutGrid size={15} className="my-0.5" /> },
            ]}
          />
        }
      />
      <div className="relative min-h-0 flex-1 overflow-y-auto">
        <MyceliumBackdrop
          width={1200}
          height={300}
          seed={27}
          origins={[[1200, 0, 2.6], [1200, 260, 3.0]]}
          density={0.8}
          animate
          className="pointer-events-none absolute top-0 right-0 h-[300px] w-full text-ink/[0.1] [mask-image:linear-gradient(to_left,black,transparent_70%)]"
        />
        <div className={cx('relative mx-auto px-5 pt-6 pb-24 sm:px-10 sm:pt-12', filters.view === 'matrix' ? 'max-w-6xl' : 'max-w-3xl')}>
          <p className="label">{tn(todos.filter((x) => !x.done).length, '{n} offen', '{n} offen')}</p>
          <h1 className="mt-2 font-display text-5xl tracking-tight">{t('Aufgaben')}</h1>

          {/* Schnell hinzufügen */}
          <form onSubmit={addQuick} className="mt-8 flex items-center gap-3 rounded-xl border border-line-strong bg-bg/70 px-3.5 backdrop-blur focus-within:border-accent">
            <Plus size={17} className="shrink-0 text-faint" />
            <input
              value={quick}
              onChange={(e) => setQuick(e.target.value)}
              placeholder={t('Neue Aufgabe hinzufügen …')}
              className="h-12 min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-faint"
            />
            <button
              type="button"
              onClick={() => newDraft()}
              className="flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2 text-[12.5px] text-muted hover:bg-hover hover:text-ink"
            >
              <SlidersHorizontal size={13} /> <span className="max-sm:hidden">{t('Details')}</span>
            </button>
          </form>

          {/* Filter */}
          <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
            <label className="flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-line-strong px-3 text-[12.5px] text-muted focus-within:border-accent">
              <Search size={13} />
              <input
                value={filters.q}
                onChange={(e) => set({ q: e.target.value })}
                placeholder={t('Suchen')}
                className="w-24 bg-transparent text-ink outline-none placeholder:text-muted focus:w-36 sm:w-28"
              />
            </label>
            <FilterPill icon={Flag} label={t('Priorität')} count={filters.priority.length} active={filters.priority.length > 0} onClick={openMenu('priority')} />
            <FilterPill icon={Timer} label={t('Dringlichkeit')} count={filters.urgency.length} active={filters.urgency.length > 0} onClick={openMenu('urgency')} />
            <FilterPill
              icon={CalendarClock}
              label={filters.due === 'all' ? t('Fälligkeit') : t(DUE_FILTERS.find((d) => d.value === filters.due).label)}
              active={filters.due !== 'all'}
              onClick={openMenu('due')}
            />
            <FilterPill icon={Tag} label={t('Tags')} count={filters.tags.length} active={filters.tags.length > 0} onClick={openMenu('tags')} />
            <FilterPill
              icon={ArrowUpDown}
              label={t(SORTS.find((s) => s.value === filters.sort).label)}
              active={false}
              onClick={openMenu('sort')}
            />
            {activeCount > 0 && (
              <button
                type="button"
                onClick={() => set({ priority: [], urgency: [], due: 'all', tags: [] })}
                className="flex h-8 shrink-0 items-center gap-1 px-1 text-[12.5px] text-muted hover:text-ink"
              >
                <X size={13} /> {t('Zurücksetzen')}
              </button>
            )}
          </div>

          <div className="mt-6">
            {!loaded.todos ? null : filters.view === 'matrix' ? (
              <Matrix todos={open} onOpen={setModal} onCreate={newDraft} />
            ) : (
              <>
                {open.map((todo) => (
                  <TodoRow key={todo.id} todo={todo} onOpen={setModal} />
                ))}
                {open.length === 0 && (
                  <p className="py-10 text-center text-sm text-faint">
                    {todos.length === 0
                      ? t('Noch keine Aufgaben. Schreib oben die erste hinein.')
                      : activeCount || filters.q
                        ? t('Keine Aufgabe passt zu den Filtern.')
                        : t('Alles erledigt. Schön.')}
                  </p>
                )}
              </>
            )}

            {done.length > 0 && (
              <div className="mt-8 border-t border-line pt-3">
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowDone((s) => !s)}
                    className="flex flex-1 items-center gap-1.5 py-1 text-left"
                  >
                    <ChevronRight size={14} className={cx('text-faint transition-transform', showDone && 'rotate-90')} />
                    <span className="label">{t('Erledigt')}</span>
                    <span className="font-mono text-[11px] text-faint">{done.length}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClear(true)}
                    className="text-[12px] text-faint hover:text-danger"
                  >
                    {t('Erledigte löschen')}
                  </button>
                </div>
                {showDone && (
                  <div className="mt-2">
                    {done.map((todo) => (
                      <TodoRow key={todo.id} todo={todo} onOpen={setModal} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Popover at={menu?.type === 'priority' || menu?.type === 'urgency' ? menu.at : null} onClose={closeMenu}>
        {menu &&
          LEVELS.map((l) => (
            <CheckRow
              key={l.value}
              checked={filters[menu.type].includes(l.value)}
              onClick={() => set({ [menu.type]: toggleIn(filters[menu.type], l.value) })}
            >
              {l.color && <span className="size-2 rounded-full" style={{ background: l.color }} />}
              {t(l.label)}
            </CheckRow>
          ))}
      </Popover>
      <Popover at={menu?.type === 'due' ? menu.at : null} onClose={closeMenu}>
        {DUE_FILTERS.map((d) => (
          <MenuItem
            key={d.value}
            active={filters.due === d.value}
            onClick={() => {
              set({ due: d.value })
              closeMenu()
            }}
          >
            {t(d.label)}
          </MenuItem>
        ))}
      </Popover>
      <Popover at={menu?.type === 'sort' ? menu.at : null} onClose={closeMenu}>
        <p className="label px-2.5 pt-1.5 pb-1">{t('Sortieren nach')}</p>
        {SORTS.map((s) => (
          <MenuItem
            key={s.value}
            active={filters.sort === s.value}
            onClick={() => {
              set({ sort: s.value })
              closeMenu()
            }}
          >
            {t(s.label)}
          </MenuItem>
        ))}
      </Popover>
      <Popover at={menu?.type === 'tags' ? menu.at : null} onClose={closeMenu} className="max-h-80 overflow-y-auto">
        {tags.length === 0 && <p className="px-2.5 py-2 text-[13px] text-faint">{t('Noch keine Tags. Lege sie in einer Aufgabe oder in den Einstellungen an.')}</p>}
        {tags.map((tag) => (
          <CheckRow key={tag.id} checked={filters.tags.includes(tag.id)} onClick={() => set({ tags: toggleIn(filters.tags, tag.id) })}>
            <span className="size-2 rounded-full" style={{ background: colorHex(tag.color) }} />
            {tag.name}
          </CheckRow>
        ))}
        <CheckRow checked={filters.tags.includes(UNTAGGED)} onClick={() => set({ tags: toggleIn(filters.tags, UNTAGGED) })}>
          <span className="text-faint">{t('Ohne Tag')}</span>
        </CheckRow>
      </Popover>

      {modal && <TodoModal key={modal.id ?? 'new'} draft={modal} onClose={closeModal} />}
      <ConfirmDialog
        open={confirmClear}
        title={t('Erledigte Aufgaben löschen?')}
        message={tn(done.length, '{n} erledigte Aufgabe wird endgültig gelöscht.', '{n} erledigte Aufgaben werden endgültig gelöscht.')}
        onConfirm={() => deleteTodos(done.map((x) => x.id))}
        onClose={() => setConfirmClear(false)}
      />
    </>
  )
}
