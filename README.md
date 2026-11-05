# Mycelium

Notizen, Aufgaben und Kalender an einem Ort. Ordner und Notizen verzweigen sich wie ein Myzel.

> **English:** Mycelium is a notes, tasks and calendar web app built with React and Firebase. The interface is available in German and English; this documentation and the code comments are in German.

- **Notizen** in beliebig tief verschachtelten Ordnern: Text, Checklisten, Tabellen, Bilder, Zeichnungen
- **Aufgaben** mit Priorität, Dringlichkeit, Fälligkeit, Tags, Filtern und Eisenhower-Matrix
- **Kalender** mit Tag/Woche/Monat/Jahr/Liste, Farben, Wiederholungen und Tag-Filter
- **Accounts** mit Sync über alle Geräte, Oberfläche auf Deutsch und Englisch, Hell/Dunkel, installierbar als App (PWA)

Gebaut mit React, Vite, Tailwind CSS v4, TipTap und Firebase (Authentication + Firestore).

## Schnellstart

Voraussetzung: Node.js 20.19+ oder 22.12+.

```bash
git clone https://github.com/Spimur/mycelium.git
cd mycelium
npm install
npm run dev
```

Ohne Firebase-Konfiguration läuft die App im **lokalen Modus**: Alles wird nur im aktuellen Browser (IndexedDB) gespeichert, es gibt keine Accounts und keinen Sync.

### Mit lokalen Firebase-Emulatoren

Zum Entwickeln mit Accounts und den echten [`firestore.rules`](firestore.rules), ganz ohne Firebase-Projekt (zusätzlich Java 21+ nötig):

```bash
npm run emulators       # Terminal 1
npm run dev:emulators   # Terminal 2
```

Die Emulatoren laufen nur lokal, die Einstellungen dafür stehen in [`.env.emulators`](.env.emulators).

### Befehle

| Befehl                  | Zweck                                                   |
| ----------------------- | ------------------------------------------------------- |
| `npm run dev`           | Entwicklungsserver                                      |
| `npm run build`         | Produktions-Build nach `dist/`                          |
| `npm run preview`       | Fertigen Build lokal ansehen                            |
| `npm run lint`          | ESLint                                                  |
| `npm run emulators`     | Firebase-Emulatoren starten                             |
| `npm run dev:emulators` | Entwicklungsserver gegen die Emulatoren                 |
| `npm run deploy`        | Build, Hosting und Firestore-Regeln veröffentlichen     |

## Eigene Instanz betreiben

Diese Anleitung richtet ein eigenes, von anderen Instanzen getrenntes Firebase-Projekt ein.

