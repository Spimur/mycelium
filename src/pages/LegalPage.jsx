import { Link } from 'react-router-dom'
import { ArrowLeft, TriangleAlert } from 'lucide-react'
import { getLang, setLang, t, useLang } from '../lib/i18n'
import { Logo, Wordmark } from '../components/Mycelium'

// Angaben zum Betreiber kommen aus .env.local und stehen bewusst nicht im öffentlichen Repository.
// vite.config.js bricht einen Produktions-Build mit Firebase ab, solange sie fehlen.
const operator = {
  name: import.meta.env.VITE_LEGAL_NAME,
  address: import.meta.env.VITE_LEGAL_ADDRESS,
  email: import.meta.env.VITE_LEGAL_EMAIL,
}

const LAST_UPDATED = { de: 'November 2026', en: 'November 2026' }

const Mail = () => (operator.email ? <a href={`mailto:${operator.email}`}>{operator.email}</a> : '–')

function Operator() {
  return (
    <p>
      {operator.name || '–'}
      <br />
      {operator.address || '–'}
      <br />
      <Mail />
    </p>
  )
}

const IMPRINT = {
  de: {
    title: 'Impressum',
    body: (
      <>
        <h2>Betreiber</h2>
        <Operator />
        <h2>Art des Angebots</h2>
        <p>
          Mycelium ist ein privat betriebenes, nicht kommerzielles Projekt. Die Nutzung ist kostenlos, es gibt keine Werbung und
          keine kostenpflichtigen Leistungen. Das Angebot richtet sich an Personen in der Schweiz.
        </p>
        <h2>Datenschutz</h2>
        <p>
          Wie Personendaten bearbeitet werden, steht in der <Link to="/datenschutz">Datenschutzerklärung</Link>.
        </p>
      </>
    ),
  },
  en: {
    title: 'Legal notice',
    body: (
      <>
        <h2>Operator</h2>
        <Operator />
        <h2>Nature of the service</h2>
        <p>
          Mycelium is a privately run, non-commercial project. It is free to use, with no advertising and no paid services. The
          service is aimed at people in Switzerland.
        </p>
        <h2>Privacy</h2>
        <p>
          How personal data is processed is explained in the <Link to="/datenschutz">privacy policy</Link>.
        </p>
      </>
    ),
  },
}

