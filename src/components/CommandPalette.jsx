import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
  CalendarDays,
  CalendarPlus,
  CircleCheckBig,
  CornerDownLeft,
  FilePlus2,
  FolderPlus,
  ListPlus,
  Search,
  Settings,
  SunMoon,
} from 'lucide-react'
import { useWorkspace } from '../lib/workspace'
import { toggleTheme } from '../lib/theme'
import { t } from '../lib/i18n'
import { nodeTitle, pathTo } from '../lib/tree'
import { cx } from './ui'
import NodeIcon from './NodeIcon'

function Palette({ onClose }) {
  const { nodes, tree, createNode } = useWorkspace()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [index, setIndex] = useState(0)

  const items = useMemo(() => {
    const go = (path) => () => navigate(path)
    const actions = [
      { id: 'a-note', label: t('Neue Notiz'), icon: FilePlus2, run: () => navigate(`/n/${createNode({ type: 'note' })}`) },
      { id: 'a-folder', label: t('Neuer Ordner'), icon: FolderPlus, run: () => navigate(`/f/${createNode({ type: 'folder' })}`) },
      { id: 'a-todo', label: t('Neue Aufgabe'), icon: ListPlus, run: go('/todos?new=1') },
      { id: 'a-event', label: t('Neuer Termin'), icon: CalendarPlus, run: go('/calendar?new=1') },
      { id: 'a-todos', label: t('Aufgaben öffnen'), icon: CircleCheckBig, run: go('/todos') },
      { id: 'a-cal', label: t('Kalender öffnen'), icon: CalendarDays, run: go('/calendar') },
      { id: 'a-settings', label: t('Einstellungen'), icon: Settings, run: go('/settings') },
      { id: 'a-theme', label: t('Hell / Dunkel umschalten'), icon: SunMoon, run: toggleTheme },
    ]
    const words = query.toLowerCase().split(/\s+/).filter(Boolean)
    const matches = (text) => words.every((w) => text.toLowerCase().includes(w))
    const nodeItems = nodes
      .filter((n) => !words.length || matches(nodeTitle(n)))
      .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
      .slice(0, 40)
      .map((n) => ({
        id: n.id,
        node: n,
        label: nodeTitle(n),
        path: pathTo(tree, n.id).slice(0, -1).map(nodeTitle).join(' / '),
        run: go(n.type === 'folder' ? `/f/${n.id}` : `/n/${n.id}`),
      }))
    return [...actions.filter((a) => !words.length || matches(a.label)), ...nodeItems]
  }, [query, nodes, tree, navigate, createNode])

  const run = (item) => {
    onClose()
    item?.run()
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center px-3 pt-[12vh]">
      <div className="animate-fade absolute inset-0 bg-black/45" onMouseDown={onClose} />
      <div className="animate-rise relative w-full max-w-xl overflow-hidden rounded-xl border border-line-strong bg-raised shadow-2xl shadow-black/40">
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search size={17} className="text-faint" />
          <input
            autoFocus
            value={query}
            placeholder={t('Notizen, Ordner oder Aktionen suchen …')}
            onChange={(e) => {
              setQuery(e.target.value)
              setIndex(0)
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setIndex((i) => Math.min(items.length - 1, i + 1))
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setIndex((i) => Math.max(0, i - 1))
              } else if (e.key === 'Enter') run(items[index])
              else if (e.key === 'Escape') onClose()
            }}
            className="h-13 flex-1 bg-transparent text-[15px] outline-none placeholder:text-faint"
          />
        </div>
        <div className="max-h-[55vh] overflow-y-auto p-1.5">
          {items.length === 0 && <p className="px-3 py-6 text-center text-sm text-faint">{t('Nichts gefunden.')}</p>}
          {items.map((item, i) => (
            <button
              key={item.id}
              onMouseMove={() => setIndex(i)}
              onClick={() => run(item)}
              className={cx(
                'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm',
                i === index ? 'bg-hover text-ink' : 'text-muted',
              )}
            >
              {item.node ? <NodeIcon node={item.node} /> : <item.icon size={15} className="text-accent-ink" />}
              <span className="truncate text-ink">{item.label}</span>
              {item.path && <span className="truncate text-xs text-faint">{item.path}</span>}
              {i === index && <CornerDownLeft size={13} className="ml-auto shrink-0 text-faint" />}
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default function CommandPalette({ open, onClose }) {
  return open ? <Palette onClose={onClose} /> : null
}
