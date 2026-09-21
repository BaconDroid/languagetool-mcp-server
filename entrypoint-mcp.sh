#!/bin/bash
set -e

echo "[mcp] Starting LanguageTool + MCP all-in-one"

# --- Start MCP server in HTTP mode (background) ---
echo "[mcp] Starting MCP server on port 3456..."
TRANSPORT=http PORT=3456 node /app/dist/index.js &
MCP_PID=$!

# --- Run LanguageTool Java server (foreground, exec) ---
config_injected=false

for varname in ${!langtool_*}; do
  key="${varname#'langtool_'}"
  value="${!varname}"

  if [ "$key" = "fasttextModel" ] || [ "$key" = "fasttextBinary" ]; then
    echo "[mcp] Warning: ignoring langtool_${key} (managed by container)"
    continue
  fi

  config_injected=true
  echo "$key=$value" >> /LanguageTool/config.properties
done

if [ "$config_injected" = true ]; then
  echo '[mcp] LanguageTool config:'
  cat /LanguageTool/config.properties
fi

Xms=${Java_Xms:-256m}
Xmx=${Java_Xmx:-512m}

PRIO_ARGS=(
  "-Xms$Xms"
  "-Xmx$Xmx"
)

if [ -f /LanguageTool/logback.xml ]; then
  PRIO_ARGS+=("-Dlogback.configurationFile=/LanguageTool/logback.xml")
fi

LT_ARGS=(
  -cp languagetool-server.jar
  org.languagetool.server.HTTPServer
  --port 8010
  --public
  --allow-origin '*'
  --config config.properties
)

echo "[mcp] Starting LanguageTool server on port 8010..."
exec java "${PRIO_ARGS[@]}" "${LT_ARGS[@]}"