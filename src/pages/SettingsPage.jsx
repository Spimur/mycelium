import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Download, FileDown, KeyRound, LogOut, Monitor, Moon, Share, Sun, Trash2 } from 'lucide-react'
import { authErrorMessage, displayNameOf, useAuth } from '../lib/auth'
import { useWorkspace } from '../lib/workspace'
import { readAllUserData } from '../lib/backend'
import { LANGUAGES, setLang, t, tn, useLang } from '../lib/i18n'
import { isIOS, isStandalone, promptInstall, useInstallPrompt } from '../lib/pwa'
import { setThemePref, useThemePref } from '../lib/theme'
import { colorHex } from '../lib/palette'
import { PageHeader } from '../components/Layout'
import { NewTagForm } from '../components/Tags'
import { useToast } from '../components/Toast'
import { Button, ConfirmDialog, Modal, Popover, Swatches, cx } from '../components/ui'

function Section({ title, description, children }) {
  return (
    <section className="grid gap-4 border-t border-line py-8 md:grid-cols-[220px_1fr] md:gap-10">
      <div>
        <h2 className="font-display text-2xl leading-tight">{title}</h2>
        {description && <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{description}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  )
}

/** Auswahlkarte mit Häkchen */
function Choice({ active, onClick, children, className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'relative rounded-lg border p-3 text-left transition-colors',
        active ? 'border-accent bg-accent/[0.07]' : 'border-line-strong hover:border-faint',
        className,
      )}
    >
      {active && (
        <span className="absolute top-2 right-2 grid size-4 place-items-center rounded-full bg-accent text-white">
          <Check size={10} strokeWidth={3} />
        </span>
      )}
      {children}
    </button>
  )
}

// Mini-Vorschau der Oberfläche in den Theme-Farben
function ThemePreview({ bg, panel, ink }) {
  return (
    <div className="mb-2.5 flex h-16 overflow-hidden rounded-md border border-line" style={{ background: bg }}>
      <div className="w-1/3 space-y-1 p-1.5" style={{ background: panel }}>
        {[70, 50, 60].map((w) => (
          <div key={w} className="h-1 rounded-full opacity-40" style={{ width: `${w}%`, background: ink }} />
        ))}
      </div>
      <div className="flex-1 space-y-1.5 p-2">
        <div className="h-1.5 w-1/2 rounded-full opacity-80" style={{ background: ink }} />
        <div className="h-1 w-4/5 rounded-full opacity-30" style={{ background: ink }} />
        <div className="h-1 w-3/5 rounded-full bg-slate-purple" />
      </div>
    </div>
  )
}

function ProfileSection() {
  const { user, updateDisplayName, isLocalMode, resetPassword } = useAuth()
  const toast = useToast()
  const [name, setName] = useState(user.displayName ?? '')
  const [busy, setBusy] = useState(false)
  const changed = name.trim() !== (user.displayName ?? '')

  const save = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      await updateDisplayName(name)
      toast(t('Benutzername gespeichert.'))
    } catch (err) {
      toast(authErrorMessage(err), { tone: 'error' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Section title={t('Profil')} description={t('So wirst du unten links in der Seitenleiste und auf der Übersicht angezeigt.')}>
      <form onSubmit={save} className="max-w-md space-y-4">
        <div className="flex items-center gap-4">
          <div className="grid size-14 shrink-0 place-items-center rounded-full bg-accent/20 font-display text-3xl text-accent-ink">
            {(name.trim() || displayNameOf(user))[0]?.toUpperCase()}
          </div>
          <label className="flex-1">
            <span className="label mb-1.5 block">{t('Benutzername')}</span>
            <input
              className="field"
              value={name}
              maxLength={40}
              placeholder={displayNameOf(user)}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
        </div>
        {!isLocalMode && (
          <label className="block">
            <span className="label mb-1.5 block">{t('E-Mail')}</span>
            <input className="field opacity-60" value={user.email ?? ''} disabled />
          </label>
        )}
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" type="submit" disabled={!changed || busy}>
            {t('Speichern')}
          </Button>
          {!isLocalMode && user.email && (
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                try {
                  await resetPassword(user.email)
                  toast(t('Wir haben dir einen Link zum Zurücksetzen geschickt.'))
                } catch (err) {
                  toast(authErrorMessage(err), { tone: 'error' })
                }
              }}
            >
              <KeyRound size={14} /> {t('Passwort ändern')}
            </Button>
          )}
        </div>
      </form>
    </Section>
  )
}

