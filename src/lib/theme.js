import { useSyncExternalStore } from 'react'

const KEY = 'mycelium:theme'
const subscribers = new Set()
const media = window.matchMedia('(prefers-color-scheme: light)')

// Gewählte Einstellung: 'light' | 'dark' | 'system'
function readPref() {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'light' || v === 'dark' ? v : 'system'
  } catch {
    return 'system'
  }
}

let pref = readPref()

const resolved = () => (pref === 'system' ? (media.matches ? 'light' : 'dark') : pref)

function apply() {
  const theme = resolved()
  document.documentElement.dataset.theme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#1C1B1B' : '#D5D5C6')
  subscribers.forEach((fn) => fn())
}

media.addEventListener('change', () => pref === 'system' && apply())

export function setThemePref(next) {
  if (next === pref) return
  pref = next
  try {
    if (next === 'system') localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, next)
  } catch {
    /* privater Modus */
  }
  apply()
}

export const getThemePref = () => pref

export const toggleTheme = () => setThemePref(resolved() === 'dark' ? 'light' : 'dark')

const subscribe = (fn) => {
  subscribers.add(fn)
  return () => subscribers.delete(fn)
}

/** Tatsächlich angezeigtes Theme ('light' | 'dark') */
export const useTheme = () => useSyncExternalStore(subscribe, resolved)

/** Gewählte Einstellung inkl. 'system' */
export const useThemePref = () => useSyncExternalStore(subscribe, getThemePref)
