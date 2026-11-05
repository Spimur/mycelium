// Bilder werden im Browser verkleinert und als Daten-URL in einem eigenen Dokument gespeichert.
// So reicht der kostenlose Firestore-Plan, und ein Firestore-Dokument (max. 1 MB) wird nie zu gross.
import { backend, newId } from './backend'
import { t } from './i18n'

const MAX_SIDE = 1800
const MAX_BYTES = 700_000

const assetCache = new Map()

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error(t('Bild konnte nicht gelesen werden.')))
    }
    img.src = url
  })
}

export async function compressImage(file) {
  const img = await loadImage(file)
  let scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height))
  let quality = 0.85
  const canvas = document.createElement('canvas')
  for (let attempt = 0; attempt < 8; attempt++) {
    canvas.width = Math.round(img.width * scale)
    canvas.height = Math.round(img.height * scale)
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
    const data = canvas.toDataURL('image/webp', quality)
    if (data.length * 0.75 <= MAX_BYTES) return { data, width: canvas.width, height: canvas.height }
    if (quality > 0.6) quality -= 0.1
    else scale *= 0.8
  }
  throw new Error(t('Bild ist zu gross.'))
}

export async function uploadImage(uid, file) {
  const { data } = await compressImage(file)
  const id = newId()
  assetCache.set(id, Promise.resolve(data))
  await backend.put(uid, 'assets', id, { data, createdAt: Date.now() })
  return id
}

export function loadAsset(uid, id) {
  if (!assetCache.has(id)) {
    const p = backend.get(uid, 'assets', id).then((a) => a?.data ?? null)
    p.catch(() => assetCache.delete(id))
    assetCache.set(id, p)
  }
  return assetCache.get(id)
}

export function assetIdsIn(json) {
  if (!json) return []
  return [...json.matchAll(/"assetId":"([^"]+)"/g)].map((m) => m[1])
}
