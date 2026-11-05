import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Moon, Sun } from 'lucide-react'
import { authErrorMessage, useAuth } from '../lib/auth'
import { toggleTheme, useTheme } from '../lib/theme'
import { getLang, setLang, t } from '../lib/i18n'
import { Logo, MyceliumBackdrop, Wordmark } from '../components/Mycelium'
import { Button, IconButton, cx } from '../components/ui'

const ORIGINS = [
  [0, 520, -0.3],
  [0, 140, 0.25],
  [380, 900, -1.35],
  [80, 900, -0.9],
  [700, 0, 1.9],
]

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.3-1.6 3.8-5.4 3.8-3.2 0-5.9-2.7-5.9-6s2.7-6 5.9-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.3 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z" />
    </svg>
  )
}

export default function Login() {
  const { signIn, signUp, signInWithGoogle, resetPassword, isLocalMode, enterLocal } = useAuth()
  const theme = useTheme()
  const [mode, setMode] = useState('login') // login | signup | reset
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)
  const [accepted, setAccepted] = useState(false)

  const run = async (fn) => {
    setError('')
    setInfo('')
    setBusy(true)
    try {
      await fn()
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const submit = (e) => {
    e.preventDefault()
    if (mode === 'login') run(() => signIn(email, password))
    if (mode === 'signup') run(() => signUp(name.trim(), email, password))
    if (mode === 'reset')
      run(async () => {
        await resetPassword(email)
        setInfo(t('Wir haben dir einen Link zum Zurücksetzen geschickt.'))
      })
  }

  const switchMode = (m) => {
    setMode(m)
    setError('')
    setInfo('')
  }

  return (
    <div className="relative grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      {/* Linke Seite: wachsendes Myzel */}
      <div className="relative hidden overflow-hidden border-r border-line bg-panel lg:block">
        <MyceliumBackdrop
          width={800}
          height={900}
          seed={42}
          origins={ORIGINS}
          density={1.2}
          animate
          className="absolute inset-0 size-full text-ink/35"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-panel via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 p-12">
          <p className="label mb-4">{t('Notizen · Ordner · Kalender')}</p>
          <p className="max-w-md font-display text-5xl leading-[1.05] tracking-tight">
            {t('Gedanken, die sich')} <em className="text-accent-ink">{t('verzweigen')}</em> {t('dürfen.')}
          </p>
        </div>
      </div>

      {/* Rechte Seite: Formular */}
      <div className="relative flex flex-col px-6 py-6 sm:px-12">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo className="size-7 text-ink" />
            <Wordmark />
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setLang(getLang() === 'de' ? 'en' : 'de')}
              title={t('Sprache')}
              className="h-8 rounded-md px-2 font-mono text-[11px] tracking-wider text-muted uppercase hover:bg-hover hover:text-ink"
            >
              {getLang() === 'de' ? 'EN' : 'DE'}
            </button>
            <IconButton label={t('Farbschema wechseln')} onClick={toggleTheme}>
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </IconButton>
          </div>
        </div>

        <MyceliumBackdrop
          width={400}
          height={300}
          seed={9}
          origins={[[400, 300, -2.4], [0, 300, -0.8]]}
          density={0.7}
          className="pointer-events-none absolute inset-x-0 bottom-0 h-48 w-full text-ink/15 lg:hidden"
        />

        <div className="relative mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          <h1 className="font-display text-4xl tracking-tight">
            {mode === 'login' && t('Willkommen zurück.')}
            {mode === 'signup' && t('Lass etwas wachsen.')}
            {mode === 'reset' && t('Passwort vergessen?')}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {mode === 'login' && t('Melde dich an, um zu deinen Notizen zu kommen.')}
            {mode === 'signup' && t('Erstelle einen Account. Deine Notizen sind dann auf jedem Gerät verfügbar.')}
            {mode === 'reset' && t('Gib deine E-Mail ein, wir schicken dir einen Link.')}
          </p>

          {isLocalMode ? (
            <div className="mt-8 space-y-4">
              <div className="rounded-lg border border-dashed border-line-strong p-4 text-sm text-muted">
                <p className="mb-1 font-medium text-ink">{t('Lokaler Modus')}</p>
                {t('Firebase ist noch nicht verbunden. Trag die Werte in .env.local ein, damit Accounts und Sync funktionieren. Bis dahin werden Daten nur in diesem Browser gespeichert.')}
              </div>
              <Button variant="primary" className="w-full" onClick={enterLocal}>
                {t('Lokal weiter')} <ArrowRight size={15} />
              </Button>
            </div>
          ) : (
            <>
              <form onSubmit={submit} className="mt-8 space-y-3">
                {mode === 'signup' && (
                  <input
                    className="field h-11"
                    placeholder={t('Name')}
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                )}
                <input
                  className="field h-11"
                  type="email"
                  placeholder={t('E-Mail')}
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {mode !== 'reset' && (
                  <input
                    className="field h-11"
                    type="password"
                    placeholder={t('Passwort')}
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    required
                    minLength={mode === 'signup' ? 8 : 6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                )}
                {mode === 'signup' && (
                  <label className="flex cursor-pointer items-start gap-2.5 pt-1 text-[13px] leading-snug text-muted">
                    <input
                      type="checkbox"
                      required
                      className="mt-0.5 accent-[var(--c-accent)]"
                      checked={accepted}
                      onChange={(e) => setAccepted(e.target.checked)}
                    />
                    <span>
                      {t('Ich bin mindestens 16 Jahre alt und habe die')}{' '}
                      <Link to="/datenschutz" className="underline hover:text-ink">
                        {t('Datenschutzerklärung')}
                      </Link>{' '}
                      {t('gelesen.')}
                    </span>
                  </label>
                )}
                {error && <p className="text-sm text-danger">{error}</p>}
                {info && <p className="text-sm text-accent-ink">{info}</p>}
                <Button variant="primary" type="submit" disabled={busy} className="h-11 w-full">
                  {mode === 'login' && t('Anmelden')}
                  {mode === 'signup' && t('Account erstellen')}
                  {mode === 'reset' && t('Link senden')}
                  <ArrowRight size={15} />
                </Button>
              </form>

              {mode !== 'reset' && (
                <>
                  <div className="my-5 flex items-center gap-3">
                    <div className="h-px flex-1 bg-line" />
                    <span className="label">{t('oder')}</span>
                    <div className="h-px flex-1 bg-line" />
                  </div>
                  <Button
                    variant="outline"
                    className="h-11 w-full"
                    disabled={busy || (mode === 'signup' && !accepted)}
                    onClick={() => run(signInWithGoogle)}
                  >
                    <GoogleMark /> {t('Mit Google fortfahren')}
                  </Button>
                  {mode === 'login' && (
                    <p className="mt-3 text-xs leading-relaxed text-faint">
                      {t('Entsteht dabei ein neuer Account, bestätigst du, dass du mindestens 16 Jahre alt bist und die')}{' '}
                      <Link to="/datenschutz" className="underline hover:text-ink">
                        {t('Datenschutzerklärung')}
                      </Link>{' '}
                      {t('gelesen hast.')}
                    </p>
                  )}
                </>
              )}

              <div className="mt-8 flex flex-wrap justify-between gap-2 text-sm">
                {mode === 'login' ? (
                  <>
                    <button className="text-muted hover:text-ink" onClick={() => switchMode('reset')}>
                      {t('Passwort vergessen')}
                    </button>
                    <button className="text-accent-ink hover:underline" onClick={() => switchMode('signup')}>
                      {t('Neuen Account erstellen')}
                    </button>
                  </>
                ) : (
                  <button className={cx('text-accent-ink hover:underline')} onClick={() => switchMode('login')}>
                    ← {t('Zurück zur Anmeldung')}
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        <footer className="relative flex gap-4 text-xs text-faint">
          <Link to="/impressum" className="hover:text-ink">
            {t('Impressum')}
          </Link>
          <Link to="/datenschutz" className="hover:text-ink">
            {t('Datenschutz')}
          </Link>
        </footer>
      </div>
    </div>
  )
}
