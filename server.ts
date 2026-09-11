import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { dbService } from './db_service.js';
import cryptoGateway, { CryptoGateway } from './crypto_gateway.js';
import { activeBots, launchSingleBot, stopSingleBot, startMultiBotManager, getBotEngineMetrics, buildDatabaseBackup, initializeWebhooks } from './bot_engine.js';
import { runBroadcast, stopBroadcast, getBroadcastStatus } from './broadcast_engine.js';
import {
  SUPPORTED_LANGUAGES,
  DEFAULT_WELCOME_TEXTS,
  DEFAULT_TERMS_TEXTS,
  DEFAULT_PAYMENT_GUIDES,
  DEFAULT_ORDER_GUIDES,
  getUI,
  getLocalizedWelcome,
  getLocalizedTerms,
  getLocalizedPaymentGuide,
  getLocalizedOrderGuide,
  getLocalizedProduct,
  getLocalizedPaymentStatus,
  getLocalizedPaymentMethod,
  formatLocalizedOrderReceipt,
  parseAccountCredential,
  getTokenExplorerUrl,
  getQrCodeUrl
} from './translations.js';
import {
  testSupabaseConnection,
  isSupabaseEnabled,
  autoCreateSupabaseTables,
  executeSupabaseSql
} from './supabase_client.js';
import {
  verifyEnvAdminLogin,
  lockFallbackLogin,
  isFallbackLocked,
  savePermanentAdminPassword,
  getMultiDbStatus,
  migrateAllDataToSupabase,
  migrateToEngine,
  ensureTablesForEngine,
  cleanSystemCache,
  cleanCancelledOrders,
  autoMigrateUniversalDatabase
} from './multi_db.js';
import fs from 'fs';
import crypto from 'crypto';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Minimal shape of the order fields the Telegram notification helpers rely on.
interface OrderNotification {
  order_id: string;
  user_id: string;
  product_title: string;
  amount: number | string;
  user_lang?: string;
  [key: string]: any;
}

// Helper: Dispatch delivery notification directly to buyer's Telegram chat if bot is active
async function sendTelegramDeliveryNotice(order: OrderNotification, accountData: string) {
  if (!order || !order.user_id) return;
  const telegramId = String(order.user_id);

  try {
    const session = await dbService.getUserSession(telegramId);
    const lang = session?.language || order.user_lang || 'id';
    const parsed = parseAccountCredential(accountData);

    let credBlock = '';
    if (parsed.email && parsed.password) {
      credBlock = `\n${getUI('credentials_label', lang)}\n` +
                  `📧 <b>Email:</b> <code>${parsed.email}</code>\n` +
                  `🔑 <b>Password:</b> <code>${parsed.password}</code>\n` +
                  (parsed.cookie ? `🍪 <b>Cookie:</b> <code>${parsed.cookie}</code>\n` : '') +
                  (parsed.apiKey ? `🔑 <b>API Key:</b> <code>${parsed.apiKey}</code>\n` : '') +
                  (parsed.note ? `📝 <b>Catatan:</b> ${parsed.note}\n` : '') +
                  `\n${getUI('warranty_tip', lang)}\n`;
    } else {
      credBlock = `\n${getUI('credentials_label', lang)}\n<code>${accountData}</code>\n\n${getUI('warranty_tip', lang)}\n`;
    }

    const message = `🎉 <b>PEMBAYARAN DIVERIFIKASI & AKUN TERKIRIM!</b>\n\n` +
      `📦 <b>Produk:</b> ${order.product_title}\n` +
      `🆔 <b>Order ID:</b> <code>${order.order_id}</code>\n` +
      `💰 <b>Total:</b> $${order.amount} USD\n` +
      credBlock;

    for (const botInstance of (activeBots as any).values()) {
      try {
        await botInstance.bot.telegram.sendMessage(telegramId, message, {
          parse_mode: 'HTML',
          disable_web_page_preview: true
        });
        console.log(`[Telegram Delivery] Sent account to buyer ${telegramId} via bot.`);
        break; // Successfully delivered by active bot
      } catch (err: any) {
        console.warn(`[Telegram Delivery] Bot dispatch note:`, err.message);
      }
    }
  } catch (e: any) {
    console.warn('[Telegram Delivery] Failed delivery notification:', e.message);
  }
}

// Notify the registered Telegram admin group/channel about a brand-new order,
// including one-tap Approve/Reject buttons for manual payments.
async function notifyAdminNewOrder(order: any) {
  if (!order) return;
  const groupChatId = process.env.TELEGRAM_ADMIN_GROUP_ID || process.env.TELEGRAM_CHANNEL_ID || process.env.ADMIN_TELEGRAM_ID;
  if (!groupChatId) return;

  const isManual = ['crypto_manual', 'qris', 'ewallet', 'bank', 'bank_transfer', 'manual_idr'].includes(order.payment_method);
  const shortId = String(order.order_id).slice(-8);
  const amountLine = order.currency === 'IDR' || order.total_amount_idr
    ? `💰 Nominal: Rp ${Number(order.total_amount_idr || order.amount || 0).toLocaleString('id-ID')}`
    : `💰 Nominal: $${order.amount} ${order.currency || 'USD'}`;

  const msg = `🆕 <b>PESAN BARU MASUK!</b>\n\n` +
    `🆔 Order ID: <code>#${order.order_id}</code>\n` +
    `👤 Pembeli: @${order.username || 'Tanpa Username'} (ID: <code>${order.user_id}</code>)\n` +
    `📦 Produk: ${order.product_title}\n` +
    `${amountLine}\n` +
    `🌐 Metode: <b>${order.payment_method_name || order.payment_method}</b> (${isManual ? 'Manual - perlu verifikasi' : 'Otomatis'})\n` +
    (order.unique_code ? `🔢 Kode Unik: <b>+${order.unique_code}</b>\n` : '') +
    `\n<i>${isManual ? 'Menunggu bukti transfer & verifikasi admin.' : 'Menunggu konfirmasi pembayaran otomatis.'}</i>`;

  for (const botInstance of (activeBots as any).values()) {
    try {
      await botInstance.bot.telegram.sendMessage(groupChatId, msg, {
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        reply_markup: {
          inline_keyboard: [[
            { text: `✅ Setujui #${shortId}`, callback_data: `adm_appr_${order.order_id}` },
            { text: `❌ Tolak #${shortId}`, callback_data: `adm_rejc_${order.order_id}` }
          ]]
        }
      });
      break;
    } catch (e: any) {
      console.warn('[Admin New Order Notify] note:', e.message);
    }
  }
}

async function sendTelegramCancellationNotice(order: OrderNotification, reason?: string) {
  if (!order || !order.user_id) return;
  const telegramId = String(order.user_id);

  try {
    const session = await dbService.getUserSession(telegramId);
    const lang = session?.language || order.user_lang || 'id';

    const message = `❌ <b>PESANAN DIBATALKAN / CANCELLED</b>\n\n` +
      `📦 <b>Produk:</b> ${order.product_title}\n` +
      `🆔 <b>Order ID:</b> <code>${order.order_id}</code>\n` +
      `💰 <b>Nominal:</b> $${order.amount} USD\n` +
      (reason ? `📝 <b>Keterangan:</b> ${reason}\n\n` : '\n') +
      `Pesanan ini telah dibatalkan. Jika Anda ingin melakukan pemesanan baru, silakan buka menu katalog produk.`;

    for (const botInstance of (activeBots as any).values()) {
      try {
        await botInstance.bot.telegram.sendMessage(telegramId, message, {
          parse_mode: 'HTML',
          disable_web_page_preview: true
        });
        console.log(`[Telegram Cancel Notice] Sent cancellation to buyer ${telegramId}.`);
        break;
      } catch (err: any) {
        console.warn(`[Telegram Cancel Notice] Bot dispatch error:`, err.message);
      }
    }
  } catch (e: any) {
    console.warn('[Telegram Cancel Notice] Failed notification:', e.message);
  }
}

// Body parsing middleware
// Preserve the exact raw request bytes so webhook signature verification can
// hash the original payload instead of a re-serialized copy.
app.use(express.json({
  verify: (req: any, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({
  extended: true,
  verify: (req: any, _res, buf) => {
    req.rawBody = buf;
  }
}));

// --- API ROUTES FIRST ---

// 1. Health check & System Info
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    active_bots: activeBots.size,
    supabase_configured: isSupabaseEnabled(),
    timestamp: new Date().toISOString()
  });
});

