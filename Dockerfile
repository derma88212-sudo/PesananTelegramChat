# =============================================================================
# Multi-stage Dockerfile for Telegram Digital Goods Store & Admin Panel
# Works for both VPS deployment (long-polling bot) and general Node hosting.
# =============================================================================

# --- Stage 1: Build (dependencies + frontend bundle + server bundle) ---
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first for better layer caching
COPY package*.json ./
RUN npm install --no-audit --no-fund

# Copy source and build
COPY . .
RUN npm run build

# --- Stage 2: Runtime (slim image, production deps only) ---
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Production dependencies only
COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund

# Copy built artifacts and runtime sources needed by dist/server.cjs
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/supabase_schema.sql ./supabase_schema.sql

# Persistent local data directory (JSON fallback store)
RUN mkdir -p /app/data
VOLUME ["/app/data"]

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/server.cjs"]
