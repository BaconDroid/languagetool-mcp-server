# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-11-24

Fork release. Everything below was added on top of upstream 1.1.0, which is where
the upstream changelog ends.

### Added
- Self-hosted LanguageTool support: `LANGUAGETOOL_URL` points the server at your own
  instance instead of the Pro API, and `LANGUAGETOOL_CHAR_LIMIT` overrides the limit.
  `LT_USERNAME` / `LT_API_KEY` become optional when a self-hosted URL is set
- Streamable HTTP transport via `TRANSPORT=http` and `PORT`, alongside the stdio default
- All-in-one Dockerfile bundling the LanguageTool server and this MCP server in one
  container, based on `erikvl87/languagetool`
- ngrams volume documentation and `download_ngrams_for_langs` support
- Unit tests (`node --test`) for the environment-variable contract, the Markdown
  formatter, and the consistency of the Java heap variable names across the
  Dockerfile, the entrypoint and the README
- CI workflow: typecheck, test, and a Docker build

### Fixed
- The Java heap variables were unreadable. The Dockerfile set `JAVA_XMS` / `JAVA_XMX`
  and the README documented those names, but nothing consumed them - the entrypoint
  reads `Java_Xms` / `Java_Xmx`. Both files now use the name the entrypoint and the
  `erikvl87/docker-languagetool` base image actually read, and the defaults are
  consistent (`512m` / `2g`) instead of the entrypoint falling back to `256m` / `512m`

## [1.1.0] - 2026-03-13

### Added
- `schemaVersion` field in `structuredContent` of all tool responses for programmatic compatibility checks
- New `StructuredCheckResult` interface in `src/types.ts` as versioned schema for `structuredContent`

## [1.0.0] — 2026-03-12

### Added
- `lt_check_text` tool: full text check with categorized suggestions (spelling, grammar, punctuation, style, typography)
- `lt_check_text_summary` tool: compact one-line summary of check results
- `lt_list_languages` tool: list all supported languages with optional filtering
- Automatic language detection (`language: auto`)
- Picky mode for stricter style checking
- `disabled_rules` / `enabled_rules` for fine-grained rule control
- Markdown-formatted output with category icons
- Structured JSON output via `structuredContent` for programmatic use
- Context highlight: erroneous passage marked with `[square brackets]`
- stdio transport (default, for local Claude Code / Claude Desktop use)
- Streamable HTTP transport (via `TRANSPORT=http` env variable)
- GFM table support and markdown whitespace noise suppression
- Support up to 40,000 characters (LanguageTool Pro limit)