const PRIVACY = {
  de: {
    title: 'Datenschutzerklärung',
    body: (
      <>
        <p>
          Diese Erklärung beschreibt, welche Personendaten bei der Nutzung von Mycelium bearbeitet werden. Sie richtet sich nach
          dem Schweizer Datenschutzgesetz (DSG) und enthält, soweit sie anwendbar ist, auch die Angaben nach der
          EU-Datenschutz-Grundverordnung (DSGVO).
        </p>

        <h2>Verantwortlicher</h2>
        <Operator />

        <h2>Welche Daten bearbeitet werden</h2>
        <ul>
          <li>
            <strong>Account:</strong> E-Mail-Adresse, Passwort (nur als Hash bei Google gespeichert), Benutzername, Zeitpunkte von
            Registrierung und Anmeldung. Bei der Anmeldung mit Google übermittelt Google zusätzlich Name, E-Mail-Adresse und
            Profilbild-Adresse des Google-Kontos.
          </li>
          <li>
            <strong>Deine Inhalte:</strong> Ordner, Notizen, Bilder, Zeichnungen, Aufgaben, Termine, Tags und Einstellungen. Was du
            dort schreibst, bestimmst du selbst. Das kann auch Angaben über andere Personen umfassen.
          </li>
          <li>
            <strong>Technische Daten:</strong> IP-Adresse und Browser-Kennung (User-Agent), die Google beim Betrieb von Anmeldung
            und Hosting protokolliert.
          </li>
        </ul>

        <h2>Wozu</h2>
        <p>
          Die Daten werden nur bearbeitet, um Mycelium bereitzustellen: für deinen Account, zum Speichern und Synchronisieren deiner
          Inhalte über deine Geräte, für E-Mails zum Zurücksetzen des Passworts sowie zum Schutz vor Missbrauch und zur
          Fehlerbehebung. Es gibt keine Werbung, kein Tracking, keine Webanalyse, kein Profiling und keine automatisierten
          Einzelentscheidungen. Daten werden nicht verkauft.
        </p>

        <h2>Wer Zugriff hat</h2>
        <p>
          Andere Nutzende können deine Inhalte nicht sehen. Deine Inhalte werden auf dem Server verschlüsselt gespeichert, Mycelium
          bietet aber <strong>keine Ende-zu-Ende-Verschlüsselung</strong>: Der Betreiber und Google könnten sie technisch einsehen.
          Der Betreiber greift nur darauf zu, wenn das für die Behebung eines Fehlers, auf deine Anfrage hin oder wegen einer
          gesetzlichen Pflicht nötig ist. Speichere deshalb keine hochsensiblen Daten in Mycelium.
        </p>

        <h2>Empfänger und Bekanntgabe ins Ausland</h2>
        <p>
          Betrieben wird Mycelium mit <strong>Google Firebase</strong> (Authentication, Firestore, Hosting). Google bearbeitet die
          Daten als Auftragsbearbeiter. Deine Inhalte liegen in Firestore in einem Rechenzentrum in Europa. Anmeldung und Hosting
          betreibt Google weltweit, Daten können daher insbesondere auch in den <strong>USA</strong> bearbeitet werden. Die Bekanntgabe
          an Google in den USA stützt sich auf das Swiss-U.S. Data Privacy Framework und die Angemessenheitsfeststellung des
          Bundesrats für dort zertifizierte Unternehmen (Art. 16 Abs. 1 DSG), bzw. für die EU auf das EU-U.S. Data Privacy Framework.
          Weitere Informationen stehen unter{' '}
          <a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener noreferrer">
            Privacy and Security in Firebase
          </a>
          . Bei der Anmeldung mit Google gilt zusätzlich die{' '}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
            Datenschutzerklärung von Google
          </a>
          .
        </p>

        <h2>Wie lange</h2>
        <ul>
          <li>Account und Inhalte: bis du sie oder deinen Account löschst. Das geht jederzeit selbst unter Einstellungen → Deine Daten.</li>
          <li>
            Nach der Löschung entfernt Google Anmeldedaten laut eigenen Angaben innerhalb von 180 Tagen auch aus Sicherungskopien.
          </li>
          <li>IP-Adressen: bei der Anmeldung laut Google einige Wochen, beim Hosting einige Monate.</li>
        </ul>

        <h2>Speicherung in deinem Browser</h2>
        <p>
          Mycelium setzt keine Werbe- oder Tracking-Cookies. Im Browser werden nur technisch nötige Daten gespeichert: deine
          Anmeldung, eine Offline-Kopie deiner Inhalte, die App-Dateien und Einstellungen wie Sprache, Farbschema und Filter
          (Local Storage, IndexedDB, Cache Storage). Die Anmeldung mit Google nutzt ein Fenster von Google, für das dessen
          Bedingungen gelten. Schriften werden von Mycelium selbst ausgeliefert. Auf gemeinsam genutzten Geräten solltest du dich
          abmelden, die Offline-Kopie kann dort sonst erhalten bleiben.
        </p>

        <h2>Deine Rechte</h2>
        <p>
          Unter Einstellungen → Deine Daten kannst du jederzeit alle Daten als Datei herunterladen und deinen Account mit allen Daten
          löschen. Du kannst ausserdem Auskunft verlangen und Daten berichtigen lassen. Soweit die DSGVO gilt, kannst du zudem der
          Bearbeitung widersprechen und sie einschränken lassen. Schreib dafür an <Mail />. Anfragen werden in der Regel innerhalb von 30 Tagen beantwortet. Du kannst dich ausserdem beim
          Eidgenössischen Datenschutz- und Öffentlichkeitsbeauftragten (EDÖB) beschweren, in der EU bei der Aufsichtsbehörde deines
          Wohnsitzstaats.
        </p>

        <h2>Rechtsgrundlagen nach DSGVO</h2>
        <p>
          Soweit die DSGVO anwendbar ist: Erfüllung des Nutzungsverhältnisses (Art. 6 Abs. 1 lit. b) für Account und Inhalte sowie
          berechtigte Interessen (Art. 6 Abs. 1 lit. f) für Sicherheit, Missbrauchsschutz und Fehlerbehebung.
        </p>

        <h2>Mindestalter</h2>
        <p>Mycelium richtet sich an Personen ab 16 Jahren. Das bestätigst du bei der Registrierung, geprüft wird es nicht.</p>

        <h2>Änderungen</h2>
        <p>Diese Erklärung kann angepasst werden, wenn sich Mycelium oder die Rechtslage ändert. Es gilt die hier veröffentlichte Fassung.</p>
      </>
    ),
  },
  en: {
    title: 'Privacy policy',
    body: (
      <>
        <p>
          This policy describes which personal data is processed when you use Mycelium. It follows the Swiss Federal Act on Data
          Protection (FADP) and, where applicable, also contains the information required by the EU General Data Protection
          Regulation (GDPR). If the versions differ, the German version prevails.
        </p>

        <h2>Controller</h2>
        <Operator />

        <h2>What data is processed</h2>
        <ul>
          <li>
            <strong>Account:</strong> email address, password (stored at Google only as a hash), username, registration and sign-in
            times. If you sign in with Google, Google also provides the name, email address and profile picture address of your
            Google account.
          </li>
          <li>
            <strong>Your content:</strong> folders, notes, images, drawings, tasks, events, tags and settings. You decide what you
            write there, which may include information about other people.
          </li>
          <li>
            <strong>Technical data:</strong> IP address and browser identifier (user agent), logged by Google when operating sign-in
            and hosting.
          </li>
        </ul>

        <h2>Why</h2>
        <p>
          Data is processed only to provide Mycelium: for your account, to store and sync your content across your devices, for
          password reset emails, and to prevent abuse and fix errors. There is no advertising, tracking, web analytics, profiling or
          automated individual decision-making. Data is not sold.
        </p>

        <h2>Who has access</h2>
        <p>
          Other users cannot see your content. It is stored encrypted on the server, but Mycelium does{' '}
          <strong>not offer end-to-end encryption</strong>: the operator and Google could technically view it. The operator only
          accesses it when necessary to fix an error, at your request or because of a legal obligation. Therefore, do not store
          highly sensitive data in Mycelium.
        </p>

        <h2>Recipients and transfers abroad</h2>
        <p>
          Mycelium runs on <strong>Google Firebase</strong> (Authentication, Firestore, Hosting). Google processes the data as a
          processor. Your content is stored in Firestore in a data centre in Europe. Google operates sign-in and hosting globally, so
          data may also be processed in the <strong>USA</strong> in particular. Disclosure to Google in the USA relies on the Swiss-U.S.
          Data Privacy Framework and the Federal Council's adequacy decision for certified companies (Art. 16(1) FADP) and, for the EU,
          on the EU-U.S. Data Privacy Framework. More information:{' '}
          <a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener noreferrer">
            Privacy and Security in Firebase
          </a>
          . If you sign in with Google, the{' '}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
            Google Privacy Policy
          </a>{' '}
          also applies.
        </p>

        <h2>How long</h2>
        <ul>
          <li>Account and content: until you delete them or your account. You can do this yourself at any time under Settings → Your data.</li>
          <li>After deletion, Google states that it removes sign-in data from backups within 180 days.</li>
          <li>IP addresses: according to Google, a few weeks for sign-in and a few months for hosting.</li>
        </ul>

        <h2>Storage in your browser</h2>
        <p>
          Mycelium does not set advertising or tracking cookies. The browser only stores what is technically necessary: your sign-in,
          an offline copy of your content, the app files and settings such as language, colour scheme and filters (Local Storage,
          IndexedDB, Cache Storage). Google sign-in uses a Google window subject to Google's terms. Fonts are served by Mycelium
          itself. Sign out on shared devices, as the offline copy may otherwise remain there.
        </p>

        <h2>Your rights</h2>
        <p>
          Under Settings → Your data you can download all your data as a file and delete your account with all its data at any time. You
          can also request access to your data and have it corrected. Where the GDPR applies, you can also object to processing and have
          it restricted. To do so, write to <Mail />. Requests are generally
          answered within 30 days. You can also complain to the Swiss Federal Data Protection and Information Commissioner (FDPIC) or,
          in the EU, to the supervisory authority of your country of residence.
        </p>

        <h2>Legal bases under the GDPR</h2>
        <p>
          Where the GDPR applies: performance of the user relationship (Art. 6(1)(b)) for account and content, and legitimate interests
          (Art. 6(1)(f)) for security, abuse prevention and error fixing.
        </p>

        <h2>Minimum age</h2>
        <p>Mycelium is intended for people aged 16 and over. You confirm this when registering; it is not verified.</p>

        <h2>Changes</h2>
        <p>This policy may be updated if Mycelium or the law changes. The version published here applies.</p>
      </>
    ),
  },
}

