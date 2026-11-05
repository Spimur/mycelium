# Sicherheit

Danke, dass du hilfst, Mycelium sicher zu halten.

## Lücke melden

Bitte **kein öffentliches Issue** für Sicherheitsprobleme eröffnen. Nutze stattdessen auf GitHub
**Security → Report a vulnerability** (private Meldung). Beschreibe kurz, was betroffen ist und wie es sich nachstellen lässt.

## Was als Lücke zählt

- Zugriff auf Daten eines anderen Accounts (lesen, ändern, löschen)
- Umgehen der Prüfungen in `firestore.rules`
- Ausführen von Skripten im Kontext der App (XSS), z. B. über Notizinhalte, Links oder Bilder
- Umgehen der Content-Security-Policy

Die Werte der Firebase-Konfiguration (API-Key, Projekt-ID usw.) sind öffentlich und **keine** Lücke.
