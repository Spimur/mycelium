// Einheitliche Speicher-Schnittstelle. Alle Daten liegen pro Account unter users/{uid}/{collection}/{id}.
// Ist Firebase nicht konfiguriert, wird stattdessen IndexedDB im Browser verwendet.
import { collection, deleteDoc, doc, getDoc, onSnapshot, setDoc, writeBatch } from 'firebase/firestore'
import { db, isFirebaseConfigured } from './firebase'

export const isLocalMode = !isFirebaseConfigured

export const newId = () => crypto.randomUUID().replace(/-/g, '').slice(0, 20)

const chunk = (arr, size) => {
  const out = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

const cloud = {
  subscribe(uid, name, onData, onError) {
    return onSnapshot(
      collection(db, 'users', uid, name),
      (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      onError,
    )
  },
  async get(uid, name, id) {
    const snap = await getDoc(doc(db, 'users', uid, name, id))
    return snap.exists() ? { id: snap.id, ...snap.data() } : null
  },
  put(uid, name, id, data) {
    return setDoc(doc(db, 'users', uid, name, id), data, { merge: true })
  },
  remove(uid, name, id) {
    return deleteDoc(doc(db, 'users', uid, name, id))
  },
  async removeMany(uid, name, ids) {
    for (const part of chunk(ids, 400)) {
      const batch = writeBatch(db)
      part.forEach((id) => batch.delete(doc(db, 'users', uid, name, id)))
      await batch.commit()
    }
  },
  async putMany(uid, name, entries) {
    for (const part of chunk(entries, 400)) {
      const batch = writeBatch(db)
      part.forEach(({ id, data }) => batch.set(doc(db, 'users', uid, name, id), data, { merge: true }))
      await batch.commit()
    }
  },
}

// ---------- Lokaler Modus (IndexedDB) ----------

let idbPromise
function idb() {
  idbPromise ??= new Promise((resolve, reject) => {
    const req = indexedDB.open('mycelium-local', 1)
    req.onupgradeneeded = () => req.result.createObjectStore('collections')
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return idbPromise
}

async function idbRequest(mode, fn) {
  const database = await idb()
  return new Promise((resolve, reject) => {
    const req = fn(database.transaction('collections', mode).objectStore('collections'))
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

const cache = new Map()
const listeners = new Map()

const keyOf = (uid, name) => `${uid}:${name}`
const load = (key) => {
  if (!cache.has(key)) cache.set(key, idbRequest('readonly', (s) => s.get(key)).then((v) => v ?? {}))
  return cache.get(key)
}
const toList = (data) => Object.entries(data).map(([id, d]) => ({ id, ...d }))

async function mutate(uid, name, fn) {
  const key = keyOf(uid, name)
  const data = await load(key)
  fn(data)
  // Erst die Oberfläche aktualisieren, dann speichern – so fühlt es sich an wie Firestore
  const list = toList(data)
  listeners.get(key)?.forEach((l) => l(list))
  await idbRequest('readwrite', (s) => s.put(data, key))
}

const local = {
  subscribe(uid, name, onData) {
    const key = keyOf(uid, name)
    if (!listeners.has(key)) listeners.set(key, new Set())
    listeners.get(key).add(onData)
    let active = true
    load(key).then((data) => active && onData(toList(data)))
    return () => {
      active = false
      listeners.get(key).delete(onData)
    }
  },
  async get(uid, name, id) {
    const data = await load(keyOf(uid, name))
    return data[id] ? { id, ...data[id] } : null
  },
  put(uid, name, id, value) {
    return mutate(uid, name, (data) => {
      data[id] = { ...data[id], ...value }
    })
  },
  remove(uid, name, id) {
    return mutate(uid, name, (data) => {
      delete data[id]
    })
  },
  removeMany(uid, name, ids) {
    return mutate(uid, name, (data) => ids.forEach((id) => delete data[id]))
  },
  putMany(uid, name, entries) {
    return mutate(uid, name, (data) =>
      entries.forEach(({ id, data: value }) => {
        data[id] = { ...data[id], ...value }
      }),
    )
  },
}

export const backend = isFirebaseConfigured ? cloud : local
