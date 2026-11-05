import { t } from './i18n'

// Hilfsfunktionen für die Ordner-/Notiz-Struktur. Knoten: { id, type: 'folder'|'note', parentId, title, order }

const byOrder = (a, b) => (a.order ?? 0) - (b.order ?? 0) || (a.createdAt ?? 0) - (b.createdAt ?? 0)

export function buildTree(nodes) {
  const byId = new Map(nodes.map((n) => [n.id, n]))
  const children = new Map()
  for (const n of nodes) {
    // Verwaiste Knoten landen in der Wurzel statt zu verschwinden
    const parent = n.parentId && byId.has(n.parentId) ? n.parentId : null
    if (!children.has(parent)) children.set(parent, [])
    children.get(parent).push(n)
  }
  children.forEach((list) => list.sort(byOrder))
  return { byId, childrenOf: (id) => children.get(id ?? null) ?? [] }
}

export function pathTo(tree, id) {
  const path = []
  let current = tree.byId.get(id)
  const seen = new Set()
  while (current && !seen.has(current.id)) {
    seen.add(current.id)
    path.unshift(current)
    current = current.parentId ? tree.byId.get(current.parentId) : null
  }
  return path
}

export function descendantIds(tree, id) {
  const out = []
  const walk = (pid) =>
    tree.childrenOf(pid).forEach((c) => {
      out.push(c.id)
      walk(c.id)
    })
  walk(id)
  return out
}

export const isDescendant = (tree, ancestorId, id) => descendantIds(tree, ancestorId).includes(id)

// Sortierschlüssel zwischen zwei Geschwistern, damit beim Verschieben nur ein Dokument geändert wird
export function orderBetween(before, after) {
  if (before == null && after == null) return 1
  if (before == null) return after - 1
  if (after == null) return before + 1
  return (before + after) / 2
}

export const nodeTitle = (node) =>
  node?.title?.trim() || (node?.type === 'folder' ? t('Unbenannter Ordner') : t('Unbenannte Notiz'))
