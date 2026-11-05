import { FileText, Folder, FolderOpen } from 'lucide-react'
import { colorHex } from '../lib/palette'

export default function NodeIcon({ node, open = false, size = 15 }) {
  if (node.icon) {
    return (
      <span className="grid w-4 shrink-0 place-items-center text-[13px] leading-none" style={{ fontSize: size - 2 }}>
        {node.icon}
      </span>
    )
  }
  const color = node.color ? colorHex(node.color) : undefined
  const Icon = node.type === 'folder' ? (open ? FolderOpen : Folder) : FileText
  return (
    <Icon
      size={size}
      strokeWidth={1.75}
      className="shrink-0 text-faint"
      style={color ? { color, fill: node.type === 'folder' ? `${color}33` : undefined } : undefined}
    />
  )
}
