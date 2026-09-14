# 🔧 PERBAIKAN BUG & SETUP BACKEND CONNECTION

## 🐛 Bug yang Sudah Diperbaiki

### 1. ✅ CORS Headers
**Masalah:** Frontend tidak bisa komunikasi ke backend
**Solusi:** 
- Added comprehensive CORS headers di `vercel.json`
- Updated `server.ts` dengan enhanced CORS middleware
- Allows all origins untuk development/testing

### 2. ✅ Backend URL Proxy
**Masalah:** Vercel API tidak terhubung ke backend server
**Solusi:**
- Created `api/index.ts` dengan axios proxy
- Automatically forward requests ke `BACKEND_URL`
- Fallback to demo mode jika backend down

### 3. ✅ Authentication
**Masalah:** Login credential tidak tersinkronisasi
**Solusi:**
- Local auth endpoint di Vercel (independent)
- Fallback auth ke backend jika tersedia
- Environment variable credentials sebagai default

### 4. ✅ Environment Variables
**Masalah:** Beberapa env vars tidak terbaca di Vercel
**Solusi:**
- Added `BACKEND_URL` untuk pointing ke server
- Standardized semua env var names
- Added `.env.local.example` dengan lengkap

### 5. ✅ Build Issues
**Masalah:** Build gagal di Vercel
**Solusi:**
- Fixed `package.json` scripts
- Added `--legacy-peer-deps` untuk compatibility
- Improved `tsconfig.json` dan `vite.config.ts`

## 🔌 SETUP BACKEND SERVER CONNECTION

### Step 1: Update Environment Variables di Vercel

Di Vercel Dashboard → Settings → Environment Variables, tambahkan:

```
BACKEND_URL=https://your-backend-server.com
```

Contoh nilai untuk berbagai backend:

```
# Local development
BACKEND_URL=http://localhost:3000

# Heroku backend
BACKEND_URL=https://my-app.herokuapp.com

# Railway.app
BACKEND_URL=https://my-app.railway.app

# VPS/Dedicated Server
BACKEND_URL=http://your-server-ip:3000

# AWS/DigitalOcean
BACKEND_URL=https://api.yourdomain.com
```

### Step 2: Restart/Redeploy di Vercel

```bash
# Option A: Via Vercel Dashboard
1. Buka Project
2. Click "Deployments"
3. Click "..." di latest deployment
4. Click "Redeploy"

# Option B: Via Git
git add .
git commit -m "Add backend URL configuration"
git push
```

### Step 3: Test Backend Connection

```bash
# Test dengan curl
curl https://your-vercel-project.vercel.app/api/status

# Expected response:
{
  "success": true,
  "message": "Vercel API gateway is running",
  "backend_connected": true,
  "timestamp": "2024-01-01T..."
}
```

## 🧪 Test Endpoints

### Health Check
```bash
curl https://your-project.vercel.app/api/health
```

### Login
```bash
curl -X POST https://your-project.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### Products
```bash
curl https://your-project.vercel.app/api/products
```

### Stats
```bash
curl https://your-project.vercel.app/api/stats
```

### Database Status
```bash
curl https://your-project.vercel.app/api/db/status
```

## 📋 Fallback Behavior (Demo Mode)

Jika `BACKEND_URL` tidak accessible, Vercel API akan:
- ✅ Return demo data untuk testing
- ✅ Tetap bisa login dengan fallback auth
- ✅ Show status message bahwa backend offline
- ✅ Allow testing frontend tanpa backend

## 🔐 Security Notes

### Sensitive Credentials
Never commit ke git:
```bash
# These should ONLY be in Vercel environment variables
ADMIN_PASSWORD=your_password
TELEGRAM_BOT_TOKEN=your_token
NOWPAYMENTS_API_KEY=your_key
GEMINI_API_KEY=your_key
```

### CORS Configuration
Current setup allows all origins. Untuk production:

Edit `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "https://yourdomain.com"
        }
      ]
    }
  ]
}
```

## 🆘 Troubleshooting Backend Connection

### Problem: "Backend Unavailable"

**Check:**
1. BACKEND_URL di Vercel environment variables
2. Backend server sedang running
3. Network connectivity (firewall, DNS)
4. CORS enabled di backend

**Solution:**
```bash
# Test backend directly
curl https://your-backend-url/api/health

# If 404 or timeout, backend is down
# Configure fallback di .env.local.example
```

### Problem: CORS Error di Browser

**Check:**
1. `vercel.json` has proper CORS headers
2. Backend also has CORS enabled
3. Browser console untuk detailed error

**Solution:**
```javascript
// Make sure frontend uses relative URLs
// ❌ Wrong
fetch('http://localhost:3000/api/products')

// ✅ Correct
fetch('/api/products')
```

### Problem: Login Not Working

**Check:**
1. ADMIN_USERNAME dan ADMIN_PASSWORD di Vercel env
2. Credentials match (case-sensitive)
3. Network tab di browser untuk see actual request

**Solution:**
```bash
# Test login endpoint
curl -X POST https://your-project.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

## 📊 Monitoring Backend Connection

**Check logs di Vercel Dashboard:**
1. Project → Deployments → Latest
2. Click on deployment
3. View Logs section

**Look for:**
- `[API]` log messages
- `Backend unavailable` messages
- Error stack traces

## 🚀 Production Deployment Checklist

- [ ] BACKEND_URL set di Vercel environment
- [ ] Backend server URL is production URL
- [ ] All credentials updated di Vercel env
- [ ] SSL/HTTPS enabled di backend
- [ ] CORS properly configured
- [ ] Database migrations completed
- [ ] Tested login endpoint
- [ ] Tested key API endpoints
- [ ] Verified demo mode works

---

**Status:** ✅ Backend Connection Ready
**Last Updated:** January 2024
