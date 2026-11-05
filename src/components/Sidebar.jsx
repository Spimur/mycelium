import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { CalendarDays, CircleCheckBig, FilePlus2, FolderPlus, LogOut, PanelLeftClose, Search, Settings, Sprout } from 'lucide-react'
import { displayNameOf, useAuth } from '../lib/auth'
import { useWorkspace } from '../lib/workspace'
import { t } from '../lib/i18n'
import { Logo, MyceliumBackdrop, Wordmark } from './Mycelium'
import { IconButton, Kbd, cx } from './ui'
import { useLayout } from './Layout'
import TreeView from './TreeView'

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

function NavItem({ to, icon: Icon, children, end, badge }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cx(
          'flex h-8 items-center gap-2.5 rounded-md px-2.5 text-[13.5px] transition-colors',
          isActive ? 'bg-hover text-ink' : 'text-muted hover:bg-hover hover:text-ink',
        )
      }
    >
      <Icon size={16} strokeWidth={1.75} />
      <span className="flex-1">{children}</span>
      {badge > 0 && <span className="font-mono text-[10.5px] text-faint">{badge}</span>}
    </NavLink>
  )
}

export default function Sidebar({ onCollapse }) {
  const { user, signOut, isLocalMode } = useAuth()
  const { createNode, todos } = useWorkspace()
  const { openPalette } = useLayout()
  const navigate = useNavigate()
  const [renamingId, setRenamingId] = useState(null)

  const create = (type) => {
    const id = createNode({ type })
    if (type === 'note') navigate(`/n/${id}`)
    else setRenamingId(id)
  }

  const displayName = displayNameOf(user)
  const openTodos = todos.filter((todo) => !todo.done).length

  return (
    <div className="relative flex h-full flex-col overflow-hidden pt-[env(safe-area-inset-top)]">
      {/* Myzel wächst vom unteren Rand herauf */}
      <MyceliumBackdrop
        width={300}
        height={260}
        seed={3}
        origins={[[60, 260, -1.7], [210, 260, -1.4], [300, 230, -2.6]]}
        density={0.8}
        className="absolute inset-x-0 bottom-0 h-64 w-full text-ink/[0.07]"
      />

      <div className="flex h-13 items-center gap-2 px-4">
        <Logo className="size-6 text-ink" />
        <Wordmark className="flex-1" />
        <IconButton label={t('Seitenleiste schliessen')} onClick={onCollapse}>
          <PanelLeftClose size={16} />
        </IconButton>
      </div>

      <div className="space-y-px px-2.5">
        <button
          onClick={openPalette}
          className="mb-2 flex h-8 w-full items-center gap-2.5 rounded-md border border-line px-2.5 text-[13.5px] text-faint transition-colors hover:border-line-strong hover:text-muted"
        >
          <Search size={15} />
          <span className="flex-1 text-left">{t('Suchen …')}</span>
          <span className="hidden sm:inline">
            <Kbd>{isMac ? '⌘' : t('Strg')} K</Kbd>
          </span>
        </button>
        <NavItem to="/" end icon={Sprout}>
          {t('Übersicht')}
        </NavItem>
        <NavItem to="/todos" icon={CircleCheckBig} badge={openTodos}>
          {t('Aufgaben')}
        </NavItem>
        <NavItem to="/calendar" icon={CalendarDays}>
          {t('Kalender')}
        </NavItem>
      </div>

      <div className="mt-5 flex items-center px-4 pb-1">
        <span className="label flex-1">{t('Notizen')}</span>
        <IconButton label={t('Neue Notiz')} className="size-6" onClick={() => create('note')}>
          <FilePlus2 size={14} />
        </IconButton>
        <IconButton label={t('Neuer Ordner')} className="size-6" onClick={() => create('folder')}>
          <FolderPlus size={14} />
        </IconButton>
      </div>

      <div className="relative min-h-0 flex-1 overflow-y-auto px-2.5 pb-6">
        <TreeView renamingId={renamingId} setRenamingId={setRenamingId} />
      </div>

      <div className="relative flex items-center gap-1 border-t border-line px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <Link to="/settings" className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1.5 py-1 hover:bg-hover">
          <div className="grid size-7 shrink-0 place-items-center rounded-full bg-accent/20 font-display text-[15px] text-accent-ink">
            {displayName[0]?.toUpperCase()}
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-[13px]">{displayName}</div>
            <div className="truncate text-[11px] text-faint">{isLocalMode ? t('Nur auf diesem Gerät') : user.email}</div>
          </div>
        </Link>
        <NavLink
          to="/settings"
          title={t('Einstellungen')}
          aria-label={t('Einstellungen')}
          className={({ isActive }) =>
            cx(
              'grid size-8 shrink-0 place-items-center rounded-md transition-colors',
              isActive ? 'bg-accent/15 text-accent-ink' : 'text-muted hover:bg-hover hover:text-ink',
            )
          }
        >
          <Settings size={15} />
        </NavLink>
        <IconButton label={t('Abmelden')} onClick={signOut}>
          <LogOut size={15} />
        </IconButton>
      </div>
    </div>
  )
}
