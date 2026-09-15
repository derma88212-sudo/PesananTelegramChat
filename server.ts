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
import cors from 'cors';
import {
  readEnvFile,
  writeEnvFile,
  getAllEnvVars,
  getEnvVar,
  setEnvVar,
  setEnvVars,
  deleteEnvVar,
  getCategorizedEnvVars,
  validateEnvKey,
  validateEnvValue,
  backupEnvFile,
  restoreEnvFile,
  listEnvBackups
} from './env_manager.js';

dotenv.config();

const app = express();
app.use(cors({
  origin: (origin, callback) => {
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
const PORT = Number(process.env.PORT) || 3000;

interface OrderNotification {
  order_id: string;
  user_id: string;
  product_title: string;
  amount: number | string;
  user_lang?: string;
  product_url?: string;
  [key: string]: any;
}

async function sendTelegramDeliveryNotice(order: OrderNotification, accountData: string) {
  if (!order || !order.user_id) return;
  const telegramId = String(order.user_id);

  try {
    const settings = await dbService.getSettings() || {};
    if (!settings.notify_on_paid && !settings.notify_on_txid) {
      return;
    }

    const session = await dbService.getUserSession(telegramId);
    const lang = session?.language || order.user_lang || 'en';
    const parsed = parseAccountCredential(accountData);

    let credBlock = '';
    if (parsed.email && parsed.password) {
      credBlock = `\n${getUI('credentials_label', lang)}\n` +
                  `Email: <code>${parsed.email}</code>\n` +
                  `Password: <code>${parsed.password}</code>\n` +
                  (parsed.cookie ? `Cookie: <code>${parsed.cookie}</code>\n` : '') +
                  (parsed.apiKey ? `API Key: <code>${parsed.apiKey}</code>\n` : '') +
                  (parsed.note ? `Note: ${parsed.note}\n` : '') +
                  `\n${getUI('warranty_tip', lang)}\n`;
    } else {
      credBlock = `\n${getUI('credentials_label', lang)}\n<code>${accountData}</code>\n\n${getUI('warranty_tip', lang)}\n`;
    }

    const isIdr = order.currency === 'IDR' || order.total_amount_idr;
    const amountText = isIdr 
      ? `Rp ${Number(order.total_amount_idr || order.amount || 0).toLocaleString('id-ID')}`
      : `$${order.amount} ${order.currency || 'USD'}`;

    const titleText = getUI('payment_verified_title', lang) || 'PAYMENT VERIFIED AND ACCOUNT DELIVERED!';
    const prodLabel = getUI('product_label', lang) || 'Product:';
    const orderIdLabel = getUI('order_id_label', lang) || 'Order ID:';
    const totalLabel = getUI('total_label', lang) || 'Total:';
    const accessLabel = getUI('product_access_label', lang) || 'Product Access:';

    const message = `<b>${titleText}</b>\n\n` +
      `<b>${prodLabel}</b> ${order.product_title}\n` +
      `<b>${orderIdLabel}</b> <code>${order.order_id}</code>\n` +
      `<b>${totalLabel}</b> ${amountText}\n` +
      (order.product_url ? `\n<b>${accessLabel}</b> ${order.product_url}\n` : '') +
      credBlock;

    for (const botInstance of (activeBots as any).values()) {
      try {
        await botInstance.bot.telegram.sendMessage(telegramId, message, {
          parse_mode: 'HTML',
          disable_web_page_preview: true
        });
        console.log(`[Telegram Delivery] Sent account to buyer ${telegramId} via bot.`);
        break;
      } catch (err: any) {
        console.warn(`[Telegram Delivery] Bot dispatch note:`, err.message);
      }
    }
  } catch (e: any) {
    console.warn('[Telegram Delivery] Failed delivery notification:', e.message);
  }
}

async function notifyAdminNewOrder(order: any) {
  if (!order) return;
  const groupChatId = process.env.TELEGRAM_ADMIN_GROUP_ID || process.env.TELEGRAM_CHANNEL_ID || process.env.ADMIN_TELEGRAM_ID;
  if (!groupChatId) return;

  const isManual = ['crypto_manual', 'qris', 'ewallet', 'bank', 'bank_transfer', 'manual_idr'].includes(order.payment_method);
  const shortId = String(order.order_id).slice(-8);
  const amountLine = order.currency === 'IDR' || order.total_amount_idr
    ? `Amount: Rp ${Number(order.total_amount_idr || order.amount || 0).toLocaleString('id-ID')}`
    : `Amount: $${order.amount} ${order.currency || 'USD'}`;

  const msg = `<b>NEW ORDER RECEIVED!</b>\n\n` +
    `Order ID: <code>#${order.order_id}</code>\n` +
    `Buyer: @${order.username || 'No Username'} (ID: <code>${order.user_id}</code>)\n` +
    `Product: ${order.product_title}\n` +
    `${amountLine}\n` +
    `Method: <b>${order.payment_method_name || order.payment_method}</b> (${isManual ? 'Manual - verification required' : 'Automatic'})\n` +
    (order.unique_code ? `Unique Code: <b>+${order.unique_code}</b>\n` : '') +
    `\n<i>${isManual ? 'Awaiting payment proof and admin verification.' : 'Awaiting automatic payment confirmation.'}</i>`;

  for (const botInstance of (activeBots as any).values()) {
    try {
      await botInstance.bot.telegram.sendMessage(groupChatId, msg, {
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        reply_markup: {
          inline_keyboard: [[
            { text: `Approve #${shortId}`, callback_data: `adm_appr_${order.order_id}` },
            { text: `Reject #${shortId}`, callback_data: `adm_rejc_${order.order_id}` }
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
    const settings = await dbService.getSettings() || {};
    if (!settings.notify_on_new_order) {
      return;
    }

    const session = await dbService.getUserSession(telegramId);
    const lang = session?.language || order.user_lang || 'en';

    const isIdr = order.currency === 'IDR' || order.total_amount_idr;
    const amountText = isIdr 
      ? `Rp ${Number(order.total_amount_idr || order.amount || 0).toLocaleString('id-ID')}`
      : `$${order.amount} ${order.currency || 'USD'}`;

    const titleText = getUI('order_cancelled_title', lang) || 'ORDER CANCELLED';
    const prodLabel = getUI('product_label', lang) || 'Product:';
    const orderIdLabel = getUI('order_id_label', lang) || 'Order ID:';
    const amountLabel = getUI('amount_label', lang) || 'Amount:';
    const reasonLabel = getUI('reason_label', lang) || 'Note:';
    const cancelBody = getUI('order_cancelled_body', lang) || 'This order has been cancelled. If you wish to place a new order, please visit the product catalog.';

    const message = `<b>${titleText}</b>\n\n` +
      `<b>${prodLabel}</b> ${order.product_title}\n` +
      `<b>${orderIdLabel}</b> <code>${order.order_id}</code>\n` +
      `<b>${amountLabel}</b> ${amountText}\n` +
      (reason ? `<b>${reasonLabel}</b> ${reason}\n\n` : '\n') +
      cancelBody;

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

app.use(express.json({
  limit: '10mb',
  verify: (req: any, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({
  extended: true,
  limit: '10mb',
  verify: (req: any, _res, buf) => {
    req.rawBody = buf;
  }
}));

app.use((err: any, req: any, res: any, next: any) => {
  if (err instanceof SyntaxError && 'status' in err && err.status === 400 && 'body' in err) {
    console.error('[Body Parser Error] Invalid JSON:', err.message);
    return res.status(400).json({ success: false, message: 'Invalid JSON in request body' });
  }
  next(err);
});

// API ROUTES

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    active_bots: activeBots.size,
    supabase_configured: isSupabaseEnabled(),
    timestamp: new Date().toISOString()
  });
});

app.get('/api/engine/status', (req, res) => {
  try {
    res.json({ success: true, data: getBotEngineMetrics() });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/db/backup-telegram', async (req, res) => {
  try {
    const { chat_id } = req.body || {};
    const targetChat = chat_id || process.env.TELEGRAM_ADMIN_GROUP_ID || process.env.ADMIN_TELEGRAM_ID;
    if (!targetChat) {
      return res.status(400).json({ success: false, message: 'Telegram admin chat address is not configured.' });
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
          caption: `<b>Database Backup</b>\nProducts: ${backup.counts.products} | Orders: ${backup.counts.orders} | Users: ${backup.counts.users}`,
          parse_mode: 'HTML'
        });
        sent = true;
        break;
      } catch (e: any) {
        console.warn('[Backup] Telegram send note:', e.message);
      }
    }

    if (!sent) {
      return res.status(502).json({ success: false, message: 'Failed to send backup to Telegram. Make sure the bot is active.' });
    }

    try {
      await dbService.addSystemLog({ admin_id: 'web_admin', action: 'manual_db_backup_telegram' });
    } catch (e) {}

    res.json({ success: true, message: 'Database backup successfully sent to Telegram admin chat.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/db/status', async (req, res) => {
  try {
    const multiStatus = await getMultiDbStatus();

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

app.post('/api/db/init-tables', async (req, res) => {
  try {
    const engine = (req.body?.engine || req.query?.engine || 'supabase') as string;
    console.log(`[API] 1-Click Auto Table Creation requested for engine: ${engine}`);
    await dbService.ensureSeeded();
    const tableInitResult = await ensureTablesForEngine(engine);

    res.json({
      success: tableInitResult.success !== false,
      message: tableInitResult.message || 'Database tables created and prepared automatically!',
      details: tableInitResult,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

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

app.post('/api/db/migrate-supabase', async (req, res) => {
  try {
    console.log('[API] 1-Click Full Data Migration to Supabase requested...');
    const result = await migrateAllDataToSupabase(dbService);
    res.json({
      success: true,
      message: 'All data (products, stocks, orders, settings, wallets, bots) successfully migrated to Supabase!',
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

app.get('/api/db/test/:engine', async (req, res) => {
  const engine = req.params.engine.toLowerCase();
  try {
    if (engine === 'supabase') {
      const status = await testSupabaseConnection();
      return res.json({ success: status.connected, details: status });
    }
    if (engine === 'firestore') {
      await dbService.ensureSeeded();
      return res.json({ success: true, message: 'Google Cloud Firestore is active and synchronized normally.' });
    }
    if (engine === 'local') {
      const localPath = path.join(process.cwd(), 'data', 'local_store.json');
      const exists = fs.existsSync(localPath);
      return res.json({ success: true, message: `Local JSON Store active (${exists ? 'Data file exists' : 'Ready to write'}).` });
    }
    if (engine === 'redis') {
      const redisUrl = process.env.REDIS_URL;
      return res.json({
        success: Boolean(redisUrl),
        message: redisUrl ? 'REDIS_URL configured in environment.' : 'REDIS_URL is empty (fallback to in-memory cache).'
      });
    }
    if (engine === 'mysql') {
      const mysqlUrl = process.env.MYSQL_URL || process.env.MYSQL_DATABASE_URL;
      if (!mysqlUrl) {
        return res.json({ success: false, message: 'MYSQL_URL is empty (standby mode).' });
      }
      try {
        const mysql: any = await import('mysql2/promise');
        const conn = await mysql.createConnection(mysqlUrl);
        await conn.query('SELECT 1');
        await conn.end();
        return res.json({ success: true, message: 'MySQL connection successful & active.' });
      } catch (e: any) {
        return res.json({ success: false, message: 'Failed to connect MySQL: ' + e.message });
      }
    }
    if (engine === 'mongodb') {
      const mongoUri = process.env.MONGODB_URI;
      if (!mongoUri) {
        return res.json({ success: false, message: 'MONGODB_URI is empty (standby mode).' });
      }
      try {
        const mongodb: any = await import('mongodb');
        const client = new mongodb.MongoClient(mongoUri, { serverSelectionTimeoutMS: 5000 });
        await client.connect();
        await client.db().command({ ping: 1 });
        await client.close();
        return res.json({ success: true, message: 'MongoDB connection successful & active.' });
      } catch (e: any) {
        return res.json({ success: false, message: 'Failed to connect MongoDB: ' + e.message });
      }
    }
    return res.status(400).json({ success: false, message: 'Unknown database engine.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    try {
      const admins = await dbService.getAdmins();
      if (admins && admins.length > 0) {
        const hasCustomCredentials = admins.some(a => a.password_hash && a.password_hash !== 'kuda2017');
        if (hasCustomCredentials) {
          lockFallbackLogin(true);
        }
      }
    } catch (dbCheckErr: any) {}

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

    try {
      await dbService.ensureSeeded();
      const admin = await dbService.verifyAdminLogin(username, password);

      if (admin) {
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
      message: 'Invalid username or password.'
    });
  } catch (err: any) {
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
    res.status(200).json({ success: false, message: 'Failed to process login. Please try again.' });
  }
});

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

app.post('/api/auth/change-password', async (req, res) => {
  try {
    const { username, new_password, current_password, new_username } = req.body || {};
    if (!new_password || String(new_password).trim().length < 4) {
      return res.status(400).json({ success: false, message: 'New password must be at least 4 characters long.' });
    }

    const verified = verifyEnvAdminLogin(username || 'admin', current_password);
    if (!verified) {
      return res.status(401).json({ success: false, message: 'Current password is invalid.' });
    }

    const targetUsername = new_username || username || 'admin';
    savePermanentAdminPassword(targetUsername, new_password);
    lockFallbackLogin(true);

    try {
      await dbService.addAdmin({
        username: targetUsername,
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
      message: 'Admin password successfully updated. Default fallback login is now locked.'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/auth/update-admin', async (req, res) => {
  try {
    const { username, new_username, new_password, current_password } = req.body || {};
    if (!username) {
      return res.status(400).json({ success: false, message: 'Target admin username is required.' });
    }

    const verified = verifyEnvAdminLogin(username, current_password);
    if (!verified) {
      try {
        const admin = await dbService.verifyAdminLogin(username, current_password);
        if (!admin) {
          return res.status(401).json({ success: false, message: 'Current password is invalid.' });
        }
      } catch (e) {
        return res.status(401).json({ success: false, message: 'Current password is invalid.' });
      }
    }

    const isRoot = verified.username === 'root@admin.com' || verified.username === 'admin';
    if (!isRoot && username !== verified.username) {
      return res.status(403).json({ success: false, message: 'Only root admin can update other admins.' });
    }

    const targetUsername = new_username || username;
    if (new_password && String(new_password).trim().length >= 4) {
      savePermanentAdminPassword(targetUsername, new_password);
      lockFallbackLogin(true);
    }

    try {
      await dbService.addAdmin({
        username: targetUsername,
        password_hash: new_password ? String(new_password).trim() : (await dbService.getAdmins()).find(a => a.username === username)?.password_hash,
        role: 'superadmin'
      });
    } catch (e) {}

    try {
      await dbService.addSystemLog({
        admin_id: verified.admin_id,
        action: 'update_admin_credentials',
        ip_address: req.ip
      });
    } catch (e) {}

    res.json({
      success: true,
      message: 'Admin updated successfully.'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

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
      .reduce((sum: number, o: any) => {
        const isIdr = o.currency === 'IDR' || o.total_amount_idr;
        if (isIdr) return sum;
        return sum + (Number(o.amount) || 0);
      }, 0);

    const totalRevenueIdr = orders
      .filter((o: any) => o.payment_status === 'PAID' || o.payment_status === 'VERIFIED_BY_ADMIN')
      .reduce((sum: number, o: any) => {
        const isIdr = o.currency === 'IDR' || o.total_amount_idr;
        if (isIdr) return sum + (Number(o.total_amount_idr) || Number(o.amount) || 0);
        return sum + (Number(o.amount) || 0) * 16000;
      }, 0);

    const availableStocks = stocks.filter((s: any) => s.status === 'AVAILABLE').length;
    const soldStocks = stocks.filter((s: any) => s.status === 'SOLD').length;
    const pendingOrders = orders.filter((o: any) => o.payment_status === 'PENDING').length;
    const completedOrders = orders.filter((o: any) => o.payment_status === 'PAID' || o.payment_status === 'VERIFIED_BY_ADMIN').length;

    const onlineBotsCount = (botTokens || []).filter((b: any) => {
      return Boolean(
        b.status === 'online' ||
        b.status === 'running' ||
        b.status === 'active' ||
        b.status === 'connected' ||
        b.running === true ||
        b.is_running === true ||
        (b.is_active !== false && b.connected !== false)
      );
    }).length;

    res.json({
      success: true,
      data: {
        totalRevenueUsd,
        totalRevenueIdr,
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

app.get('/api/reports/financial', async (req, res) => {
  try {
    const { start_date, end_date, period } = req.query as Record<string, string>;
    
    const orders = await dbService.getOrders();
    const paidOrders = orders.filter((o: any) => 
      o.payment_status === 'PAID' || o.payment_status === 'VERIFIED_BY_ADMIN'
    );

    let filteredOrders = paidOrders;
    if (start_date && end_date) {
      const start = new Date(start_date);
      const end = new Date(end_date);
      end.setHours(23, 59, 59, 999);
      filteredOrders = paidOrders.filter((o: any) => {
        const orderDate = new Date(o.created_at);
        return orderDate >= start && orderDate <= end;
      });
    } else if (period) {
      const now = new Date();
      let start = new Date(now);
      if (period === 'today') {
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (period === 'week') {
        const day = now.getDay();
        const diffToMonday = (day + 6) % 7;
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday);
      } else if (period === 'month') {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
      } else if (period === 'year') {
        start = new Date(now.getFullYear(), 0, 1);
      }
      filteredOrders = paidOrders.filter((o: any) => new Date(o.created_at) >= start);
    }

    const USD_TO_IDR = 16000;

    const summary = filteredOrders.reduce((acc, o) => {
      const isIdr = o.currency === 'IDR' || o.total_amount_idr;
      const amountIdr = isIdr 
        ? (Number(o.total_amount_idr) || Number(o.amount) || 0)
        : (Number(o.amount) || 0) * USD_TO_IDR;
      const amountUsd = isIdr
        ? (Number(o.total_amount_idr) || Number(o.amount) || 0) / USD_TO_IDR
        : (Number(o.amount) || 0);

      acc.totalRevenueIdr += amountIdr;
      acc.totalRevenueUsd += amountUsd;
      acc.totalOrders += 1;
      
      const method = o.payment_method || 'unknown';
      acc.byPaymentMethod[method] = (acc.byPaymentMethod[method] || 0) + 1;
      acc.byPaymentMethodRevenue[method] = (acc.byPaymentMethodRevenue[method] || 0) + amountIdr;
      
      const product = o.product_title || 'unknown';
      acc.byProduct[product] = (acc.byProduct[product] || 0) + 1;
      acc.byProductRevenue[product] = (acc.byProductRevenue[product] || 0) + amountIdr;

      return acc;
    }, {
      totalRevenueIdr: 0,
      totalRevenueUsd: 0,
      totalOrders: 0,
      byPaymentMethod: {},
      byPaymentMethodRevenue: {},
      byProduct: {},
      byProductRevenue: {}
    });

    const dailyBreakdown = filteredOrders.reduce((acc, o) => {
      const date = new Date(o.created_at).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { orders: 0, revenueIdr: 0, revenueUsd: 0 };
      }
      const isIdr = o.currency === 'IDR' || o.total_amount_idr;
      const amountIdr = isIdr 
        ? (Number(o.total_amount_idr) || Number(o.amount) || 0)
        : (Number(o.amount) || 0) * USD_TO_IDR;
      const amountUsd = isIdr
        ? amountIdr / USD_TO_IDR
        : (Number(o.amount) || 0);
      
      acc[date].orders += 1;
      acc[date].revenueIdr += amountIdr;
      acc[date].revenueUsd += amountUsd;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        summary: {
          totalRevenueIdr: Math.round(summary.totalRevenueIdr),
          totalRevenueUsd: Math.round(summary.totalRevenueUsd * 100) / 100,
          totalOrders: summary.totalOrders,
          exchangeRate: USD_TO_IDR
        },
        byPaymentMethod: summary.byPaymentMethod,
        byPaymentMethodRevenue: summary.byPaymentMethodRevenue,
        byProduct: summary.byProduct,
        byProductRevenue: summary.byProductRevenue,
        dailyBreakdown,
        period: period || 'custom',
        startDate: start_date || null,
        endDate: end_date || null
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/products', async (req, res) => {
  try {
    const products = await dbService.getProducts();
    const stocks = await dbService.getStocks();

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

function extractFileIdFromOrder(order: any): string | null {
  if (!order) return null;
  if (order.receipt_file_id) return order.receipt_file_id;
  const match = (order.tx_hash || '').match(/(?:\[(?:Receipt Image ID|Photo):\s*([a-zA-Z0-9_\-]+)\])/i);
  if (match) return match[1];
  if (order.tx_hash && (order.tx_hash.startsWith('AgAC') || order.tx_hash.startsWith('BAAC'))) {
    return order.tx_hash.trim();
  }
  return null;
}

async function getTelegramFileDirectUrl(fileId: string): Promise<string | null> {
  if (!fileId) return null;
  for (const botInstance of (activeBots as any).values()) {
    try {
      if (botInstance.bot && botInstance.bot.telegram) {
        const link = await botInstance.bot.telegram.getFileLink(fileId);
        if (link) return link.href || link.toString();
      }
    } catch (e: any) {}
  }

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

async function streamRemoteFile(
  fileUrl: string,
  res: express.Response,
  options: { defaultContentType?: string; notFoundMessage?: string; downloadErrorMessage?: string } = {}
) {
  const {
    defaultContentType = 'image/jpeg',
    notFoundMessage = 'File not found',
    downloadErrorMessage = 'Failed to download file.'
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

function evaluateCoupon(coupon: any, baseAmount: number, lang: string = 'en'): {
  success: boolean;
  valid: boolean;
  message: string;
  code?: string;
  discount_amount?: number;
  final_amount?: number;
} {
  if (!coupon) {
    return { success: true, valid: false, message: getUI('coupon_not_found', lang) || 'Coupon code not found or invalid.' };
  }
  if (coupon.is_active === false) {
    return { success: true, valid: false, message: getUI('coupon_inactive', lang) || 'This coupon code is inactive.' };
  }
  const maxUses = Number(coupon.max_uses) || 0;
  const usedCount = Number(coupon.used_count) || 0;
  if (maxUses > 0 && usedCount >= maxUses) {
    return { success: true, valid: false, message: getUI('coupon_limit_reached', lang) || 'Coupon code has reached its usage limit.' };
  }

  const pct = Number(coupon.discount_percentage) || 0;
  const fixed = Number(coupon.fixed_discount) || 0;
  const discountAmount = Math.round((baseAmount * pct) / 100 + fixed);
  const finalAmount = Math.max(0, baseAmount - discountAmount);

  const appliedMsg = getUI('coupon_applied', lang) || `Coupon ${coupon.code} applied successfully! Discount: Rp ${discountAmount.toLocaleString('id-ID')}.`;

  return {
    success: true,
    valid: true,
    code: coupon.code,
    discount_amount: discountAmount,
    final_amount: finalAmount,
    message: appliedMsg
  };
}

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

  const isIdrPayment = ['qris', 'ewallet', 'bank', 'bank_transfer', 'manual_idr'].includes(paymentMethod || '');
  const isCryptoManual = paymentMethod === 'crypto_manual';
  const orderAmount = isIdrPayment ? (product.price_idr || product.price_usd * 16000) : product.price_usd;
  const orderCurrency = isIdrPayment ? 'IDR' : (isCryptoManual ? (currency || 'USDT') : 'USDT');

  if (isCryptoManual) {
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
      return { kind: 'error', ok: false, status: 400, message: 'No manual crypto wallet configured by admin.' };
    }

    const generateRandomChar = () => String.fromCharCode(65 + Math.floor(Math.random() * 26));

    const orderId = `S-${Math.floor(100000 + Math.random() * 900000)}-${generateRandomChar()}`;

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
      amount: orderAmount,
      currency: orderCurrency,
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

  if (isIdrPayment) {
    let paymentMethodDetails = null;
    const allMethods = await dbService.getPaymentMethods();
    if (paymentMethod) {
      paymentMethodDetails = allMethods.find((m: any) => m.method_id === paymentMethod || m.type === paymentMethod || m.id === paymentMethod);
    }
    if (!paymentMethodDetails) {
      paymentMethodDetails = allMethods.find((m: any) => m.type === paymentMethod && m.is_active !== false);
    }

    const generateRandomChar = () => String.fromCharCode(65 + Math.floor(Math.random() * 26));

    const orderId = `S-${Math.floor(100000 + Math.random() * 900000)}-${generateRandomChar()}`;

    const orderDoc = {
      order_id: orderId,
      user_id: userId,
      username,
      user_lang: lang,
      product_id: productId,
      product_title: product.title,
      payment_method: paymentMethod || 'qris',
      payment_method_id: paymentMethodDetails?.method_id || paymentMethodDetails?.id,
      payment_gateway: 'Manual',
      payment_status: 'PENDING',
      crypto_address: paymentMethodDetails?.account_number || '',
      crypto_network: paymentMethodDetails?.type || paymentMethod || 'qris',
      amount: orderAmount,
      currency: orderCurrency,
      total_amount_idr: isIdrPayment ? orderAmount : null,
      unique_code: Math.floor(100 + Math.random() * 900),
      account_delivered: null,
      payment_proof: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await dbService.createOrder(orderDoc);
    notifyAdminNewOrder(orderDoc).catch(() => {});
    
    const qrUrl = paymentMethodDetails?.qr_image_url || getQrCodeUrl(paymentMethodDetails?.account_number || 'IDR-Payment', 300);
    const instructions = paymentMethodDetails?.instructions || getUI('payment_pending_notice', lang);
    
    return {
      kind: 'invoice',
      ok: true,
      type: 'invoice',
      order: orderDoc,
      order_id: orderId,
      qr_url: qrUrl,
      token_url: qrUrl,
      instructions
    };
  }

  if (typeof (cryptoGateway as any).isConfigured === 'function' && !(cryptoGateway as any).isConfigured()) {
    return { kind: 'error', ok: false, status: 503, message: 'Automatic crypto payment is disabled (gateway not connected). Please use Manual Payment.' };
  }

  const generateRandomChar = () => String.fromCharCode(65 + Math.floor(Math.random() * 26));

  const orderId = `S-${Math.floor(100000 + Math.random() * 900000)}-${generateRandomChar()}`;

  const payRes = await cryptoGateway.createPayment({
    orderId,
    priceAmountUsd: product.price_usd,
    payCurrency: (currency || 'usdttrc20').toLowerCase(),
    orderDescription: product.title,
    callbackUrl: ''
  });

  if (!payRes.success || !payRes.payAddress) {
    return { kind: 'error', ok: false, status: 502, message: payRes.error || 'Automatic payment gateway failed to create invoice.' };
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
  if (cleanTxHash.includes('[Receipt Image ID:') || cleanTxHash.includes('[Photo:') || cleanTxHash.includes('[Bukti Gambar ID:')) {
    cleanTxHash = cleanTxHash.replace(/\[(?:Receipt Image ID|Bukti Gambar ID|Photo):\s*[a-zA-Z0-9_\-]+\]/g, 'Payment Proof Photo').trim();
    if (!cleanTxHash) cleanTxHash = 'Payment Proof Photo';
  }
  const lang = order.user_lang || 'en';
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

app.get('/api/orders', async (req, res) => {
  try {
    const orders = await dbService.getOrders();
    const now = new Date().getTime();
    const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

    const validOrders = [];
    for (const order of orders) {
      const isPending = order.payment_status === 'PENDING';
      const createdAtMs = new Date(order.created_at || order.timestamp || Date.now()).getTime();
      const isExpired = (now - createdAtMs) > THREE_DAYS_MS;

      if (isPending && isExpired) {
        await dbService.releaseClaimedStock(order.order_id || order.id);
      } else {
        validOrders.push(order);
      }
    }

    const enriched = validOrders.map(enrichOrderReceipt);
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

app.get('/api/orders/:id/receipt-image', async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await dbService.getOrder(orderId);
    if (!order) {
      return res.status(404).send('Order not found');
    }

    const fileId = extractFileIdFromOrder(order);

    if (!fileId && order.receipt_image_url && order.receipt_image_url.startsWith('http')) {
      return streamRemoteFile(order.receipt_image_url, res, {
        notFoundMessage: 'No receipt image found for this order.',
        downloadErrorMessage: 'Failed to download receipt image from external source.'
      });
    }

    if (!fileId) {
      return res.status(404).send('No receipt image found for this order.');
    }

    const fileUrl = await getTelegramFileDirectUrl(fileId);
    if (!fileUrl) {
      return res.status(404).send('Failed to fetch image file from Telegram server. Make sure the bot is active.');
    }

    return streamRemoteFile(fileUrl, res, {
      notFoundMessage: 'No receipt image found for this order.',
      downloadErrorMessage: 'Failed to download image from Telegram.'
    });
  } catch (err: any) {
    console.error('[Receipt Image Error]:', err.message);
    res.status(500).send(`An error occurred: ${err.message}`);
  }
});

app.get('/api/telegram-file/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const fileUrl = await getTelegramFileDirectUrl(fileId);
    if (!fileUrl) {
      return res.status(404).send('File not found in Telegram');
    }
    return streamRemoteFile(fileUrl, res, {
      notFoundMessage: 'File not found in Telegram',
      downloadErrorMessage: 'Failed to download file from Telegram'
    });
  } catch (err: any) {
    res.status(500).send(err.message);
  }
});

app.post('/api/orders/checkout', async (req, res) => {
  try {
    const { user_id, username, product_id, payment_method, wallet_id, currency, user_lang } = req.body;

    const result = await createOrderFromProduct({
      productId: product_id,
      userId: user_id || 'guest_buyer',
      username: username || 'buyer',
      lang: user_lang || 'en',
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
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    let deliveredAccount = order.account_delivered;
    if (!deliveredAccount) {
      try {
        const stock: any = await dbService.claimAvailableStock(order.product_id, order.order_id);
        if (stock && stock.account_data) {
          deliveredAccount = stock.account_data;
        } else {
          deliveredAccount = 'Account not available in stock. Admin will attach account manually.';
        }
      } catch (stockErr: any) {
        console.warn('Stock claim fallback:', stockErr.message);
        deliveredAccount = 'Account ready to be sent manually by admin.';
      }
    }

    let productUrl = null;
    try {
      const product = await dbService.getProduct(order.product_id);
      if (product && product.product_url) {
        productUrl = product.product_url;
      }
    } catch (e) {}

    await dbService.updateOrder(orderId, {
      payment_status: 'VERIFIED_BY_ADMIN',
      account_delivered: deliveredAccount,
      updated_at: new Date().toISOString()
    });

    const orderWithUrl = { ...order, order_id: orderId, product_url: productUrl };
    sendTelegramDeliveryNotice(orderWithUrl, deliveredAccount).catch(() => {});

    const updated = await dbService.getOrder(orderId);
    res.json({ success: true, order_id: orderId, order: updated || order, account_delivered: deliveredAccount });
  } catch (err: any) {
    console.error('Approve order error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/orders/:id/cancel', async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await dbService.getOrder(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    try {
      await dbService.releaseClaimedStock(order.order_id);
    } catch (e: any) {
      console.warn('releaseClaimedStock error:', e.message);
    }

    await dbService.updateOrder(orderId, {
      payment_status: 'CANCELLED',
      updated_at: new Date().toISOString()
    });

    sendTelegramCancellationNotice(order, req.body?.reason).catch(() => {});

    const updated = await dbService.getOrder(orderId);
    res.json({ success: true, order_id: orderId, order: updated || order, status: 'CANCELLED' });
  } catch (err: any) {
    console.error('Cancel order error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/orders/:id/reject', async (req, res) => {
  try {
    const orderId = req.params.id;
    const action = req.body?.action || req.query?.action;

    if (action === 'delete') {
      await dbService.deleteOrder(orderId);
      return res.json({ success: true, order_id: orderId, deleted: true, status: 'DELETED' });
    }

    const order = await dbService.getOrder(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

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

app.post('/api/orders/:id/reset', async (req, res) => {
  try {
    const orderId = req.params.id;
    const resetOrder = await dbService.resetOrder(orderId);
    res.json({ 
      success: true, 
      order_id: orderId, 
      order: resetOrder, 
      status: 'PENDING',
      message: 'Order status successfully reset to Pending.' 
    });
  } catch (err: any) {
    console.error('Reset order error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/orders/reset-completed', async (req, res) => {
  try {
    const mode = req.body?.mode || 'to_pending';
    const count = await dbService.resetCompletedOrders(mode);
    res.json({ 
      success: true, 
      count, 
      mode, 
      message: `Successfully reset ${count} completed orders.` 
    });
  } catch (err: any) {
    console.error('Reset completed orders error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

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
        o.user_lang || 'en',
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

app.get('/api/payment-methods', async (req, res) => {
  try {
    const methods = await dbService.getPaymentMethods();
    const mappedMethods = methods.map((m: any) => ({
      ...m,
      method_id: m.id || m.method_id,
      id: m.id || m.method_id
    }));
    res.json({ success: true, data: mappedMethods });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/payment-methods', async (req, res) => {
  try {
    const methodData = req.body;
    if (!methodData.name) {
      return res.status(400).json({ success: false, message: 'Method name is required' });
    }
    const methodId = methodData.method_id || methodData.id || `pm_${Date.now()}`;
    const newMethod = {
      id: methodId,
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
      id: methodId,
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
    const existing = methods.find((m: any) => (m.id || m.method_id) === methodId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Payment method not found' });
    }
    existing.is_active = !existing.is_active;
    existing.updated_at = new Date().toISOString();
    existing.id = existing.id || existing.method_id || methodId;
    existing.method_id = existing.id;
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
      return res.status(400).json({ success: false, message: 'Coupon code is required' });
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
      return res.status(404).json({ success: false, message: 'Coupon not found' });
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

app.post('/api/coupons/validate', async (req, res) => {
  try {
    const { code, amount_idr, user_lang } = req.body || {};
    const coupon = await dbService.getCouponByCode(code);
    const result = evaluateCoupon(coupon, Number(amount_idr) || 0, user_lang || 'en');
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

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
      return res.status(400).json({ success: false, message: 'Channel name is required' });
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
      return res.status(404).json({ success: false, message: 'Channel not found' });
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

app.get('/api/referral-links', async (req, res) => {
  try {
    const channelId = req.query.channel_id as string | undefined;
    const links = await dbService.getReferralLinks(channelId);
    res.json({ success: true, data: links });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/referral-links/:id', async (req, res) => {
  try {
    const link = await dbService.getReferralLink(req.params.id);
    if (!link) {
      return res.status(404).json({ success: false, message: 'Referral link not found' });
    }
    res.json({ success: true, data: link });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/referral-links', async (req, res) => {
  try {
    const { channel_id, channel_name, bot_token_id, bot_name, referral_code, referral_link } = req.body;
    if (!channel_id || !channel_name || !referral_code) {
      return res.status(400).json({ success: false, message: 'channel_id, channel_name, and referral_code are required' });
    }
    const saved = await dbService.saveReferralLink(req.body);
    res.json({ success: true, data: saved });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/referral-links/:id', async (req, res) => {
  try {
    const saved = await dbService.saveReferralLink({ ...req.body, referral_id: req.params.id });
    res.json({ success: true, data: saved });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/referral-links/:id', async (req, res) => {
  try {
    await dbService.deleteReferralLink(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/referral-links/:id/clicks', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const clicks = await dbService.getReferralClicks(req.params.id, limit);
    res.json({ success: true, data: clicks });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/referral-links/:identifier/click', async (req, res) => {
  try {
    const { identifier } = req.params;
    const { telegram_id, username, first_name } = req.body;

    let link = await dbService.getReferralLink(identifier);
    if (!link) {
      link = await dbService.getReferralLinkByCode(identifier);
    }

    if (!link) {
      return res.status(404).json({ success: false, message: 'Referral link not found' });
    }

    const updatedLink = await dbService.incrementReferralClick(link.referral_id);

    if (link.channel_id) {
      await dbService.incrementChannelCounter(link.channel_id, 'clicks_count', 1);
    }

    const clickRecord = await dbService.saveReferralClick({
      referral_id: link.referral_id,
      telegram_id: telegram_id ? String(telegram_id) : '',
      username: username || '',
      first_name: first_name || '',
      clicked_at: new Date().toISOString(),
      joined: false
    });

    res.json({
      success: true,
      data: {
        link: updatedLink || link,
        click: clickRecord
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/referral-links/generate', async (req, res) => {
  try {
    const { channel_id, bot_token_id, custom_code } = req.body;
    if (!channel_id) {
      return res.status(400).json({ success: false, message: 'channel_id is required' });
    }
    
    const channel = await dbService.getChannels().then(channels => channels.find(c => c.channel_id === channel_id));
    if (!channel) {
      return res.status(404).json({ success: false, message: 'Channel not found' });
    }

    const referralCode = custom_code || `${channel.username || 'CH'}${Date.now().toString().slice(-6)}`.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20);
    const bot = bot_token_id ? await dbService.getBotTokens().then(bots => bots.find(b => b.token_id === bot_token_id)) : null;
    
    let botUsername = 'bot';
    if (bot?.bot_token) {
      try {
        const response = await fetch(`https://api.telegram.org/bot${bot.bot_token}/getMe`);
        const data = await response.json();
        if (data.ok && data.result?.username) {
          botUsername = data.result.username;
        }
      } catch (e) {}
    }

    const referralLink = `https://t.me/${botUsername}?start=ref_${referralCode}`;
    
    const saved = await dbService.saveReferralLink({
      channel_id,
      channel_name: channel.name,
      bot_token_id: bot?.token_id,
      bot_name: bot?.bot_name,
      referral_code: referralCode,
      referral_link: referralLink,
      is_active: true
    });

    await dbService.saveChannel({
      ...channel,
      referral_code: referralCode,
      referral_link: referralLink
    });

    res.json({ success: true, data: saved });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/broadcast/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const history = await dbService.getBroadcastHistory(limit);
    res.json({ success: true, data: history });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/broadcast/history/:id', async (req, res) => {
  try {
    const broadcast = await dbService.getBroadcastHistoryById(req.params.id);
    if (!broadcast) {
      return res.status(404).json({ success: false, message: 'Broadcast history not found' });
    }
    res.json({ success: true, data: broadcast });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/broadcast/history/:id', async (req, res) => {
  try {
    await dbService.deleteBroadcastHistory(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/super-admins', async (req, res) => {
  try {
    const admins = await dbService.getSuperAdmins();
    res.json({ success: true, data: admins });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/super-admins/:id', async (req, res) => {
  try {
    const admin = await dbService.getSuperAdmin(req.params.id);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Super admin not found' });
    }
    res.json({ success: true, data: admin });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/super-admins', async (req, res) => {
  try {
    const { username, password, permissions, is_root } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }
    const saved = await dbService.saveSuperAdmin({
      username,
      password_hash: password,
      permissions,
      is_root: is_root || false
    });
    res.json({ success: true, data: saved });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/super-admins/:id', async (req, res) => {
  try {
    const admin = await dbService.getSuperAdmin(req.params.id);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Super admin not found' });
    }

    const currentUser = req.body.current_user || req.headers['x-current-user'];
    const isRootUser = currentUser === 'root@admin.com' || currentUser === 'root_admin';
    
    if (admin.is_root && !isRootUser) {
      return res.status(403).json({ success: false, message: 'Only root admin can edit root admin accounts.' });
    }
    
    if (!isRootUser && currentUser !== admin.username && currentUser !== admin.admin_id) {
      return res.status(403).json({ success: false, message: 'Not allowed to modify other admins.' });
    }

    const updateData = {
      ...req.body,
      admin_id: req.params.id,
      updated_at: new Date().toISOString()
    };
    
    if (!updateData.password || updateData.password === '') {
      delete updateData.password;
      delete updateData.password_hash;
    } else {
      updateData.password_hash = updateData.password;
      delete updateData.password;
    }
    
    const saved = await dbService.saveSuperAdmin(updateData);
    res.json({ success: true, data: saved });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/super-admins/:id', async (req, res) => {
  try {
    await dbService.deleteSuperAdmin(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

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
        return res.status(400).json({ success: false, message: 'Combined backup (All) is supported in JSON format only.' });
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

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
    return res.send(JSON.stringify(data, null, 2));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/admins', async (req, res) => {
  try {
    const admins = await dbService.getAdmins();
    res.json({ success: true, data: admins });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

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
        message: 'Access denied: Only Superadmin has permission to add administrator accounts.' 
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

app.patch('/api/admins/:id/telegram', async (req, res) => {
  try {
    const requesterRole = (req.headers['x-admin-role'] as string) || req.body.requester_role;
    if (requesterRole !== 'superadmin') {
      return res.status(403).json({ success: false, message: 'Access denied: Only Superadmin can change admin Telegram ID.' });
    }
    const { telegram_id } = req.body || {};
    await dbService.updateAdminTelegramId(req.params.id, telegram_id);
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
        message: 'Access denied: Only Superadmin has permission to delete administrator accounts.' 
      });
    }

    if (req.params.id === 'root_superadmin' || req.params.id === 'root_admin') {
      return res.status(400).json({ success: false, message: 'Main Superadmin account cannot be deleted.' });
    }

    await dbService.deleteAdmin(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/translate/auto', async (req, res) => {
  try {
    const { text, type } = req.body;
    if (!text) return res.status(400).json({ success: false, message: 'Text is required' });

    let translations: Record<string, string> = {};

    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const prompt = `You are a professional multi-lingual translator for a digital store bot.
Translate the following store text into all supported languages dynamically.
Preserve formatting tags (<b>, <i>, <code>, <pre>) and punctuation. Remove any emojis.
Respond with ONLY a valid JSON object whose keys are the language codes (en, id, ms, zh, ru, it, es, hi, uz, ar) and values are the translated strings.

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
        translations = { ...DEFAULT_WELCOME_TEXTS, en: text };
      } else if (type === 'terms') {
        translations = { ...DEFAULT_TERMS_TEXTS, en: text };
      } else if (type === 'payment_guide') {
        translations = { ...DEFAULT_PAYMENT_GUIDES, en: text };
      } else if (type === 'order_guide') {
        translations = { ...DEFAULT_ORDER_GUIDES, en: text };
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
          const prompt = `Translate this product title and description into 10 languages: en, id, ms, zh, ru, it, es, hi, uz, ar. Do not include emojis.
Title: ${prod.title}
Description: ${prod.description}

Respond ONLY with valid JSON in this exact structure:
{
  "en": { "title": "...", "description": "..." },
  "id": { "title": "...", "description": "..." },
  "ms": { "title": "...", "description": "..." },
  "zh": { "title": "...", "description": "..." },
  "ru": { "title": "...", "description": "..." },
  "it": { "title": "...", "description": "..." },
  "es": { "title": "...", "description": "..." },
  "hi": { "title": "...", "description": "..." },
  "uz": { "title": "...", "description": "..." },
  "ar": { "title": "...", "description": "..." }
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
    const welcome = settings.welcome_text || DEFAULT_WELCOME_TEXTS['en'] || DEFAULT_WELCOME_TEXTS['id'];
    const terms = settings.terms_text || DEFAULT_TERMS_TEXTS['en'] || DEFAULT_TERMS_TEXTS['id'];
    const paymentGuide = settings.payment_guide_text || DEFAULT_PAYMENT_GUIDES['en'] || DEFAULT_PAYMENT_GUIDES['id'];
    const orderGuide = settings.order_guide_text || DEFAULT_ORDER_GUIDES['en'] || DEFAULT_ORDER_GUIDES['id'];

    let welcomeTranslations = settings.welcome_translations || {};
    let termsTranslations = settings.terms_translations || {};
    let paymentGuideTranslations = settings.payment_guide_translations || {};
    let orderGuideTranslations = settings.order_guide_translations || {};

    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const prompt = `Translate all 4 digital store texts into 10 languages: en, id, ms, zh, ru, it, es, hi, uz, ar.
Keep formatting tags (<b>, <i>, <code>, <pre>) and newlines intact. Remove all emojis.

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
    "en": "...", "id": "...", "ms": "...", "zh": "...", "ru": "...", "it": "...", "es": "...", "hi": "...", "uz": "...", "ar": "..."
  },
  "terms": {
    "en": "...", "id": "...", "ms": "...", "zh": "...", "ru": "...", "it": "...", "es": "...", "hi": "...", "uz": "...", "ar": "..."
  },
  "payment_guide": {
    "en": "...", "id": "...", "ms": "...", "zh": "...", "ru": "...", "it": "...", "es": "...", "hi": "...", "uz": "...", "ar": "..."
  },
  "order_guide": {
    "en": "...", "id": "...", "ms": "...", "zh": "...", "ru": "...", "it": "...", "es": "...", "hi": "...", "uz": "...", "ar": "..."
  }
}`;
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt
        });

        const match = (response.text || '').match(/\{[\s\S]*\}/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          welcomeTranslations = parsed.welcome || {};
          termsTranslations = parsed.terms || {};
          paymentGuideTranslations = parsed.payment_guide || {};
          orderGuideTranslations = parsed.order_guide || {};
        }
      } catch (e: any) {
        console.warn('Auto translate settings error:', e.message);
      }
    }

    await dbService.updateSettings({
      welcome_translations: welcomeTranslations,
      terms_translations: termsTranslations,
      payment_guide_translations: paymentGuideTranslations,
      order_guide_translations: orderGuideTranslations
    });

    res.json({ success: true, message: 'Successfully translated all store texts to supported languages.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/broadcast/start', async (req, res) => {
  try {
    const { message, photo_url, target_language, button_label, button_url, admin_id } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, message: 'Broadcast message is required' });
    }

    const broadcastJob = await runBroadcast(dbService, activeBots, message, {
      delayMs: 200,
      parseMode: 'HTML',
      photoUrl: photo_url,
      targetLanguage: target_language || 'ALL',
      buttonLabel: button_label,
      buttonUrl: button_url,
      adminId: admin_id || 'admin'
    });

    res.json({ success: true, broadcast: broadcastJob });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/broadcast/status', (req, res) => {
  try {
    res.json({ success: true, status: getBroadcastStatus() });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/broadcast/stop', (req, res) => {
  try {
    stopBroadcast();
    res.json({ success: true, message: 'Broadcast process stopped.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ENVIRONMENT VARIABLES MANAGEMENT API

app.get('/api/env', async (req, res) => {
  try {
    const categorized = getCategorizedEnvVars();
    const flat = getAllEnvVars();
    res.json({ success: true, data: { categorized, flat } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/env/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const value = getEnvVar(key);
    if (value === null) {
      return res.status(404).json({ success: false, message: 'Environment variable not found' });
    }
    const validation = validateEnvValue(key, value);
    res.json({ success: true, data: { key, value, ...validation } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/env', async (req, res) => {
  try {
    const { key, value } = req.body;
    if (!key || value === undefined) {
      return res.status(400).json({ success: false, message: 'Key and value are required' });
    }
    if (!validateEnvKey(key)) {
      return res.status(400).json({ success: false, message: 'Invalid key format. Use UPPER_SNAKE_CASE' });
    }
    const validation = validateEnvValue(key, value);
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.error });
    }
    const result = setEnvVar(key, value);
    if (result.success) {
      process.env[key] = String(value);
      res.json({ success: true, message: `Environment variable ${key} updated`, warning: validation.warning });
    } else {
      res.status(500).json({ success: false, message: result.error });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/env', async (req, res) => {
  try {
    const { variables } = req.body;
    if (!variables || typeof variables !== 'object') {
      return res.status(400).json({ success: false, message: 'Variables object is required' });
    }
    const errors: string[] = [];
    const validVars: Record<string, any> = {};
    Object.entries(variables).forEach(([key, value]) => {
      if (!validateEnvKey(key)) {
        errors.push(`Invalid key format: ${key}`);
      } else {
        const validation = validateEnvValue(key, value);
        if (!validation.valid) {
          errors.push(`Invalid value for ${key}: ${validation.error}`);
        } else {
          validVars[key] = value;
        }
      }
    });
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: 'Validation errors', errors });
    }
    const result = setEnvVars(validVars);
    if (result.success) {
      Object.entries(validVars).forEach(([key, value]) => {
        process.env[key] = String(value);
      });
      res.json({ success: true, message: `${Object.keys(validVars).length} environment variables updated` });
    } else {
      res.status(500).json({ success: false, message: result.error });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/env/:key', async (req, res) => {
  try {
    const { key } = req.params;
    if (!validateEnvKey(key)) {
      return res.status(400).json({ success: false, message: 'Invalid key format' });
    }
    const result = deleteEnvVar(key);
    if (result.success) {
      delete process.env[key];
      res.json({ success: true, message: `Environment variable ${key} deleted` });
    } else {
      res.status(500).json({ success: false, message: result.error });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/env/backup', async (req, res) => {
  try {
    const result = backupEnvFile();
    if (result.success) {
      res.json({ success: true, message: 'Backup created successfully', backupPath: result.backupPath });
    } else {
      res.status(400).json({ success: false, message: result.error });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/env/backups', async (req, res) => {
  try {
    const backups = listEnvBackups();
    res.json({ success: true, data: backups });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/env/restore', async (req, res) => {
  try {
    const { backupPath } = req.body;
    if (!backupPath) {
      return res.status(400).json({ success: false, message: 'backupPath is required' });
    }
    const result = restoreEnvFile(backupPath);
    if (result.success) {
      dotenv.config({ override: true });
      res.json({ success: true, message: 'Environment restored from backup. Server restart recommended.' });
    } else {
      res.status(400).json({ success: false, message: result.error });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/webhooks/nowpayments', async (req, res) => {
  try {
    const rawPayload = (req as any).rawBody || JSON.stringify(req.body);
    const signature = req.headers['x-nowpayments-sig'] as string;

    const isValid = cryptoGateway.verifyIpnSignature(rawPayload, signature);
    if (!isValid) {
      console.warn('[Webhook] Invalid NOWPayments signature received');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const payload = req.body;
    console.log('[Webhook] Valid NOWPayments notification:', payload.payment_id, payload.payment_status);

    const orderId = payload.order_id;
    const paymentStatus = payload.payment_status;

    if (orderId && (paymentStatus === 'finished' || paymentStatus === 'confirmed')) {
      const order = await dbService.getOrder(orderId);
      if (order && order.payment_status !== 'PAID' && order.payment_status !== 'VERIFIED_BY_ADMIN') {
        let deliveredAccount = order.account_delivered;
        if (!deliveredAccount) {
          try {
            const stock: any = await dbService.claimAvailableStock(order.product_id, order.order_id);
            if (stock && stock.account_data) {
              deliveredAccount = stock.account_data;
            } else {
              deliveredAccount = 'Account not available in stock. Admin will send it shortly.';
            }
          } catch (e: any) {
            deliveredAccount = 'Account ready to be sent manually by admin.';
          }
        }

        await dbService.updateOrder(orderId, {
          payment_status: 'PAID',
          payment_id: payload.payment_id,
          account_delivered: deliveredAccount,
          updated_at: new Date().toISOString()
        });

        sendTelegramDeliveryNotice({ ...order, order_id: orderId }, deliveredAccount).catch(() => {});
      }
    }

    res.json({ success: true });
  } catch (err: any) {
    console.error('[Webhook Error]:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/webhooks/telegram/:tokenId', async (req, res) => {
  const { tokenId } = req.params;
  const botRecord = activeBots.get(tokenId);

  if (botRecord && botRecord.bot) {
    try {
      await botRecord.bot.handleUpdate(req.body, res);
      return;
    } catch (err: any) {
      console.error(`[Webhook Telegram] Processing error for bot ${tokenId}:`, err.message);
    }
  }

  res.sendStatus(200);
});

(async () => {
  try {
    await autoMigrateUniversalDatabase(dbService);
    await startMultiBotManager(dbService);
    await initializeWebhooks(dbService, process.env.APP_URL || process.env.VERCEL_URL);
  } catch (botErr: any) {
    console.warn('[MultiBot Manager Warning]:', botErr.message);
  }
})();

if (process.env.NODE_ENV !== 'production') {
  try {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } catch (vErr) {
    console.warn('[Vite Server Middleware Note]:', vErr);
  }
} else {
  const distPath = path.join(process.cwd(), 'dist');
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
}

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Server Ready] Store Express backend online on port ${PORT}`);
});

process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception]:', err.message);
});

process.on('unhandledRejection', (reason: any) => {
  console.error('[Unhandled Rejection]:', reason?.message || reason);
});

export default app;
export { app };

export async function bootstrapServerless() {
  try {
    await dbService.ensureSeeded();
    if (dbService.hasSupabase) {
      await autoCreateSupabaseTables();
    }
    console.log('[Vercel] Serverless bootstrap completed');
  } catch (err: any) {
    console.warn('[Vercel] Bootstrap note:', err.message);
  }
}
