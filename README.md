# Pfadfinder Schiefbahn Materialrechner

Statische Web-App zur Berechnung einer Material- und Stückliste für ein Zeltlager der Pfadfinder Schiefbahn.

Die App läuft vollständig im Browser und benötigt kein Backend, keine Datenbank, kein Build-System und keine externen Frameworks.

## Funktionen

- Auswahl der benötigten Zeltarten über Plus- und Minus-Buttons
- Unterstützte Zeltarten:
  - Jurte
  - Großraumjurte
  - Kohte
- Auswahl der Mittelstangen-Variante pro Zeltart:
  - feste Mittelstange
  - Dreibein-Kombination
- Automatische Berechnung einer zusammengefassten Stückliste
- Gleiche Materialpositionen werden anhand ihrer `id` zusammengefasst
- Anzeige von:
  - Materialname
  - Kennzeichnung
  - Gesamtmenge
  - Herkunft der Menge je Zeltart
- Button zum Zurücksetzen aller Mengen
- Rückgängig-Funktion nach Zurücksetzen (ein Schritt)
- Adaptiver Export der Stückliste:
  - Mobile: natives Teilen (Web Share), falls verfügbar
  - Sonst: Kopieren in die Zwischenablage
  - Zusätzliche Desktop-Aktion: Textansicht in neuem Tab
- Mobilfreundliches Design
- Zusätzliche Hilfetexte für Aufbauoptionen und Varianten
- Verbesserte Lesbarkeit (größere Schriften und Bedienelemente)
- Nutzerpräferenz für Designmodus (System, Hell, Dunkel)
- Optionaler hoher Kontrast als gespeicherte Einstellung
- Einfache Druckansicht per CSS

## Projektstruktur

```text
/
├── index.html
├── style.css
├── app.js
├── tent-types.js
├── recipe-store.js
├── admin.js
└── admin.css
```

## Dateien

### `index.html`

Enthält die Grundstruktur der App:

- Kopfbereich
- Auswahlbereich für die Zeltarten
- eingebetteten Admin-Bereich (ein-/ausblendbar)
- Stücklistenbereich
- Buttons für Zurücksetzen und Kopieren
- zusätzlicher Button für Textansicht (Desktop)
- Einbindung von `style.css`, `admin.css` und der JavaScript-Dateien in fester Reihenfolge

### `style.css`

Enthält das komplette Styling:

- Naturtöne in Grün, Beige und Braun
- responsive Kartenansicht
- große Smartphone-taugliche Plus- und Minus-Buttons
- Tabellenlayout für die Stückliste
- Druckansicht über `@media print`

### `app.js`

Enthält die komplette Logik:

- Laden der aktiven Rezeptdaten über `recipe-store.js`
- Zustand der ausgewählten Zelte
- Berechnung der Stückliste
- Rendering der Karten und Tabelle
- Kopierfunktion
- adaptive Export-Orchestrierung (Share, Clipboard, Fallback, Textansicht)
- Reset-Funktion
- optionale Speicherung im `localStorage`

### `tent-types.js`

Enthält die komplette Materialkonfiguration:

- globale Komponenten (z. B. Hering, Abspannschnur)
- zelt-spezifische Komponenten
- Varianten je Zeltart
- Aufbauoptionen (`fixed`, `tripod`)
- finale Zuordnung im exportierten Objekt `tentTypes`

### `recipe-store.js`

Enthaelt den Daten-Layer fuer Rezepte:

- laedt Default-Rezepte aus `tent-types.js`
- liest/speichert Admin-Rezepte in `localStorage`
- importiert/exportiert JSON
- normalisiert und validiert Rezeptdaten

### `admin.js`, `admin.css`

Eingebettete Admin-Oberflaeche zur Rezeptpflege in `index.html`:

- PIN-Schutz (erste Implementierung: `hubi32`)
- Bearbeiten von Rezeptbereichen (Varianten/Aufbauoptionen/Basis)
- Komponenten-Bibliothek mit Suche
- Tabelleneditor fuer Komponenten
- Mengen-Quickbuttons, Reihenfolge hoch/runter, Zeilen loeschen
- Import/Export von Rezepten als JSON

## Materialdaten anpassen

Alle Materialregeln werden zentral in `tent-types.js` im exportierten Objekt `tentTypes` gepflegt.

Beispiel:

```js
const tentTypes = {
  kohte: {
    label: "Kohte",
    description: "Kohte",
    components: baseComponents.kohte,
    poleOptions: poleOptions.kohte
  }
};
```

Hinweis: Gleiche Material-`id` wird über alle Zeltarten hinweg zusammengeführt. Darum sind globale Positionen wie Heringe und Abspannschnüre zentral definiert.

### Wichtige Felder

| Feld | Bedeutung |
|---|---|
| `id` | Technischer Schlüssel. Gleiche IDs werden in der Stückliste zusammengefasst. |
| `label` | Anzeigename des Materials. |
| `marking` | Kennzeichnung oder Markierung des Materials. |
| `qty` | Menge pro Zelt dieser Zeltart. |

