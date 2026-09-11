# =============================================================================
# Universal Dockerfile — Bisa dipakai di SEMUA Platform
# ✅ Vercel | ✅ Render | ✅ Koyeb | ✅ Railway | ✅ Fly.io | ✅ VPS
# =============================================================================

# --- Stage 1: Builder — Pasang Semua Dependensi & Bangun ---
FROM node:20-alpine AS builder

WORKDIR /app

# Salin berkas dependensi dulu untuk cache yang lebih baik
COPY package*.json ./

# Pasang SEMUA paket (termasuk devDependencies untuk proses build)
RUN npm install --no-audit --no-fund

# Salin seluruh kode sumber
COPY . .

# Bangun frontend/TypeScript sesuai konfigurasi
RUN npm run build

# --- Stage 2: Runtime — Hanya Pakai Yang Diperlukan ---
FROM node:20-alpine AS runner

WORKDIR /app

# Variabel lingkungan standar
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Pasang hanya dependensi produksi
COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund

# Salin hasil bangun dari tahap builder
COPY --from=builder /app/dist ./dist

# Salin berkas pendukung yang diperlukan
COPY --from=builder /app/supabase_schema.sql ./supabase_schema.sql

# Buat folder data untuk penyimpanan lokal JSON
RUN mkdir -p /app/data
VOLUME ["/app/data"]

# Buka port — dibaca otomatis oleh Render/Koyeb/Railway
EXPOSE ${PORT}

# Cek kesehatan — diperbaiki agar kompatibel semua lingkungan
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "
    const http = require('http');
    const port = process.env.PORT || 3000;
    http.get(\`http://127.0.0.1:\${port}/api/health\`, (res) => {
      process.exit(res.statusCode === 200 ? 0 : 1);
    }).catch(() => process.exit(1));
  "

# Perintah jalankan — kompatibel .js maupun .cjs/.mjs
CMD ["node", "dist/server.ts"]