const PAGES = { imprint: IMPRINT, privacy: PRIVACY }

/** Öffentliche Rechtstexte, auch ohne Anmeldung erreichbar. */
export default function LegalPage({ page }) {
  const lang = useLang()
  const { title, body } = PAGES[page][lang]
  const complete = operator.name && operator.address && operator.email

  return (
    <div className="h-dvh overflow-y-auto">
      <div className="mx-auto max-w-2xl px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-20 sm:px-8">
        <header className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <Logo className="size-7 text-ink" />
            <Wordmark />
          </Link>
          <button
            onClick={() => setLang(getLang() === 'de' ? 'en' : 'de')}
            title={t('Sprache')}
            className="h-8 rounded-md px-2 font-mono text-[11px] tracking-wider text-muted uppercase hover:bg-hover hover:text-ink"
          >
            {lang === 'de' ? 'EN' : 'DE'}
          </button>
        </header>

        <Link to="/" className="mt-10 inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink">
          <ArrowLeft size={14} /> {t('Zurück zu Mycelium')}
        </Link>
        <h1 className="mt-3 font-display text-5xl tracking-tight">{title}</h1>
        <p className="label mt-3">
          {t('Stand')}: {LAST_UPDATED[lang]}
        </p>

        {!complete && (
          <p className="mt-6 flex gap-2 rounded-lg border border-danger/50 p-3 text-[13px] text-danger">
            <TriangleAlert size={16} className="mt-0.5 shrink-0" />
            {t('Die Angaben zum Betreiber fehlen noch (VITE_LEGAL_NAME, VITE_LEGAL_ADDRESS, VITE_LEGAL_EMAIL in .env.local).')}
          </p>
        )}

        <div className="legal-text mt-8">{body}</div>
      </div>
    </div>
  )
}
