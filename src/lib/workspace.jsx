import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { backend, newId } from './backend'
import { assetIdsIn } from './images'
import { buildTree, descendantIds, orderBetween } from './tree'
import { useAuth } from './auth'
import { setLang, t } from './i18n'
import { setThemePref } from './theme'
import { useToast } from '../components/Toast'

const WorkspaceContext = createContext(null)

const EXPANDED_KEY = 'mycelium:expanded'
const readExpanded = () => {
  try {
    return new Set(JSON.parse(localStorage.getItem(EXPANDED_KEY) || '[]'))
  } catch {
    return new Set()
  }
}

const COLLECTIONS = ['nodes', 'events', 'tags', 'todos']

export function WorkspaceProvider({ children }) {
  const { user } = useAuth()
  const uid = user.uid
  const toast = useToast()

  const [data, setData] = useState({ nodes: [], events: [], tags: [], todos: [] })
  const [loaded, setLoaded] = useState({ nodes: false, events: false, tags: false, todos: false })
  const [expanded, setExpanded] = useState(readExpanded)
  const prefsApplied = useRef(false)

  useEffect(() => {
    const onError = (err) => {
      console.error(err)
      toast(
        err?.code === 'permission-denied'
          ? t('Kein Zugriff auf die Datenbank. Sind die Firestore-Regeln veröffentlicht?')
          : t('Synchronisierung fehlgeschlagen.'),
        { tone: 'error', duration: 6000 },
      )
    }
    const offs = COLLECTIONS.map((name) =>
      backend.subscribe(
        uid,
        name,
        (list) => {
          setData((d) => ({ ...d, [name]: list }))
          setLoaded((l) => (l[name] ? l : { ...l, [name]: true }))
        },
        onError,
      ),
    )
    // Sprache und Theme folgen dem Account auf jedes Gerät
    offs.push(
      backend.subscribe(uid, 'settings', (list) => {
        const stored = list.find((s) => s.id === 'prefs')
        if (!stored || prefsApplied.current) return
        prefsApplied.current = true
        if (stored.theme) setThemePref(stored.theme)
        if (stored.lang) setLang(stored.lang)
      }),
    )
    return () => offs.forEach((off) => off())
  }, [uid, toast])

  useEffect(() => {
    localStorage.setItem(EXPANDED_KEY, JSON.stringify([...expanded]))
  }, [expanded])

  const { nodes, events, tags, todos } = data
  const tree = useMemo(() => buildTree(nodes), [nodes])
  const sortedTags = useMemo(() => [...tags].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '')), [tags])

  const fail = useCallback(
    (err) => {
      console.error(err)
      toast(t('Speichern fehlgeschlagen.'), { tone: 'error' })
    },
    [toast],
  )

  const setOpen = useCallback((id, open) => {
    setExpanded((prev) => {
      if (prev.has(id) === open) return prev
      const next = new Set(prev)
      if (open) next.add(id)
      else next.delete(id)
      return next
    })
  }, [])

  // ---------- Ordner & Notizen ----------

  const createNode = useCallback(
    ({ type, parentId = null, title = '' }) => {
      const id = newId()
      const siblings = tree.childrenOf(parentId)
      const now = Date.now()
      const node = {
        type,
        parentId,
        title,
        order: orderBetween(siblings.at(-1)?.order, null),
        createdAt: now,
        updatedAt: now,
      }
      backend.put(uid, 'nodes', id, node).catch(fail)
      if (parentId) setOpen(parentId, true)
      return id
    },
    [tree, uid, fail, setOpen],
  )

  const updateNode = useCallback(
    (id, patch) => backend.put(uid, 'nodes', id, { ...patch, updatedAt: Date.now() }).catch(fail),
    [uid, fail],
  )

  // Verschiebt einen Knoten in parentId, vor beforeId (oder ans Ende)
  const moveNode = useCallback(
    (id, parentId, beforeId = null) => {
      const siblings = tree.childrenOf(parentId).filter((n) => n.id !== id)
      const index = beforeId ? siblings.findIndex((n) => n.id === beforeId) : siblings.length
      const order = orderBetween(siblings[index - 1]?.order, siblings[index]?.order)
      if (parentId) setOpen(parentId, true)
      return backend.put(uid, 'nodes', id, { parentId, order }).catch(fail)
    },
    [tree, uid, fail, setOpen],
  )

  const deleteNode = useCallback(
    async (id) => {
      const ids = [id, ...descendantIds(tree, id)]
      const noteIds = ids.filter((i) => tree.byId.get(i)?.type === 'note')
      try {
        const contents = await Promise.all(noteIds.map((i) => backend.get(uid, 'contents', i)))
        const assets = contents.flatMap((c) => assetIdsIn(c?.json))
        await backend.removeMany(uid, 'nodes', ids)
        await backend.removeMany(uid, 'contents', noteIds)
        if (assets.length) await backend.removeMany(uid, 'assets', assets)
      } catch (err) {
        fail(err)
      }
    },
    [tree, uid, fail],
  )

  const duplicateNote = useCallback(
    async (id) => {
      const source = tree.byId.get(id)
      if (!source || source.type !== 'note') return null
      const content = await backend.get(uid, 'contents', id)
      let json = content?.json ?? null
      // Bilder mitkopieren, damit das Löschen einer Kopie die andere nicht beschädigt
      for (const assetId of new Set(assetIdsIn(json))) {
        const asset = await backend.get(uid, 'assets', assetId)
        if (!asset) continue
        const copyId = newId()
        await backend.put(uid, 'assets', copyId, { data: asset.data, createdAt: Date.now() })
        json = json.replaceAll(`"assetId":"${assetId}"`, `"assetId":"${copyId}"`)
      }
      const siblings = tree.childrenOf(source.parentId)
      const next = siblings[siblings.findIndex((n) => n.id === id) + 1]
      const copyId = newId()
      const now = Date.now()
      if (json) await backend.put(uid, 'contents', copyId, { json, updatedAt: now })
      await backend.put(uid, 'nodes', copyId, {
        type: 'note',
        parentId: source.parentId ?? null,
        title: `${source.title || t('Unbenannte Notiz')} (${t('Kopie')})`,
        icon: source.icon ?? null,
        color: source.color ?? null,
        order: orderBetween(source.order, next?.order),
        createdAt: now,
        updatedAt: now,
      })
      return copyId
    },
    [tree, uid],
  )

  // ---------- Termine, Aufgaben, Tags ----------

  const saveIn = useCallback(
    (name) => (id, patch) => {
      const docId = id ?? newId()
      const now = Date.now()
      backend.put(uid, name, docId, { ...patch, ...(id ? {} : { createdAt: now }), updatedAt: now }).catch(fail)
      return docId
    },
    [uid, fail],
  )
  const removeIn = useCallback((name) => (id) => backend.remove(uid, name, id).catch(fail), [uid, fail])

  const saveEvent = useMemo(() => saveIn('events'), [saveIn])
  const deleteEvent = useMemo(() => removeIn('events'), [removeIn])
  const saveTodo = useMemo(() => saveIn('todos'), [saveIn])
  const deleteTodo = useMemo(() => removeIn('todos'), [removeIn])
  const saveTag = useMemo(() => saveIn('tags'), [saveIn])

  const deleteTodos = useCallback((ids) => backend.removeMany(uid, 'todos', ids).catch(fail), [uid, fail])

  // Tag löschen und überall entfernen, wo er verwendet wird
  const deleteTag = useCallback(
    async (id) => {
      try {
        for (const name of ['events', 'todos']) {
          const affected = data[name].filter((x) => x.tagIds?.includes(id))
          if (affected.length) {
            await backend.putMany(
              uid,
              name,
              affected.map((x) => ({ id: x.id, data: { tagIds: x.tagIds.filter((tid) => tid !== id) } })),
            )
          }
        }
        await backend.remove(uid, 'tags', id)
      } catch (err) {
        fail(err)
      }
    },
    [data, uid, fail],
  )

  const savePrefs = useCallback((patch) => backend.put(uid, 'settings', 'prefs', patch).catch(fail), [uid, fail])

  const value = {
    uid,
    nodes,
    tree,
    events,
    todos,
    tags: sortedTags,
    loaded,
    expanded,
    setOpen,
    createNode,
    updateNode,
    moveNode,
    deleteNode,
    duplicateNote,
    saveEvent,
    deleteEvent,
    saveTodo,
    deleteTodo,
    deleteTodos,
    saveTag,
    deleteTag,
    savePrefs,
  }

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useWorkspace = () => useContext(WorkspaceContext)
