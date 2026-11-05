// Installierbare Web-App (Home-Bildschirm): Service Worker und Installations-Abfrage.
import { useSyncExternalStore } from 'react'

const ua = navigator.userAgent
export const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
export const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return
  navigator.serviceWorker.register('/sw.js').catch((err) => console.warn('Service Worker nicht registriert', err))
}

// Chrome/Edge/Android bieten eine eigene Installations-Abfrage an, Safari nicht
const subscribers = new Set()
let installEvent = null
const setInstallEvent = (event) => {
  installEvent = event
  subscribers.forEach((fn) => fn())
}
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  setInstallEvent(e)
})
window.addEventListener('appinstalled', () => setInstallEvent(null))

export const useInstallPrompt = () =>
  useSyncExternalStore(
    (fn) => {
      subscribers.add(fn)
      return () => subscribers.delete(fn)
    },
    () => installEvent,
  )

export async function promptInstall() {
  const event = installEvent
  setInstallEvent(null)
  await event?.prompt()
}
