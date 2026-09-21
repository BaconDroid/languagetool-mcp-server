# languagetool-mcp-server (self-hosted fork)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> **Fork of [dpesch/languagetool-mcp-server](https://codeberg.org/dpesch/languagetool-mcp-server)** - adapted for **self-hosted LanguageTool** instances in addition to the Pro API.

MCP server for **LanguageTool** - brings spell-checking, grammar, and style suggestions directly into Claude Code and other MCP-compatible clients.

## What changed from the original

This fork adds support for **self-hosted LanguageTool** (Docker or standalone) without requiring a Pro subscription:

- `LANGUAGETOOL_URL` env var to point to your own instance (default: Pro API)
- `LANGUAGETOOL_CHAR_LIMIT` env var to override character limit
- Credentials (`LT_USERNAME` / `LT_API_KEY`) are now **optional** - self-hosted instances don't need them
- Fully backward-compatible with LanguageTool Pro (set credentials as before)

---

## Prerequisites

- Node.js ≥ 18
- **Either:** a self-hosted LanguageTool instance (e.g. Docker `erikvl87/languagetool`)
- **Or:** a LanguageTool Pro account with API access ([subscription required](https://languagetool.org/pro))

### Self-hosted (free)

Run your own LanguageTool server:

```bash
docker run -d \
  --name languagetool \
  -p 8010:8010 \
  -e Java_Xms=512m \
  -e Java_Xmx=2g \
  --restart unless-stopped \
  erikvl87/languagetool:latest
```

### Pro API (paid)

Find your API key at: https://languagetool.org/editor/settings/access-tokens

---

## Docker (all-in-one)

Bundle LanguageTool server + MCP server in a single container.
Base image: [erikvl87/languagetool](https://github.com/Erikvl87/docker-languagetool) (Community Apps, shell entrypoint).

```bash
git clone https://github.com/BaconDroid/languagetool-mcp-server
cd languagetool-mcp-server
docker build -t languagetool-mcp:latest .
```

```bash
docker run -d \
  --name languagetool-mcp \
  -p 8010:8010 \
  -p 3456:3456 \
  -e Java_Xms=512m \
  -e Java_Xmx=2g \
  -v /mnt/user/appdata/languagetool/ngrams:/ngrams \
  --restart unless-stopped \
  languagetool-mcp:latest
```

Health check: `curl http://localhost:8010/v2/languages`

### Environment variables

| Variable                  | Default                                  | Description                         |
| ------------------------- | ---------------------------------------- | ----------------------------------- |
| `LANGUAGETOOL_URL`          | `http://127.0.0.1:8010/v2`                | LanguageTool API URL                |
| `LANGUAGETOOL_CHAR_LIMIT`   | `40000`                                  | Max characters per check            |
| `TRANSPORT`                 | `stdio`                                    | `stdio` or `http`                     |
| `PORT`                      | `3456`                                   | Port for HTTP transport             |
| `JAVA_XMS`                 | `512m`                                   | Java heap min                       |
| `JAVA_XMX`                 | `2g`                                     | Java heap max                       |

---

## Installation (standalone)

```bash
git clone https://github.com/BaconDroid/languagetool-mcp-server
cd languagetool-mcp-server
npm install
npm run build
```

---

## Environment Variables

| Variable                  | Required           | Description                                         | Default                                  |
| ------------------------- | ------------------ | --------------------------------------------------- | ---------------------------------------- |
| `LANGUAGETOOL_URL`          | No                 | Base URL of your LanguageTool instance              | `https://api.languagetoolplus.com/v2`    |
| `LANGUAGETOOL_CHAR_LIMIT`   | No                 | Max characters per request                          | `40000`                                  |
| `LT_USERNAME`               | Pro API only       | LanguageTool username (email)                       | -                                        |
| `LT_API_KEY`                | Pro API only       | API key from account settings                       | -                                        |
| `TRANSPORT`                 | No                 | `stdio` (default) or `http`                           | `stdio`                                    |
| `PORT`                      | No                 | Port for HTTP transport                             | `3456`                                   |

---

## Sources and Credits

This fork combines open-source projects:

| Component | Source | License | Purpose |
|-----------|--------|---------|----------|
| **MCP Server** (this repo) | [dpesch/languagetool-mcp-server](https://codeberg.org/dpesch/languagetool-mcp-server) | MIT | MCP protocol wrapper for LanguageTool API |
| **LanguageTool Docker** | [Erikvl87/docker-languagetool](https://github.com/Erikvl87/docker-languagetool) | LGPL-2.1 | Base image for all-in-one Docker (shell entrypoint, Community Apps) |
| **LanguageTool** | [languagetool-org/languagetool](https://github.com/languagetool-org/languagetool) | LGPL-2.1 | Grammar/spell checker engine |

The 3 official community Docker images referenced by LanguageTool:

| Project | Stars | Port | Entry point | Notes |
|---------|-------|------|-------------|-------|
| [Erikvl87/docker-languagetool](https://github.com/Erikvl87/docker-languagetool) | 721 | 8010 | Shell script | **Used as base image** - Community Apps, fastText auto-download |
| [meyayl/docker-languagetool](https://github.com/meyayl/docker-languagetool) | 273 | 8081 | Binary | More features (read-only FS, user mapping), auto ngrams |
| [silviof/docker-languagetool](https://hub.docker.com/r/silviof/docker-languagetool) | - | 8010 | Shell script | 1M+ pulls, no fastText, no auto ngrams |

### What was changed

- `src/constants.ts`: `LT_API_URL` now reads from `LANGUAGETOOL_URL` env var (default: Pro API)
- `src/constants.ts`: `CHARACTER_LIMIT` now reads from `LANGUAGETOOL_CHAR_LIMIT` env var
- `src/services/languagetool.ts`: `getCredentials()` returns `null` instead of throwing when credentials are missing
- `src/services/languagetool.ts`: `ltPost()` only sends auth params when credentials are present

---

## Setup with MCPElevator

This server works as a stdio command in [MCPElevator](https://github.com/pacnpal/mcpelevator):

```json
{
  "name": "LanguageTool",
  "runner": "command",
  "command": "node",
  "args": ["/path/to/languagetool-mcp-server/dist/index.js"],
  "env": {
    "LANGUAGETOOL_URL": "http://127.0.0.1:8010/v2"
  },
  "enabled": true
}
```

Then access via `http://<mcpelevator>:<port>/s/languagetool/mcp`.

---

## Setup in Claude Code (stdio)

### Self-hosted LanguageTool (free)

```json
{
  "mcpServers": {
    "languagetool": {
      "command": "node",
      "args": ["/path/to/languagetool-mcp-server/dist/index.js"],
      "env": {
        "LANGUAGETOOL_URL": "http://localhost:8010/v2"
      }
    }
  }
}
```

### LanguageTool Pro API (paid)

```json
{
  "mcpServers": {
    "languagetool": {
      "command": "node",
      "args": ["/path/to/languagetool-mcp-server/dist/index.js"],
      "env": {
        "LT_USERNAME": "your@email.com",
        "LT_API_KEY": "your-api-key"
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
| :red_circle: | Spelling       |
| :orange_circle: | Grammar        |
| :yellow_circle: | Punctuation    |
| :blue_circle: | Style          |
| :white_circle: | Typography     |
| :black_circle: | Other          |

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