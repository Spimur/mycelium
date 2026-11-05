import { useState } from 'react'
import { Download, Share, SquarePlus, X } from 'lucide-react'
import { t } from '../lib/i18n'
import { isIOS, isStandalone, promptInstall, useInstallPrompt } from '../lib/pwa'
import { Button } from './ui'

const DISMISSED_KEY = 'mycelium:install-hint-dismissed'

/** Einmaliger Hinweis, Mycelium als App auf den Home-Bildschirm zu legen. */
export default function InstallPrompt() {
  const installEvent = useInstallPrompt()
  const [hidden, setHidden] = useState(() => Boolean(localStorage.getItem(DISMISSED_KEY)))

  const hide = () => {
    localStorage.setItem(DISMISSED_KEY, '1')
    setHidden(true)
  }

  const showIos = isIOS && !isStandalone()
  if (hidden || (!showIos && !installEvent)) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:justify-end sm:px-5">
      <div className="animate-rise pointer-events-auto relative w-full max-w-sm rounded-xl border border-line-strong bg-raised p-4 shadow-2xl shadow-black/30">
        <button
          onClick={hide}
          aria-label={t('Schliessen')}
          className="absolute top-2.5 right-2.5 grid size-7 place-items-center rounded-md text-faint hover:bg-hover hover:text-ink"
        >
          <X size={14} />
        </button>
        <div className="flex gap-3 pr-6">
          <div className="grid size-9 shrink-0 place-items-center rounded-full bg-accent/15 text-accent-ink">
            {showIos ? <SquarePlus size={17} /> : <Download size={17} />}
          </div>
          <div className="min-w-0">
            <p className="font-display text-xl leading-tight">{t('Mycelium als App')}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-muted">
              {showIos ? (
                <>
                  {t('Tippe in Safari auf')} <Share size={13} className="inline -translate-y-px text-accent-ink" />{' '}
                  <strong className="font-medium text-ink">{t('Teilen')}</strong> {t('und dann auf')}{' '}
                  <strong className="font-medium text-ink">„{t('Zum Home-Bildschirm')}“</strong>.
                </>
              ) : (
                t('Installiere Mycelium, um es wie eine App direkt vom Startbildschirm zu öffnen.')
              )}
            </p>
          </div>
        </div>
        {!showIos && (
          <div className="mt-3.5 flex justify-end gap-2">
            <Button size="sm" onClick={hide}>
              {t('Später')}
            </Button>
            <Button size="sm" variant="primary" onClick={promptInstall}>
              {t('Installieren')}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
