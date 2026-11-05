import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronRight, MoreHorizontal, Plus } from 'lucide-react'
import { t } from '../lib/i18n'
import { useWorkspace } from '../lib/workspace'
import { isDescendant, nodeTitle } from '../lib/tree'
import { cx } from './ui'
import { useNodeMenu } from './NodeMenu'
import NodeIcon from './NodeIcon'

const INDENT = 16
const ROW = 30

function RenameInput({ node, onDone }) {
  const { updateNode } = useWorkspace()
  const [value, setValue] = useState(node.title ?? '')
  const ref = useRef(null)

  useEffect(() => {
    ref.current?.focus()
    ref.current?.select()
  }, [])

  const commit = () => {
    if (value.trim() !== (node.title ?? '')) updateNode(node.id, { title: value.trim() })
    onDone()
  }

  return (
    <input
      ref={ref}
      value={value}
      placeholder={nodeTitle({ type: node.type })}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit()
        if (e.key === 'Escape') onDone()
        e.stopPropagation()
      }}
      onClick={(e) => e.stopPropagation()}
      className="h-6 min-w-0 flex-1 rounded border border-accent bg-bg px-1.5 text-[13.5px] outline-none"
    />
  )
}

export default function TreeView({ renamingId, setRenamingId }) {
  const { tree, nodes, loaded, expanded, setOpen, moveNode, createNode } = useWorkspace()
  const { id: activeId } = useParams()
  const navigate = useNavigate()
  const menu = useNodeMenu({ onRename: setRenamingId })
  const [drag, setDrag] = useState(null) // { id, overId, pos }

  // Die Ordner auf dem Weg zur geöffneten Notiz automatisch aufklappen
  useEffect(() => {
    let current = tree.byId.get(activeId)
    while (current?.parentId) {
      setOpen(current.parentId, true)
      current = tree.byId.get(current.parentId)
    }
  }, [activeId, tree, setOpen])

  const dropPosition = (e, node) => {
    const r = e.currentTarget.getBoundingClientRect()
    const y = (e.clientY - r.top) / r.height
    if (node.type === 'folder') return y < 0.28 ? 'before' : y > 0.72 ? 'after' : 'inside'
    return y < 0.5 ? 'before' : 'after'
  }

  const canDrop = (dragId, target) => dragId !== target.id && !isDescendant(tree, dragId, target.id)

  const drop = (target, pos) => {
    const dragId = drag?.id
    setDrag(null)
    if (!dragId || !canDrop(dragId, target)) return
    if (pos === 'inside') return moveNode(dragId, target.id)
    const parentId = target.parentId ?? null
    if (pos === 'before') return moveNode(dragId, parentId, target.id)
    const siblings = tree.childrenOf(parentId).filter((n) => n.id !== dragId)
    const next = siblings[siblings.findIndex((n) => n.id === target.id) + 1]
    moveNode(dragId, parentId, next?.id ?? null)
  }

  const renderNodes = (parentId, depth) => {
    const list = tree.childrenOf(parentId)
    return list.map((node, i) => {
      const isFolder = node.type === 'folder'
      const isOpen = isFolder && expanded.has(node.id)
      const isActive = node.id === activeId
      const kids = isFolder ? tree.childrenOf(node.id) : []
      const over = drag && drag.overId === node.id ? drag.pos : null
      const stemX = (depth - 1) * INDENT + 15

      const openMenu = (e) => {
        e.preventDefault()
        e.stopPropagation()
        const r = e.currentTarget.getBoundingClientRect()
        menu.open(node, e.type === 'contextmenu' ? { x: e.clientX, y: e.clientY } : { x: r.left, y: r.bottom + 4, top: r.top })
      }

      return (
        <div key={node.id} className="relative">
          {depth > 0 && (
            <>
              {i < list.length - 1 && (
                <div className="absolute top-0 bottom-0 w-px bg-line-strong" style={{ left: stemX }} />
              )}
              <div
                className={cx(
                  'pointer-events-none absolute top-0 rounded-bl-[9px] border-b border-l',
                  isActive ? 'border-accent/70' : 'border-line-strong',
                )}
                style={{ left: stemX, width: INDENT - 7, height: ROW / 2 }}
              />
            </>
          )}

          <div
            role="treeitem"
            aria-expanded={isFolder ? isOpen : undefined}
            aria-selected={isActive}
            tabIndex={0}
            draggable={renamingId !== node.id}
            onDragStart={(e) => {
              e.dataTransfer.effectAllowed = 'move'
              e.dataTransfer.setData('text/plain', node.id)
              setDrag({ id: node.id })
            }}
            onDragEnd={() => setDrag(null)}
            onDragOver={(e) => {
              if (!drag || !canDrop(drag.id, node)) return
              e.preventDefault()
              const pos = dropPosition(e, node)
              if (drag.overId !== node.id || drag.pos !== pos) setDrag({ ...drag, overId: node.id, pos })
            }}
            onDrop={(e) => {
              e.preventDefault()
              drop(node, dropPosition(e, node))
            }}
            onClick={() => {
              // Erster Klick öffnet den Ordner, ein weiterer Klick auf den aktiven Ordner klappt ihn zu
              if (isFolder) setOpen(node.id, isActive ? !isOpen : true)
              navigate(isFolder ? `/f/${node.id}` : `/n/${node.id}`)
            }}
            onDoubleClick={() => setRenamingId(node.id)}
            onContextMenu={openMenu}
            onKeyDown={(e) => {
              if (e.key === 'F2') setRenamingId(node.id)
              if (e.key === 'Enter') e.currentTarget.click()
              if (isFolder && e.key === 'ArrowRight') setOpen(node.id, true)
              if (isFolder && e.key === 'ArrowLeft') setOpen(node.id, false)
            }}
            style={{ paddingLeft: depth * INDENT + 6, height: ROW }}
            className={cx(
              'group relative flex cursor-pointer items-center gap-1.5 rounded-md pr-1 text-[13.5px] transition-colors select-none',
              isActive ? 'bg-hover text-ink' : 'text-muted hover:bg-hover hover:text-ink',
              over === 'inside' && 'bg-accent/15 ring-1 ring-accent/60',
              drag?.id === node.id && 'opacity-40',
            )}
          >
            {over === 'before' && <div className="absolute -top-px right-1 left-2 h-0.5 rounded-full bg-accent" />}
            {over === 'after' && <div className="absolute right-1 -bottom-px left-2 h-0.5 rounded-full bg-accent" />}

            {isFolder ? (
              <button
                tabIndex={-1}
                aria-label={isOpen ? t('Zuklappen') : t('Aufklappen')}
                onClick={(e) => {
                  e.stopPropagation()
                  setOpen(node.id, !isOpen)
                }}
                className="-ml-0.5 grid size-[18px] shrink-0 place-items-center rounded text-faint hover:text-ink"
              >
                <ChevronRight size={13} className={cx('transition-transform', isOpen && 'rotate-90')} />
              </button>
            ) : (
              <span className="-ml-0.5 grid size-[18px] shrink-0 place-items-center">
                <span className={cx('size-[5px] rounded-full', isActive ? 'bg-accent' : 'bg-line-strong')} />
              </span>
            )}

            <NodeIcon node={node} open={isOpen} />

            {renamingId === node.id ? (
              <RenameInput node={node} onDone={() => setRenamingId(null)} />
            ) : (
              <span className={cx('min-w-0 flex-1 truncate', !node.title && 'italic text-faint')}>{nodeTitle(node)}</span>
            )}

            {renamingId !== node.id && (
              <div className="flex opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100">
                {isFolder && (
                  <button
                    tabIndex={-1}
                    aria-label={t('Neue Notiz in diesem Ordner')}
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/n/${createNode({ type: 'note', parentId: node.id })}`)
                    }}
                    className="grid size-6 place-items-center rounded text-faint hover:bg-hover hover:text-ink"
                  >
                    <Plus size={14} />
                  </button>
                )}
                <button
                  tabIndex={-1}
                  aria-label={t('Mehr')}
                  onClick={openMenu}
                  className="grid size-6 place-items-center rounded text-faint hover:bg-hover hover:text-ink"
                >
                  <MoreHorizontal size={14} />
                </button>
              </div>
            )}
          </div>

          {isOpen && kids.length > 0 && <div>{renderNodes(node.id, depth + 1)}</div>}
          {isOpen && kids.length === 0 && (
            <div
              className="py-1 text-xs text-faint italic"
              style={{ paddingLeft: (depth + 1) * INDENT + 30, height: ROW - 4 }}
            >
              {t('leer')}
            </div>
          )}
        </div>
      )
    })
  }

  if (!loaded.nodes) {
    return (
      <div className="space-y-2 px-2 pt-2">
        {[70, 50, 62].map((w) => (
          <div key={w} className="h-3 animate-pulse rounded bg-hover" style={{ width: `${w}%` }} />
        ))}
      </div>
    )
  }

  return (
    <div role="tree">
      {nodes.length === 0 ? (
        <p className="px-3 py-2 text-[13px] leading-relaxed text-faint">
          {t('Noch nichts gewachsen. Leg oben mit + deine erste Notiz oder einen Ordner an.')}
        </p>
      ) : (
        renderNodes(null, 0)
      )}

      {/* Ablagefläche für die oberste Ebene */}
      <div
        onDragOver={(e) => drag && e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          if (drag) moveNode(drag.id, null)
          setDrag(null)
        }}
        className={cx(
          'mt-1 h-10 rounded-md border border-dashed transition-colors',
          drag ? 'border-line-strong' : 'border-transparent',
        )}
      />
      {menu.element}
    </div>
  )
}