function TagsSection() {
  const { tags, events, todos, saveTag, deleteTag } = useWorkspace()
  const [colorMenu, setColorMenu] = useState(null) // { tag, at }
  const [confirm, setConfirm] = useState(null)
  const [drafts, setDrafts] = useState({})

  const usage = (id) =>
    events.filter((e) => e.tagIds?.includes(id)).length + todos.filter((x) => x.tagIds?.includes(id)).length

  const commitName = (tag) => {
    const draft = drafts[tag.id]
    if (draft != null && draft.trim() && draft.trim() !== tag.name) saveTag(tag.id, { name: draft.trim() })
    setDrafts((d) => {
      const next = { ...d }
      delete next[tag.id]
      return next
    })
  }

  return (
    <Section
      title={t('Tags')}
      description={t('Eigene Kennzeichen für Termine und Aufgaben. Im Kalender kannst du Termine nach Tags ein- und ausblenden.')}
    >
      <div className="max-w-xl space-y-3">
        {tags.length > 0 && (
          <div className="divide-y divide-line rounded-lg border border-line">
            {tags.map((tag) => (
              <div key={tag.id} className="flex items-center gap-2.5 px-3 py-2">
                <button
                  type="button"
                  title={t('Farbe')}
                  onClick={(e) => {
                    const r = e.currentTarget.getBoundingClientRect()
                    setColorMenu({ tag, at: { x: r.left, y: r.bottom + 6, top: r.top } })
                  }}
                  className="size-4 shrink-0 rounded-full ring-offset-2 ring-offset-bg hover:ring-2 hover:ring-line-strong"
                  style={{ background: colorHex(tag.color) }}
                />
                <input
                  value={drafts[tag.id] ?? tag.name}
                  onChange={(e) => setDrafts((d) => ({ ...d, [tag.id]: e.target.value }))}
                  onBlur={() => commitName(tag)}
                  onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                  className="min-w-0 flex-1 rounded bg-transparent px-1 py-0.5 text-sm outline-none focus:bg-hover"
                />
                <span className="shrink-0 font-mono text-[11px] text-faint">{tn(usage(tag.id), '{n}× verwendet', '{n}× verwendet')}</span>
                <button
                  type="button"
                  onClick={() => setConfirm(tag)}
                  aria-label={t('Löschen')}
                  className="grid size-7 shrink-0 place-items-center rounded-md text-faint hover:bg-danger/10 hover:text-danger"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
        <NewTagForm autoFocus={false} />
      </div>

      <Popover at={colorMenu?.at} onClose={() => setColorMenu(null)} className="!min-w-0 p-2.5">
        {colorMenu && (
          <Swatches
            value={colorMenu.tag.color}
            onChange={(color) => {
              saveTag(colorMenu.tag.id, { color })
              setColorMenu(null)
            }}
          />
        )}
      </Popover>
      <ConfirmDialog
        open={Boolean(confirm)}
        title={t('Tag „{name}“ löschen?', { name: confirm?.name })}
        message={t('Der Tag wird von allen Terminen und Aufgaben entfernt. Die Termine und Aufgaben selbst bleiben erhalten.')}
        onConfirm={() => deleteTag(confirm.id)}
        onClose={() => setConfirm(null)}
      />
    </Section>
  )
}

function DeleteAccountDialog({ onClose }) {
  const { user, deleteAccount, isLocalMode } = useAuth()
  const [password, setPassword] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const needsPassword = !isLocalMode && user.usesPassword
  const ready = confirmed && (!needsPassword || password) && !busy

  const submit = async (e) => {
    e.preventDefault()
    if (!ready) return
    setBusy(true)
    setError('')
    try {
      await deleteAccount(password)
    } catch (err) {
      console.error(err)
      setError(authErrorMessage(err))
      setBusy(false)
    }
  }

  return (
    <Modal open onClose={busy ? () => {} : onClose} title={t('Account löschen?')}>
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm leading-relaxed text-muted">
          {t('Dein Account und alle deine Notizen, Bilder, Aufgaben, Termine und Tags werden endgültig gelöscht. Das kann nicht rückgängig gemacht werden.')}
        </p>
        {needsPassword && (
          <label className="block">
            <span className="label mb-1.5 block">{t('Passwort zur Bestätigung')}</span>
            <input
              type="password"
              className="field"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
        )}
        {!needsPassword && !isLocalMode && (
          <p className="text-[13px] text-muted">{t('Zur Bestätigung meldest du dich gleich nochmals bei Google an.')}</p>
        )}
        <label className="flex cursor-pointer items-start gap-2.5 text-[13.5px]">
          <input
            type="checkbox"
            className="mt-0.5 accent-[var(--c-danger)]"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
          />
          {t('Ich will meinen Account und alle meine Daten endgültig löschen.')}
        </label>
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" disabled={busy} onClick={onClose}>
            {t('Abbrechen')}
          </Button>
          <Button type="submit" variant="primary" className="!bg-danger" disabled={!ready}>
            <Trash2 size={14} /> {busy ? t('Wird gelöscht …') : t('Endgültig löschen')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function DataSection() {
  const { user } = useAuth()
  const { uid } = useWorkspace()
  const toast = useToast()
  const [exporting, setExporting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const exportData = async () => {
    setExporting(true)
    try {
      const data = await readAllUserData(uid)
      const payload = { exportedAt: new Date().toISOString(), account: { email: user.email, displayName: user.displayName }, data }
      const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }))
      const link = document.createElement('a')
      link.href = url
      link.download = `mycelium-export-${new Date().toISOString().slice(0, 10)}.json`
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
      toast(t('Export fehlgeschlagen. Bist du online?'), { tone: 'error' })
    } finally {
      setExporting(false)
    }
  }

  return (
    <Section title={t('Deine Daten')} description={t('Du kannst jederzeit eine Kopie aller Daten herunterladen oder deinen Account mit allen Daten löschen.')}>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" disabled={exporting} onClick={exportData}>
          <FileDown size={14} /> {exporting ? t('Wird vorbereitet …') : t('Daten herunterladen')}
        </Button>
        <Button variant="danger" onClick={() => setDeleting(true)}>
          <Trash2 size={14} /> {t('Account löschen')}
        </Button>
      </div>
      {deleting && <DeleteAccountDialog onClose={() => setDeleting(false)} />}
    </Section>
  )
}

function AppSection() {
  const installEvent = useInstallPrompt()
  let content
  if (isStandalone()) content = <p className="text-[13px] text-muted">{t('Mycelium läuft als installierte App.')}</p>
  else if (isIOS)
    content = (
      <p className="text-[13px] leading-relaxed text-muted">
        {t('Tippe in Safari auf')} <Share size={13} className="inline -translate-y-px text-accent-ink" />{' '}
        <strong className="font-medium text-ink">{t('Teilen')}</strong> {t('und dann auf')}{' '}
        <strong className="font-medium text-ink">„{t('Zum Home-Bildschirm')}“</strong>.
      </p>
    )
  else if (installEvent)
    content = (
      <Button variant="outline" onClick={promptInstall}>
        <Download size={14} /> {t('Als App installieren')}
      </Button>
    )
  else content = <p className="text-[13px] text-muted">{t('Öffne Mycelium in Chrome, Edge oder Safari, um es als App zu installieren.')}</p>

  return (
    <Section title={t('App')} description={t('Leg Mycelium auf den Home-Bildschirm, dann startet es wie eine eigene App.')}>
      <div className="max-w-xl">{content}</div>
    </Section>
  )
}

export default function SettingsPage() {
  const { signOut, isLocalMode } = useAuth()
  const { savePrefs } = useWorkspace()
  const themePref = useThemePref()
  const lang = useLang()

  const chooseTheme = (theme) => {
    setThemePref(theme)
    savePrefs({ theme })
  }
  const chooseLang = (value) => {
    savePrefs({ lang: value })
    setLang(value)
  }

  const themes = [
    { value: 'light', label: t('Hell'), icon: Sun, colors: { bg: '#D5D5C6', panel: '#CACAB9', ink: '#1C1B1B' } },
    { value: 'dark', label: t('Dunkel'), icon: Moon, colors: { bg: '#1C1B1B', panel: '#171616', ink: '#D5D5C6' } },
    { value: 'system', label: t('System'), icon: Monitor, colors: null },
  ]

  return (
    <>
      <PageHeader />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-5 pt-6 pb-20 sm:px-10 sm:pt-12">
          <p className="label">{t('Mycelium')}</p>
          <h1 className="mt-2 mb-10 font-display text-5xl tracking-tight">{t('Einstellungen')}</h1>

          <ProfileSection />

          <Section title={t('Darstellung')} description={t('„System“ folgt automatisch der Einstellung deines Geräts.')}>
            <div className="grid max-w-xl grid-cols-3 gap-3">
              {themes.map((th) => (
                <Choice key={th.value} active={themePref === th.value} onClick={() => chooseTheme(th.value)}>
                  {th.colors ? (
                    <ThemePreview {...th.colors} />
                  ) : (
                    <div className="mb-2.5 flex h-16 overflow-hidden rounded-md border border-line">
                      <div className="flex-1 bg-bone" />
                      <div className="flex-1 bg-carbon" />
                    </div>
                  )}
                  <span className="flex items-center gap-1.5 text-[13px]">
                    <th.icon size={13} className="text-muted" /> {th.label}
                  </span>
                </Choice>
              ))}
            </div>
          </Section>

          <Section
            title={t('Sprache')}
            description={t('Ändert nur die Sprache der Oberfläche. Deine Notizen und Termine bleiben, wie du sie geschrieben hast.')}
          >
            <div className="grid max-w-xl grid-cols-2 gap-3">
              {LANGUAGES.map((l) => (
                <Choice key={l.value} active={lang === l.value} onClick={() => chooseLang(l.value)} className="py-3.5">
                  <span className="block font-display text-2xl leading-none">{l.label}</span>
                  <span className="label mt-2 block">{l.value === 'de' ? 'Hallo, Myzel' : 'Hello, mycelium'}</span>
                </Choice>
              ))}
            </div>
          </Section>

          <AppSection />

          <TagsSection />

          <DataSection />

          <Section
            title={t('Konto')}
            description={
              isLocalMode
                ? t('Lokaler Modus: Deine Daten liegen nur in diesem Browser.')
                : t('Deine Daten werden mit deinem Account synchronisiert.')
            }
          >
            <Button variant="outline" onClick={signOut}>
              <LogOut size={14} /> {t('Abmelden')}
            </Button>
            <p className="mt-5 flex gap-4 text-[13px] text-muted">
              <Link to="/impressum" className="underline underline-offset-3 hover:text-ink">
                {t('Impressum')}
              </Link>
              <Link to="/datenschutz" className="underline underline-offset-3 hover:text-ink">
                {t('Datenschutz')}
              </Link>
            </p>
          </Section>
        </div>
      </div>
    </>
  )
}
