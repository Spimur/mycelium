import { Link } from 'react-router-dom'
import { useWorkspace } from '../lib/workspace'
import { nodeTitle, pathTo } from '../lib/tree'
import { cx } from './ui'
import NodeIcon from './NodeIcon'

export default function Breadcrumbs({ id }) {
  const { tree } = useWorkspace()
  const path = pathTo(tree, id)
  return (
    <nav className="flex min-w-0 items-center gap-1 text-[13px] text-faint">
      {path.map((n, i) => (
        <span key={n.id} className={cx('flex min-w-0 items-center gap-1', i < path.length - 1 && 'max-sm:hidden')}>
          {i > 0 && <span className="text-line-strong">/</span>}
          <Link
            to={n.type === 'folder' ? `/f/${n.id}` : `/n/${n.id}`}
            className={cx(
              'flex min-w-0 items-center gap-1.5 rounded px-1 py-0.5 hover:bg-hover hover:text-ink',
              i === path.length - 1 && 'text-muted',
            )}
          >
            <NodeIcon node={n} size={13} />
            <span className="truncate">{nodeTitle(n)}</span>
          </Link>
        </span>
      ))}
    </nav>
  )
}
