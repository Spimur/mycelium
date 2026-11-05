// Systemsprache der Oberfläche. Die deutschen Texte im Code sind gleichzeitig die Schlüssel;
// für Englisch werden sie über das Wörterbuch in ./en.js ersetzt. Notizinhalte bleiben unberührt.
import { useSyncExternalStore } from 'react'
import { de as deLocale, enGB } from 'date-fns/locale'
import en from './en'

const KEY = 'mycelium:lang'
export const LANGUAGES = [
  { value: 'de', label: 'Deutsch' },
  { value: 'en', label: 'English' },
]

const subscribers = new Set()

function initial() {
  try {
    const stored = localStorage.getItem(KEY)
    if (stored === 'de' || stored === 'en') return stored
  } catch {
    /* privater Modus */
  }
  return navigator.language?.toLowerCase().startsWith('de') ? 'de' : 'en'
}

let lang = initial()
document.documentElement.lang = lang

export const getLang = () => lang

export function setLang(next) {
  if (next === lang || !LANGUAGES.some((l) => l.value === next)) return
  lang = next
  document.documentElement.lang = next
  try {
    localStorage.setItem(KEY, next)
  } catch {
    /* privater Modus */
  }
  subscribers.forEach((fn) => fn())
}

export function useLang() {
  return useSyncExternalStore((fn) => {
    subscribers.add(fn)
    return () => subscribers.delete(fn)
  }, getLang)
}

/** Übersetzt einen deutschen Text. Platzhalter: t('{n} Einträge', { n: 3 }) */
export function t(text, vars) {
  let out = lang === 'en' ? (en[text] ?? text) : text
  if (vars) out = out.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''))
  return out
}

/** Einzahl/Mehrzahl: tn(n, '{n} Notiz', '{n} Notizen') */
export const tn = (n, one, many) => t(n === 1 ? one : many, { n })

export const dateLocale = () => (lang === 'en' ? enGB : deLocale)
export const intlLocale = () => (lang === 'en' ? 'en-GB' : 'de-CH')
