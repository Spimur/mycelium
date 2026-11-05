// Prüft Adressen, bevor sie als Link oder Bild in einer Notiz landen.
// Verhindert z. B. "javascript:"-Links, die beim Anklicken Code ausführen würden.

const LINK_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:'])

/** Normalisiert eine eingegebene Adresse und gibt sie nur zurück, wenn sie sicher ist (sonst null). */
export function safeLinkUrl(input) {
  const raw = String(input ?? '').trim()
  if (!raw) return null
  const withProtocol = /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`
  try {
    const url = new URL(withProtocol)
    return LINK_PROTOCOLS.has(url.protocol) ? url.href : null
  } catch {
    return null
  }
}

export const isSafeLinkUrl = (url) => safeLinkUrl(url) != null

/** Bilder dürfen nur über HTTPS oder als eingebettete Bilddaten kommen. */
export function isSafeImageSrc(src) {
  if (typeof src !== 'string') return false
  if (/^data:image\/(png|jpe?g|gif|webp);base64,/i.test(src)) return true
  try {
    return new URL(src).protocol === 'https:'
  } catch {
    return false
  }
}
