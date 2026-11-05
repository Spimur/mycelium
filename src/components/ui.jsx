import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, X } from 'lucide-react'
import { PALETTE } from '../lib/palette'
import { t } from '../lib/i18n'

// eslint-disable-next-line react-refresh/only-export-components
export const cx = (...c) => c.filter(Boolean).join(' ')

export function Button({ variant = 'ghost', size = 'md', className, ...props }) {
  return (
    <button
      {...props}
      className={cx(
        'inline-flex items-center justify-center gap-1.5 rounded-md font-medium whitespace-nowrap transition-colors disabled:opacity-40',
        size === 'sm' ? 'h-7 px-2.5 text-[13px]' : 'h-9 px-3.5 text-sm',
        variant === 'primary' && 'bg-accent text-white hover:brightness-110',
        variant === 'outline' && 'border border-line-strong text-ink hover:bg-hover',
        variant === 'ghost' && 'text-muted hover:bg-hover hover:text-ink',
        variant === 'danger' && 'text-danger hover:bg-danger/10',
        className,
      )}
    />
  )
}

export function IconButton({ label, active, compact, className, children, ...props }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      {...props}
      className={cx(
        'inline-flex shrink-0 items-center justify-center rounded-md transition-colors disabled:opacity-30',
        compact ? 'size-7' : 'size-8',
        active ? 'bg-accent/15 text-accent-ink' : 'text-muted hover:bg-hover hover:text-ink',
        className,
      )}
    >
      {children}
    </button>
  )
}

export function Kbd({ children }) {
  return (
    <kbd className="rounded border border-line-strong px-1 font-mono text-[10px] leading-4 text-faint">{children}</kbd>
  )
}

export function Modal({ open, onClose, title, children, footer, width = 'max-w-md' }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div className="animate-fade absolute inset-0 bg-black/45 backdrop-blur-[2px]" onMouseDown={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className={cx(
          'animate-rise relative flex max-h-[92dvh] w-full flex-col rounded-t-2xl border border-line-strong bg-raised shadow-2xl shadow-black/30 sm:rounded-xl',
          width,
        )}
      >
        {title && (
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <h2 className="font-display text-2xl">{title}</h2>
            <IconButton label={t('Schliessen')} onClick={onClose}>
              <X size={16} />
            </IconButton>
          </div>
        )}
        <div className="overflow-y-auto px-5 pb-5">{children}</div>
        {footer && (
          <div className="flex items-center gap-2 border-t border-line px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}

export function ConfirmDialog({ open, title, message, confirmLabel, onConfirm, onClose }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <div className="flex-1" />
          <Button onClick={onClose}>{t('Abbrechen')}</Button>
          <Button
            variant="primary"
            className="!bg-danger"
            onClick={() => {
              onConfirm()
              onClose()
            }}
          >
            {confirmLabel ?? t('Löschen')}
          </Button>
        </>
      }
    >
      <p className="text-sm text-muted">{message}</p>
    </Modal>
  )
}

/** Schwebendes Menü an einer Position {x, y} (z. B. Mausposition oder Button-Ecke). */
export function Popover({ at, onClose, children, className, align = 'start' }) {
  const ref = useRef(null)
  const [pos, setPos] = useState(null)

  useLayoutEffect(() => {
    if (!at || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    const margin = 8
    let x = align === 'end' ? at.x - r.width : at.x
    let y = at.y
    if (x + r.width > window.innerWidth - margin) x = window.innerWidth - r.width - margin
    if (y + r.height > window.innerHeight - margin) y = Math.max(margin, (at.top ?? at.y) - r.height - 4)
    setPos({ x: Math.max(margin, x), y: Math.max(margin, y) })
  }, [at, align])

  useEffect(() => {
    if (!at) return
    const onDown = (e) => !ref.current?.contains(e.target) && onClose()
    const onKey = (e) => e.key === 'Escape' && onClose()
    const timer = setTimeout(() => window.addEventListener('pointerdown', onDown))
    window.addEventListener('keydown', onKey)
    window.addEventListener('resize', onClose)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', onClose)
    }
  }, [at, onClose])

  if (!at) return null
  return createPortal(
    <div
      ref={ref}
      style={{ left: pos?.x ?? at.x, top: pos?.y ?? at.y, visibility: pos ? 'visible' : 'hidden' }}
      className={cx(
        'animate-rise fixed z-[60] min-w-48 rounded-lg border border-line-strong bg-raised p-1 shadow-xl shadow-black/25',
        className,
      )}
    >
      {children}
    </div>,
    document.body,
  )
}

export function MenuItem({ icon: Icon, children, onClick, danger, hint, active }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-[13.5px] transition-colors',
        danger ? 'text-danger hover:bg-danger/10' : 'text-ink hover:bg-hover',
        active && 'bg-hover',
      )}
    >
      {Icon && <Icon size={15} className={danger ? '' : 'text-muted'} />}
      <span className="flex-1">{children}</span>
      {hint && <span className="text-xs text-faint">{hint}</span>}
    </button>
  )
}

export const MenuDivider = () => <div className="my-1 h-px bg-line" />

export function Swatches({ value, onChange, allowNone = false, size = 'size-6' }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {allowNone && (
        <button
          type="button"
          title={t('Keine Farbe')}
          onClick={() => onChange(null)}
          className={cx(
            size,
            'grid place-items-center rounded-full border border-line-strong text-faint',
            !value && 'ring-2 ring-ink ring-offset-2 ring-offset-raised',
          )}
        >
          <X size={12} />
        </button>
      )}
      {PALETTE.map((c) => (
        <button
          key={c.id}
          type="button"
          title={t(c.name)}
          onClick={() => onChange(c.id)}
          style={{ background: c.hex }}
          className={cx(
            size,
            'grid place-items-center rounded-full text-white transition-transform hover:scale-110',
            value === c.id && 'ring-2 ring-ink ring-offset-2 ring-offset-raised',
          )}
        >
          {value === c.id && <Check size={12} strokeWidth={3} />}
        </button>
      ))}
    </div>
  )
}

export function Segmented({ value, onChange, options, className }) {
  return (
    <div className={cx('inline-flex rounded-lg border border-line-strong p-0.5', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          title={o.title}
          aria-label={o.title}
          type="button"
          onClick={() => onChange(o.value)}
          className={cx(
            'rounded-md px-2.5 py-1 text-[13px] transition-colors',
            value === o.value ? 'bg-ink text-bg' : 'text-muted hover:text-ink',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
