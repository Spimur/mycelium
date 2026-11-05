# Mycelium

Notizen, Aufgaben und Kalender an einem Ort. Ordner und Notizen verzweigen sich wie ein Myzel.

- **Notizen** in beliebig tief verschachtelten Ordnern: Text, Checklisten, Tabellen, Bilder, Zeichnungen
- **Aufgaben** mit Priorität, Dringlichkeit, Fälligkeit, Tags, Filtern und Eisenhower-Matrix
- **Kalender** mit Tag/Woche/Monat/Jahr/Liste, Farben, Wiederholungen und Tag-Filter
- Accounts mit Sync über alle Geräte, Deutsch/Englisch, Hell/Dunkel, installierbar als App (PWA)

Gebaut mit React, Vite, Tailwind CSS v4, TipTap und Firebase (Auth + Firestore).

## Schnellstart

```bash
npm install
npm run dev
```

Ohne Firebase-Konfiguration läuft die App im **lokalen Modus**: Alles wird nur im aktuellen Browser (IndexedDB) gespeichert.

### Mit lokalen Firebase-Emulatoren

Zum Entwickeln mit echten Accounts, ohne ein eigenes Firebase-Projekt (Java 21+ nötig):

```bash
npm run emulators       # Terminal 1
npm run dev:emulators   # Terminal 2
```

Die Emulatoren laufen nur lokal und verwenden die echten [`firestore.rules`](firestore.rules).

## Eigenes Firebase-Projekt verbinden

1. In der [Firebase-Konsole](https://console.firebase.google.com) ein Projekt anlegen und unter *Projekteinstellungen → Allgemein → Deine Apps* eine Web-App registrieren.
2. `.env.example` nach `.env.local` kopieren und die Werte eintragen.
3. **Authentication → Sign-in method**: *E-Mail/Passwort* und optional *Google* aktivieren.
4. **Firestore Database** anlegen.
5. Firebase CLI installieren und das Projekt verknüpfen:
   ```bash
   npm i -g firebase-tools
   firebase login
   firebase use --add
   ```
6. Veröffentlichen (App, Firestore-Regeln und -Indizes): `npm run deploy`

Alles läuft im kostenlosen **Spark-Tarif**. Solange kein Zahlungsmittel hinterlegt ist, kann Firebase nichts verrechnen. Wird ein Tageskontingent überschritten, pausiert die App bis zum nächsten Tag.

### Eigene Domain

Firebase-Konsole → *Hosting* → „Benutzerdefinierte Domain hinzufügen“ und den DNS-Einträgen folgen (kostenlos, inkl. HTTPS-Zertifikat).
Danach die Domain unter *Authentication → Einstellungen → Autorisierte Domains* eintragen.

## Sicherheit

Die Firebase-Konfiguration in `.env.local` ist **nicht geheim**: Jede Firebase-Web-App liefert diese Werte an den Browser aus.
Geschützt werden die Daten serverseitig:

- **[`firestore.rules`](firestore.rules)**: Jeder Account kann nur seine eigenen Daten unter `users/{uid}` lesen und schreiben.
  Erlaubt sind ausschliesslich die Sammlungen und Felder der App, mit Typ- und Grössengrenzen
  (z. B. nur Bilder als `png/jpeg/gif/webp`, keine SVGs, keine fremden Felder).
- **Security-Header** in [`firebase.json`](firebase.json): strikte Content-Security-Policy (keine Inline-Skripte, keine fremden Skripte ausser der Google-Anmeldung),
  Schutz vor Clickjacking, HSTS, `nosniff`, restriktive Permissions-Policy.
- **Editor**: Links nur mit `http(s)`, `mailto` und `tel` (kein `javascript:`), eingefügte fremde Bilder nur über HTTPS.
- Schriften werden selbst ausgeliefert, es gehen keine Anfragen an Google Fonts.


Sicherheitslücken bitte nicht öffentlich melden, siehe [SECURITY.md](SECURITY.md).

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

Bilder liegen bewusst in Firestore statt in Firebase Storage, damit der kostenlose Tarif reicht.

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

## Sprache

Die Oberfläche gibt es auf Deutsch und Englisch (Einstellungen → Sprache). Die deutschen Texte im Code sind
gleichzeitig die Schlüssel: `t('Neue Notiz')` zeigt auf Englisch den Eintrag aus [`src/lib/en.js`](src/lib/en.js).
Fehlt dort ein Eintrag, erscheint der deutsche Text.

## Tastenkürzel

- `Strg/⌘ + K`: Suche und Befehle
- `Strg/⌘ + \`: Seitenleiste ein-/ausblenden
- `/` im Editor: Blöcke einfügen (Checkliste, Tabelle, Bild, Zeichnung …)
- Kalender: `D` `W` `M` `Y` `L` für die Ansichten, `T` heute, `N` neuer Termin, `←` `→` blättern
- Seitenbaum: Doppelklick oder `F2` zum Umbenennen, Rechtsklick für das Menü, Drag & Drop zum Verschieben
