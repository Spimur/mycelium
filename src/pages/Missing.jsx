import { Link } from 'react-router-dom'
import { t } from '../lib/i18n'
import { PageHeader } from '../components/Layout'
import { Logo } from '../components/Mycelium'

export default function Missing() {
  return (
    <>
      <PageHeader />
      <div className="grid flex-1 place-items-center px-6 text-center">
        <div>
          <Logo className="mx-auto size-10 text-faint opacity-60 grayscale" />
          <h1 className="mt-4 font-display text-3xl">{t('Hier wächst nichts mehr.')}</h1>
          <p className="mt-2 text-sm text-muted">{t('Diese Seite wurde gelöscht oder hat nie existiert.')}</p>
          <Link to="/" className="mt-5 inline-block text-sm text-accent-ink hover:underline">
            {t('Zur Übersicht')}
          </Link>
        </div>
      </div>
    </>
  )
}
