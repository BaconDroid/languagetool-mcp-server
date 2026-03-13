# languagetool-mcp-server

MCP server for the **LanguageTool Pro API** — brings spell-checking, grammar, and style suggestions directly into Claude Code and other MCP-compatible clients.

> **⚠️ LanguageTool Pro required** — This server uses the LanguageTool Pro API. A paid [LanguageTool Pro subscription](https://languagetool.org/pro) with API access is required. The free tier does not provide API access.

📖 [Deutsche Dokumentation](README.de.md)

---

## Prerequisites

- Node.js ≥ 18
- **LanguageTool Pro account** with API access ([subscription required](https://languagetool.org/pro))
- API credentials: username (email address) + API key

Find your API key at: https://languagetool.org/editor/settings/access-tokens

---

## Installation

**Option A — via npx (no installation needed):**

Use `npx @dpesch/languagetool-mcp-server` directly in your MCP config (see Setup below).

**Option B — clone and build:**

```bash
git clone https://codeberg.org/dpesch/languagetool-mcp-server
cd languagetool-mcp-server
npm install
npm run build
```

---

## Credentials

The server reads credentials from environment variables:

| Variable       | Description                                  |
|---------------|----------------------------------------------|
| `LT_USERNAME` | LanguageTool username (email address)        |
| `LT_API_KEY`  | API key from your account settings           |

---

## Setup in Claude Code (stdio — recommended for local use)

Add to `~/.claude/claude_desktop_config.json` (Windows: `%APPDATA%\Claude\claude_desktop_config.json`):

**Option A — via npx (recommended, no build step):**

```json
{
  "mcpServers": {
    "languagetool": {
      "command": "npx",
      "args": ["-y", "@dpesch/languagetool-mcp-server"],
      "env": {
        "LT_USERNAME": "your@email.com",
        "LT_API_KEY":  "your-api-key"
      }
    }
  }
}
```

**Option B — local build:**

```json
{
  "mcpServers": {
    "languagetool": {
      "command": "node",
      "args": ["/path/to/languagetool-mcp-server/dist/index.js"],
      "env": {
        "LT_USERNAME": "your@email.com",
        "LT_API_KEY":  "your-api-key"
      }
    }
  }
}
```

---

## Setup as HTTP server (for multiple clients)

```bash
LT_USERNAME=your@email.com LT_API_KEY=your-key TRANSPORT=http PORT=3456 node dist/index.js
```

Then in your MCP configuration:

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

Health check: `GET http://localhost:3456/health`

---

## Available Tools

### `lt_check_text`
Full text check with categorized suggestions and corrections.

**Parameters:**
- `text` — text to check (max. 40,000 characters)
- `language` — language code (`de-DE`, `en-US`, …) or `auto` (default)
- `picky` — stricter checking with more style hints (default: `false`)
- `disabled_rules` — rule IDs to ignore
- `enabled_rules` — additional rule IDs to enable

### `lt_check_text_summary`
Compact one-line summary without individual details — useful for quick checks.

### `lt_list_languages`
All supported languages with language codes. Optionally filterable via `filter` parameter.

---

## Categories

| Icon | Category       |
|------|----------------|
| 🔴   | Spelling       |
| 🟠   | Grammar        |
| 🟡   | Punctuation    |
| 🔵   | Style          |
| ⚪   | Typography     |
| ⚫   | Other          |

---

## Development

```bash
# Watch mode
npm run dev

# Single build
npm run build

# Type check only
npm run typecheck
```

---

## License

[MIT](LICENSE) © 2026 Dominik Pesch
