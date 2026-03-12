# languagetool-mcp-server

MCP-Server für die **LanguageTool Pro API** – bringt Rechtschreib-, Grammatik- und Stilprüfung direkt in Claude Code und andere MCP-fähige Clients.

## Voraussetzungen

- Node.js ≥ 18
- LanguageTool Pro Konto (API-Zugang)
- API-Zugangsdaten: Benutzername (E-Mail) + API-Key

Den API-Key findet man unter: https://languagetool.org/editor/settings/access-tokens

---

## Installation

```bash
# Abhängigkeiten installieren & bauen
npm install
npm run build
```

---

## Zugangsdaten

Der Server liest die Zugangsdaten aus Umgebungsvariablen:

| Variable       | Beschreibung                              |
|---------------|-------------------------------------------|
| `LT_USERNAME` | LanguageTool-Benutzername (E-Mail-Adresse) |
| `LT_API_KEY`  | API-Key aus den Kontoeinstellungen        |

---

## Einrichtung in Claude Code (stdio – empfohlen für lokal)

In `~/.claude/claude_desktop_config.json` (Windows: `%APPDATA%\Claude\claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "languagetool": {
      "command": "node",
      "args": ["C:/dev.local/mcp-servers/languagetool-mcp-server/dist/index.js"],
      "env": {
        "LT_USERNAME": "deine@email.de",
        "LT_API_KEY":  "dein-api-key"
      }
    }
  }
}
```

**Alternativ mit `npx` direkt aus dem Projektordner:**

```json
{
  "mcpServers": {
    "languagetool": {
      "command": "node",
      "args": ["dist/index.js"],
      "cwd": "C:/dev.local/mcp-servers/languagetool-mcp-server",
      "env": {
        "LT_USERNAME": "deine@email.de",
        "LT_API_KEY":  "dein-api-key"
      }
    }
  }
}
```

---

## Einrichtung als HTTP-Server (für mehrere Clients)

```bash
# Server starten
LT_USERNAME=deine@email.de LT_API_KEY=dein-key TRANSPORT=http PORT=3456 node dist/index.js
```

Dann in der MCP-Konfiguration:

```json
{
  "mcpServers": {
    "languagetool": {
      "type": "http",
      "url": "http://localhost:3456/mcp"
    }
  }
}
```

Health-Check: `GET http://localhost:3456/health`

---

## Verfügbare Tools

### `lt_check_text`
Vollständige Textprüfung mit kategorisierten Hinweisen und Korrekturvorschlägen.

**Parameter:**
- `text` – der zu prüfende Text (max. 40.000 Zeichen)
- `language` – Sprachcode (`de-DE`, `en-US`, …) oder `auto` (Standard)
- `picky` – strengere Prüfung mit mehr Stil-Hinweisen (Standard: `false`)
- `disabled_rules` – Regel-IDs, die ignoriert werden sollen
- `enabled_rules` – zusätzliche Regel-IDs

### `lt_check_text_summary`
Kompakte Zusammenfassung (eine Zeile) ohne Einzeldetails – nützlich für schnelle Checks.

### `lt_list_languages`
Alle unterstützten Sprachen mit Sprachcodes. Optional mit `filter`-Parameter.

---

## Kategorien

| Symbol | Kategorie       |
|--------|----------------|
| 🔴     | Rechtschreibung |
| 🟠     | Grammatik       |ok,
| 🟡     | Zeichensetzung  |
| 🔵     | Stil            |
| ⚪     | Typografie      |
| ⚫     | Sonstiges       |

---

## Entwicklung

```bash
# TypeScript im Watch-Modus
npm run dev

# Einmalig bauen
npm run build
```
