import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { PanelLeft } from 'lucide-react'
import { t } from '../lib/i18n'
import Sidebar from './Sidebar'
import CommandPalette from './CommandPalette'
import InstallPrompt from './InstallPrompt'
import { IconButton, cx } from './ui'

const LayoutContext = createContext(null)
// eslint-disable-next-line react-refresh/only-export-components
export const useLayout = () => useContext(LayoutContext)

const WIDTH_KEY = 'mycelium:sidebar-width'
const COLLAPSED_KEY = 'mycelium:sidebar-collapsed'

export default function Layout() {
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSED_KEY) === '1')
  const [width, setWidth] = useState(() => Number(localStorage.getItem(WIDTH_KEY)) || 272)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [lastPath, setLastPath] = useState(location.pathname)

  // Auf dem Handy schliesst die Sidebar nach jeder Navigation
  if (lastPath !== location.pathname) {
    setLastPath(location.pathname)
    setMobileOpen(false)
  }

  useEffect(() => localStorage.setItem(COLLAPSED_KEY, collapsed ? '1' : '0'), [collapsed])

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((o) => !o)
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault()
        setCollapsed((c) => !c)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const startResize = (e) => {
    e.preventDefault()
    const startX = e.clientX
    const startW = width
    let next = startW
    const move = (ev) => {
      next = Math.min(440, Math.max(220, startW + ev.clientX - startX))
      setWidth(next)
    }
    const up = () => {
      localStorage.setItem(WIDTH_KEY, String(next))
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      document.body.style.cursor = ''
    }
    document.body.style.cursor = 'col-resize'
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const openSidebar = useCallback(() => {
    setMobileOpen(true)
    setCollapsed(false)
  }, [])

  const ctx = {
    openSidebar,
    sidebarHidden: collapsed,
    openPalette: () => setPaletteOpen(true),
  }

  return (
    <LayoutContext.Provider value={ctx}>
      <div className="flex h-dvh overflow-hidden">
        {mobileOpen && (
          <div className="animate-fade fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setMobileOpen(false)} />
        )}
        <aside
          style={{ '--w': `${width}px` }}
          className={cx(
            'fixed inset-y-0 left-0 z-40 w-[min(86vw,320px)] border-r border-line bg-panel transition-transform duration-200',
            'md:relative md:z-auto md:w-[var(--w)] md:translate-x-0 md:transition-none',
            mobileOpen ? 'translate-x-0' : '-translate-x-full',
            collapsed && 'md:hidden',
          )}
        >
          <Sidebar onCollapse={() => (mobileOpen ? setMobileOpen(false) : setCollapsed(true))} />
          <div
            onPointerDown={startResize}
            className="absolute inset-y-0 -right-1 z-10 hidden w-2 cursor-col-resize md:block [&:hover>div]:bg-accent"
          >
            <div className="mx-auto h-full w-px transition-colors" />
          </div>
        </aside>
        <main className="relative flex min-w-0 flex-1 flex-col">
          <Outlet />
        </main>
      </div>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <InstallPrompt />
    </LayoutContext.Provider>
  )
}

/** Kopfzeile jeder Seite. Zeigt auf dem Handy (oder bei eingeklappter Sidebar) den Menü-Knopf. */
export function PageHeader({ children, actions, className }) {
  const { openSidebar, sidebarHidden } = useLayout()
  return (
    <header
      className={cx(
        'flex h-13 shrink-0 items-center gap-2 px-3 pt-[env(safe-area-inset-top)] sm:px-5',
        className,
      )}
    >
      <IconButton label={t('Seitenleiste öffnen')} onClick={openSidebar} className={sidebarHidden ? '' : 'md:hidden'}>
        <PanelLeft size={17} />
      </IconButton>
      <div className="flex min-w-0 flex-1 items-center gap-1">{children}</div>
      {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
    </header>
  )
}
