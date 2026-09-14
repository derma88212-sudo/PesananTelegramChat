# =============================================================================
# Universal Dockerfile — Railway Fixed & Production Ready
# =============================================================================

# --- Stage 1: Builder ---
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install --no-audit --no-fund

COPY . .
RUN npm run build

# --- Stage 2: Runtime ---
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund --ignore-scripts && npm cache clean --force

# Copy hasil build dari stage builder
COPY --from=builder /app/dist ./dist

# Copy file opsional tanpa operator shell
COPY --from=builder /app/supabase_schema.sq[l] ./supabase_schema.sql

RUN mkdir -p /app/data

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e " \
    const http = require('http'); \
    const req = http.get('http://127.0.0.1:' + (process.env.PORT || 3000) + '/api/health', (res) => { \
      process.exit(res.statusCode === 200 ? 0 : 1); \
    }); \
    req.on('error', () => process.exit(1)); \
  "

CMD ["node", "dist/server.js"]
