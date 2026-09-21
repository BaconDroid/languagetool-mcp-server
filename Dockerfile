# =============================================================================
# languagetool-mcp-server - All-in-one Image
# LanguageTool server + MCP server (stdio) in a single container
# =============================================================================
# Base: erikvl87/languagetool (Community Apps, shell entrypoint)
# Adds: Node.js 18 + MCP server (TypeScript)
# =============================================================================

# --- Stage 1: Build MCP server ---
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# --- Stage 2: Final image ---
FROM erikvl87/languagetool:latest

USER root

# Install Node.js
RUN apk add --no-cache nodejs npm tini

WORKDIR /LanguageTool

# Copy production deps + built code from builder
COPY --from=builder /app/package.json /app/package-lock.json /app/
COPY --from=builder /app/dist/ /app/dist/
RUN cd /app && npm install --production && npm cache clean --force

# Copy custom entrypoint
COPY entrypoint-mcp.sh /entrypoint-mcp.sh
RUN chmod +x /entrypoint-mcp.sh

USER languagetool

# Default env vars
ENV LANGUAGETOOL_URL="http://127.0.0.1:8010/v2" \
    LANGUAGETOOL_CHAR_LIMIT="40000" \
    JAVA_XMS="512m" \
    JAVA_XMX="2g"

# Expose MCP HTTP port
EXPOSE 3456

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD wget -qO- http://localhost:8010/v2/languages || exit 1

ENTRYPOINT ["tini", "--"]
CMD ["/entrypoint-mcp.sh"]