// 1.4 Realtime Bot Engine Metrics (mode, uptime, latency, total requests)
app.get('/api/engine/status', (req, res) => {
  try {
    res.json({ success: true, data: getBotEngineMetrics() });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 1.4.1 Manual Database Backup delivered straight to the admin Telegram chat
app.post('/api/db/backup-telegram', async (req, res) => {
  try {
    const { chat_id } = req.body || {};
    const targetChat = chat_id || process.env.TELEGRAM_ADMIN_GROUP_ID || process.env.ADMIN_TELEGRAM_ID;
    if (!targetChat) {
      return res.status(400).json({ success: false, message: 'Alamat chat admin Telegram belum dikonfigurasi.' });
    }

    const backup = await buildDatabaseBackup(dbService);
    const buffer = Buffer.from(JSON.stringify(backup, null, 2), 'utf8');

    let sent = false;
    for (const botInstance of (activeBots as any).values()) {
      try {
        await botInstance.bot.telegram.sendDocument(targetChat, {
          source: buffer,
          filename: `db_backup_${Date.now()}.json`
        }, {
          caption: `🗄️ <b>Backup Database</b>\nProduk: ${backup.counts.products} | Pesanan: ${backup.counts.orders} | Pengguna: ${backup.counts.users}`,
          parse_mode: 'HTML'
        });
        sent = true;
        break;
      } catch (e: any) {
        console.warn('[Backup] Telegram send note:', e.message);
      }
    }

    if (!sent) {
      return res.status(502).json({ success: false, message: 'Gagal mengirim backup ke Telegram. Pastikan bot aktif.' });
    }

    try {
      await dbService.addSystemLog({ admin_id: 'web_admin', action: 'manual_db_backup_telegram' });
    } catch (e) {}

    res.json({ success: true, message: 'Backup database berhasil dikirim ke chat Telegram admin.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 1.5 Multi-Database Status & Cloud Storage Monitor
app.get('/api/db/status', async (req, res) => {
  try {
    const multiStatus = await getMultiDbStatus();

    // Check collections/tables counts
    const [prods, orders, stocks, admins] = await Promise.all([
      dbService.getProducts().catch(() => []),
      dbService.getOrders().catch(() => []),
      dbService.getStocks().catch(() => []),
      dbService.getAdmins().catch(() => [])
    ]);

    res.json({
      success: true,
      data: {
        active_database: multiStatus.active_database,
        databases: multiStatus.databases,
        supabase: multiStatus.databases.supabase,
        firestore: multiStatus.databases.firestore,
        redis: multiStatus.databases.redis,
        mysql: multiStatus.databases.mysql,
        mongodb: multiStatus.databases.mongodb,
        local: multiStatus.databases.local,
        counts: {
          products: prods.length,
          orders: orders.length,
          stocks: stocks.length,
          admins: admins.length
        }
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 1.6 1-Click Auto-Create Tables in Supabase (No Manual SQL Migration Needed)
app.post('/api/db/init-tables', async (req, res) => {
  try {
    const engine = (req.body?.engine || req.query?.engine || 'supabase') as string;
    console.log(`[API] 1-Click Auto Table Creation requested for engine: ${engine}`);
    await dbService.ensureSeeded();
    const tableInitResult = await ensureTablesForEngine(engine);

    res.json({
      success: tableInitResult.success !== false,
      message: tableInitResult.message || 'Tabel database berhasil dibuat dan disiapkan secara otomatis!',
      details: tableInitResult,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 1.65 Universal Migration: migrate/sync to ANY registered database engine.
// Body: { engine: 'supabase' | 'mysql' | 'mongodb' | 'firestore' | 'local' }
app.post('/api/db/migrate', async (req, res) => {
  try {
    const engine = (req.body?.engine || req.query?.engine || 'supabase') as string;
    console.log(`[API] Universal migration requested for engine: ${engine}`);
    const result = await migrateToEngine(dbService, engine);
    try {
      await dbService.addSystemLog({ admin_id: 'web_admin', action: `migrate_engine ${engine}`, ip_address: req.ip });
    } catch (e) {}
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 1.7 1-Click Full Data Migration to Supabase
app.post('/api/db/migrate-supabase', async (req, res) => {
  try {
    console.log('[API] 1-Click Full Data Migration to Supabase requested...');
    const result = await migrateAllDataToSupabase(dbService);
    res.json({
      success: true,
      message: 'Migrasi seluruh data (produk, stok, pesanan, settings, dompet, bot) ke Supabase sukses!',
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/db/schema-sql', (req, res) => {
  try {
    const schemaPath = path.join(process.cwd(), 'supabase_schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sqlContent = fs.readFileSync(schemaPath, 'utf8');
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.send(sqlContent);
    }
    res.status(404).json({ success: false, message: 'supabase_schema.sql not found' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 1.8 Full JSON Data Export / Backup
app.get('/api/db/export-backup', async (req, res) => {
  try {
    await dbService.ensureSeeded();
    const [products, orders, stocks, settings, wallets, botTokens, admins, users] = await Promise.all([
      dbService.getProducts().catch(() => []),
      dbService.getOrders().catch(() => []),
      dbService.getStocks().catch(() => []),
      dbService.getSettings().catch(() => ({})),
      ((dbService as any).getWallets ? (dbService as any).getWallets() : (dbService as any).getCryptoWallets()).catch(() => []),
      dbService.getBotTokens().catch(() => []),
      dbService.getAdmins().catch(() => []),
      dbService.getUsers().catch(() => [])
    ]);

    const backupData = {
      exported_at: new Date().toISOString(),
      version: '2.5',
      counts: {
        products: products.length,
        orders: orders.length,
        stocks: stocks.length,
        wallets: wallets.length,
        bot_tokens: botTokens.length,
        admins: admins.length,
        users: users.length
      },
      data: {
        products,
        orders,
        stocks,
        settings,
        wallets,
        bot_tokens: botTokens,
        admins: admins.map((a: any) => ({ ...a, password_hash: '***MASKED***' })),
        users
      }
    };

    res.setHeader('Content-Disposition', `attachment; filename="commerce_backup_${Date.now()}.json"`);
    res.setHeader('Content-Type', 'application/json');
    res.json(backupData);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 1.9 Test Connection to Individual Engine
app.get('/api/db/test/:engine', async (req, res) => {
  const engine = req.params.engine.toLowerCase();
  try {
    if (engine === 'supabase') {
      const status = await testSupabaseConnection();
      return res.json({ success: status.connected, details: status });
    }
    if (engine === 'firestore') {
      await dbService.ensureSeeded();
      return res.json({ success: true, message: 'Google Cloud Firestore aktif dan tersinkronisasi normal.' });
    }
    if (engine === 'local') {
      const localPath = path.join(process.cwd(), 'data', 'local_store.json');
      const exists = fs.existsSync(localPath);
      return res.json({ success: true, message: `Local JSON Store aktif (${exists ? 'Data file ada' : 'Siap ditulis'}).` });
    }
    if (engine === 'redis') {
      const redisUrl = process.env.REDIS_URL;
      return res.json({
        success: Boolean(redisUrl),
        message: redisUrl ? 'REDIS_URL terkonfigurasi di environment.' : 'REDIS_URL belum diisi (fallback aman ke in-memory cache).'
      });
    }
    if (engine === 'mysql') {
      const mysqlUrl = process.env.MYSQL_URL || process.env.MYSQL_DATABASE_URL;
      if (!mysqlUrl) {
        return res.json({ success: false, message: 'MYSQL_URL belum diisi (mode standby).' });
      }
      try {
        const mysql: any = await import('mysql2/promise');
        const conn = await mysql.createConnection(mysqlUrl);
        await conn.query('SELECT 1');
        await conn.end();
        return res.json({ success: true, message: 'Koneksi MySQL berhasil & aktif.' });
      } catch (e: any) {
        return res.json({ success: false, message: 'Gagal konek MySQL: ' + e.message });
      }
    }
    if (engine === 'mongodb') {
      const mongoUri = process.env.MONGODB_URI;
      if (!mongoUri) {
        return res.json({ success: false, message: 'MONGODB_URI belum diisi (mode standby).' });
      }
      try {
        const mongodb: any = await import('mongodb');
        const client = new mongodb.MongoClient(mongoUri, { serverSelectionTimeoutMS: 5000 });
        await client.connect();
        await client.db().command({ ping: 1 });
        await client.close();
        return res.json({ success: true, message: 'Koneksi MongoDB berhasil & aktif.' });
      } catch (e: any) {
        return res.json({ success: false, message: 'Gagal konek MongoDB: ' + e.message });
      }
    }
    return res.status(400).json({ success: false, message: 'Engine database tidak dikenal.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. Authentication:
// Zero-fail login support with strict security lock once permanent database is initialized
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    // Step 1: Detect if database already has customized admin credentials
    // If active database has custom admin password, automatically lock default fallback credentials!
    try {
      const admins = await dbService.getAdmins();
      if (admins && admins.length > 0) {
        const hasCustomCredentials = admins.some(a => a.password_hash && a.password_hash !== 'kuda2017');
        if (hasCustomCredentials) {
          lockFallbackLogin(true);
        }
      }
    } catch (dbCheckErr: any) {
      // Database is offline/not reachable, fallback remains open
    }

    // Step 2: Check ENV / fallback credentials (Zero DB dependency)
    const envAdmin = verifyEnvAdminLogin(username, password);
    if (envAdmin) {
      return res.json({
        success: true,
        user: {
          admin_id: envAdmin.admin_id,
          username: envAdmin.username,
          role: envAdmin.role,
          is_fallback: envAdmin.is_fallback ?? false,
          token: `session_${Date.now()}_${envAdmin.admin_id}`
        }
      });
    }

    // Step 3: Verify against database if available
    try {
      await dbService.ensureSeeded();
      const admin = await dbService.verifyAdminLogin(username, password);

      if (admin) {
        // Successful permanent DB login locks fallback
        lockFallbackLogin(true);
        return res.json({
          success: true,
          user: {
            admin_id: admin.admin_id,
            username: admin.username,
            role: admin.role,
            is_fallback: false,
            token: `session_${Date.now()}_${admin.admin_id}`
          }
        });
      }
    } catch (dbErr: any) {
      console.warn('[Auth DB notice]:', dbErr.message);
    }

    return res.status(401).json({
      success: false,
      message: 'Username atau password yang Anda masukkan salah.'
    });
  } catch (err: any) {
    // Absolute last-resort guard: login must never crash the request.
    // If anything unexpected happens, still attempt the zero-DB fallback.
    try {
      const fallback = verifyEnvAdminLogin(req.body?.username, req.body?.password);
      if (fallback) {
        return res.json({
          success: true,
          user: {
            admin_id: fallback.admin_id,
            username: fallback.username,
            role: fallback.role,
            is_fallback: fallback.is_fallback ?? false,
            token: `session_${Date.now()}_${fallback.admin_id}`
          }
        });
      }
    } catch (innerErr) {}
    res.status(200).json({ success: false, message: 'Login gagal diproses. Silakan coba lagi.' });
  }
});

// 2.1 Auth Status: reports whether the default fallback login is still usable
app.get('/api/auth/status', async (req, res) => {
  try {
    let fallbackLocked = isFallbackLocked();
    if (!fallbackLocked) {
      try {
        const admins = await dbService.getAdmins();
        if (admins && admins.length > 0 && admins.some(a => a.password_hash && a.password_hash !== 'kuda2017')) {
          lockFallbackLogin(true);
          fallbackLocked = true;
        }
      } catch (e) {}
    }
    const authStatusPayload = { success: true, fallback_locked: fallbackLocked };
    res.json(authStatusPayload);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2.2 Change Admin Password: permanently locks the default fallback credentials
app.post('/api/auth/change-password', async (req, res) => {
  try {
    const { username, new_password, current_password } = req.body || {};
    if (!new_password || String(new_password).trim().length < 4) {
      return res.status(400).json({ success: false, message: 'Password baru minimal 4 karakter.' });
    }

    // Verify the requester knows the current credential before rotating it
    const verified = verifyEnvAdminLogin(username || 'admin', current_password);
    if (!verified) {
      return res.status(401).json({ success: false, message: 'Password saat ini tidak valid.' });
    }

    savePermanentAdminPassword(username || 'admin', new_password);
    lockFallbackLogin(true);

    // Best-effort sync to the active database
    try {
      await dbService.addAdmin({
        username: username || 'admin',
        password_hash: String(new_password).trim(),
        role: 'superadmin'
      });
    } catch (e) {}

    try {
      await dbService.addSystemLog({
        admin_id: verified.admin_id,
        action: 'change_admin_password',
        ip_address: req.ip
      });
    } catch (e) {}

    res.json({
      success: true,
      message: 'Password admin berhasil diperbarui. Login fallback default kini terkunci.'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3. Overall Store Statistics
app.get('/api/stats', async (req, res) => {
  try {
    await dbService.ensureSeeded();
    const [orders, products, stocks, botTokens, users] = await Promise.all([
      dbService.getOrders(),
      dbService.getProducts(),
      dbService.getStocks(),
      dbService.getBotTokens(),
      dbService.getUsers()
    ]);

    const totalRevenueUsd = orders
      .filter((o: any) => o.payment_status === 'PAID' || o.payment_status === 'VERIFIED_BY_ADMIN')
      .reduce((sum: number, o: any) => sum + (Number(o.amount) || 0), 0);

    const availableStocks = stocks.filter((s: any) => s.status === 'AVAILABLE').length;
    const soldStocks = stocks.filter((s: any) => s.status === 'SOLD').length;
    const pendingOrders = orders.filter((o: any) => o.payment_status === 'PENDING').length;
    const completedOrders = orders.filter((o: any) => o.payment_status === 'PAID' || o.payment_status === 'VERIFIED_BY_ADMIN').length;

    let onlineBotsCount = 0;
    activeBots.forEach((b: any) => {
      if (b.status === 'online') onlineBotsCount++;
    });

    res.json({
      success: true,
      data: {
        totalRevenueUsd,
        totalOrders: orders.length,
        pendingOrders,
        completedOrders,
        totalProducts: products.length,
        availableStocks,
        soldStocks,
        totalBotsConfigured: botTokens.length,
        activeBotsOnline: onlineBotsCount,
        totalTelegramUsers: users.length
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. Products Management
app.get('/api/products', async (req, res) => {
  try {
    const products = await dbService.getProducts();
    const stocks = await dbService.getStocks();

    // Attach current available stock count to each product
    const enriched = products.map((p: any) => {
      const pStocks = stocks.filter((s: any) => s.product_id === p.product_id && s.status === 'AVAILABLE');
      return {
        ...p,
        available_stocks: pStocks.length
      };
    });
    res.json({ success: true, data: enriched });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const product = req.body;
    if (!product.title || product.price_usd === undefined) {
      return res.status(400).json({ success: false, message: 'Title and price_usd are required' });
    }
    const productId = await dbService.saveProduct(product);
    res.json({ success: true, product_id: productId });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    await dbService.deleteProduct(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 5. Stocks Inventory (Email:Password:Cookie)
app.get('/api/stocks', async (req, res) => {
  try {
    const productId = req.query.product_id ? String(req.query.product_id) : null;
    const stocks = await dbService.getStocks(productId);
    res.json({ success: true, data: stocks });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/stocks', async (req, res) => {
  try {
    const { product_id, account_data } = req.body;
    if (!product_id || !account_data) {
      return res.status(400).json({ success: false, message: 'product_id and account_data are required' });
    }
    const stock = await dbService.addStockItem(product_id, account_data);
    res.json({ success: true, data: stock });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/stocks/bulk', async (req, res) => {
  try {
    const { product_id, accounts_text } = req.body;
    if (!product_id || !accounts_text) {
      return res.status(400).json({ success: false, message: 'product_id and accounts_text are required' });
    }

    const lines = accounts_text.split('\n').map((l: string) => l.trim()).filter(Boolean);
    const added = [];
    for (const line of lines) {
      const item = await dbService.addStockItem(product_id, line);
      added.push(item);
    }

    res.json({ success: true, added_count: added.length });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/stocks/:id', async (req, res) => {
  try {
    await dbService.deleteStockItem(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Helper to extract file_id from order
function extractFileIdFromOrder(order: any): string | null {
  if (!order) return null;
  if (order.receipt_file_id) return order.receipt_file_id;
  const match = (order.tx_hash || '').match(/(?:\[(?:Bukti Gambar ID|Photo):\s*([a-zA-Z0-9_\-]+)\])/i);
  if (match) return match[1];
  if (order.tx_hash && (order.tx_hash.startsWith('AgAC') || order.tx_hash.startsWith('BAAC'))) {
    return order.tx_hash.trim();
  }
  return null;
}

// Helper to get Telegram file link
async function getTelegramFileDirectUrl(fileId: string): Promise<string | null> {
  if (!fileId) return null;
  // Try active bots
  for (const botInstance of (activeBots as any).values()) {
    try {
      if (botInstance.bot && botInstance.bot.telegram) {
        const link = await botInstance.bot.telegram.getFileLink(fileId);
        if (link) return link.href || link.toString();
      }
    } catch (e: any) {}
  }

  // Fallback: lookup bot tokens directly from Firestore
  try {
    const tokens = await dbService.getBotTokens();
    for (const t of tokens) {
      const tok = t.bot_token || t.token;
      if (tok) {
        try {
          const res = await fetch(`https://api.telegram.org/bot${tok}/getFile?file_id=${fileId}`);
          const data: any = await res.json();
          if (data.ok && data.result?.file_path) {
            return `https://api.telegram.org/file/bot${tok}/${data.result.file_path}`;
          }
        } catch (e: any) {}
      }
    }
  } catch (e: any) {}

  return null;
}

// Shared helper: stream a remote (Telegram or external) file straight to the
// HTTP response, avoiding duplicated fetch/buffer/header logic across endpoints.
async function streamRemoteFile(
  fileUrl: string,
  res: express.Response,
  options: { defaultContentType?: string; notFoundMessage?: string; downloadErrorMessage?: string } = {}
) {
  const {
    defaultContentType = 'image/jpeg',
    notFoundMessage = 'File tidak ditemukan',
    downloadErrorMessage = 'Gagal mengunduh file.'
  } = options;

  if (!fileUrl) {
    return res.status(404).send(notFoundMessage);
  }

  const remoteResponse = await fetch(fileUrl);
  if (!remoteResponse.ok) {
    return res.status(502).send(downloadErrorMessage);
  }

  const contentType = remoteResponse.headers.get('content-type') || defaultContentType;
  res.setHeader('Content-Type', contentType);
  res.setHeader('Cache-Control', 'public, max-age=86400');
  const buffer = Buffer.from(await remoteResponse.arrayBuffer());
  return res.send(buffer);
}

// Shared coupon evaluator used by both the API and the Telegram bot checkout.
function evaluateCoupon(coupon: any, baseAmount: number): {
  success: boolean;
  valid: boolean;
  message: string;
  code?: string;
  discount_amount?: number;
  final_amount?: number;
} {
  if (!coupon) {
    return { success: true, valid: false, message: 'Kode kupon tidak ditemukan atau tidak valid.' };
  }
  if (coupon.is_active === false) {
    return { success: true, valid: false, message: 'Kode kupon ini sedang tidak aktif.' };
  }
  const maxUses = Number(coupon.max_uses) || 0;
  const usedCount = Number(coupon.used_count) || 0;
  if (maxUses > 0 && usedCount >= maxUses) {
    return { success: true, valid: false, message: 'Kode kupon sudah mencapai batas pemakaian.' };
  }

  const pct = Number(coupon.discount_percentage) || 0;
  const fixed = Number(coupon.fixed_discount) || 0;
  const discountAmount = Math.round((baseAmount * pct) / 100 + fixed);
  const finalAmount = Math.max(0, baseAmount - discountAmount);

  return {
    success: true,
    valid: true,
    code: coupon.code,
    discount_amount: discountAmount,
    final_amount: finalAmount,
    message: `Kupon ${coupon.code} berhasil diterapkan! Potongan Rp ${discountAmount.toLocaleString('id-ID')}.`
  };
}

// Shared service: resolve a product, verify stock, then build & persist an order
// for either manual crypto or automatic NOWPayments settlement. Returns a small
// result object so callers can serialize it their own way (HTTP or simulation).
type CreateOrderResult =
  | { kind: 'error'; ok: false; status: number; message: string }
  | { kind: 'invoice'; ok: true; type: 'invoice'; order: any; order_id: string; qr_url: string; token_url: string; instructions?: string };

async function createOrderFromProduct(params: {
  productId: string;
  userId: string;
  username: string;
  lang: string;
  paymentMethod?: string;
  walletId?: string;
  currency?: string;
}): Promise<CreateOrderResult> {
  const { productId, userId, username, lang, paymentMethod, walletId, currency } = params;

  const stockCount = await dbService.getAvailableStockCount(productId);
  if (stockCount <= 0) {
    return { kind: 'error', ok: false, status: 400, message: getUI('out_of_stock_alert', lang) };
  }

  let rawProduct = await dbService.getProduct(productId);
  if (!rawProduct) {
    const allProds = await dbService.getProducts();
    rawProduct = allProds?.find((p: any) => p.product_id === productId || p.id === productId) || null;
  }
  if (!rawProduct) {
    return { kind: 'error', ok: false, status: 404, message: 'Product not found' };
  }
  const product = getLocalizedProduct(rawProduct, lang);

  if (paymentMethod === 'crypto_manual') {
    let wallet: any = null;
    if (walletId) {
      wallet = await dbService.getCryptoWallet(walletId);
    }
    if (!wallet) {
      const wallets = await dbService.getActiveCryptoWallets();
      if (wallets && wallets.length > 0) {
        wallet = wallets.find((w: any) => w.wallet_id === walletId || w.id === walletId) || wallets[0];
      }
    }
    if (!wallet) {
      return { kind: 'error', ok: false, status: 400, message: 'Belum ada dompet kripto manual yang dikonfigurasi admin.' };
    }

    const orderId = `ORD-MAN-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const qrUrl = wallet.qr_url || getQrCodeUrl(wallet.address, 300);

    const orderDoc = {
      order_id: orderId,
      user_id: userId,
      username,
      user_lang: lang,
      product_id: productId,
      product_title: product.title,
      payment_method: 'crypto_manual',
      payment_gateway: 'Manual',
      payment_status: 'PENDING',
      crypto_address: wallet.address,
      crypto_network: wallet.network,
      amount: product.price_usd,
      currency: wallet.currency || currency || 'USD',
      account_delivered: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await dbService.createOrder(orderDoc);
    notifyAdminNewOrder(orderDoc).catch(() => {});
    return {
      kind: 'invoice',
      ok: true,
      type: 'invoice',
      order: orderDoc,
      order_id: orderId,
      qr_url: qrUrl,
      token_url: qrUrl,
      instructions: getUI('payment_pending_notice', lang)
    };
  }

  // Automatic Payment (NOWPayments)
  // HARD GUARD: never create an automatic-crypto order when the gateway is not
  // connected — this prevents fake/unpayable orders in the database.
  if (typeof (cryptoGateway as any).isConfigured === 'function' && !(cryptoGateway as any).isConfigured()) {
    return { kind: 'error', ok: false, status: 503, message: 'Pembayaran otomatis kripto belum aktif (gateway belum terhubung). Silakan gunakan metode Bayar Manual.' };
  }

  const orderId = `ORD-AUTO-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

  const payRes = await cryptoGateway.createPayment({
    orderId,
    priceAmountUsd: product.price_usd,
    payCurrency: (currency || 'usdttrc20').toLowerCase(),
    orderDescription: product.title,
    callbackUrl: ''
  });

  if (!payRes.success || !payRes.payAddress) {
    return { kind: 'error', ok: false, status: 502, message: payRes.error || 'Gateway pembayaran otomatis gagal membuat invoice.' };
  }

  const depositAddr = payRes.payAddress;
  const qrUrl = getQrCodeUrl(depositAddr, 300);
  const tokenUrl = payRes.paymentUrl || getTokenExplorerUrl('USDT (TRC-20)', depositAddr);

  const orderDoc = {
    order_id: orderId,
    user_id: userId,
    username,
    user_lang: lang,
    product_id: productId,
    product_title: product.title,
    payment_method: 'crypto_auto',
    payment_gateway: 'NOWPayments',
    payment_status: 'PENDING',
    crypto_address: depositAddr,
    crypto_network: 'USDT (TRC-20)',
    amount: product.price_usd,
    currency: 'USDT',
    payment_id: payRes.paymentId || 'sim_pay_123',
    account_delivered: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  await dbService.createOrder(orderDoc);
  notifyAdminNewOrder(orderDoc).catch(() => {});
  return { kind: 'invoice', ok: true, type: 'invoice', order: orderDoc, order_id: orderId, qr_url: qrUrl, token_url: tokenUrl };
}

function enrichOrderReceipt(order: any) {
  if (!order) return order;
  const fileId = extractFileIdFromOrder(order);
  let cleanTxHash = order.tx_hash || '';
  if (cleanTxHash.includes('[Bukti Gambar ID:') || cleanTxHash.includes('[Photo:')) {
    cleanTxHash = cleanTxHash.replace(/\[(?:Bukti Gambar ID|Photo):\s*[a-zA-Z0-9_\-]+\]/g, 'Foto Bukti Transfer').trim();
    if (!cleanTxHash) cleanTxHash = 'Foto Bukti Transfer';
  }
  const lang = order.user_lang || 'id';
  return {
    ...order,
    tx_hash: cleanTxHash || order.tx_hash,
    payment_status_localized: getLocalizedPaymentStatus(order.payment_status, lang),
    payment_method_localized: getLocalizedPaymentMethod(order.payment_method, lang),
    formatted_receipt: formatLocalizedOrderReceipt(order, lang),
    receipt_file_id: fileId || order.receipt_file_id || null,
    receipt_image_url: fileId
      ? `/api/orders/${order.order_id}/receipt-image`
      : (order.receipt_image_url || null)
  };
}

// 6. Orders Management & Manual Verification
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await dbService.getOrders();
    const enriched = orders.map(enrichOrderReceipt);
    res.json({ success: true, data: enriched });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/orders/:id', async (req, res) => {
  try {
    const order = await dbService.getOrder(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, data: enrichOrderReceipt(order) });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Endpoint to stream the pure receipt image directly
app.get('/api/orders/:id/receipt-image', async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await dbService.getOrder(orderId);
    if (!order) {
      return res.status(404).send('Pesanan tidak ditemukan');
    }

    const fileId = extractFileIdFromOrder(order);

    // If order already has a direct external url, stream it straight through.
    if (!fileId && order.receipt_image_url && order.receipt_image_url.startsWith('http')) {
      return streamRemoteFile(order.receipt_image_url, res, {
        notFoundMessage: 'Tidak ada bukti gambar untuk pesanan ini.',
        downloadErrorMessage: 'Gagal mengunduh gambar bukti dari sumber eksternal.'
      });
    }

    if (!fileId) {
      return res.status(404).send('Tidak ada bukti gambar untuk pesanan ini.');
    }

    const fileUrl = await getTelegramFileDirectUrl(fileId);
    if (!fileUrl) {
      return res.status(404).send('Gagal mengambil file gambar dari server Telegram. Pastikan bot aktif.');
    }

    return streamRemoteFile(fileUrl, res, {
      notFoundMessage: 'Tidak ada bukti gambar untuk pesanan ini.',
      downloadErrorMessage: 'Gagal mengunduh gambar dari Telegram.'
    });
  } catch (err: any) {
    console.error('[Receipt Image Error]:', err.message);
    res.status(500).send(`Terjadi kesalahan: ${err.message}`);
  }
});

// Generic endpoint to stream any Telegram file by ID
app.get('/api/telegram-file/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const fileUrl = await getTelegramFileDirectUrl(fileId);
    if (!fileUrl) {
      return res.status(404).send('File tidak ditemukan di Telegram');
    }
    return streamRemoteFile(fileUrl, res, {
      notFoundMessage: 'File tidak ditemukan di Telegram',
      downloadErrorMessage: 'Gagal mengunduh file dari Telegram'
    });
  } catch (err: any) {
    res.status(500).send(err.message);
  }
});

// Direct Checkout Endpoint (for frontend simulator or direct API payment initiation)
app.post('/api/orders/checkout', async (req, res) => {
  try {
    const { user_id, username, product_id, payment_method, wallet_id, currency, user_lang } = req.body;

    const result = await createOrderFromProduct({
      productId: product_id,
      userId: user_id || 'guest_buyer',
      username: username || 'buyer',
      lang: user_lang || 'id',
      paymentMethod: payment_method,
      walletId: wallet_id,
      currency
    });

    if (result.kind === 'error') {
      return res.status(result.status).json({ success: false, message: result.message });
    }

    return res.json({
      success: true,
      type: 'invoice',
      order: result.order,
      order_id: result.order_id,
      instructions: result.instructions,
      qr_url: result.qr_url,
      token_url: result.token_url
    });
  } catch (err: any) {
    console.error('[Checkout API Error]:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/orders/:id/approve', async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await dbService.getOrder(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
    }

    // Atomically claim available stock if not delivered yet
    let deliveredAccount = order.account_delivered;
    if (!deliveredAccount) {
      try {
        const stock: any = await dbService.claimAvailableStock(order.product_id, order.order_id);
        if (stock && stock.account_data) {
          deliveredAccount = stock.account_data;
        } else {
          deliveredAccount = 'Akun fisik belum tersedia di stok. Admin dapat melampirkan akun manual.';
        }
      } catch (stockErr: any) {
        console.warn('Stock claim fallback:', stockErr.message);
        deliveredAccount = 'Akun siap dikirim manual oleh admin.';
      }
    }

    await dbService.updateOrder(orderId, {
      payment_status: 'VERIFIED_BY_ADMIN',
      account_delivered: deliveredAccount,
      updated_at: new Date().toISOString()
    });

    // Notify buyer directly on Telegram if bot is running
    sendTelegramDeliveryNotice({ ...order, order_id: orderId }, deliveredAccount).catch(() => {});

    const updated = await dbService.getOrder(orderId);
    res.json({ success: true, order_id: orderId, order: updated || order, account_delivered: deliveredAccount });
  } catch (err: any) {
    console.error('Approve order error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Cancel Order: Sets status to CANCELLED, releases any reserved stock back to AVAILABLE, and notifies customer
app.post('/api/orders/:id/cancel', async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await dbService.getOrder(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
    }

    // Release any allocated stock item so it is available for other buyers
    try {
      await dbService.releaseClaimedStock(order.order_id);
    } catch (e: any) {
      console.warn('releaseClaimedStock error:', e.message);
    }

    await dbService.updateOrder(orderId, {
      payment_status: 'CANCELLED',
      updated_at: new Date().toISOString()
    });

    // Notify customer on Telegram if available
    sendTelegramCancellationNotice(order, req.body?.reason).catch(() => {});

    const updated = await dbService.getOrder(orderId);
    res.json({ success: true, order_id: orderId, order: updated || order, status: 'CANCELLED' });
  } catch (err: any) {
    console.error('Cancel order error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Reject Order: aliases to cancel, or permanently deletes if action=delete
app.post('/api/orders/:id/reject', async (req, res) => {
  try {
    const orderId = req.params.id;
    const action = req.body?.action || req.query?.action;

    if (action === 'delete') {
      await dbService.deleteOrder(orderId);
      return res.json({ success: true, order_id: orderId, deleted: true, status: 'DELETED' });
    }

    // Default to cancelling order cleanly
    const order = await dbService.getOrder(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
    }

    // Release any allocated stock so it becomes available again. Never let a
    // release failure block the rejection itself.
    try {
      await dbService.releaseClaimedStock(order.order_id);
    } catch (releaseErr: any) {
      console.warn('releaseClaimedStock error:', releaseErr.message);
    }

    await dbService.updateOrder(orderId, {
      payment_status: 'CANCELLED',
      rejection_reason: req.body?.reason || req.query?.reason || null,
      updated_at: new Date().toISOString()
    });
    sendTelegramCancellationNotice(order, req.body?.reason || req.query?.reason).catch(() => {});

    res.json({ success: true, order_id: orderId, status: 'CANCELLED' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Reset single completed or cancelled order back to PENDING
app.post('/api/orders/:id/reset', async (req, res) => {
  try {
    const orderId = req.params.id;
    const resetOrder = await dbService.resetOrder(orderId);
    res.json({ 
      success: true, 
      order_id: orderId, 
      order: resetOrder, 
      status: 'PENDING',
      message: 'Pesanan berhasil di-reset ke status Pending.' 
    });
  } catch (err: any) {
    console.error('Reset order error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Bulk reset completed orders (to PENDING or clear/purge)
app.post('/api/orders/reset-completed', async (req, res) => {
  try {
    const mode = req.body?.mode || 'to_pending'; // 'to_pending' | 'purge'
    const count = await dbService.resetCompletedOrders(mode);
    res.json({ 
      success: true, 
      count, 
      mode, 
      message: `Berhasil mereset ${count} pesanan selesai.` 
    });
  } catch (err: any) {
    console.error('Reset completed orders error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Full Backup of Orders (JSON or CSV)
app.get('/api/orders/backup', async (req, res) => {
  try {
    const orders = await dbService.getOrders();
    const format = String(req.query.format || 'json').toLowerCase();
    const download = req.query.download === 'true';

    if (format === 'csv') {
      const headers = [
        'Order ID',
        'User ID',
        'Username',
        'Language',
        'Product ID',
        'Product Title',
        'Amount',
        'Currency',
        'Payment Method',
        'Payment Status',
        'Crypto Network',
        'Crypto Address',
        'TX Hash',
        'Account Delivered',
        'Created At',
        'Updated At'
      ];

      const rows = orders.map((o: any) => [
        o.order_id || '',
        o.user_id || '',
        o.username || '',
        o.user_lang || 'id',
        o.product_id || '',
        `"${(o.product_title || '').replace(/"/g, '""')}"`,
        o.amount || 0,
        o.currency || 'USD',
        o.payment_method || '',
        o.payment_status || '',
        o.crypto_network || '',
        o.crypto_address || '',
        o.tx_hash || '',
        `"${(o.account_delivered || '').replace(/"/g, '""')}"`,
        o.created_at || '',
        o.updated_at || ''
      ]);

      const csvContent = [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');

      if (download) {
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="orders_backup_${Date.now()}.csv"`);
      } else {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      }
      return res.send(csvContent);
    }

    if (download) {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="orders_backup_${Date.now()}.json"`);
    }
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      total_orders: orders.length,
      data: orders
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/orders/:id', async (req, res) => {
  try {
    const orderId = req.params.id;
    await dbService.deleteOrder(orderId);
    res.json({ success: true, order_id: orderId, deleted: true });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/orders/purge-cancelled', async (req, res) => {
  try {
    const purgedCount = await dbService.purgeCancelledOrders();
    res.json({ success: true, purged_count: purgedCount });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 7. Crypto Wallets CRUD
app.get('/api/wallets', async (req, res) => {
  try {
    const wallets = await dbService.getCryptoWallets();
    res.json({ success: true, data: wallets });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/wallets', async (req, res) => {
  try {
    const wallet = req.body;
    if (!wallet.network || !wallet.address) {
      return res.status(400).json({ success: false, message: 'Network and address are required' });
    }
    const walletId = await dbService.saveCryptoWallet({
      ...wallet,
      qr_url: wallet.qr_url || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(wallet.address)}`,
      is_active: wallet.is_active ?? true
    });
    res.json({ success: true, wallet_id: walletId });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/wallets/:id', async (req, res) => {
  try {
    await dbService.deleteCryptoWallet(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 7b. Payment Methods Management (QRIS, E-Wallet, Bank, Crypto)
app.get('/api/payment-methods', async (req, res) => {
  try {
    const methods = await dbService.getPaymentMethods();
    res.json({ success: true, data: methods });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/payment-methods', async (req, res) => {
  try {
    const methodData = req.body;
    if (!methodData.name) {
      return res.status(400).json({ success: false, message: 'Nama metode wajib diisi' });
    }
    const methodId = methodData.method_id || `pm_${Date.now()}`;
    const newMethod = {
      method_id: methodId,
      name: methodData.name,
      type: methodData.type || 'qris',
      account_number: methodData.account_number || '',
      account_name: methodData.account_name || '',
      qr_image_url: methodData.qr_image_url || '',
      instructions: methodData.instructions || '',
      scope: methodData.scope || 'ALL',
      is_active: methodData.is_active !== undefined ? methodData.is_active : true,
      created_at: methodData.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    await dbService.savePaymentMethod(newMethod);
    res.json({ success: true, data: newMethod });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/payment-methods/:id', async (req, res) => {
  try {
    const methodId = req.params.id;
    const updateData = {
      ...req.body,
      method_id: methodId,
      updated_at: new Date().toISOString()
    };
    await dbService.savePaymentMethod(updateData);
    res.json({ success: true, data: updateData });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.patch('/api/payment-methods/:id/toggle', async (req, res) => {
  try {
    const methodId = req.params.id;
    const methods = await dbService.getPaymentMethods();
    const existing = methods.find((m: any) => m.method_id === methodId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Metode pembayaran tidak ditemukan' });
    }
    existing.is_active = !existing.is_active;
    existing.updated_at = new Date().toISOString();
    await dbService.savePaymentMethod(existing);
    res.json({ success: true, data: existing });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/payment-methods/:id', async (req, res) => {
  try {
    await dbService.deletePaymentMethod(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 7b2. Coupons Management (Dynamic Discount Codes)
app.get('/api/coupons', async (req, res) => {
  try {
    const coupons = await dbService.getCoupons();
    res.json({ success: true, data: coupons });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/coupons', async (req, res) => {
  try {
    const { code } = req.body || {};
    if (!code || !String(code).trim()) {
      return res.status(400).json({ success: false, message: 'Kode kupon wajib diisi' });
    }
    const saved = await dbService.saveCoupon(req.body);
    res.json({ success: true, data: saved });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/coupons/:id', async (req, res) => {
  try {
    const saved = await dbService.saveCoupon({ ...req.body, coupon_id: req.params.id });
    res.json({ success: true, data: saved });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.patch('/api/coupons/:id/toggle', async (req, res) => {
  try {
    const coupons = await dbService.getCoupons();
    const existing = coupons.find((c: any) => c.coupon_id === req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Kupon tidak ditemukan' });
    }
    const saved = await dbService.saveCoupon({ ...existing, is_active: !existing.is_active });
    res.json({ success: true, data: saved });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/coupons/:id', async (req, res) => {
  try {
    await dbService.deleteCoupon(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Public coupon validation for the bot / checkout flow
app.post('/api/coupons/validate', async (req, res) => {
  try {
    const { code, amount_idr } = req.body || {};
    const coupon = await dbService.getCouponByCode(code);
    const result = evaluateCoupon(coupon, Number(amount_idr) || 0);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 7c. Channels Management (Official Telegram Channels & Referral Sources)
app.get('/api/channels', async (req, res) => {
  try {
    const channels = await dbService.getChannels();
    res.json({ success: true, data: channels });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/channels', async (req, res) => {
  try {
    const chData = req.body;
    if (!chData.name) {
      return res.status(400).json({ success: false, message: 'Nama channel wajib diisi' });
    }
    const channelId = chData.channel_id || `ch_${Date.now()}`;
    const newChannel = {
      channel_id: channelId,
      name: chData.name,
      username: chData.username ? chData.username.replace('@', '') : '',
      invite_link: chData.invite_link || '',
      description: chData.description || '',
      source_tag: chData.source_tag || channelId,
      is_active: chData.is_active !== undefined ? chData.is_active : true,
      clicks_count: Number(chData.clicks_count) || 0,
      orders_count: Number(chData.orders_count ?? chData.conversions_count) || 0,
      created_at: chData.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    const saved = await dbService.saveChannel(newChannel);
    res.json({ success: true, data: saved });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/channels/:id', async (req, res) => {
  try {
    const channelId = req.params.id;
    const updateData = {
      ...req.body,
      channel_id: channelId,
      username: req.body.username ? req.body.username.replace('@', '') : '',
      source_tag: req.body.source_tag || channelId,
      updated_at: new Date().toISOString()
    };
    const saved = await dbService.saveChannel(updateData);
    res.json({ success: true, data: saved });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.patch('/api/channels/:id/toggle', async (req, res) => {
  try {
    const channelId = req.params.id;
    const channels = await dbService.getChannels();
    const existing = channels.find((c: any) => c.channel_id === channelId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Channel tidak ditemukan' });
    }
    existing.is_active = !existing.is_active;
    existing.updated_at = new Date().toISOString();
    await dbService.saveChannel(existing);
    res.json({ success: true, data: existing });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/channels/:id', async (req, res) => {
  try {
    await dbService.deleteChannel(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 8. Bot Tokens & Multi-Bot Polling Manager
app.get('/api/bots', async (req, res) => {
  try {
    const tokens = await dbService.getBotTokens();
    const list = tokens.map((t: any) => {
      const activeInfo = activeBots.get(t.token_id);
      return {
        ...t,
        status: activeInfo ? activeInfo.status : (t.status || 'stopped'),
        is_running: activeInfo?.status === 'online'
      };
    });
    res.json({ success: true, data: list });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/bots', async (req, res) => {
  try {
    const { bot_token, bot_name, auto_start } = req.body;
    if (!bot_token) {
      return res.status(400).json({ success: false, message: 'bot_token is required' });
    }

    const tokenId = `bot_${Date.now()}`;
    const tokenRecord = {
      token_id: tokenId,
      bot_token: bot_token.trim(),
      bot_name: bot_name || 'Telegram Bot',
      is_active: true,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    await dbService.saveBotToken(tokenRecord);

    if (auto_start) {
      await launchSingleBot(tokenRecord, dbService);
    }

    res.json({ success: true, data: tokenRecord });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/bots/:id/launch', async (req, res) => {
  try {
    const tokenId = req.params.id;
    const tokens = await dbService.getBotTokens();
    const tokenRecord = tokens.find((t: any) => t.token_id === tokenId);
    if (!tokenRecord) {
      return res.status(404).json({ success: false, message: 'Bot token not found' });
    }

    await dbService.updateBotToken(tokenId, { is_active: true });
    tokenRecord.is_active = true;
    const result = await launchSingleBot(tokenRecord, dbService);

    res.json({ success: result.success, status: result.status, error: result.error });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/bots/:id/stop', async (req, res) => {
  try {
    const tokenId = req.params.id;
    stopSingleBot(tokenId);
    await dbService.updateBotToken(tokenId, { is_active: false, status: 'stopped' });
    res.json({ success: true, status: 'stopped' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/bots/:id', async (req, res) => {
  try {
    const tokenId = req.params.id;
    stopSingleBot(tokenId);
    await dbService.deleteBotToken(tokenId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 9. Settings Configuration (Text, Audio, NOWPayments API)
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await dbService.getSettings();
    res.json({ success: true, data: settings });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/settings', async (req, res) => {
  try {
    const newSettings = req.body;
    await dbService.updateSettings(newSettings);

    // Update crypto gateway instance with new keys
    if (newSettings.nowpayments_api_key !== undefined) {
      cryptoGateway.setCredentials(
        newSettings.nowpayments_api_key,
        newSettings.nowpayments_ipn_secret || '',
        newSettings.nowpayments_sandbox === true
      );
    }

    res.json({ success: true, data: newSettings });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 9.5 Data Export & Backup (CSV / JSON)
app.get('/api/export/:dataset', async (req, res) => {
  try {
    const { dataset } = req.params;
    const format = (req.query.format as string || 'json').toLowerCase();
    const timestamp = new Date().toISOString().slice(0, 10);

    let data: any = null;
    let filename = `export_${dataset}_${timestamp}`;

    if (dataset === 'orders') {
      data = await dbService.getOrders();
      filename = `orders_backup_${timestamp}`;
    } else if (dataset === 'products') {
      data = await dbService.getProducts();
      filename = `products_backup_${timestamp}`;
    } else if (dataset === 'stocks') {
      data = await dbService.getStocks();
      filename = `stocks_inventory_backup_${timestamp}`;
    } else if (dataset === 'all') {
      const [orders, products, stocks, wallets, settings] = await Promise.all([
        dbService.getOrders(),
        dbService.getProducts(),
        dbService.getStocks(),
        dbService.getActiveCryptoWallets(),
        dbService.getSettings()
      ]);
      data = {
        backup_date: new Date().toISOString(),
        total_orders: orders.length,
        total_products: products.length,
        total_stocks: stocks.length,
        orders,
        products,
        stocks,
        wallets,
        settings
      };
      filename = `store_complete_backup_${timestamp}`;
    } else {
      return res.status(400).json({ success: false, message: 'Invalid dataset. Allowed: orders, products, stocks, all' });
    }

    if (format === 'csv') {
      if (dataset === 'all') {
        return res.status(400).json({ success: false, message: 'Cadangan gabungan (All) hanya didukung dalam format JSON.' });
      }

      const rows = Array.isArray(data) ? data : [];
      if (rows.length === 0) {
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
        return res.send('no_data');
      }

      const headerSet = new Set<string>();
      rows.forEach(item => {
        Object.keys(item).forEach(k => headerSet.add(k));
      });
      const headers = Array.from(headerSet);

      const csvLines = [headers.join(',')];
      for (const row of rows) {
        const line = headers.map(h => {
          let val = row[h];
          if (val === null || val === undefined) return '""';
          if (typeof val === 'object') val = JSON.stringify(val);
          return `"${String(val).replace(/"/g, '""')}"`;
        }).join(',');
        csvLines.push(line);
      }

      const csvString = csvLines.join('\r\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      return res.send(csvString);
    }

    // Default JSON
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
    return res.send(JSON.stringify(data, null, 2));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 10. Admin Management (Root superadmin access)
app.get('/api/admins', async (req, res) => {
  try {
    const admins = await dbService.getAdmins();
    res.json({ success: true, data: admins });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// List known Telegram users (for choosing who may access the bot admin panel)
app.get('/api/telegram-users', async (req, res) => {
  try {
    const users = await dbService.getUsers().catch(() => []);
    const list = (users || []).map((u: any) => ({
      telegram_id: String(u.telegram_id || ''),
      username: u.username || '',
      first_name: u.first_name || '',
      last_name: u.last_name || '',
      last_active: u.last_active || null
    })).filter((u: any) => u.telegram_id);
    res.json({ success: true, data: list });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/admins', async (req, res) => {
  try {
    const requesterRole = (req.headers['x-admin-role'] as string) || req.body.requester_role;
    if (requesterRole !== 'superadmin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Akses ditolak: Hanya Superadmin yang memiliki izin menambah akun administrator.' 
      });
    }

    const { username, password, role, telegram_id } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }
    const adminId = await dbService.addAdmin({
      username,
      password_hash: password,
      role: role || 'admin',
      telegram_id: telegram_id ? String(telegram_id).trim() : null
    });
    try {
      await dbService.addSystemLog({ admin_id: requesterRole, action: `add_admin ${username} telegram_id=${telegram_id || '-'}` });
    } catch (e) {}
    res.json({ success: true, admin_id: adminId });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Link / update the Telegram ID for an admin (controls bot admin panel access)
app.patch('/api/admins/:id/telegram', async (req, res) => {
  try {
    const requesterRole = (req.headers['x-admin-role'] as string) || req.body.requester_role;
    if (requesterRole !== 'superadmin') {
      return res.status(403).json({ success: false, message: 'Akses ditolak: Hanya Superadmin yang dapat mengubah Telegram ID admin.' });
    }
    const { telegram_id } = req.body || {};
    await dbService.updateAdminTelegramId(req.params.id, telegram_id);
    // Also reflect this in the local store so bot auth works even offline.
    try {
      const { setLocalAdminTelegramId } = await import('./multi_db.js');
      setLocalAdminTelegramId(req.params.id, telegram_id);
    } catch (e) {}
    res.json({ success: true, admin_id: req.params.id, telegram_id: telegram_id || null });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/admins/:id', async (req, res) => {
  try {
    const requesterRole = (req.headers['x-admin-role'] as string) || (req.query.requester_role as string);
    if (requesterRole !== 'superadmin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Akses ditolak: Hanya Superadmin yang memiliki izin menghapus akun administrator.' 
      });
    }

    if (req.params.id === 'root_superadmin' || req.params.id === 'root_admin') {
      return res.status(400).json({ success: false, message: 'Akun Superadmin Utama tidak dapat dihapus.' });
    }

    await dbService.deleteAdmin(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 10.5 Multi-Language Translation APIs (Gemini 3.8 Flash + Dictionary Fallback)
app.post('/api/translate/auto', async (req, res) => {
  try {
    const { text, type } = req.body;
    if (!text) return res.status(400).json({ success: false, message: 'Text is required' });

    let translations: Record<string, string> = {};

    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const prompt = `You are a professional multi-lingual translator for a digital store bot.
Translate the following store text into these 10 languages:
id (Indonesian), ms (Malay), zh (Chinese Simplified), ru (Russian), it (Italian), es (Spanish), hi (Hindi), uz (Uzbek), ar (Arabic), en (English).
Preserve all emojis, formatting tags (<b>, <i>, <code>, <pre>), and punctuation.
Respond with ONLY a valid JSON object whose keys are the language codes (id, ms, zh, ru, it, es, hi, uz, ar, en) and values are the translated strings.

Original text:
${text}`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt
        });

        const rawResp = response.text || '';
        const jsonMatch = rawResp.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          translations = JSON.parse(jsonMatch[0]);
        }
      } catch (geminiErr: any) {
        console.warn('[Translate API] Gemini error, using dictionary fallback:', geminiErr.message);
      }
    }

    if (Object.keys(translations).length === 0) {
      if (type === 'welcome') {
        translations = { ...DEFAULT_WELCOME_TEXTS, id: text };
      } else if (type === 'terms') {
        translations = { ...DEFAULT_TERMS_TEXTS, id: text };
      } else if (type === 'payment_guide') {
        translations = { ...DEFAULT_PAYMENT_GUIDES, id: text };
      } else if (type === 'order_guide') {
        translations = { ...DEFAULT_ORDER_GUIDES, id: text };
      } else {
        SUPPORTED_LANGUAGES.forEach(l => {
          translations[l.code] = text;
        });
      }
    }

    res.json({ success: true, translations });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/translate/batch-products', async (req, res) => {
  try {
    const products = await dbService.getProducts();
    const updated: any[] = [];

    let ai: any = null;
    if (process.env.GEMINI_API_KEY) {
      ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }

    for (const prod of products) {
      let productTranslations: Record<string, { title: string; description: string }> = prod.translations || {};

      if (ai) {
        try {
          const prompt = `Translate this product title and description into 10 languages: id, ms, zh, ru, it, es, hi, uz, ar, en.
Title: ${prod.title}
Description: ${prod.description}

Respond ONLY with valid JSON in this exact structure:
{
  "id": { "title": "...", "description": "..." },
  "ms": { "title": "...", "description": "..." },
  "zh": { "title": "...", "description": "..." },
  "ru": { "title": "...", "description": "..." },
  "it": { "title": "...", "description": "..." },
  "es": { "title": "...", "description": "..." },
  "hi": { "title": "...", "description": "..." },
  "uz": { "title": "...", "description": "..." },
  "ar": { "title": "...", "description": "..." },
  "en": { "title": "...", "description": "..." }
}`;
          const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: prompt
          });
          const match = (response.text || '').match(/\{[\s\S]*\}/);
          if (match) {
            productTranslations = JSON.parse(match[0]);
          }
        } catch (e: any) {
          console.warn(`Product ${prod.product_id} translate error:`, e.message);
        }
      }

      if (Object.keys(productTranslations).length === 0) {
        SUPPORTED_LANGUAGES.forEach(l => {
          productTranslations[l.code] = {
            title: prod.title,
            description: prod.description
          };
        });
      }

      await dbService.updateProduct(prod.product_id, {
        translations: productTranslations
      });
      updated.push({ product_id: prod.product_id, title: prod.title });
    }

    res.json({ success: true, updated_count: updated.length, updated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/settings/auto-translate-all', async (req, res) => {
  try {
    const settings = await dbService.getSettings() || {};
    const welcome = settings.welcome_text || DEFAULT_WELCOME_TEXTS['id'];
    const terms = settings.terms_text || DEFAULT_TERMS_TEXTS['id'];
    const paymentGuide = settings.payment_guide_text || DEFAULT_PAYMENT_GUIDES['id'];
    const orderGuide = settings.order_guide_text || DEFAULT_ORDER_GUIDES['id'];

    let welcomeTranslations = settings.welcome_translations || {};
    let termsTranslations = settings.terms_translations || {};
    let paymentGuideTranslations = settings.payment_guide_translations || {};
    let orderGuideTranslations = settings.order_guide_translations || {};

    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const prompt = `Translate all 4 digital store texts into 10 languages: id, ms, zh, ru, it, es, hi, uz, ar, en.
Keep formatting tags (<b>, <i>, <code>, <pre>), emojis, and newlines intact.

Welcome text:
${welcome}

Terms text:
${terms}

Payment guide text:
${paymentGuide}

Order guide text:
${orderGuide}

Respond ONLY with valid JSON in this exact structure:
{
  "welcome": {
    "id": "...", "ms": "...", "zh": "...", "ru": "...", "it": "...", "es": "...", "hi": "...", "uz": "...", "ar": "...", "en": "..."
  },
  "terms": {
    "id": "...", "ms": "...", "zh": "...", "ru": "...", "it": "...", "es": "...", "hi": "...", "uz": "...", "ar": "...", "en": "..."
  },
  "payment_guide": {
    "id": "...", "ms": "...", "zh": "...", "ru": "...", "it": "...", "es": "...", "hi": "...", "uz": "...", "ar": "...", "en": "..."
  },
  "order_guide": {
    "id": "...", "ms": "...", "zh": "...", "ru": "...", "it": "...", "es": "...", "hi": "...", "uz": "...", "ar": "...", "en": "..."
  }
}`;
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt
        });
        const match = (response.text || '').match(/\{[\s\S]*\}/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          if (parsed.welcome) welcomeTranslations = parsed.welcome;
          if (parsed.terms) termsTranslations = parsed.terms;
          if (parsed.payment_guide) paymentGuideTranslations = parsed.payment_guide;
          if (parsed.order_guide) orderGuideTranslations = parsed.order_guide;
        }
      } catch (e: any) {
        console.warn('Auto translate settings error, using fallback:', e.message);
      }
    }

    if (Object.keys(welcomeTranslations).length === 0) {
      welcomeTranslations = { ...DEFAULT_WELCOME_TEXTS, id: welcome };
    }
    if (Object.keys(termsTranslations).length === 0) {
      termsTranslations = { ...DEFAULT_TERMS_TEXTS, id: terms };
    }
    if (Object.keys(paymentGuideTranslations).length === 0) {
      paymentGuideTranslations = { ...DEFAULT_PAYMENT_GUIDES, id: paymentGuide };
    }
    if (Object.keys(orderGuideTranslations).length === 0) {
      orderGuideTranslations = { ...DEFAULT_ORDER_GUIDES, id: orderGuide };
    }

    await dbService.updateSettings({
      welcome_translations: welcomeTranslations,
      terms_translations: termsTranslations,
      payment_guide_translations: paymentGuideTranslations,
      order_guide_translations: orderGuideTranslations
    });

    res.json({ 
      success: true, 
      welcome_translations: welcomeTranslations, 
      terms_translations: termsTranslations,
      payment_guide_translations: paymentGuideTranslations,
      order_guide_translations: orderGuideTranslations
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Helper to verify NOWPayments HMAC signature.
// NOWPayments signs the exact raw request bytes, so we hash the preserved
// rawBody when available and only fall back to a sorted re-serialization
// when the raw buffer was not captured.
function verifyNowPaymentsHmac(payload: any, signature: string, ipnSecret: string, rawBody?: Buffer | string): boolean {
  if (!ipnSecret || !signature) return true;
  try {
    let signedPayload: string | Buffer;
    if (rawBody !== undefined && rawBody !== null && String(rawBody).length > 0) {
      signedPayload = rawBody;
    } else {
      const sortedKeys = Object.keys(payload || {}).sort();
      const sortedObj: any = {};
      for (const key of sortedKeys) {
        sortedObj[key] = payload[key];
      }
      signedPayload = JSON.stringify(sortedObj);
    }
    const hmac = crypto.createHmac('sha512', ipnSecret);
    hmac.update(signedPayload);
    const digest = hmac.digest('hex');
    return digest.toLowerCase() === signature.toLowerCase();
  } catch (e) {
    return false;
  }
}

// 11. NOWPayments IPN Webhook Receiver (Supports both /api/webhook/nowpayments and /api/webhooks/nowpayments)
const handleNowPaymentsWebhook = async (req: express.Request, res: express.Response) => {
  try {
    const signature = (req.headers['x-nowpayments-sig'] || '') as string;
    const body = req.body || {};

    console.log('[NOWPayments Webhook] Received payload:', body);

    const settings = await dbService.getSettings() || {};
    const ipnSecret = settings.nowpayments_ipn_secret || process.env.NOWPAYMENTS_IPN_SECRET || '';

    // Verify HMAC signature if secret is provided
    if (ipnSecret && signature) {
      const isValid = verifyNowPaymentsHmac(body, signature, ipnSecret, (req as any).rawBody);
      if (!isValid) {
        console.warn('[NOWPayments Webhook] Invalid HMAC signature rejected.');
        return res.status(403).json({ success: false, message: 'Invalid IPN signature' });
      }
    }

    // Check payment status from payload ('finished', 'confirmed', 'waiting', etc.)
    const paymentStatus = (body.payment_status || '').toLowerCase();
    const orderId = body.order_id;

    if (orderId && (paymentStatus === 'confirmed' || paymentStatus === 'finished')) {
      const order = await dbService.getOrder(orderId);
      if (order && order.payment_status !== 'PAID' && order.payment_status !== 'FINISHED' && order.payment_status !== 'APPROVED') {
        // Atomic stock claim
        const stock: any = await dbService.claimAvailableStock(order.product_id, order.order_id);
        const delivered = stock && stock.account_data ? stock.account_data : 'Credential delivered via webhook';

        await dbService.updateOrder(orderId, {
          payment_status: 'FINISHED',
          account_delivered: delivered,
          payment_id: String(body.payment_id || order.payment_id || ''),
          pay_amount: body.pay_amount || order.pay_amount,
          actually_paid: body.actually_paid || order.actually_paid,
          outcome_amount: body.outcome_amount,
          pay_currency: body.pay_currency || order.crypto_currency,
          updated_at: new Date().toISOString()
        });
        console.log(`[NOWPayments Webhook] Order ${orderId} marked as FINISHED & stock claimed!`);

        // Send delivery notification to buyer's Telegram chat
        sendTelegramDeliveryNotice({ ...order, order_id: orderId }, delivered).catch(() => {});
      }
    }

    res.status(200).json({ status: 'received', order_id: orderId });
  } catch (err: any) {
    console.error('[NOWPayments Webhook] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

app.post('/api/webhook/nowpayments', handleNowPaymentsWebhook);
app.post('/api/webhooks/nowpayments', handleNowPaymentsWebhook);

// System Maintenance & Cleanup Endpoints
app.post('/api/system/cleanup-cache', async (req, res) => {
  try {
    const result = await cleanSystemCache();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/system/cleanup-cancelled-orders', async (req, res) => {
  try {
    const result = await cleanCancelledOrders(dbService);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Mass Broadcast Engine (rate-limited queue)
app.post('/api/broadcast', async (req, res) => {
  try {
    const { message, delay_ms } = req.body || {};
    if (!message || !String(message).trim()) {
      return res.status(400).json({ success: false, message: 'Isi pesan broadcast tidak boleh kosong.' });
    }
    const result = await runBroadcast(dbService, activeBots, String(message), {
      delayMs: Number(delay_ms) || 1000,
      adminId: req.headers['x-admin-id'] || 'web_admin'
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/broadcast/status', (req, res) => {
  res.json({ success: true, data: getBroadcastStatus() });
});

app.post('/api/broadcast/stop', (req, res) => {
  res.json(stopBroadcast());
});

app.post('/api/db/auto-migrate', async (req, res) => {
  try {
    const result = await autoMigrateUniversalDatabase(dbService);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/database/auto-migrate', async (req, res) => {
  try {
    const result = await autoMigrateUniversalDatabase(dbService);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 12. Telegram Bot Web Simulation Endpoint
// Enables immediate live testing of buyer flow right within the Admin Panel!
// Each simulated action is an isolated handler receiving the shared simulation
// context, so a single action can be read, changed and tested on its own.
type SimulateContext = {
  req: express.Request;
  res: express.Response;
  action: string;
  tgId: string;
  tgUser: string;
  lang: string;
  productId: string;
  orderId: string;
  body: any;
};

type SimulateHandler = (ctx: SimulateContext) => Promise<any>;

async function simStart(ctx: SimulateContext) {
  await dbService.upsertUser({
    telegram_id: ctx.tgId,
    username: ctx.tgUser,
    language: ctx.lang,
    last_active: new Date().toISOString()
  });
  const settings = await dbService.getSettings() || {};
  const welcome = getLocalizedWelcome(settings, ctx.lang);
  return {
    success: true,
    type: 'message',
    text: welcome,
    lang: ctx.lang,
    menu: [
      { id: 'catalog', label: getUI('menu_catalog', ctx.lang) },
      { id: 'orders', label: getUI('menu_orders', ctx.lang) },
      { id: 'payments', label: getUI('menu_payments', ctx.lang) },
      { id: 'help', label: getUI('menu_help', ctx.lang) }
    ]
  };
}

async function simCatalog(ctx: SimulateContext) {
  const products = await dbService.getProducts();
  const enriched = await Promise.all(products.map(async (p: any) => {
    const localized = getLocalizedProduct(p, ctx.lang);
    const stockCount = await dbService.getAvailableStockCount(p.product_id);
    return { ...localized, stocks: stockCount, is_out_of_stock: stockCount <= 0 };
  }));
  return {
    success: true,
    type: 'catalog',
    prompt: getUI('catalog_select_prompt', ctx.lang),
    products: enriched,
    lang: ctx.lang
  };
}

async function simHelp(ctx: SimulateContext) {
  const settings = await dbService.getSettings() || {};
  const terms = getLocalizedTerms(settings, ctx.lang);
  return { success: true, type: 'message', text: terms, lang: ctx.lang };
}

async function simPayments(ctx: SimulateContext) {
  const settings = await dbService.getSettings() || {};
  const paymentGuide = getLocalizedPaymentGuide(settings, ctx.lang);
  return { success: true, type: 'message', text: paymentGuide, lang: ctx.lang };
}

async function simOrders(ctx: SimulateContext) {
  const settings = await dbService.getSettings() || {};
  const orderGuide = getLocalizedOrderGuide(settings, ctx.lang);
  const userOrders = await dbService.getUserOrders(ctx.tgId);
  return { success: true, type: 'orders', text: orderGuide, orders: userOrders, lang: ctx.lang };
}

async function simSubmitTxid(ctx: SimulateContext) {
  const { tx_hash } = ctx.body;
  if (!ctx.orderId || !tx_hash) {
    throw { status: 400, message: 'order_id and tx_hash are required' };
  }
  await dbService.updateOrder(ctx.orderId, { tx_hash, updated_at: new Date().toISOString() });
  return { success: true, message: 'TXID saved successfully' };
}

async function simPayWallet(ctx: SimulateContext) {
  const wId = ctx.body.wallet_id || (ctx.body.wallet && (ctx.body.wallet.wallet_id || ctx.body.wallet.id));
  const pId = ctx.body.product_id || ctx.productId;

  const result = await createOrderFromProduct({
    productId: pId,
    userId: ctx.tgId,
    username: ctx.tgUser,
    lang: ctx.lang,
    paymentMethod: 'crypto_manual',
    walletId: wId
  });

  if (result.kind === 'error') throw { status: result.status, message: result.message };
  return {
    success: true,
    type: 'invoice',
    order: result.order,
    instructions: result.instructions,
    qr_url: result.qr_url,
    token_url: result.token_url
  };
}

async function simSelectWallet() {
  const wallets = await dbService.getActiveCryptoWallets();
  return { success: true, type: 'select_wallet', wallets: wallets || [] };
}

async function simBuyAuto(ctx: SimulateContext) {
  const result = await createOrderFromProduct({
    productId: ctx.productId,
    userId: ctx.tgId,
    username: ctx.tgUser,
    lang: ctx.lang,
    paymentMethod: 'crypto_auto'
  });

  if (result.kind === 'error') throw { status: result.status, message: result.message };
  return {
    success: true,
    type: 'invoice',
    order: result.order,
    instructions: result.instructions,
    qr_url: result.qr_url,
    token_url: result.token_url
  };
}

async function simCheckPayment(ctx: SimulateContext) {
  const order = await dbService.getOrder(ctx.orderId);
  if (!order) throw { status: 404, message: 'Order not found' };

  const orderLang = order.user_lang || ctx.lang;

  // STRICT VERIFICATION: If not verified/paid, reject delivery!
  if (order.payment_status !== 'PAID' && order.payment_status !== 'VERIFIED_BY_ADMIN') {
    return {
      success: false,
      status: order.payment_status,
      message: getUI('payment_pending_notice', orderLang),
      account: null
    };
  }

  // If PAID, ensure atomic stock claim if not delivered yet
  let delivered = order.account_delivered;
  if (!delivered) {
    const stock: any = await dbService.claimAvailableStock(order.product_id, order.order_id);
    if (stock && stock.account_data) {
      delivered = stock.account_data;
      await dbService.updateOrder(order.order_id, {
        account_delivered: delivered,
        updated_at: new Date().toISOString()
      });
    }
  }

  return {
    success: true,
    status: 'PAID',
    account: delivered,
    parsed: parseAccountCredential(delivered || ''),
    message: getUI('payment_success_header', orderLang),
    warranty_tip: getUI('warranty_tip', orderLang)
  };
}

async function simSimulatePay(ctx: SimulateContext) {
  const order = await dbService.getOrder(ctx.orderId);
  if (!order) throw { status: 404, message: 'Order not found' };

  const stock: any = await dbService.claimAvailableStock(order.product_id, order.order_id);
  const delivered = stock && stock.account_data ? stock.account_data : 'Credential delivered via simulation';

  await dbService.updateOrder(ctx.orderId, {
    payment_status: 'PAID',
    account_delivered: delivered,
    updated_at: new Date().toISOString()
  });

  const orderLang = order.user_lang || ctx.lang;
  return {
    success: true,
    status: 'PAID',
    account: delivered,
    parsed: parseAccountCredential(delivered),
    message: getUI('payment_success_header', orderLang)
  };
}

async function simCancelOrder(ctx: SimulateContext) {
  if (ctx.orderId) {
    await dbService.deleteOrder(ctx.orderId);
  }
  return { success: true, message: 'Pesanan telah dibatalkan & otomatis dihapus dari penyimpanan.' };
}

// Dispatch table: single source of truth for the simulated buyer-flow actions.
const SIMULATE_ACTIONS: Record<string, SimulateHandler> = {
  start: simStart,
  catalog: simCatalog,
  help: simHelp,
  payments: simPayments,
  orders: simOrders,
  submit_txid: simSubmitTxid,
  pay_wallet: simPayWallet,
  buy_manual: async (ctx) => {
    const hasWallet = ctx.body.wallet_id || ctx.body.wallet;
    return hasWallet ? simPayWallet(ctx) : simSelectWallet();
  },
  buy_auto: simBuyAuto,
  check_payment: simCheckPayment,
  simulate_pay: simSimulatePay,
  cancel_order: simCancelOrder
};

app.post('/api/bot/simulate', async (req, res) => {
  try {
    const { action, telegram_id, username, product_id, order_id, user_lang } = req.body;

    const handler = SIMULATE_ACTIONS[action];
    if (!handler) {
      return res.status(400).json({ success: false, message: 'Unknown action' });
    }

    const ctx: SimulateContext = {
      req,
      res,
      action,
      tgId: telegram_id || 'sim_user_9981',
      tgUser: username || 'tester_buyer',
      lang: user_lang || 'id',
      productId: product_id,
      orderId: order_id,
      body: req.body
    };

    const payload = await handler(ctx);
    return res.json(payload);
  } catch (err: any) {
    const status = typeof err?.status === 'number' ? err.status : 500;
    res.status(status).json({ success: false, message: err?.message || String(err) });
  }
});

// --- STATIC SERVING FOR PRODUCTION / SERVERLESS (Vercel) ---
// On Vercel, startServer() is skipped and the exported Express app handles each
// request, so we must register the built frontend here at module scope. This
// block is registered AFTER all /api routes, so API endpoints always win.
const DIST_PATH = path.join(process.cwd(), 'dist');
const isProduction = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);

if (isProduction) {
  app.use(express.static(DIST_PATH));
  // SPA fallback: serve index.html for any non-API GET route (client routing).
  app.get(/^(?!\/api\/).*/, (req, res) => {
    res.sendFile(path.join(DIST_PATH, 'index.html'));
  });
}

// --- VITE MIDDLEWARE (LOCAL DEV) & SERVER START ---
async function startServer() {
  // Ensure database seeding
  await dbService.ensureSeeded();

  // Initialize background multi-bot runner from Firestore
  startMultiBotManager(dbService).catch(err => {
    console.error('[BotManager] Startup error:', err.message);
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Express static + SPA fallback already registered above.
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Telegram Digital Shop & Admin Panel running at http://0.0.0.0:${PORT}`);
  });
}

// --- TELEGRAM WEBHOOK RECEIVER (serverless / Vercel mode) ---
// Each active bot registers a webhook at /api/telegram/webhook/:tokenId so
// updates are pushed here instead of long polling. Locally this route is unused
// because long polling handles the bot instead.
app.post('/api/telegram/webhook/:tokenId', async (req, res) => {
  try {
    const tokenId = req.params.tokenId;
    let instance = (activeBots as any).get(tokenId);

    // Cold start may not have the bot instance yet — spin it up on demand.
    if (!instance) {
      try {
        const tokens = await dbService.getBotTokens();
        const tokenRecord = tokens.find((t: any) => t.token_id === tokenId);
        if (tokenRecord && tokenRecord.bot_token) {
          await launchSingleBot(tokenRecord, dbService);
          instance = (activeBots as any).get(tokenId);
        }
      } catch (e: any) {
        console.warn('[Webhook] On-demand bot launch note:', e.message);
      }
    }

    if (instance?.bot) {
      await instance.bot.handleUpdate(req.body);
    }
    // Always ACK so Telegram does not retry endlessly.
    res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error('[Webhook] Error:', err.message);
    res.status(200).json({ ok: true });
  }
});

let serverlessBootstrapped = false;

/**
 * One-time bootstrap used by serverless deployments (Vercel).
 * Seeds the database and registers Telegram webhooks so the whole application
 * works automatically right after a GitHub import + deploy.
 */
export async function bootstrapServerless(): Promise<void> {
  if (serverlessBootstrapped) return;
  serverlessBootstrapped = true;

  try {
    await dbService.ensureSeeded();
  } catch (e: any) {
    console.warn('[Bootstrap] ensureSeeded note:', e.message);
  }

  try {
    await initializeWebhooks(dbService, process.env.APP_URL || process.env.VERCEL_URL || '');
  } catch (e: any) {
    console.warn('[Bootstrap] Webhook setup note:', e.message);
  }
}

// In standard container / local mode, start the server (long polling).
// In Vercel serverless environment, the exported handler is invoked per request
// and bootstrapServerless() runs on the first request instead.
if (!process.env.VERCEL) {
  startServer();
}

export { app };
export default app;
