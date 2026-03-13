@.claude/lessons.md

# CLAUDE.md – Projektkontext für Claude Code

Diese Datei gibt Claude Code den vollständigen Kontext über Entstehung, Design-Entscheidungen und offene Aufgaben des `languagetool-mcp-server`-Projekts.

---

## Was ist dieses Projekt?

Ein **MCP-Server** (Model Context Protocol), der die **LanguageTool Pro API** anbindet und damit Rechtschreib-, Grammatik-, Stil- und Typografieprüfung direkt in Claude Code und andere MCP-fähige Clients bringt.

**Warum wurde es gebaut?** Der Projektinhaber hat ein LanguageTool Pro-Abo und wollte die API per MCP für Claude nutzbar machen – damit Texte, die Claude schreibt oder überarbeitet, direkt gegen LanguageTool geprüft werden können, ohne manuell copy-pasten zu müssen.

**Gibt es vergleichbare Projekte?** Nein. Eine Recherche auf GitHub und Codeberg ergab: Es existiert kein MCP-Server für die LanguageTool (Pro) API. Die gefundenen `mcp-language-server`- und `languagetool-language-server`-Repos sind LSP-Server (Language Server Protocol für Code-Editoren) – konzeptuell etwas völlig anderes. Dieses Projekt füllt eine echte Lücke und ist ein guter Kandidat für den offiziellen MCP-Server-Index.

---

## Tech-Stack und Design-Entscheidungen

### Sprache & Framework
- **TypeScript** mit dem offiziellen `@modelcontextprotocol/sdk`
- Entscheidung für TypeScript (nicht Python/FastMCP), weil: bessere SDK-Unterstützung, statische Typisierung, und der Projektinhaber arbeitet primär mit Node.js-Tools

### Transport
- **stdio** als Standard (für lokale Claude Code / Claude Desktop Nutzung)
- **HTTP** (Streamable HTTP) als Alternative via `TRANSPORT=http`-Umgebungsvariable – für Szenarien mit mehreren Clients oder Remote-Nutzung
- Konfiguration über `process.env.TRANSPORT`

### Projektstruktur
```
src/
├── index.ts              ← Einstiegspunkt, Transport-Auswahl
├── types.ts              ← Alle TypeScript-Interfaces (LtMatch, CheckResult, etc.)
├── constants.ts          ← API-URL, Zeichenlimit, Kategorie-Mapping
├── services/
│   └── languagetool.ts   ← API-Client (fetch-basiert, keine externen HTTP-libs)
└── tools/
    ├── check.ts          ← lt_check_text + lt_check_text_summary
    └── languages.ts      ← lt_list_languages
```

### Authentifizierung
- Über Umgebungsvariablen `LT_USERNAME` (E-Mail) und `LT_API_KEY`
- Kein Hardcoding, keine Config-Datei – bewusste Entscheidung für maximale Sicherheit und einfache CI/CD-Kompatibilität
- API-Endpunkt: `https://api.languagetoolplus.com/v2`

### LanguageTool-Features
Folgende Features wurden bewusst eingebaut:
- **Automatische Spracherkennung** (`language: "auto"`) als Standard
- **Picky-Mode** (`level=picky`) für strengere Stil-Prüfung
- **disabled_rules / enabled_rules** für granulare Kontrolle
- Zeichenlimit: 40.000 Zeichen (LanguageTool Pro-Limit)

### Ausgabe-Format
- Markdown-formatierter Bericht mit Kategorisierung nach: 🔴 Rechtschreibung, 🟠 Grammatik, 🟡 Zeichensetzung, 🔵 Stil, ⚪ Typografie, ⚫ Sonstiges
- Zusätzlich `structuredContent` (JSON) im Tool-Response für programmatische Weiterverarbeitung
- Kontext-Highlight: fehlerhafte Stelle wird mit `[eckigen Klammern]` markiert

---

## Verfügbare Tools

| Tool-Name | Beschreibung |
|---|---|
| `lt_check_text` | Vollständige Prüfung mit kategorisierten Hinweisen und Vorschlägen |
| `lt_check_text_summary` | Einzeiler-Zusammenfassung (Anzahl Fehler pro Kategorie) |
| `lt_list_languages` | Alle unterstützten Sprachen mit Sprachcodes, optional filterbar |

---

## Versionierung und Kompatibilitätsversprechen

