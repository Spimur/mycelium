/* eslint-disable react-refresh/only-export-components -- TipTap-Erweiterungen/Hooks neben ihren Komponenten */
import { forwardRef, useImperativeHandle, useState } from 'react'
import { createPortal } from 'react-dom'
import { t } from '../lib/i18n'
import { cx } from '../components/ui'
import { filterCommands } from './commands'

/** Prüft, ob vor dem Cursor ein "/befehl" steht, und liefert Position + Suchbegriff. */
export function detectSlash(editor) {
  const { state } = editor
  const { $from, empty } = state.selection
  if (!empty || $from.parent.type.spec.code) return null
  const before = $from.parent.textBetween(0, $from.parentOffset, undefined, '￼')
  const match = /(?:^|\s)\/([\p{L}\d]{0,20})$/u.exec(before)
  if (!match) return null
  const from = $from.pos - match[1].length - 1
  const coords = editor.view.coordsAtPos(from)
  return { query: match[1], from, to: $from.pos, coords }
}

/** Schwebende Befehlsliste. Tastatursteuerung kommt per Ref aus dem Editor. */
const SlashMenu = forwardRef(function SlashMenu({ slash, onRun }, ref) {
  const items = filterCommands(slash.query)
  const [state, setState] = useState({ query: slash.query, index: 0 })
  // Auswahl zurücksetzen, sobald sich der Suchbegriff ändert
  if (state.query !== slash.query) setState({ query: slash.query, index: 0 })
  const index = Math.min(state.index, Math.max(0, items.length - 1))
  const setIndex = (fn) => setState((s) => ({ ...s, index: typeof fn === 'function' ? fn(s.index) : fn }))

  useImperativeHandle(ref, () => ({
    onKeyDown(event) {
      if (!items.length) return false
      if (event.key === 'ArrowDown') {
        setIndex((i) => (i + 1) % items.length)
        return true
      }
      if (event.key === 'ArrowUp') {
        setIndex((i) => (i - 1 + items.length) % items.length)
        return true
      }
      if (event.key === 'Enter' || event.key === 'Tab') {
        onRun(items[index])
        return true
      }
      return false
    },
  }))

  if (!items.length) return null

  const below = slash.coords.bottom + 320 < window.innerHeight
  const style = {
    left: Math.min(slash.coords.left, window.innerWidth - 272),
    ...(below ? { top: slash.coords.bottom + 6 } : { bottom: window.innerHeight - slash.coords.top + 6 }),
  }

  return createPortal(
    <div
      style={style}
      onMouseDown={(e) => e.preventDefault()}
      className="animate-rise fixed z-[60] max-h-80 w-64 overflow-y-auto rounded-lg border border-line-strong bg-raised p-1 shadow-xl shadow-black/25"
    >
      <p className="label px-2.5 pt-1.5 pb-1">{t('Einfügen')}</p>
      {items.map((item, i) => (
        <button
          key={item.id}
          onMouseMove={() => setIndex(i)}
          onClick={() => onRun(item)}
          className={cx('flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left', i === index && 'bg-hover')}
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-md border border-line bg-bg text-muted">
            <item.icon size={15} />
          </span>
          <span className="min-w-0">
            <span className="block text-[13.5px] text-ink">{t(item.label)}</span>
            <span className="block truncate text-xs text-faint">{t(item.hint)}</span>
          </span>
        </button>
      ))}
    </div>,
    document.body,
  )
})

export default SlashMenu
