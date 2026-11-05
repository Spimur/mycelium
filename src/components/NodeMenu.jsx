/* eslint-disable react-refresh/only-export-components -- TipTap-Erweiterungen/Hooks neben ihren Komponenten */
import { useCallback, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronRight, Copy, FilePlus2, FolderInput, FolderPlus, Home, Palette, Pencil, Trash2 } from 'lucide-react'
import { t } from '../lib/i18n'
import { useWorkspace } from '../lib/workspace'
import { NODE_ICONS } from '../lib/palette'
import { descendantIds, nodeTitle } from '../lib/tree'
import { ConfirmDialog, MenuDivider, MenuItem, Modal, Popover, Swatches, cx } from './ui'
import NodeIcon from './NodeIcon'

function StyleDialog({ node, onClose }) {
  const { updateNode } = useWorkspace()
  return (
    <Modal open onClose={onClose} title={t('Aussehen')}>
      <div className="space-y-5">
        <div>
          <p className="label mb-2">Farbe</p>
          <Swatches value={node.color} allowNone onChange={(color) => updateNode(node.id, { color })} />
        </div>
        <div>
          <p className="label mb-2">Symbol</p>
          <div className="grid grid-cols-8 gap-1">
            <button
              onClick={() => updateNode(node.id, { icon: null })}
              className={cx(
                'grid aspect-square place-items-center rounded-md border border-line text-xs text-faint hover:bg-hover',
                !node.icon && 'border-accent',
              )}
            >
              —
            </button>
            {NODE_ICONS.map((icon) => (
              <button
                key={icon}
                onClick={() => updateNode(node.id, { icon })}
                className={cx(
                  'grid aspect-square place-items-center rounded-md text-lg hover:bg-hover',
                  node.icon === icon && 'bg-accent/15 ring-1 ring-accent',
                )}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  )
}

function MoveDialog({ node, onClose }) {
  const { tree, moveNode } = useWorkspace()
  const blocked = new Set([node.id, ...descendantIds(tree, node.id)])

  const renderFolders = (parentId, depth) =>
    tree
      .childrenOf(parentId)
      .filter((n) => n.type === 'folder' && !blocked.has(n.id))
      .map((f) => (
        <div key={f.id}>
          <button
            onClick={() => {
              moveNode(node.id, f.id)
              onClose()
            }}
            disabled={node.parentId === f.id}
            style={{ paddingLeft: 10 + depth * 16 }}
            className="flex w-full items-center gap-2 rounded-md py-1.5 pr-2 text-left text-sm hover:bg-hover disabled:opacity-40"
          >
            <NodeIcon node={f} />
            <span className="truncate">{nodeTitle(f)}</span>
          </button>
          {renderFolders(f.id, depth + 1)}
        </div>
      ))

  return (
    <Modal open onClose={onClose} title={t('Verschieben nach')}>
      <div className="-mx-2 max-h-[50vh] overflow-y-auto">
        <button
          onClick={() => {
            moveNode(node.id, null)
            onClose()
          }}
          disabled={!node.parentId}
          className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm hover:bg-hover disabled:opacity-40"
        >
          <Home size={15} className="text-muted" /> {t('Oberste Ebene')}
        </button>
        {renderFolders(null, 0)}
      </div>
    </Modal>
  )
}

/**
 * Kontextmenü für Ordner und Notizen.
 * Gibt eine open(node, position)-Funktion und das zu rendernde Element zurück.
 */
export function useNodeMenu({ onRename } = {}) {
  const { tree, createNode, deleteNode, duplicateNote } = useWorkspace()
  const navigate = useNavigate()
  const location = useLocation()
  const [menu, setMenu] = useState(null)
  const [dialog, setDialog] = useState(null)

  const open = useCallback((node, at) => setMenu({ node, at }), [])
  const close = useCallback(() => setMenu(null), [])

  const act = (fn) => () => {
    const node = menu.node
    setMenu(null)
    fn(node)
  }

  const childCount = (node) => descendantIds(tree, node.id).length

  const element = (
    <>
      <Popover at={menu?.at} onClose={close}>
        {menu && (
          <>
            {menu.node.type === 'folder' && (
              <>
                <MenuItem
                  icon={FilePlus2}
                  onClick={act((n) => navigate(`/n/${createNode({ type: 'note', parentId: n.id })}`))}
                >
                  {t('Neue Notiz hier')}
                </MenuItem>
                <MenuItem
                  icon={FolderPlus}
                  onClick={act((n) => onRename?.(createNode({ type: 'folder', parentId: n.id })))}
                >
                  {t('Neuer Unterordner')}
                </MenuItem>
                <MenuDivider />
              </>
            )}
            {onRename && (
              <MenuItem icon={Pencil} hint="F2" onClick={act((n) => onRename(n.id))}>
                {t('Umbenennen')}
              </MenuItem>
            )}
            <MenuItem icon={Palette} onClick={act((n) => setDialog({ type: 'style', id: n.id }))}>
              {t('Farbe & Symbol')}
            </MenuItem>
            {menu.node.type === 'note' && (
              <MenuItem
                icon={Copy}
                onClick={act(async (n) => {
                  const id = await duplicateNote(n.id)
                  if (id) navigate(`/n/${id}`)
                })}
              >
                {t('Duplizieren')}
              </MenuItem>
            )}
            <MenuItem icon={FolderInput} onClick={act((n) => setDialog({ type: 'move', id: n.id }))}>
              {t('Verschieben nach')} <ChevronRight size={13} className="ml-auto inline text-faint" />
            </MenuItem>
            <MenuDivider />
            <MenuItem icon={Trash2} danger onClick={act((n) => setDialog({ type: 'delete', id: n.id }))}>
              {t('Löschen')}
            </MenuItem>
          </>
        )}
      </Popover>

      {dialog?.type === 'style' && tree.byId.get(dialog.id) && (
        <StyleDialog node={tree.byId.get(dialog.id)} onClose={() => setDialog(null)} />
      )}
      {dialog?.type === 'move' && tree.byId.get(dialog.id) && (
        <MoveDialog node={tree.byId.get(dialog.id)} onClose={() => setDialog(null)} />
      )}
      {dialog?.type === 'delete' && tree.byId.get(dialog.id) && (
        <ConfirmDialog
          open
          title={t('„{name}“ löschen?', { name: nodeTitle(tree.byId.get(dialog.id)) })}
          message={
            tree.byId.get(dialog.id).type === 'folder' && childCount(tree.byId.get(dialog.id)) > 0
              ? t('Der Ordner und alles darin ({n} Einträge) werden endgültig gelöscht.', { n: childCount(tree.byId.get(dialog.id)) })
              : t('Das kann nicht rückgängig gemacht werden.')
          }
          onConfirm={() => {
            const id = dialog.id
            const affected = [id, ...descendantIds(tree, id)]
            if (affected.some((a) => location.pathname.endsWith(`/${a}`))) navigate('/')
            deleteNode(id)
          }}
          onClose={() => setDialog(null)}
        />
      )}
    </>
  )

  return { open, element }
}
