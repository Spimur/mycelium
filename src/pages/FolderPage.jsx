import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { FilePlus2, FolderPlus, MoreHorizontal } from 'lucide-react'
import { dateLocale, t, tn } from '../lib/i18n'
import { useWorkspace } from '../lib/workspace'
import { colorHex } from '../lib/palette'
import { descendantIds, nodeTitle } from '../lib/tree'
import { PageHeader } from '../components/Layout'
import { useNodeMenu } from '../components/NodeMenu'
import { MyceliumBackdrop } from '../components/Mycelium'
import { Button, IconButton } from '../components/ui'
import NodeIcon from '../components/NodeIcon'
import Breadcrumbs from '../components/Breadcrumbs'
import Missing from './Missing'

function FolderTitle({ node }) {
  const { updateNode } = useWorkspace()
  const [draft, setDraft] = useState(null)
  return (
    <input
      value={draft ?? node.title ?? ''}
      placeholder={t('Unbenannter Ordner')}
      autoFocus={!node.title}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        if (draft != null && draft.trim() !== (node.title ?? '')) updateNode(node.id, { title: draft.trim() })
        setDraft(null)
      }}
      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
      className="w-full bg-transparent font-display text-4xl tracking-tight outline-none placeholder:text-faint sm:text-5xl"
    />
  )
}

export default function FolderPage() {
  const { id } = useParams()
  const { tree, loaded, createNode } = useWorkspace()
  const navigate = useNavigate()
  const menu = useNodeMenu()
  const node = tree.byId.get(id)

  if (!loaded.nodes) return null
  if (!node || node.type !== 'folder') return <Missing />

  const children = tree.childrenOf(id)
  const accent = node.color ? colorHex(node.color) : null

  return (
    <>
      <PageHeader
        actions={
          <IconButton
            label={t('Mehr')}
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect()
              menu.open(node, { x: r.right, y: r.bottom + 4 })
            }}
          >
            <MoreHorizontal size={17} />
          </IconButton>
        }
      >
        <Breadcrumbs id={id} />
      </PageHeader>

      <div className="relative min-h-0 flex-1 overflow-y-auto">
        <MyceliumBackdrop
          key={id}
          width={900}
          height={260}
          seed={id.charCodeAt(0) + id.charCodeAt(1) * 7}
          origins={[[900, 0, 2.5], [0, 0, 0.6]]}
          density={0.7}
          animate
          className="absolute inset-x-0 top-0 h-64 w-full opacity-25"
          style={{ color: accent ?? 'var(--c-ink)' }}
        />
        <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-transparent to-bg" />

        <div className="relative mx-auto max-w-4xl px-5 pt-14 pb-16 sm:px-8 sm:pt-24">
          {node.icon && <div className="mb-3 text-5xl">{node.icon}</div>}
          <FolderTitle key={id} node={node} />
          <p className="label mt-3">
            {tn(children.length, '{n} Eintrag', '{n} Einträge')} · {t('{n} insgesamt', { n: descendantIds(tree, id).length })}
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate(`/n/${createNode({ type: 'note', parentId: id })}`)}>
              <FilePlus2 size={15} /> {t('Neue Notiz')}
            </Button>
            <Button variant="outline" onClick={() => navigate(`/f/${createNode({ type: 'folder', parentId: id })}`)}>
              <FolderPlus size={15} /> {t('Unterordner')}
            </Button>
          </div>

          {children.length === 0 ? (
            <p className="mt-16 text-center text-sm text-faint">{t('Dieser Ordner ist noch leer.')}</p>
          ) : (
            <div className="mt-8 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {children.map((child) => {
                const count = child.type === 'folder' ? tree.childrenOf(child.id).length : null
                return (
                  <Link
                    key={child.id}
                    to={child.type === 'folder' ? `/f/${child.id}` : `/n/${child.id}`}
                    className="group relative flex flex-col gap-6 overflow-hidden rounded-lg border border-line bg-bg/60 p-4 transition-colors hover:border-line-strong hover:bg-hover"
                  >
                    {child.color && (
                      <span className="absolute inset-y-0 left-0 w-[3px]" style={{ background: colorHex(child.color) }} />
                    )}
                    <div className="flex items-center gap-2">
                      <NodeIcon node={child} size={16} />
                      <span className="label">{child.type === 'folder' ? `${t('Ordner')} · ${count}` : t('Notiz')}</span>
                    </div>
                    <div>
                      <div className="truncate font-medium">{nodeTitle(child)}</div>
                      <div className="mt-0.5 text-xs text-faint">
                        {child.updatedAt && formatDistanceToNow(child.updatedAt, { locale: dateLocale(), addSuffix: true })}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
      {menu.element}
    </>
  )
}
