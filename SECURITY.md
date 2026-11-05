# Sicherheit / Security

## Lücke melden

Bitte **kein öffentliches Issue** für Sicherheitsprobleme eröffnen. Nutze stattdessen im Tab **Security** dieses Repositories die Funktion **Report a vulnerability**, damit die Meldung privat bleibt. Beschreibe kurz, was betroffen ist und wie es sich nachstellen lässt.

*Please do not open public issues for security problems. Use **Security → Report a vulnerability** on this repository instead. Reports in English are welcome.*

Mycelium ist ein privates Hobbyprojekt, Antworten können daher etwas dauern. Geprüft wird jeweils nur der aktuelle Stand des Standard-Branches.

## Was als Lücke zählt

- Zugriff auf Daten eines anderen Accounts (lesen, ändern, löschen)
- Umgehen der Prüfungen in `firestore.rules`
- Ausführen von Skripten im Kontext der App (XSS), z. B. über Notizinhalte, Links oder Bilder
- Umgehen der Content-Security-Policy

## Was keine Lücke ist

- Die Werte der Firebase-Web-Konfiguration (API-Schlüssel, Projekt-ID usw.). Sie sind bei jeder Firebase-Web-App öffentlich.
- Dass Betreiber einer Instanz die dort gespeicherten Inhalte einsehen können. Mycelium bietet keine Ende-zu-Ende-Verschlüsselung (siehe README).
- Fehlkonfigurationen einzelner selbst betriebener Instanzen.