## Neue Zeltart hinzufügen

Eine neue Zeltart wird in `tent-types.js` in fünf Schritten ergänzt:

1. `tentSpecificComponents.<zeltId>` anlegen
2. optional `variants.<zeltId>` anlegen
3. `poleOptions.<zeltId>` anlegen
4. optional `baseComponents.<zeltId>` anlegen
5. in `tentTypes.<zeltId>` referenzieren

Minimaler Aufbau:

```js
neueZeltart: {
  label: "Neue Zeltart",
  description: "Kurze Beschreibung",
  variants: variants.neueZeltart,          // optional
  components: baseComponents.neueZeltart,  // optional
  poleOptions: poleOptions.neueZeltart
}
```

Danach wird die neue Zeltart automatisch als Karte angezeigt.

## Lokal starten

Die App kann direkt lokal per Doppelklick auf `index.html` oder über einen einfachen lokalen Webserver gestartet werden.

1. Dateien herunterladen oder kopieren
2. `index.html` im Browser öffnen
3. Zelte auswählen
4. Stückliste prüfen oder kopieren

Admin-Bereich aufrufen:

1. In `index.html` im Bereich **Zeltarten** den Hilfe-Block aufklappen
2. Unterhalb des Hilfe-Blocks auf "Admin Rezepte" klicken
3. PIN eingeben (`hubi32`)
4. Rezepte bearbeiten und speichern
5. Mit "Zurueck zum Rechner" zur Hauptansicht wechseln

Optionaler Start per lokalem Server (wenn Node.js vorhanden):

```bash
npx serve .
```

## Einbindung in Jimdo

Die App ist für statisches Hosting geeignet.

Mögliche Varianten:

### Variante 1: Als komplette HTML-Datei einbinden

Wenn Jimdo einen HTML-/Code-Block erlaubt, können HTML, CSS und JavaScript auch in einer einzigen Datei zusammengeführt und dort eingebunden werden.

### Variante 2: Drei Dateien hochladen

Falls Jimdo eigene Dateien oder externe Links unterstützt:

```html
<link rel="stylesheet" href="style.css">
<script src="tent-types.js"></script>
<script src="recipe-store.js"></script>
<script src="app.js"></script>
<script src="admin.js"></script>
```

Die Dateien muessen gemeinsam erreichbar sein und in dieser Reihenfolge geladen werden, damit Rezeptdaten und Admin-Funktionen verfuegbar sind.

## Browser-Kompatibilität

Die App nutzt moderne Browser-Funktionen:

- `const` und `let`
- `Map`
- `localStorage`
- `navigator.clipboard` mit Fallback
- `navigator.share` (wenn verfügbar und sicherer Kontext)
- semantisches HTML

## Export-Flow und Plattformgrenzen

Der Export folgt einem Best-Effort-Ansatz innerhalb der Browser-Sicherheitsgrenzen:

1. Auf Mobilgeräten wird bevorzugt das native Share-Sheet genutzt (`navigator.share`), aber nur aus einem direkten Nutzerklick heraus.
2. Wenn Teilen nicht verfügbar ist oder abgebrochen wird, versucht die App automatisch den Clipboard-Flow.
3. Wenn moderne Clipboard-APIs nicht verfügbar sind, wird ein Fallback über `execCommand("copy")` versucht.
4. Falls auch der Fallback scheitert, zeigt die App eine klare manuelle Anweisung.
5. Auf Desktop gibt es zusätzlich die Aktion „Textansicht öffnen", die den vollständigen BOM-Text in einem neuen Tab selektierbar darstellt.

Wichtig: Ein automatisches Öffnen eines nativen Editors mit automatischem Einfügen ist in Browsern aus Sicherheitsgründen nicht zuverlässig möglich und daher bewusst nicht Teil der App.

Empfohlen werden aktuelle Versionen von Chrome, Edge, Firefox oder Safari.

## Hinweise zur Berechnung

Die Stückliste wird nach folgendem Prinzip berechnet:

1. Für jede Zeltart wird die Anzahl gelesen.
2. Alle Standard-Komponenten werden mit der Anzahl multipliziert.
3. Zusätzlich werden die Komponenten der ausgewählten Mittelstangen-Variante addiert.
4. Komponenten mit gleicher `id` werden zusammengefasst.
5. Die Tabelle wird nach Materialname sortiert ausgegeben.

## Keine Server-Abhängigkeiten

Die App verwendet bewusst keine externen Dienste.

Es gibt:

- kein Backend
- keine Datenbank
- keine Benutzerkonten
- keine API-Aufrufe
- keine externen Bibliotheken

Dadurch kann die App einfach kopiert, lokal geöffnet oder als statische Seite eingebunden werden.

## Lizenz

Interne Nutzung für die Pfadfinder Schiefbahn.

Falls das Projekt veröffentlicht werden soll, kann später eine konkrete Open-Source-Lizenz ergänzt werden, zum Beispiel MIT.
