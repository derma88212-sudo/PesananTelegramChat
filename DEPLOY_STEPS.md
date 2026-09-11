# 🚀 Langkah Deployment ke Vercel (Siap Pakai)

## Step 1: Persiapan Repository

```bash
# 1. Clone atau update repository
git clone https://github.com/derma88212-sudo/PesananTelegramChat.git
cd PesananTelegramChat

# 2. Install dependencies
npm install --legacy-peer-deps

# 3. Test build lokal
npm run build

# 4. Pastikan tidak ada error
# Jika ada error, jalankan:
npm run lint
```

## Step 2: Setup di Vercel Dashboard

1. **Buka https://vercel.com**
2. **Login dengan GitHub account**
3. **Click "Add New" → "Project"**
4. **Pilih repository: `PesananTelegramChat`**
5. **Di halaman "Import Project":**
   - Framework Preset: `Other`
   - Root Directory: `.` (default)
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install --legacy-peer-deps`

6. **Click "Environment Variables" dan tambahkan:**

| Key | Value | Required |
|-----|-------|----------|
| `ADMIN_USERNAME` | `admin` | ✅ |
| `ADMIN_PASSWORD` | `YourSecurePassword123!` | ✅ |
| `NODE_ENV` | `production` | ✅ |
| `DATABASE_TYPE` | `local` | ✅ |
| `TELEGRAM_BOT_TOKEN` | Your token here | ❌ |
| `TELEGRAM_ADMIN_GROUP_ID` | Your group ID | ❌ |

7. **Click "Deploy"**

## Step 3: Wait for Deployment

- ⏳ Build process dimulai (2-5 menit)
- ✅ Tunggu hingga status "Ready"
- 🔗 Copy domain Vercel (https://your-project.vercel.app)

## Step 4: Test di Browser

```
Buka URL project Vercel:
https://your-project.vercel.app

Anda akan melihat:
- Frontend React loading
- Admin Panel bisa diakses
```

## Step 5: Test API Endpoints

```bash
# Option 1: Gunakan curl
curl https://your-project.vercel.app/api/health

# Option 2: Buka di browser
https://your-project.vercel.app/api/health

# Response harusnya:
{
  "status": "ok",
  "uptime": 123.45,
  "active_bots": 0,
  "environment": "production",
  "timestamp": "2024-01-01T..."
}
```

## Step 6: Login ke Admin Panel

1. **Buka:** https://your-project.vercel.app/admin
2. **Username:** `admin` (atau yang Anda set)
3. **Password:** Password yang Anda set di env variables
4. **Click Login**

## ✅ Checklist Sukses

- [ ] Vercel deployment status "Ready" ✅
- [ ] `/api/health` bisa diakses
- [ ] Admin login berhasil
- [ ] Frontend halaman load dengan baik
- [ ] Tidak ada 500 error di console

## 🔧 Custom Domain (Optional)

1. Di Vercel Dashboard → Settings → Domains
2. Add custom domain (misal: myapp.com)
3. Update DNS records sesuai instruksi Vercel
4. Wait 5-10 minutes untuk DNS propagation

## 📱 Telegram Bot Integration (Optional)

Untuk menghubungkan Telegram bot:

1. **Dapatkan Bot Token dari BotFather**
   ```
   Telegram: @BotFather
   Command: /newbot
   ```

2. **Set Webhook ke Vercel:**
   ```bash
   curl -X POST https://api.telegram.org/bot<YOUR_TOKEN>/setWebhook \
     -H 'Content-Type: application/json' \
     -d '{
       "url": "https://your-project.vercel.app/api/telegram",
       "allowed_updates": ["message", "callback_query"]
     }'
   ```

3. **Update di Vercel Environment Variables:**
   - `TELEGRAM_BOT_TOKEN=your_token_here`
   - `TELEGRAM_ADMIN_GROUP_ID=your_group_id`

## 🚨 Troubleshooting

### Error: "Build failed"
```bash
# Solution:
npm run build
npm audit fix --legacy-peer-deps
git push
```

### Error: "Module not found"
```bash
# Clean reinstall
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
npm run build
```

### API returning 404
- Check vercel.json is present
- Verify api/index.ts exists
- Check build logs in Vercel Dashboard

### Password tidak terbaca di environment
1. Vercel Dashboard → Settings → Environment Variables
2. Delete dan re-add variable
3. Re-deploy: Click "Redeploy"

## 🎯 Next Steps

Setelah deployment berhasil:

1. **Customize Admin Panel**
   - Edit store name di settings
   - Add products
   - Configure payment methods

2. **Setup Database** (Optional)
   - Connect Supabase
   - Or use MongoDB Atlas
   - Update DATABASE_TYPE env var

3. **Enable Telegram Bot** (Optional)
   - Add bot token
   - Set webhook
   - Test with /start command

4. **Monitor Performance**
   - Check Vercel Analytics
   - Monitor function invocations
   - Review error logs

---

## 📞 Support

- **Vercel Docs:** https://vercel.com/docs
- **Issues:** Create GitHub issue
- **Discord:** Join community server

## ✨ Credits

Project siap deploy dengan:
- ✅ Express.js backend
- ✅ React frontend
- ✅ Vite builder
- ✅ Vercel serverless
- ✅ TypeScript support
- ✅ CORS enabled
- ✅ Demo API responses

**Selamat! 🎉 Project Anda sudah live di Vercel!**

---
Last Updated: January 2024
