# 🚀 SETUP GUIDE - SIAP PAKAI DI VERCEL

## ✅ Yang Sudah Diperbaiki

### 1. **Server TypeScript Error** ✓
- Fixed `server.ts` line 2152 error
- Simplified endpoint handlers
- Proper error handling

### 2. **Backend Connection** ✓
- Created proxy API di `api/index.ts`
- Automatically forward requests ke backend
- Fallback handling saat backend offline

### 3. **Vercel Configuration** ✓
- Cleaned up `vercel.json`
- Proper rewrite rules untuk API + frontend
- CORS headers di production

### 4. **TypeScript Configuration** ✓
- Fixed `tsconfig.json`
- Proper module resolution
- Skip strict checks untuk compatibility

### 5. **Dependencies** ✓
- Removed unused packages
- Added axios untuk HTTP requests
- Optimized bundle size

---

## 🔧 LANGKAH DEPLOYMENT KE VERCEL

### Step 1: Clone & Setup Lokal

```bash
# Clone repository
git clone https://github.com/derma88212-sudo/PesananTelegramChat.git
cd PesananTelegramChat

# Install dependencies
npm install --legacy-peer-deps

# Build untuk test
npm run build

# Jika tidak ada error, lanjut ke step 2
```

### Step 2: Push ke GitHub

```bash
# Pastikan sudah ada di main branch
git branch

# Commit changes
git add .
git commit -m "Fix: Vercel deployment dengan backend proxy"
git push origin main
```

### Step 3: Deploy di Vercel Dashboard

1. **Buka:** https://vercel.com
2. **Login dengan GitHub**
3. **Click "Add New" → "Project"**
4. **Pilih repository: PesananTelegramChat**
5. **Di halaman Project Settings:**

   **Build & Output:**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install --legacy-peer-deps`

6. **Environment Variables** (PENTING!):

   ```
   BACKEND_URL=http://localhost:3000
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=admin123
   NODE_ENV=production
   DATABASE_TYPE=local
   ```

   > ⚠️ **CRITICAL:** Set `BACKEND_URL` ke server Anda (bukan localhost)
   
   Contoh untuk production:
   ```
   BACKEND_URL=https://api.yourdomain.com
   ```

7. **Click "Deploy"**

### Step 4: Tunggu Deploy Selesai

- ⏳ Build process: 2-5 menit
- ✅ Status "Ready" = Deploy sukses
- 🔗 Dapatkan URL: `https://your-project.vercel.app`

---

## ✨ TEST SETELAH DEPLOY

### 1. Test Health Check
```bash
curl https://your-project.vercel.app/api/health

# Harusnya return:
{
  "status": "ok",
  "uptime": 123.45,
  ...
}
```

### 2. Test Login
```bash
curl -X POST https://your-project.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Return:
{
  "success": true,
  "user": {
    "admin_id": "admin_...",
    "username": "admin",
    "role": "superadmin",
    "token": "session_..."
  }
}
```

### 3. Test Stats
```bash
curl https://your-project.vercel.app/api/stats

# Return stats data
```

### 4. Open di Browser
```
https://your-project.vercel.app/
```

Anda akan melihat:
- ✅ Frontend React loading
- ✅ Admin panel accessible
- ✅ API endpoints working

---

## 🔌 KONFIGURASI BACKEND SERVER

### Jika Backend Lokal (Development)
```
BACKEND_URL=http://localhost:3000
```

### Jika Backend di Heroku
```
BACKEND_URL=https://my-app.herokuapp.com
```

### Jika Backend di Railway
```
BACKEND_URL=https://my-app.railway.app
```

### Jika Backend di VPS/Dedicated
```
BACKEND_URL=http://your-server-ip:3000
```

### Jika Backend di Custom Domain
```
BACKEND_URL=https://api.yourdomain.com
```

---

## 🧪 API ENDPOINTS YANG TERSEDIA

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/health` | GET | ❌ | Health check |
| `/api/status` | GET | ❌ | Server status |
| `/api/auth/login` | POST | ❌ | Admin login |
| `/api/auth/status` | GET | ❌ | Auth status |
| `/api/products` | GET | ❌ | List products |
| `/api/products` | POST | ✅ | Create product |
| `/api/orders` | GET | ❌ | List orders |
| `/api/stats` | GET | ❌ | Store statistics |
| `/api/settings` | GET | ❌ | App settings |
| `/api/db/status` | GET | ❌ | Database status |

---

## 🆘 TROUBLESHOOTING

### Error: "Build failed"
```bash
# Clear cache dan rebuild
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
npm run build
```

### Error: "Backend unavailable"
- Check `BACKEND_URL` di Vercel env variables
- Pastikan backend server sedang running
- Test backend directly: `curl https://your-backend-url/api/health`

### Error: "CORS error"
- Check `vercel.json` has proper CORS headers
- Backend juga harus enable CORS
- Test dengan postman (disable CORS)

### Login tidak working
- Verify `ADMIN_USERNAME` dan `ADMIN_PASSWORD` di Vercel env
- Test login dengan curl
- Check Vercel logs

### Large chunk warning
- Tidak perlu dikhawatirkan untuk production
- Vite sudah minify bundle
- Ukuran akan berkurang di production

---

## 📊 MONITORING DI VERCEL

1. **Dashboard** → Project
2. **Deployments tab** → Lihat history
3. **Klik deployment terbaru**
4. **View Logs:**
   - Build logs
   - Runtime logs
   - Error messages

---

## 🎯 NEXT STEPS

Setelah deployment sukses:

1. **Customize Admin Panel**
   - Login ke `/admin`
   - Change store settings
   - Add products

2. **Configure Database** (Optional)
   - Connect ke Supabase
   - Or MongoDB Atlas
   - Update env variables

3. **Setup Telegram Bot** (Optional)
   - Get bot token dari BotFather
   - Add TELEGRAM_BOT_TOKEN ke env
   - Configure webhook

4. **Setup Payment Gateway** (Optional)
   - Add NOWPayments API key
   - Configure crypto wallets
   - Test payment flow

---

## 🔒 PRODUCTION CHECKLIST

- [ ] BACKEND_URL set ke production URL
- [ ] ADMIN_PASSWORD di-change ke secure password
- [ ] All credentials di Vercel env variables (not in code)
- [ ] Database migrations completed
- [ ] SSL/HTTPS enabled di backend
- [ ] CORS properly configured
- [ ] Tested key endpoints
- [ ] Monitored error logs
- [ ] Set custom domain (optional)

---

## 📞 SUPPORT

- **Vercel Docs:** https://vercel.com/docs
- **Express.js:** https://expressjs.com
- **Create Issue:** GitHub Issues

---

**Status:** ✅ Ready for Production Deployment  
**Last Updated:** January 2024