1. In der [Firebase-Konsole](https://console.firebase.google.com) ein Projekt anlegen und unter *Projekteinstellungen → Allgemein → Deine Apps* eine Web-App registrieren.
2. `.env.example` nach `.env.local` kopieren und die Werte eintragen. `.env.local` wird nicht eingecheckt.
3. **Authentication → Sign-in method**: *E-Mail/Passwort* und optional *Google* aktivieren.
4. **Firestore Database** anlegen.
5. Firebase CLI installieren und das Projekt verknüpfen:
   ```bash
   npm i -g firebase-tools
   firebase login
   firebase use --add
   ```
6. Betreiber-Angaben für Impressum und Datenschutzerklärung eintragen (siehe [Rechtliches](#rechtliches)).
7. Veröffentlichen: `npm run deploy`
8. Die [Einstellungen weiter unten](#einstellungen-für-den-eigenen-betrieb) vornehmen.

### Kosten

Mycelium ist für den kostenlosen **Spark-Tarif** gebaut. Ohne hinterlegtes Zahlungsmittel kann Firebase nichts verrechnen. Wird ein Kontingent überschritten, ist die App eingeschränkt, bis es zurückgesetzt wird. Bilder liegen bewusst in Firestore statt in Firebase Storage und zählen zum dortigen Speicherkontingent.

### Eigene Domain

Firebase-Konsole → *Hosting* → „Benutzerdefinierte Domain hinzufügen“ und den DNS-Anweisungen folgen. Danach die Domain unter *Authentication → Einstellungen → Autorisierte Domains* eintragen.

## Sicherheit

Die Werte in `.env.local` sind **nicht geheim**: Jede Firebase-Web-App liefert sie an den Browser aus. Geschützt werden die Daten serverseitig.

### Was das Projekt mitbringt

- **[`firestore.rules`](firestore.rules):** Jeder Account kann nur seine eigenen Daten unter `users/{uid}` lesen und schreiben. Erlaubt sind ausschliesslich die Sammlungen und Felder der App, mit Typ- und Grössengrenzen. Bilder sind nur als PNG, JPEG, GIF oder WebP erlaubt.
- **Security-Header** in [`firebase.json`](firebase.json): Content-Security-Policy ohne Inline-Skripte, Schutz vor Clickjacking, HSTS, `nosniff`, restriktive Permissions-Policy. Sie gelten nur beim Hosting über Firebase; bei anderen Anbietern müssen sie dort eingerichtet werden.
- **Editor:** Links nur mit `http(s)`, `mailto` und `tel`, eingefügte fremde Bilder nur über HTTPS.
- **Schriften** werden selbst ausgeliefert, es gehen keine Anfragen an Google Fonts.

### Einstellungen für den eigenen Betrieb

Diese Punkte lassen sich nicht im Code festlegen und müssen pro Firebase-Projekt gesetzt werden:

1. **API-Schlüssel einschränken:** [Google Cloud Console → APIs & Dienste → Anmeldedaten](https://console.cloud.google.com/apis/credentials) → Browser-Schlüssel → *Websites* → die eigenen Domains, `<projekt-id>.web.app`, `<projekt-id>.firebaseapp.com` und für die Entwicklung `localhost`.
2. **Autorisierte Domains** (Authentication → Einstellungen): nur tatsächlich genutzte Domains.
3. **E-Mail-Enumeration-Schutz** (Authentication → Einstellungen → Benutzeraktionen) aktiviert lassen.
4. **Passwortrichtlinie** (Authentication → Einstellungen): mindestens 8 Zeichen.
5. Optional **geschlossene Instanz:** Unter *Benutzeraktionen* die Registrierung deaktivieren und Accounts selbst in der Konsole anlegen.

### Grenzen

- **Keine Ende-zu-Ende-Verschlüsselung:** Wer das Firebase-Projekt betreibt, kann die gespeicherten Inhalte technisch einsehen. Mycelium ist nicht für hochsensible Daten gedacht.
- Offene Registrierung bedeutet, dass auch Fremde Accounts anlegen und Kontingente des Projekts verbrauchen können. Eine geschlossene Instanz (siehe oben) verhindert das.

Sicherheitslücken bitte nicht öffentlich melden, siehe [SECURITY.md](SECURITY.md).

## Rechtliches

Die Website enthält ein Impressum (`/impressum`) und eine Datenschutzerklärung (`/datenschutz`). Die Texte in [`src/pages/LegalPage.jsx`](src/pages/LegalPage.jsx) sind auf die Instanz des Projekts zugeschnitten (Schweiz, Firestore in Europa, Google-Anmeldung) und **keine Rechtsberatung**. Wer eine eigene Instanz betreibt, ist selbst verantwortlich und muss sie prüfen und anpassen.

Name, Postadresse und E-Mail des Betreibers stehen nicht im Repository, sondern in `.env.local` (`VITE_LEGAL_NAME`, `VITE_LEGAL_ADDRESS`, `VITE_LEGAL_EMAIL`). Sie erscheinen öffentlich auf der Website. Ein Produktions-Build mit Firebase bricht ab, solange sie fehlen.

## Bekannte Einschränkungen

- Keine Altersprüfung: Das Mindestalter von 16 Jahren wird bei der Registrierung nur bestätigt.
- Ist dieselbe Notiz auf zwei Geräten gleichzeitig offen, gewinnt die zuletzt gespeicherte Version.
- Änderungen an einem wiederkehrenden Termin gelten immer für die ganze Serie.
- Keine Erinnerungen oder Push-Benachrichtigungen: Dafür wäre ein Server nötig, der über den Spark-Tarif hinausgeht.
- Auf Touch-Geräten verschiebt man Einträge im Baum über „Verschieben nach …“ statt per Drag & Drop.
- Das Repository enthält noch keine automatisierten Tests.

## Datenmodell

Alles liegt pro Account unter `users/{uid}/…`:

| Sammlung   | Inhalt                                                               |
| ---------- | -------------------------------------------------------------------- |
| `nodes`    | Ordner und Notizen (Titel, Elternordner, Reihenfolge, Farbe, Symbol) |
| `contents` | Inhalt einer Notiz als TipTap-JSON (eine Notiz = ein Dokument)       |
| `assets`   | Eingefügte Bilder (im Browser komprimiert, max. ca. 700 KB)          |
| `events`   | Kalendertermine inkl. Wiederholungen und Tags                        |
| `todos`    | Aufgaben mit Priorität, Dringlichkeit, Fälligkeit und Tags           |
| `tags`     | Eigene Tags (Name + Farbe), gemeinsam für Termine und Aufgaben       |
| `settings` | Sprache und Farbschema, damit sie auf jedem Gerät gleich sind        |

## Projektstruktur

```
src/
  lib/          Firebase, Speicher-Schicht, Auth, Sprache, Baum-, Kalender- und Aufgabenlogik
  components/   Layout, Sidebar, Seitenbaum, Befehlspalette, Tags, UI-Bausteine, Myzel-Grafik
  editor/       Notiz-Editor, Toolbar, Slash-Menü, Bild- und Zeichenblöcke
  calendar/     Kalenderseite mit allen Ansichten, Termin-Dialog und Tag-Filter
  pages/        Login, Übersicht, Notiz-, Ordner-, Aufgaben- und Einstellungsseite
public/         Service Worker, Manifest, App-Icons
```

## Übersetzungen

Die deutschen Texte im Code sind gleichzeitig die Schlüssel: `t('Neue Notiz')` zeigt auf Englisch den Eintrag aus [`src/lib/en.js`](src/lib/en.js). Fehlt dort ein Eintrag, erscheint der deutsche Text.

## Tastenkürzel

- `Strg/⌘ + K`: Suche und Befehle
- `Strg/⌘ + \`: Seitenleiste ein-/ausblenden
- `/` im Editor: Blöcke einfügen (Checkliste, Tabelle, Bild, Zeichnung …)
- Kalender: `D` `W` `M` `Y` `L` für die Ansichten, `T` heute, `N` neuer Termin, `←` `→` blättern
- Seitenbaum: Doppelklick oder `F2` zum Umbenennen, Rechtsklick für das Menü, Drag & Drop zum Verschieben

## Lizenz

[GNU Affero General Public License v3.0](LICENSE). Du darfst den Code nutzen, verändern und weitergeben. Wer eine veränderte Version betreibt, auch nur als Website, muss deren Quellcode den Nutzenden ebenfalls unter dieser Lizenz zugänglich machen.