Dieses Projekt folgt [Semantic Versioning 2.0.0](https://semver.org/) und orientiert sich
am Symfony Backward Compatibility Promise: Minor- und Patch-Releases dürfen keine
unerwarteten Seiteneffekte für bestehende Integrationen verursachen.

---

### Was ist die öffentliche API dieses Projekts?

Die öffentliche API umfasst alles, worauf MCP-Clients und externe Nutzer:innen sich verlassen:

#### Tool-Schnittstellen (streng stabil)
- **Tool-Namen:** `lt_check_text`, `lt_check_text_summary`, `lt_list_languages`
  – Umbenennung oder Entfernung ist immer ein Breaking Change (→ major).
- **Parameter-Namen und -Typen:** Bestehende Parameter dürfen nicht umbenannt,
  entfernt oder in ihrer Semantik verändert werden (→ major).
- **Pflicht-/Optional-Status:** Ein optionaler Parameter darf nicht zu einem
  Pflichtparameter werden (→ major). Umgekehrt ist erlaubt (→ minor).
- **Parameter-Defaults:** Änderungen an Standardwerten gelten als Breaking Change (→ major).

#### `structuredContent`-Schema (versioniert, streng stabil)
Das JSON-Objekt im `structuredContent`-Feld des Tool-Response ist versioniertes Kernfeature.
Es enthält ein `schemaVersion`-Feld (z. B. `"1.0"`).

- Neue optionale Felder hinzufügen → minor
- Bestehende Felder entfernen oder umbenennen → major
- Typ eines bestehenden Felds ändern → major
- `schemaVersion` wird bei jedem Breaking Change hochgezählt

Aktuelles Schema: siehe `src/types.ts`, Interface `StructuredCheckResult`.

#### Umgebungsvariablen (streng stabil)
Bestehende Variablen (`LT_USERNAME`, `LT_API_KEY`, `TRANSPORT`, `PORT`) dürfen
in minor/patch nicht umbenannt oder entfernt werden (→ major).
Neue optionale Variablen einführen ist erlaubt (→ minor).

#### Markdown-Ausgabe (teilweise stabil)
- **Kategorie-Schlüssel** (🔴 Spelling, 🟠 Grammar, …) und ihre **Reihenfolge**
  in der Ausgabe sind stabil (→ Änderung ist major).
- **Darstellungsdetails** (Formatierung, Einrückung, Emoji-Stil) dürfen sich
  in minor ändern, sofern alle Informationen vollständig erhalten bleiben.
- Informationen entfernen ist immer breaking (→ major).

---

### Was ist intern und kann sich jederzeit ändern?

- Dateistruktur unter `src/` (Modulnamen, Klassen, interne Funktionen)
- Interne TypeScript-Typen, die nicht Teil von `structuredContent` sind
- Build-Konfiguration (`tsconfig.json`, `package.json`-Scripts)
- Entwicklerwerkzeuge (Lint, Format, CI-Konfiguration)

---

### Versionsregeln im Überblick

| Änderungstyp                                        | Version   |
|-----------------------------------------------------|-----------|
| Bugfix ohne Verhaltensänderung                      | patch     |
| Neues optionales Tool-Parameter                     | minor     |
| Neues Tool                                          | minor     |
| Neue optionale Umgebungsvariable                    | minor     |
| Neue optionale Felder in `structuredContent`        | minor     |
| Darstellungsänderung (Markdown, Formatierung)       | minor     |
| Tool-Name geändert oder entfernt                    | **major** |
| Pflichtparameter hinzugefügt                        | **major** |
| Parameter-Default geändert                          | **major** |
| Bestehende Umgebungsvariable umbenannt/entfernt     | **major** |
| Felder in `structuredContent` entfernt/umbenannt    | **major** |
| `schemaVersion` erhöht                              | **major** |
| Kategorie-Schlüssel oder -Reihenfolge geändert      | **major** |

---

### Deprecation-Prozess

Soll etwas aus der öffentlichen API entfernt werden, gilt:

1. In einem **minor**-Release als deprecated markieren (Hinweis im README und
   in der Tool-Beschreibung im MCP-Response).
2. Frühestens im **nächsten major**-Release entfernen.
3. Im CHANGELOG.md unter `### Deprecated` dokumentieren.

---

### Release-Checkliste

Vor jedem Release prüfen:

- [ ] Alle Änderungen seit letztem Tag dokumentiert in `CHANGELOG.md`
- [ ] Versionsnummer in `package.json` gesetzt
- [ ] Git-Tag gesetzt (`git tag v1.2.3`)
- [ ] Geprüft: Entspricht der Versionstyp (patch/minor/major) den obigen Regeln?
- [ ] Bei major: Migration-Hinweise im CHANGELOG unter `### Breaking Changes`
- [ ] Bei Änderung an `structuredContent`: `schemaVersion` aktualisiert und
      Interface `StructuredCheckResult` in `src/types.ts` angepasst

---

### `schemaVersion` in `structuredContent`

Jeder Tool-Response, der `structuredContent` enthält, liefert:

```json
{
  "schemaVersion": "1.0",
  ...
}
```

Clients können dieses Feld auswerten, um Kompatibilität zu prüfen.
Die Version folgt dem Format `MAJOR.MINOR` unabhängig von der Paketversion.

---

## Konfiguration (Claude Desktop / Claude Code)

```json
{
  "mcpServers": {
    "languagetool": {
      "command": "node",
      "args": ["C:/dev.local/mcp-servers/languagetool-mcp-server/dist/index.js"],
      "env": {
        "LT_USERNAME": "deine@email.de",
        "LT_API_KEY": "dein-api-key"
      }
    }
  }
}
```

HTTP-Modus:
```bash
LT_USERNAME=... LT_API_KEY=... TRANSPORT=http PORT=3456 node dist/index.js
```

---

## Open-Source-Setup: Was noch zu tun ist

Das Projekt soll als Open-Source-Projekt veröffentlicht werden. Folgende Aufgaben stehen an:

### Repository-Setup
- [ ] GitHub-Repository anlegen (Name: `languagetool-mcp-server`)
- [x] Passende Lizenz wählen – **MIT** (LICENSE-Datei vorhanden, package.json aktualisiert)
- [ ] `.gitignore` für Node.js anlegen (`node_modules/`, `dist/`)
- [ ] `CHANGELOG.md` anlegen
- [ ] `CONTRIBUTING.md` anlegen (Hinweise für Beitragende)

### package.json ergänzen
- [ ] `repository`-Feld mit GitHub-URL ergänzen
- [ ] `license`-Feld setzen
- [ ] `keywords` ergänzen: `["mcp", "languagetool", "grammar", "spellcheck", "model-context-protocol"]`
- [ ] `author`-Feld setzen
- [ ] `engines`-Feld: `{ "node": ">=18" }`

### CI/CD
- [ ] GitHub Actions Workflow für automatisches Build & Test bei Push
- [ ] Optional: npm-Paket veröffentlichen (dann via `npx languagetool-mcp-server` nutzbar)

### Dokumentation
- [ ] README.md ist vorhanden und gut – ggf. Badges ergänzen (npm version, license, build status)
- [ ] Einbindung in den offiziellen MCP-Server-Index beantragen: https://github.com/modelcontextprotocol/servers

### Tests
- [ ] Aktuell keine Tests vorhanden – Grundstruktur für Unit-Tests mit `vitest` oder `jest` aufsetzen
- [ ] Mindestens: Mock-Tests für den API-Client und die Formatter-Funktionen

### Erweiterungsideen (Backlog)
- [ ] `lt_check_file`-Tool: direkt eine Datei (z. B. Markdown) prüfen
- [ ] Unterstützung für selbst-gehostete LanguageTool-Instanzen (eigene `LT_API_URL`-Env-Variable – Grundstruktur ist schon in `constants.ts` vorbereitet)
- [ ] `lt_get_rule_info`-Tool: Details zu einer Regel-ID abrufen
- [ ] Ergebnis-Cache (z. B. für wiederholte Prüfungen desselben Textes)

---

## SDK-Dokumentation via context7

Das `@modelcontextprotocol/sdk` entwickelt sich aktiv. Für aktuelle API-Dokumentation immer context7 nutzen:
- Tool-Response-Format, `structuredContent`, Transport-Klassen
- Resolver: `@modelcontextprotocol/sdk`

---

## Stil-Hinweise für dieses Projekt

Der Projektinhaber schreibt deutsche Texte und bevorzugt:
- Anführungszeichen: »«
- Gender-Doppelpunkt (Nutzer:innen), kein Genderstern
- »allerdings« statt »aber«
- »Vereinbarung« statt »Vertrag«
- Korrekte Typografie (Gedankenstriche, schmales Leerzeichen bei Einheiten etc.)

Für Code und Kommentare gilt: Englisch (internationale Open-Source-Konvention).
Für README und Dokumentation: Deutsch (primäre Zielgruppe) + Englisch (für internationale Nutzung sinnvoll – ggf. zweisprachige README).

---

## Lokale Entwicklungsumgebung

```bash
npm install          # Abhängigkeiten installieren
npm run build        # TypeScript kompilieren → dist/
npm run typecheck    # Typ-Check ohne Ausgabe (schnell, kein dist/-Schreibzugriff)
npm run dev          # Watch-Modus für Entwicklung
npm start            # Server starten (stdio)
```

Umgebungsvariablen lokal setzen (PowerShell):
```powershell
$env:LT_USERNAME = "deine@email.de"
$env:LT_API_KEY  = "dein-api-key"
node dist/index.js
```
