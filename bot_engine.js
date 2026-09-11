/**
 * Telegram Multi-Bot Engine
 * Features:
 * - 10-Language Multi-Lingual Support (ID, MS, ZH, RU, IT, ES, HI, UZ, AR, EN)
 * - Real Telegram long-polling via Telegraf
 * - Clean UI (auto-delete user command and previous bot message for pristine chat)
 * - Session tracking in Firestore collection 'user_sessions'
 * - Real NOWPayments invoice generation and manual crypto wallets (TRC-20, BEP-20, BTC, SOL)
 * - Strict payment verification (never release accounts before confirmed blockchain payment or admin approval)
 * - Atomic stock locking and release (runTransaction)
 * - Auto-translation using Google Gen AI SDK (gemini-3.8-flash)
 */

import { Telegraf, Markup } from 'telegraf';
import { GoogleGenAI } from '@google/genai';
import cryptoGateway from './crypto_gateway.js';
import { 
  SUPPORTED_LANGUAGES, 
  getUI, 
  getLocalizedWelcome, 
  getLocalizedTerms, 
  getLocalizedPaymentGuide,
  getLocalizedOrderGuide,
  getLocalizedProduct,
  getLocalizedPaymentStatus,
  getLocalizedPaymentMethod,
  formatLocalizedOrderReceipt,
  getTokenExplorerUrl,
  getQrCodeUrl,
  DEFAULT_WELCOME_TEXTS,
  DEFAULT_TERMS_TEXTS,
  DEFAULT_PAYMENT_GUIDES,
  DEFAULT_ORDER_GUIDES
} from './translations.js';
import {
  cleanSystemCache,
  cleanCancelledOrders,
  autoMigrateUniversalDatabase
} from './multi_db.js';
import { getBroadcastStatus, stopBroadcast } from './broadcast_engine.js';

// Cache of active bot instances: tokenId -> { bot, token, info, status, stop }
export const activeBots = new Map();

// --- Bot Engine Runtime Metrics (for realtime dashboard monitoring) ---
const engineMetrics = {
  started_at: Date.now(),
  engine_mode: process.env.VERCEL ? 'webhook' : 'long_polling',
  total_requests: 0,
  last_update_at: null,
  last_latency_ms: 0,
  reconnects: 0,
  polling_alive: false
};

export function recordUpdateProcessed(latencyMs = 0) {
  engineMetrics.total_requests++;
  engineMetrics.last_update_at = new Date().toISOString();
  engineMetrics.last_latency_ms = Math.round(latencyMs);
}

export function getBotEngineMetrics() {
  const uptimeSeconds = Math.floor((Date.now() - engineMetrics.started_at) / 1000);
  return {
    engine_mode: engineMetrics.engine_mode,
    engine_label: engineMetrics.engine_mode === 'webhook'
      ? '[ONLINE] Webhook Active'
      : '[ONLINE] Long Polling Active',
    uptime_seconds: uptimeSeconds,
    uptime_human: `${Math.floor(uptimeSeconds / 3600)}j ${Math.floor((uptimeSeconds % 3600) / 60)}m ${uptimeSeconds % 60}s`,
    latency_ms: engineMetrics.last_latency_ms,
    total_requests: engineMetrics.total_requests,
    last_update_at: engineMetrics.last_update_at,
    reconnects: engineMetrics.reconnects,
    polling_alive: engineMetrics.polling_alive,
    active_bots: activeBots.size
  };
}

/**
 * Build a JSON snapshot of the core database collections for backup purposes.
 */
export async function buildDatabaseBackup(dbService) {
  const [products, orders, stocks, settings, wallets, botTokens, admins, users, coupons] = await Promise.all([
    dbService.getProducts().catch(() => []),
    dbService.getOrders().catch(() => []),
    dbService.getStocks().catch(() => []),
    dbService.getSettings().catch(() => ({})),
    dbService.getWallets().catch(() => []),
    dbService.getBotTokens().catch(() => []),
    dbService.getAdmins().catch(() => []),
    dbService.getUsers().catch(() => []),
    dbService.getCoupons ? dbService.getCoupons().catch(() => []) : []
  ]);

  return {
    exported_at: new Date().toISOString(),
    version: '3.0',
    counts: {
      products: products.length,
      orders: orders.length,
      stocks: stocks.length,
      wallets: wallets.length,
      bot_tokens: botTokens.length,
      admins: admins.length,
      users: users.length,
      coupons: coupons.length
    },
    data: {
      products,
      orders,
      stocks,
      settings,
      wallets,
      bot_tokens: botTokens,
      admins: admins.map((a) => ({ ...a, password_hash: '***MASKED***' })),
      users,
      coupons
    }
  };
}

// Initialize Gemini for dynamic translation if key is provided
let geminiClient = null;
function getGemini() {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    try {
      geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    } catch (e) {
      console.warn('Gemini client init skipped:', e.message);
    }
  }
  return geminiClient;
}

/**
 * Dynamic translator using Gemini (gemini-3.8-flash)
 */
export async function translateText(text, targetLang = 'id') {
  if (!text || !targetLang || targetLang === 'id') return text;
  
  const ai = getGemini();
  if (!ai) return text;

  try {
    const prompt = `You are an expert translator for a Telegram digital goods store. Translate the following text into language code '${targetLang}'. Keep all HTML tags (<b>, <i>, <code>, <pre>), emojis, symbols, and technical credentials (like email, passwords, tokens) intact:\n\n${text}`;
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt
    });
    return response.text?.trim() || text;
  } catch (err) {
    console.error('Translation error, using fallback:', err.message);
    return text;
  }
}

// In-memory cache so repeated strings are only translated once per language.
const AUTO_TRANSLATE_CACHE = new Map();

/**
 * Auto-translate an Indonesian (or base) string into the target language using
 * Gemini, with a per-language cache. Falls back to the original text if no API
 * key is configured or the translation fails, so the bot never breaks.
 */
export async function autoTranslate(text, targetLang = 'id') {
  if (!text || !targetLang || targetLang === 'id') return text;
  const cacheKey = `${targetLang}::${text}`;
  if (AUTO_TRANSLATE_CACHE.has(cacheKey)) return AUTO_TRANSLATE_CACHE.get(cacheKey);

  const translated = await translateText(text, targetLang);
  // Only cache successful (changed) translations to avoid caching raw fallbacks.
  if (typeof translated === 'string' && translated.trim()) {
    AUTO_TRANSLATE_CACHE.set(cacheKey, translated);
  }
  return translated;
}

/**
 * Helper: Parse raw account string into clean structured representation
 */
export function parseAccountCredential(accountData = '') {
  if (!accountData) return { raw: '' };
  
  // Format could be: Email:Password:Cookie:ApiKey:Note or newline separated
  const parts = accountData.split(':');
  if (parts.length >= 3) {
    return {
      raw: accountData,
      email: parts[0]?.trim(),
      password: parts[1]?.trim(),
      cookie: parts[2]?.trim(),
      apiKey: parts[3]?.trim() || null,
      note: parts.slice(4).join(':').trim() || null
    };
  }
  return { raw: accountData };
}

/**
 * Build language selection inline keyboard
 */
function buildLanguageKeyboard() {
  const rows = [];
  for (let i = 0; i < SUPPORTED_LANGUAGES.length; i += 2) {
    const row = [
      Markup.button.callback(`${SUPPORTED_LANGUAGES[i].flag} ${SUPPORTED_LANGUAGES[i].name}`, `set_lang_${SUPPORTED_LANGUAGES[i].code}`)
    ];
    if (i + 1 < SUPPORTED_LANGUAGES.length) {
      row.push(
        Markup.button.callback(`${SUPPORTED_LANGUAGES[i + 1].flag} ${SUPPORTED_LANGUAGES[i + 1].name}`, `set_lang_${SUPPORTED_LANGUAGES[i + 1].code}`)
      );
    }
    rows.push(row);
  }
  rows.push([Markup.button.callback('🔙 Kembali / Back', 'menu_main')]);
  return Markup.inlineKeyboard(rows);
}

/**
 * Creates and configures a Telegraf bot instance with Clean UI & Multi-Language Support
 */
export function createBotInstance(botConfig, dbService) {
  const { token_id, bot_token, bot_name } = botConfig;
  const bot = new Telegraf(bot_token);

  // Request/latency tracking middleware for realtime engine monitoring
  bot.use(async (ctx, next) => {
    const start = Date.now();
    try {
      await next();
    } finally {
      recordUpdateProcessed(Date.now() - start);
    }
  });

  // Global error handler to prevent bot or Node from crashing on unhandled rejection
  bot.catch((err, ctx) => {
    console.error(`[Bot Engine] [${bot_name}] Error for update ${ctx?.updateType || 'unknown'}:`, err.message || err);
  });

  // Helper: Retrieve user language from Firestore or Telegram context
  async function getUserLang(ctx) {
    const telegramId = String(ctx.from?.id || ctx.chat?.id);
    try {
      const session = await dbService.getUserSession(telegramId);
      if (session?.language) return session.language;
    } catch (e) {}

    // Fallback to Telegram client language code
    const raw = (ctx.from?.language_code || 'id').toLowerCase();
    const match = SUPPORTED_LANGUAGES.find(l => raw.startsWith(l.code));
    return match ? match.code : 'id';
  }

  // Helper: Clean UI - Deletes previous messages and keeps chat crystal clean
  async function cleanAndSend(ctx, text, keyboard = null, options = {}) {
    const telegramId = String(ctx.from?.id || ctx.chat?.id);

    // Optional auto-translation for hardcoded (non-localized) strings.
    // Callers pass { translate: true } for strings that are still Indonesian-only.
    if (options.translate && text && !options._translated) {
      try {
        const targetLang = await getUserLang(ctx);
        if (targetLang && targetLang !== 'id') {
          text = await autoTranslate(text, targetLang);
        }
      } catch (e) {}
    }

    // Auto-delete incoming user command or message if present
    if (ctx.message?.message_id) {
      try {
        await ctx.telegram.deleteMessage(ctx.chat.id, ctx.message.message_id);
      } catch (e) {
        // Can fail if message is too old or no delete permission
      }
    }

    // Retrieve previous bot messages from session and delete them
    try {
      const session = await dbService.getUserSession(telegramId);
      const toDelete = new Set();
      if (session?.last_message_id) toDelete.add(session.last_message_id);
      if (Array.isArray(session?.message_history)) {
        session.message_history.forEach(id => toDelete.add(id));
      }
      
      for (const msgId of toDelete) {
        try {
          await ctx.telegram.deleteMessage(ctx.chat.id, msgId);
        } catch (e) {
          // Ignored if already deleted or expired (>48h)
        }
      }
    } catch (e) {
      console.warn('Failed to clean previous messages:', e.message);
    }

    // Send new message with safe parsing and photo fallback
    const sendOptions = {
      parse_mode: 'HTML',
      disable_web_page_preview: false,
      ...options
    };
    if (keyboard) {
      sendOptions.reply_markup = keyboard.reply_markup || keyboard;
    }

    let newMsg;
    if (options.photo) {
      try {
        newMsg = await ctx.telegram.sendPhoto(ctx.chat.id, options.photo, {
          caption: text,
          parse_mode: 'HTML',
          reply_markup: sendOptions.reply_markup
        });
      } catch (photoErr) {
        console.warn('[Bot Engine] Photo send fallback to message:', photoErr.message);
        try {
          newMsg = await ctx.telegram.sendMessage(ctx.chat.id, text, sendOptions);
        } catch (sendErr) {
          const plainText = text.replace(/<[^>]*>?/gm, '');
          const fallbackOpts = { ...sendOptions };
          delete fallbackOpts.parse_mode;
          newMsg = await ctx.telegram.sendMessage(ctx.chat.id, plainText, fallbackOpts);
        }
      }
    } else {
      try {
        newMsg = await ctx.telegram.sendMessage(ctx.chat.id, text, sendOptions);
      } catch (sendErr) {
        // If Telegram rejects entity parsing (e.g. unclosed tags or syntax error in text)
        if (sendErr?.message && (sendErr.message.includes("can't parse entities") || sendErr.message.includes('tag'))) {
          const plainText = text.replace(/<[^>]*>?/gm, '');
          const fallbackOpts = { ...sendOptions };
          delete fallbackOpts.parse_mode;
          newMsg = await ctx.telegram.sendMessage(ctx.chat.id, plainText, fallbackOpts);
        } else {
          throw sendErr;
        }
      }
    }

    // Persist new message ID and history to session
    try {
      const session = await dbService.getUserSession(telegramId);
      const history = Array.isArray(session?.message_history) ? session.message_history : [];
      history.push(newMsg.message_id);
      // Keep last 8 message IDs
      const trimmedHistory = history.slice(-8);

      await dbService.updateUserSession(telegramId, {
        last_message_id: newMsg.message_id,
        message_history: trimmedHistory,
        current_state: options.state || 'idle',
        updated_at: new Date().toISOString()
      });
    } catch (e) {
      console.error('Session update error:', e.message);
    }

    return newMsg;
  }

  // Strict Admin Verification Helper (Strict Telegram ID Auth)
  async function isUserAdmin(telegramId) {
    if (!telegramId) return false;
    const strId = String(telegramId).trim();

    // 1. Check environment variables
    const envIds = [
      process.env.ADMIN_TELEGRAM_ID,
      process.env.ADMIN_TELEGRAM_IDS,
      process.env.TELEGRAM_ADMIN_ID,
      process.env.TELEGRAM_ADMIN_IDS,
      process.env.ADMIN_USER_ID,
      process.env.ADMIN_USER_IDS
    ]
      .filter(Boolean)
      .flatMap(val => String(val).split(','))
      .map(s => s.trim())
      .filter(Boolean);

    if (envIds.includes(strId)) return true;

    // 2. Check Database Admins
    try {
      const admins = await dbService.getAdmins();
      if (admins && admins.length > 0) {
        const match = admins.find(a => 
          String(a.telegram_id || '').trim() === strId ||
          String(a.admin_id || '').trim() === strId
        );
        if (match) return true;
      }
    } catch (e) {}

    // 3. Check registered users
    try {
      const user = await dbService.getUser(strId);
      if (user?.role === 'admin' || user?.role === 'superadmin' || user?.is_admin) return true;
    } catch (e) {}

    return false;
  }

  // Helper: Build dynamic main menu keyboard with active channel buttons
  async function buildMainMenuKeyboard(userLang, isAdmin = false) {
    const buttons = [
      [Markup.button.callback(getUI('menu_catalog', userLang), 'menu_catalog')],
      [
        Markup.button.callback(getUI('menu_orders', userLang), 'menu_orders'),
        Markup.button.callback(getUI('menu_payments', userLang), 'menu_payments')
      ]
    ];

    try {
      const channels = await dbService.getActiveChannels();
      if (channels && channels.length > 0) {
        // Two channel buttons per row, up to 6 channels shown in the main menu.
        const channelButtons = [];
        for (const ch of channels.slice(0, 6)) {
          const link = ch.invite_link || (ch.username ? `https://t.me/${ch.username.replace('@', '')}` : null);
          const label = ch.name || ch.username || 'Channel Telegram';
          if (link) channelButtons.push(Markup.button.url(`📢 ${label}`, link));
        }
        for (let i = 0; i < channelButtons.length; i += 2) {
          buttons.push(channelButtons.slice(i, i + 2));
        }
      }
    } catch (e) {
      console.warn('Channel button note:', e.message);
    }

    buttons.push([
      Markup.button.callback(getUI('menu_help', userLang), 'menu_help'),
      Markup.button.callback(getUI('menu_language', userLang), 'menu_language')
    ]);

    // STRICT: Only render Admin Panel button for authorized admins!
    if (isAdmin) {
      buttons.push([
        Markup.button.callback('👑 Panel Admin Toko', 'admin_menu')
      ]);
    }

    return Markup.inlineKeyboard(buttons);
  }

  // Shared helper: build a manual (QRIS / E-Wallet / Bank) order, persist it and
  // render the invoice. Used by both the custom-method and instant-QRIS actions
  // so order/credential changes only live in one place.
  async function createManualOrderAndInvoice(ctx, { productId, method, orderPrefix, qrDataBuilder, titleBuilder, instructionsBuilder }) {
    const telegramId = String(ctx.from.id);
    const username = ctx.from.username || '';
    const userLang = await getUserLang(ctx);

    const rawProduct = await dbService.getProduct(productId);
    if (!rawProduct) {
      await ctx.answerCbQuery('❌ Produk tidak ditemukan.', { show_alert: true });
      return;
    }
    const product = getLocalizedProduct(rawProduct, userLang);

    // Apply any coupon the buyer redeemed for this session
    const session = await dbService.getUserSession(telegramId).catch(() => null);
    const appliedCoupon = session?.applied_coupon;
    const baseIdrRaw = product.price_idr || 15000;
    const couponDiscount = appliedCoupon && appliedCoupon.valid ? Number(appliedCoupon.discount_amount) || 0 : 0;
    const baseIdr = Math.max(0, baseIdrRaw - couponDiscount);

    // Generate unique code for IDR payments (100 - 999)
    const uniqueCode = Math.floor(100 + Math.random() * 900);
    const totalAmountIdr = baseIdr + uniqueCode;

    const orderId = `${orderPrefix}-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const qrUrl = (method?.qr_image_url) || getQrCodeUrl(qrDataBuilder(orderId, totalAmountIdr), 300);

    const orderDoc = {
      order_id: orderId,
      user_id: telegramId,
      username: username,
      user_lang: userLang,
      product_id: productId,
      product_title: product.title,
      payment_method: method?.type || 'manual_idr',
      payment_method_name: method?.name || 'QRIS / E-Wallet',
      payment_gateway: 'Manual',
      payment_status: 'PENDING',
      unique_code: uniqueCode,
      total_amount_idr: totalAmountIdr,
      amount: totalAmountIdr,
      currency: 'IDR',
      coupon_code: appliedCoupon?.code || null,
      coupon_discount: couponDiscount,
      crypto_address: method?.account_number || 'QRIS',
      crypto_network: method?.name || 'QRIS',
      account_delivered: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await dbService.createOrder(orderDoc);

    // Auto-notify the registered admin group/channel about this manual order.
    notifyAdminGroupNewOrder(orderDoc).catch(() => {});

    // Consume the coupon usage and clear it from the session
    if (appliedCoupon?.code) {
      try {
        const couponRecord = await dbService.getCouponByCode(appliedCoupon.code);
        if (couponRecord) await dbService.incrementCouponUsage(couponRecord.coupon_id);
      } catch (e) {}
      await dbService.updateUserSession(telegramId, { applied_coupon: null, updated_at: new Date().toISOString() }).catch(() => {});
    }

    const couponNote = couponDiscount > 0
      ? `\n🎟️ <b>Kupon ${appliedCoupon.code}:</b> -Rp ${couponDiscount.toLocaleString('id-ID')}`
      : '';

    const invoiceText = titleBuilder({ orderId, product, totalAmountIdr, uniqueCode, method, userLang }) +
      couponNote +
      instructionsBuilder({ totalAmountIdr, userLang });

    const buttons = [
      [Markup.button.callback(getUI('btn_check_payment', userLang), `check_pay_${orderId}`)],
      [Markup.button.url(getUI('btn_open_qr', userLang), qrUrl)],
      [Markup.button.callback(getUI('btn_send_txid', userLang), `prompt_txid_${orderId}`)],
      [Markup.button.callback(getUI('btn_cancel_order', userLang), `cancel_order_${orderId}`)],
      [Markup.button.callback(getUI('btn_back', userLang), 'menu_main')]
    ];

    await cleanAndSend(ctx, invoiceText, Markup.inlineKeyboard(buttons), { photo: qrUrl, state: `order_${orderId}`, translate: true });
  }

  // --- Handlers ---

  // /start & /menu
  bot.command(['start', 'menu'], async (ctx) => {
    const telegramId = String(ctx.from.id);
    const username = ctx.from.username || '';
    const userLang = await getUserLang(ctx);
    const isAdmin = await isUserAdmin(telegramId);

    // Track source channel if referred via deep link
    const payload = ctx.startPayload || '';
    if (payload.startsWith('ref_') || payload.startsWith('ch_')) {
      const channelId = payload.startsWith('ref_') ? payload.replace('ref_', '') : payload;
      await dbService.updateUserSession(telegramId, { source_channel_id: channelId });
      try {
        const channels = await dbService.getChannels();
        const ch = channels.find(c => c.channel_id === channelId || c.source_tag === channelId);
        if (ch) {
          if (typeof dbService.incrementChannelCounter === 'function') {
            await dbService.incrementChannelCounter(ch.channel_id, 'clicks_count', 1);
          } else {
            await dbService.saveChannel({ ...ch, clicks_count: (ch.clicks_count || 0) + 1 });
          }
        }
      } catch (e) {}
    }

    // Upsert user in Firestore
    await dbService.upsertUser({
      telegram_id: telegramId,
      username: username,
      first_name: ctx.from.first_name || '',
      language: userLang,
      last_active: new Date().toISOString()
    });

    const settings = await dbService.getSettings() || {};
    const welcomeText = getLocalizedWelcome(settings, userLang);
    const keyboard = await buildMainMenuKeyboard(userLang, isAdmin);

    await cleanAndSend(ctx, welcomeText, keyboard, { state: 'main_menu' });
  });

  // /language command
  bot.command(['language', 'lang'], async (ctx) => {
    const userLang = await getUserLang(ctx);
    const msg = `🌐 <b>PILIH BAHASA / SELECT LANGUAGE</b>\n\n` +
      `Silakan pilih bahasa yang ingin Anda gunakan untuk seluruh katalog, menu, dan instruksi pembelian:`;
    await cleanAndSend(ctx, msg, buildLanguageKeyboard(), { state: 'language_select' });
  });

  // Action: Open Language Selection
  bot.action('menu_language', async (ctx) => {
    await ctx.answerCbQuery();
    const msg = `🌐 <b>PILIH BAHASA / CHOOSE YOUR LANGUAGE</b>\n\n` +
      `Semua teks, produk, petunjuk pembayaran, dan kredensial akun akan otomatis ditampilkan dalam bahasa yang Anda pilih:`;
    await cleanAndSend(ctx, msg, buildLanguageKeyboard(), { state: 'language_select' });
  });

  // Action: Set Language callback
  bot.action(/^set_lang_(.+)$/, async (ctx) => {
    const newLang = ctx.match[1];
    const telegramId = String(ctx.from.id);

    // Save language preference in Firestore
    await dbService.updateUserSession(telegramId, { language: newLang });
    await dbService.upsertUser({ telegram_id: telegramId, language: newLang });

    const confirmMsg = getUI('lang_changed_msg', newLang);
    await ctx.answerCbQuery(confirmMsg, { show_alert: false });

    // Show refreshed main menu in new language
    const settings = await dbService.getSettings() || {};
    const welcomeText = getLocalizedWelcome(settings, newLang);
    const keyboard = await buildMainMenuKeyboard(newLang);

    await cleanAndSend(ctx, `${confirmMsg}\n\n${welcomeText}`, keyboard, { state: 'main_menu' });
  });

  // Action: Catalog
  bot.action('menu_catalog', async (ctx) => {
    await ctx.answerCbQuery();
    const userLang = await getUserLang(ctx);
    const products = await dbService.getProducts();

    if (!products || products.length === 0) {
      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback(getUI('btn_back', userLang), 'menu_main')]
      ]);
      return cleanAndSend(ctx, '⚠️ <i>Saat ini belum ada produk yang tersedia di katalog.</i>', keyboard);
    }

    // Build buttons for products with real available stock count
    const buttons = [];
    for (const rawProd of products) {
      const prod = getLocalizedProduct(rawProd, userLang);
      const stockCount = await dbService.getAvailableStockCount(prod.product_id);
      const isAvailable = stockCount > 0;
      const stockBadge = isAvailable ? `[${getUI('stock_badge', userLang)}: ${stockCount}]` : `[${getUI('out_of_stock', userLang)}]`;

      buttons.push([
        Markup.button.callback(
          `${prod.title} - $${prod.price_usd} ${stockBadge}`,
          `prod_${prod.product_id}`
        )
      ]);
    }
    buttons.push([Markup.button.callback(getUI('btn_back', userLang), 'menu_main')]);

    const msg = `🛍️ <b>${getUI('menu_catalog', userLang).toUpperCase()}</b>\n\n` +
      `${getUI('catalog_select_prompt', userLang)}`;

    await cleanAndSend(ctx, msg, Markup.inlineKeyboard(buttons), { state: 'catalog' });
  });

  // Action: View Product Details
  bot.action(/^prod_(.+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const productId = ctx.match[1];
    const userLang = await getUserLang(ctx);
    const rawProduct = await dbService.getProduct(productId);

    if (!rawProduct) {
      return cleanAndSend(ctx, '❌ Produk tidak ditemukan.', Markup.inlineKeyboard([
        [Markup.button.callback(getUI('btn_back_catalog', userLang), 'menu_catalog')]
      ]));
    }

    const product = getLocalizedProduct(rawProduct, userLang);
    const stockCount = await dbService.getAvailableStockCount(productId);
    const isAvailable = stockCount > 0;

    let text = `📦 <b>${product.title}</b>\n\n` +
      `🏷️ <b>Kategori:</b> ${product.category || 'Digital Goods'}\n` +
      `💵 <b>Harga USD:</b> $${product.price_usd}\n` +
      `🇮🇩 <b>Harga IDR:</b> Rp ${(product.price_idr || 0).toLocaleString('id-ID')}\n` +
      `📊 <b>${getUI('stock_badge', userLang)}:</b> ${isAvailable ? `${stockCount} unit siap kirim` : `<b>${getUI('out_of_stock', userLang)}</b>`}\n\n` +
      `📝 <b>Deskripsi:</b>\n${product.description || 'Akun siap pakai dengan garansi replace.'}\n\n` +
      `⚡ <i>Kredensial akun (Email:Password:Cookie) akan dikirimkan otomatis HANYA setelah pembayaran Anda sah terverifikasi.</i>`;

    const buttons = [];
    if (isAvailable) {
      buttons.push([
        Markup.button.callback(getUI('btn_buy_auto', userLang), `buy_auto_${productId}`),
        Markup.button.callback(getUI('btn_buy_manual', userLang), `buy_manual_${productId}`)
      ]);
    } else {
      buttons.push([
        Markup.button.callback(getUI('out_of_stock', userLang), `out_of_stock_${productId}`)
      ]);
    }
    buttons.push([Markup.button.callback(getUI('btn_back_catalog', userLang), 'menu_catalog')]);

    await cleanAndSend(ctx, text, Markup.inlineKeyboard(buttons), { state: `prod_${productId}` });
  });

  // Action: Clicked Out of Stock
  bot.action(/^out_of_stock_(.+)$/, async (ctx) => {
    const userLang = await getUserLang(ctx);
    await ctx.answerCbQuery(getUI('out_of_stock_alert', userLang), { show_alert: true });
  });

  // Action: Buy via NOWPayments (Automatic Crypto)
  bot.action(/^buy_auto_(.+)$/, async (ctx) => {
    const productId = ctx.match[1];
    const telegramId = String(ctx.from.id);
    const username = ctx.from.username || '';
    const userLang = await getUserLang(ctx);

    // STRICT STOCK CHECK: Verify available stock before generating order
    const stockCount = await dbService.getAvailableStockCount(productId);
    if (stockCount <= 0) {
      await ctx.answerCbQuery(getUI('out_of_stock_alert', userLang), { show_alert: true });
      return cleanAndSend(ctx, getUI('out_of_stock_alert', userLang), Markup.inlineKeyboard([
        [Markup.button.callback(getUI('btn_back_catalog', userLang), 'menu_catalog')]
      ]));
    }

    await ctx.answerCbQuery('Menghubungkan ke gateway pembayaran kripto...');

    // HARD GUARD: NEVER create an automatic-crypto order when NOWPayments is not
    // connected. This prevents fake/unpayable orders from piling up.
    if (typeof cryptoGateway.isConfigured === 'function' && !cryptoGateway.isConfigured()) {
      await ctx.answerCbQuery('Gateway pembayaran otomatis belum aktif.', { show_alert: true });
      return cleanAndSend(ctx,
        `⚠️ <b>PEMBAYARAN OTOMATIS BELUM TERSEDIA</b>\n\n` +
        `Metode <b>Bayar Otomatis Kripto</b> sedang tidak aktif karena gateway (NOWPayments) belum terhubung.\n\n` +
        `Silakan gunakan metode <b>Bayar Manual</b> (QRIS / E-Wallet / Transfer Kripto) untuk menyelesaikan pembelian Anda.`,
        Markup.inlineKeyboard([
          [Markup.button.callback('💳 Bayar Manual', `buy_manual_${productId}`)],
          [Markup.button.callback(getUI('btn_back_catalog', userLang), 'menu_catalog')]
        ])
      );
    }

    const rawProduct = await dbService.getProduct(productId);
    if (!rawProduct) {
      return cleanAndSend(ctx, '❌ Produk tidak ditemukan atau sudah tidak tersedia.', Markup.inlineKeyboard([
        [Markup.button.callback(getUI('btn_back_catalog', userLang), 'menu_catalog')]
      ]));
    }
    const product = getLocalizedProduct(rawProduct, userLang);
    const orderId = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Generate NOWPayments transaction (only reachable when configured)
    const nowpaymentsResult = await cryptoGateway.createPayment({
      orderId,
      priceAmountUsd: product.price_usd,
      payCurrency: 'usdttrc20',
      orderDescription: `${product.title} (User: @${username || telegramId})`,
      callbackUrl: ''
    });

    // If the gateway call itself failed, do NOT create a fake order.
    if (!nowpaymentsResult.success || !nowpaymentsResult.payAddress) {
      await ctx.answerCbQuery('Gateway gagal membuat invoice.', { show_alert: true });
      return cleanAndSend(ctx,
        `❌ <b>GAGAL MEMBUAT INVOICE OTOMATIS</b>\n\n` +
        `${nowpaymentsResult.error || 'Gateway pembayaran otomatis sedang gangguan.'}\n\n` +
        `Silakan coba lagi sebentar atau gunakan metode <b>Bayar Manual</b>.`,
        Markup.inlineKeyboard([
          [Markup.button.callback('💳 Bayar Manual', `buy_manual_${productId}`)],
          [Markup.button.callback(getUI('btn_back_catalog', userLang), 'menu_catalog')]
        ])
      );
    }

    const cryptoAddress = nowpaymentsResult.payAddress;
    const payAmount = nowpaymentsResult.payAmount || product.price_usd;
    const paymentId = String(nowpaymentsResult.paymentId || '');

    // Persist order in Firestore with initial PENDING status
    const orderDoc = {
      order_id: orderId,
      user_id: telegramId,
      username: username,
      user_lang: userLang,
      product_id: productId,
      product_title: product.title,
      payment_method: 'crypto_auto',
      payment_gateway: 'NOWPayments',
      payment_status: 'PENDING',
      crypto_address: cryptoAddress,
      crypto_network: 'USDT (TRC20)',
      amount: payAmount,
      currency: 'USDT',
      payment_id: paymentId,
      account_delivered: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await dbService.createOrder(orderDoc);
    notifyAdminGroupNewOrder(orderDoc).catch(() => {});

    const qrUrl = getQrCodeUrl(cryptoAddress, 300);
    const tokenUrl = nowpaymentsResult.paymentUrl || getTokenExplorerUrl('USDT (TRC-20)', cryptoAddress);

    const invoiceText = `🧾 <b>INVOICE PEMBAYARAN: #${orderId}</b>\n\n` +
      `📦 <b>Produk:</b> ${product.title}\n` +
      `💰 <b>Total Tagihan:</b> <code>${payAmount} USDT</code> (TRC-20)\n` +
      `📬 <b>Alamat Deposit Token:</b>\n<code>${cryptoAddress}</code>\n\n` +
      `🔗 <b>URL Token / Explorer:</b>\n<a href="${tokenUrl}">${tokenUrl}</a>\n\n` +
      `⚠️ <b>KEBIJAKAN PENGIRIMAN:</b>\n` +
      `1. Transfer nominal tepat ke alamat di atas (bisa scan gambar QR code).\n` +
      `2. Setelah transfer, klik tombol <b>"${getUI('btn_check_payment', userLang)}"</b> di bawah.\n` +
      `3. Akun HANYA akan dikirim otomatis bila transaksi terdeteksi & terkonfirmasi di blockchain.`;

    const buttons = [
      [Markup.button.callback(getUI('btn_check_payment', userLang), `check_pay_${orderId}`)],
      [Markup.button.url('🔍 Buka URL Token / Explorer', tokenUrl)],
      [Markup.button.callback(getUI('btn_cancel_order', userLang), `cancel_order_${orderId}`)],
      [Markup.button.callback(getUI('btn_back', userLang), 'menu_main')]
    ];

    await cleanAndSend(ctx, invoiceText, Markup.inlineKeyboard(buttons), { photo: qrUrl, state: `order_${orderId}`, translate: true });
  });

  // Action: Buy via Manual Payment Methods (QRIS, E-Wallet, Crypto)
  bot.action(/^buy_manual_(.+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const productId = ctx.match[1];
    const userLang = await getUserLang(ctx);

    // Strict stock check
    const stockCount = await dbService.getAvailableStockCount(productId);
    if (stockCount <= 0) {
      await ctx.answerCbQuery(getUI('out_of_stock_alert', userLang), { show_alert: true });
      return;
    }

    const rawProduct = await dbService.getProduct(productId);
    if (!rawProduct) {
      return cleanAndSend(ctx, '❌ Produk tidak ditemukan atau sudah tidak tersedia.', Markup.inlineKeyboard([
        [Markup.button.callback(getUI('btn_back_catalog', userLang), 'menu_catalog')]
      ]));
    }
    const product = getLocalizedProduct(rawProduct, userLang);

    // Check both general payment methods (QRIS/E-Wallet) and crypto wallets
    const pMethods = await dbService.getActivePaymentMethods().catch(() => []);
    const wallets = await dbService.getActiveCryptoWallets().catch(() => []);

    const buttons = [];

    // If custom payment methods exist
    if (pMethods && pMethods.length > 0) {
      for (const pm of pMethods) {
        const icon = pm.type === 'qris' ? '💳' : pm.type === 'ewallet' ? '📱' : pm.type === 'bank' ? '🏦' : '🌐';
        buttons.push([
          Markup.button.callback(`${icon} ${pm.name}`, `pay_custom::${productId}::${pm.method_id}`)
        ]);
      }
    } else {
      // Default quick QRIS / E-Wallet option
      buttons.push([
        Markup.button.callback('💳 QRIS (Semua E-Wallet & M-Banking)', `pay_qris_${productId}`)
      ]);
    }

    // Crypto manual option
    if (wallets && wallets.length > 0) {
      buttons.push([
        Markup.button.callback('🪙 Transfer Dompet Kripto Manual', `pay_crypto_select_${productId}`)
      ]);
    }

    // Coupon redemption entry point
    buttons.push([Markup.button.callback('🎟️ Pakai Kode Kupon Diskon', `redeem_coupon_${productId}`)]);

    buttons.push([Markup.button.callback(getUI('btn_back_catalog', userLang), `prod_${productId}`)]);

    // Show any coupon already applied to this product session
    const sessionForCoupon = await dbService.getUserSession(String(ctx.from.id)).catch(() => null);
    const activeCoupon = sessionForCoupon?.applied_coupon;
    const couponNote = activeCoupon ? `\n🎟️ <b>Kupon aktif:</b> <code>${activeCoupon.code}</code> (-Rp ${Number(activeCoupon.discount_amount || 0).toLocaleString('id-ID')})` : '';

    const msg = `💳 <b>PILIH METODE PEMBAYARAN MANUAL</b>\n\n` +
      `📦 Produk: <b>${product.title}</b>\n` +
      `💵 Harga: <b>$${product.price_usd}</b> / <b>Rp ${(product.price_idr || 0).toLocaleString('id-ID')}</b>${couponNote}\n\n` +
      `Silakan tentukan metode pembayaran yang ingin Anda gunakan:`;

    await cleanAndSend(ctx, msg, Markup.inlineKeyboard(buttons), { state: 'select_payment_method' });
  });

  // Action: Prompt buyer to type a coupon code for a given product
  bot.action(/^redeem_coupon_(.+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const productId = ctx.match[1];
    const telegramId = String(ctx.from.id);
    const userLang = await getUserLang(ctx);

    await dbService.updateUserSession(telegramId, {
      current_state: `coupon_for_${productId}`,
      updated_at: new Date().toISOString()
    });

    const msg = `🎟️ <b>REDEEM KODE KUPON</b>\n\n` +
      `Silakan kirimkan <b>kode kupon</b> Anda pada chat ini (misal: <code>DISKON10</code>).\n\n` +
      `<i>Sistem akan otomatis memotong nominal tagihan Anda saat checkout.</i>`;

    const buttons = [
      [Markup.button.callback(getUI('btn_back', userLang), `buy_manual_${productId}`)]
    ];

    await cleanAndSend(ctx, msg, Markup.inlineKeyboard(buttons), { state: `coupon_for_${productId}` });
  });

  // Action: Select crypto wallets list
  bot.action(/^pay_crypto_select_(.+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const productId = ctx.match[1];
    const userLang = await getUserLang(ctx);
    const rawProduct = await dbService.getProduct(productId);
    const product = rawProduct ? getLocalizedProduct(rawProduct, userLang) : { title: 'Product', price_usd: 0 };
    const wallets = await dbService.getActiveCryptoWallets();

    const buttons = (wallets || []).map(w => [
      Markup.button.callback(`🪙 ${w.network}`, `payw::${productId}::${w.wallet_id || w.id}`)
    ]);
    buttons.push([Markup.button.callback(getUI('btn_back', userLang), `buy_manual_${productId}`)]);

    const msg = `🪙 <b>PILIH JARINGAN BLOCKCHAIN</b>\n\n` +
      `Produk: <b>${product.title}</b> ($${product.price_usd})\n` +
      `Pilih salah satu jaringan dompet kripto di bawah untuk melihat alamat tujuan:`;

    await cleanAndSend(ctx, msg, Markup.inlineKeyboard(buttons), { state: 'select_wallet' });
  });

  // Action: Pay via Custom Payment Method (QRIS / E-Wallet / Bank)
  bot.action(/^pay_custom::(.+)::(.+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const productId = ctx.match[1];
    const methodId = ctx.match[2];

    const methods = await dbService.getPaymentMethods();
    const method = methods.find(m => m.method_id === methodId);

    await createManualOrderAndInvoice(ctx, {
      productId,
      method,
      orderPrefix: 'ORD-M',
      qrDataBuilder: (orderId, total) => `ORDER:${orderId}:${total}`,
      titleBuilder: ({ orderId, product, totalAmountIdr, uniqueCode, method }) =>
        `🧾 <b>INVOICE PEMBAYARAN: #${orderId}</b>\n\n` +
        `📦 <b>Produk:</b> ${product.title}\n` +
        `💰 <b>Total Bayar:</b> <code>Rp ${totalAmountIdr.toLocaleString('id-ID')}</code>\n` +
        `<i>(Termasuk kode unik 3 digit: +${uniqueCode} untuk verifikasi otomatis)</i>\n\n` +
        `💳 <b>Metode:</b> ${method?.name || 'QRIS'}\n` +
        (method?.account_number ? `📬 <b>Nomor Rekening / Akun:</b>\n<code>${method.account_number}</code> (${method.account_name || 'Admin'})\n\n` : ''),
      instructionsBuilder: ({ totalAmountIdr, userLang }) =>
        `📋 <b>PETUNJUK:</b>\n` +
        `1. Transfer nominal <b>tepat Rp ${totalAmountIdr.toLocaleString('id-ID')}</b> agar sistem mudah mengenali.\n` +
        `2. Setelah transfer, klik tombol <b>"${getUI('btn_send_txid', userLang)}"</b> di bawah untuk mengunggah foto struk/mutasi.\n` +
        `3. Akun digital Anda akan langsung dikirim setelah verifikasi pembayaran.`
    });
  });

  // Action: Pay via Instant QRIS
  bot.action(/^pay_qris_(.+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const productId = ctx.match[1];

    await createManualOrderAndInvoice(ctx, {
      productId,
      method: { type: 'qris', name: 'QRIS', account_number: 'QRIS ALL PAYMENT' },
      orderPrefix: 'ORD-QRIS',
      qrDataBuilder: (orderId, total) => `QRIS:${orderId}:${total}`,
      titleBuilder: ({ orderId, product, totalAmountIdr, uniqueCode }) =>
        `🧾 <b>INVOICE QRIS: #${orderId}</b>\n\n` +
        `📦 <b>Produk:</b> ${product.title}\n` +
        `💰 <b>Total Tagihan:</b> <code>Rp ${totalAmountIdr.toLocaleString('id-ID')}</code>\n` +
        `<i>(Termasuk kode unik transfer <b>+${uniqueCode}</b>)</i>\n\n` +
        `🌐 <b>Dapat discan dengan:</b> GoPay, OVO, DANA, BCA, BRI, Mandiri, ShopeePay, dll.\n\n`,
      instructionsBuilder: ({ totalAmountIdr, userLang }) =>
        `📋 <b>PETUNJUK:</b>\n` +
        `1. Scan QR Code di atas menggunakan aplikasi bank atau e-wallet Anda.\n` +
        `2. Masukkan nominal persis <b>Rp ${totalAmountIdr.toLocaleString('id-ID')}</b>.\n` +
        `3. Klik <b>"${getUI('btn_send_txid', userLang)}"</b> untuk mengirim screenshot bukti transfer.\n` +
        `4. Akun digital Anda akan segera dikirim setelah disetujui.`
    });
  });

  // Action: Selected specific wallet for manual payment (Supports both payw:: and pay_wallet_)
  bot.action(/^(?:payw::|pay_wallet_)(.+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const rawPayload = ctx.match[1];
    const telegramId = String(ctx.from.id);
    const username = ctx.from.username || '';
    const userLang = await getUserLang(ctx);

    let productId = '';
    let walletId = '';

    if (rawPayload.includes('::')) {
      const parts = rawPayload.split('::');
      productId = parts[0];
      walletId = parts[1];
    } else {
      // Smart extraction for legacy format or underscore-containing IDs
      const allProducts = await dbService.getProducts();
      const matchedProd = allProducts?.find(p => rawPayload.startsWith(p.product_id + '_'));
      if (matchedProd) {
        productId = matchedProd.product_id;
        walletId = rawPayload.slice(productId.length + 1);
      } else {
        const lastIdx = rawPayload.lastIndexOf('_');
        productId = lastIdx > 0 ? rawPayload.slice(0, lastIdx) : rawPayload;
        walletId = lastIdx > 0 ? rawPayload.slice(lastIdx + 1) : '';
      }
    }

    // Retrieve real product from Firestore
    let rawProduct = await dbService.getProduct(productId);
    if (!rawProduct) {
      const allProducts = await dbService.getProducts();
      rawProduct = allProducts?.find(p => p.product_id === productId || p.id === productId || rawPayload.includes(p.product_id));
      if (rawProduct) {
        productId = rawProduct.product_id;
      }
    }

    if (!rawProduct) {
      return cleanAndSend(ctx, '❌ Produk tidak ditemukan atau sudah tidak tersedia.', Markup.inlineKeyboard([
        [Markup.button.callback(getUI('btn_back_catalog', userLang), 'menu_catalog')]
      ]));
    }

    // Strict stock check
    const stockCount = await dbService.getAvailableStockCount(productId);
    if (stockCount <= 0) {
      return cleanAndSend(ctx, getUI('out_of_stock_alert', userLang), Markup.inlineKeyboard([
        [Markup.button.callback(getUI('btn_back_catalog', userLang), 'menu_catalog')]
      ]));
    }

    const product = getLocalizedProduct(rawProduct, userLang);

    // Retrieve real crypto wallet from Firestore
    let wallet = null;
    if (walletId) {
      wallet = await dbService.getCryptoWallet(walletId);
    }
    if (!wallet) {
      const wallets = await dbService.getActiveCryptoWallets();
      if (wallets && wallets.length > 0) {
        wallet = wallets.find(w => w.wallet_id === walletId || w.id === walletId || (walletId && w.wallet_id?.includes(walletId))) || wallets[0];
      }
    }

    if (!wallet) {
      return cleanAndSend(ctx, '⚠️ Dompet kripto tidak ditemukan atau telah dinonaktifkan.', Markup.inlineKeyboard([
        [Markup.button.callback(getUI('btn_back_catalog', userLang), 'menu_catalog')]
      ]));
    }

    const orderId = `ORD-MAN-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const currencyCode = wallet.currency || (wallet.network.includes('TON') ? 'TON' : wallet.network.includes('BTC') ? 'BTC' : wallet.network.includes('SOL') ? 'SOL' : 'USDT');

    const orderDoc = {
      order_id: orderId,
      user_id: telegramId,
      username: username,
      user_lang: userLang,
      product_id: productId,
      product_title: product.title,
      payment_method: 'crypto_manual',
      payment_gateway: 'Manual',
      payment_status: 'PENDING',
      crypto_address: wallet.address,
      crypto_network: wallet.network,
      amount: product.price_usd,
      currency: currencyCode,
      account_delivered: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await dbService.createOrder(orderDoc);
    notifyAdminGroupNewOrder(orderDoc).catch(() => {});

    const qrUrl = wallet.qr_url || getQrCodeUrl(wallet.address, 300);

    const invoiceText = `🧾 <b>INVOICE PEMBAYARAN MANUAL: #${orderId}</b>\n\n` +
      `📦 <b>Produk:</b> ${product.title}\n` +
      `💰 <b>Total Tagihan:</b> <code>${product.price_usd} ${currencyCode}</code> (${wallet.network})\n` +
      `🌐 <b>Jaringan Blockchain:</b> ${wallet.network}\n` +
      `📬 <b>Alamat Deposit Tujuan:</b>\n<code>${wallet.address}</code>\n` +
      `<i>(Klik/tekan alamat di atas untuk langsung menyalin)</i>\n\n` +
      `🖼️ <b>Tautan Gambar QR Code:</b>\n<a href="${qrUrl}">${qrUrl}</a>\n\n` +
      `📋 <b>PANDUAN PEMBAYARAN:</b>\n` +
      `1. Transfer nominal tepat ke alamat deposit di atas (atau scan gambar QR code).\n` +
      `2. Setelah transfer, klik <b>"📝 Kirim Bukti Transfer / TXID"</b> untuk mengirim hash transaksi atau foto resi.\n` +
      `3. Anda dapat mengecek status terkini atau melihat struk bukti pembayaran setelah diverifikasi.\n` +
      `4. Akun kredensial resmi otomatis dikirim ke chat ini segera setelah pembayaran dikonfirmasi.`;

    const buttons = [
      [Markup.button.callback(getUI('btn_check_payment', userLang), `check_pay_${orderId}`)],
      [Markup.button.url(getUI('btn_open_qr', userLang), qrUrl)],
      [Markup.button.callback(getUI('btn_send_txid', userLang), `prompt_txid_${orderId}`)],
      [Markup.button.callback(getUI('btn_cancel_order', userLang), `cancel_order_${orderId}`)],
      [Markup.button.callback(getUI('btn_back', userLang), 'menu_main')]
    ];

    await cleanAndSend(ctx, invoiceText, Markup.inlineKeyboard(buttons), { photo: qrUrl, state: `order_${orderId}`, translate: true });
  });

  // Action: Re-view QR Code directly
  bot.action(/^view_qr_(.+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const orderId = ctx.match[1];
    const userLang = await getUserLang(ctx);
    const order = await dbService.getOrder(orderId);
    if (!order) return;
    const qrUrl = getQrCodeUrl(order.crypto_address, 320);
    const text = `🖼️ <b>QR CODE PEMBAYARAN: #${order.order_id}</b>\n\n` +
      `📦 <b>Produk:</b> ${order.product_title}\n` +
      `💰 <b>Total Tagihan:</b> <code>${order.amount} ${order.currency || 'USD'}</code>\n` +
      `🌐 <b>Jaringan:</b> ${order.crypto_network || '-'}\n` +
      `📬 <b>Alamat Deposit:</b>\n<code>${order.crypto_address}</code>\n\n` +
      `<i>Pindai (scan) QR Code di atas menggunakan dompet kripto Anda.</i>`;
    const buttons = [
      [Markup.button.callback(getUI('btn_check_payment', userLang), `check_pay_${order.order_id}`)],
      [Markup.button.callback(getUI('btn_send_txid', userLang), `prompt_txid_${order.order_id}`)],
      [Markup.button.callback(getUI('btn_back_order', userLang), `view_order_${order.order_id}`)]
    ];
    await cleanAndSend(ctx, text, Markup.inlineKeyboard(buttons), { photo: qrUrl, state: `order_${order.order_id}` });
  });

  // Action: Prompt TXID for manual payment
  bot.action(/^prompt_txid_(.+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const orderId = ctx.match[1];
    const userLang = await getUserLang(ctx);

    const promptText = `📝 <b>KIRIM BUKTI TRANSAKSI / TXID</b>\n\n` +
      `🆔 Order ID: <code>${orderId}</code>\n\n` +
      `Anda dapat mengirim bukti pembayaran dengan dua cara:\n` +
      `1. <b>Ketik / Tempel Hash Transaksi (TXID):</b> Salin hash dari dompet kripto Anda dan kirimkan di sini.\n` +
      `2. <b>Kirim Foto / Screenshot Resi:</b> Unggah gambar tangkapan layar bukti transfer langsung ke chat bot ini.\n\n` +
      `<i>Admin akan memverifikasi mutasi dan akun digital akan segera dikirimkan otomatis.</i>`;

    await cleanAndSend(ctx, promptText, Markup.inlineKeyboard([
      [Markup.button.callback(getUI('btn_back_invoice', userLang), `check_pay_${orderId}`)],
      [Markup.button.callback(getUI('btn_back', userLang), 'menu_main')]
    ]), { state: `submit_txid_${orderId}`, translate: true });
  });

  // Action: Check / Confirm Payment (STRICT VERIFICATION)
  bot.action(/^check_pay_(.+)$/, async (ctx) => {
    const orderId = ctx.match[1];
    const userLang = await getUserLang(ctx);
    const order = await dbService.getOrder(orderId);

    if (!order) {
      await ctx.answerCbQuery('❌ Pesanan tidak ditemukan.', { show_alert: true });
      return;
    }

    // CASE 1: Order is ALREADY VERIFIED or PAID
    if (order.payment_status === 'PAID' || order.payment_status === 'VERIFIED_BY_ADMIN') {
      await ctx.answerCbQuery('✅ Pembayaran terverifikasi!', { show_alert: false });

      let delivered = order.account_delivered;
      if (!delivered) {
        // Atomically claim available stock now
        const stock = await dbService.claimAvailableStock(order.product_id, order.order_id);
        if (stock && stock.account_data) {
          delivered = stock.account_data;
          await dbService.updateOrder(order.order_id, {
            payment_status: 'PAID',
            account_delivered: delivered,
            updated_at: new Date().toISOString()
          });
        }
      }

      if (delivered) {
        const parsed = parseAccountCredential(delivered);
        let credBlock = '';
        if (parsed.email && parsed.password) {
          credBlock = `📧 <b>Email:</b> <code>${parsed.email}</code>\n` +
                      `🔑 <b>Password:</b> <code>${parsed.password}</code>\n` +
                      (parsed.cookie ? `🍪 <b>Session Cookie:</b> <code>${parsed.cookie}</code>\n` : '') +
                      (parsed.apiKey ? `🔑 <b>API Key:</b> <code>${parsed.apiKey}</code>\n` : '') +
                      (parsed.note ? `📝 <b>Catatan:</b> ${parsed.note}\n` : '');
        } else {
          credBlock = `<code>${delivered}</code>`;
        }

        const successText = `${getUI('payment_success_header', userLang)}\n\n` +
          `📦 <b>Produk:</b> ${order.product_title}\n` +
          `🆔 <b>Order ID:</b> <code>${order.order_id}</code>\n\n` +
          `${getUI('credentials_label', userLang)}\n` +
          `${credBlock}\n\n` +
          `${getUI('warranty_tip', userLang)}`;

        const keyboard = Markup.inlineKeyboard([
          [Markup.button.callback('🧾 Lihat Bukti Pembayaran Berhasil', `view_receipt_${order.order_id}`)],
          [Markup.button.callback(getUI('menu_catalog', userLang), 'menu_catalog')],
          [Markup.button.callback(getUI('btn_back', userLang), 'menu_main')]
        ]);
        return cleanAndSend(ctx, successText, keyboard);
      }
    }

    // CASE 2: Order is crypto_auto -> Query NOWPayments API directly for live blockchain status
    if (order.payment_method === 'crypto_auto' && order.payment_id) {
      try {
        const nowCheck = await cryptoGateway.getPaymentStatus(order.payment_id);
        if (nowCheck.success && nowCheck.isPaid) {
          // Blockchain confirms payment is finished/confirmed!
          const stock = await dbService.claimAvailableStock(order.product_id, order.order_id);
          const delivered = stock && stock.account_data ? stock.account_data : 'Credential delivered via blockchain auto-pay';

          await dbService.updateOrder(order.order_id, {
            payment_status: 'PAID',
            account_delivered: delivered,
            updated_at: new Date().toISOString()
          });

          await ctx.answerCbQuery('✅ Pembayaran blockchain terkonfirmasi!', { show_alert: true });

          const parsed = parseAccountCredential(delivered);
          let credBlock = '';
          if (parsed.email && parsed.password) {
            credBlock = `📧 <b>Email:</b> <code>${parsed.email}</code>\n` +
                        `🔑 <b>Password:</b> <code>${parsed.password}</code>\n` +
                        (parsed.cookie ? `🍪 <b>Session Cookie:</b> <code>${parsed.cookie}</code>\n` : '');
          } else {
            credBlock = `<code>${delivered}</code>`;
          }

          const successText = `${getUI('payment_success_header', userLang)}\n\n` +
            `📦 <b>Produk:</b> ${order.product_title}\n` +
            `🆔 <b>Order ID:</b> <code>${order.order_id}</code>\n\n` +
            `${getUI('credentials_label', userLang)}\n` +
            `${credBlock}\n\n` +
            `${getUI('warranty_tip', userLang)}`;

          return cleanAndSend(ctx, successText, Markup.inlineKeyboard([
            [Markup.button.callback('🧾 Lihat Bukti Pembayaran Berhasil', `view_receipt_${order.order_id}`)],
            [Markup.button.callback(getUI('menu_catalog', userLang), 'menu_catalog')],
            [Markup.button.callback(getUI('btn_back', userLang), 'menu_main')]
          ]));
        }
      } catch (e) {
        console.warn('NOWPayments status check failed:', e.message);
      }
    }

    // CASE 3: Payment is UNVERIFIED / UNPAID
    // STRICT REFUSAL: NEVER deliver accounts if payment is not confirmed!
    const notice = getUI('payment_pending_notice', userLang);
    await ctx.answerCbQuery(notice, { show_alert: true });

    const isManualMethod = ['crypto_manual', 'qris', 'ewallet', 'bank', 'bank_transfer', 'manual_idr'].includes(order.payment_method);
    const alreadySubmittedProof = Boolean(order.tx_hash || order.receipt_file_id || order.receipt_image_url);
    const localizedStatus = getLocalizedPaymentStatus(order.payment_status, userLang);
    const localizedMethod = getLocalizedPaymentMethod(order.payment_method, userLang);
    const amountLine = (order.currency === 'IDR' || order.total_amount_idr)
      ? `Rp ${Number(order.total_amount_idr || order.amount || 0).toLocaleString('id-ID')}`
      : `${order.amount} ${order.currency || 'USD'}`;

    let reminderMsg = `⏳ <b>${localizedStatus.toUpperCase()} (#${order.order_id})</b>\n\n` +
      `${notice}\n\n` +
      `📦 <b>Produk:</b> ${order.product_title}\n` +
      `💰 <b>Total Tagihan:</b> <code>${amountLine}</code>\n` +
      (order.unique_code ? `<i>(Termasuk kode unik transfer +${order.unique_code})</i>\n` : '') +
      `🌐 <b>Metode:</b> ${localizedMethod}\n\n`;

    // Method-aware payment info so the buyer never sees a wrong address.
    if (isManualMethod) {
      reminderMsg += `📬 <b>Tujuan Pembayaran:</b>\n<code>${order.crypto_address || '-'}</code>\n` +
        (order.crypto_network ? `🏷️ <b>${order.crypto_network}</b>\n` : '') + '\n';
    } else {
      reminderMsg += `📬 <b>Alamat Deposit (Blockchain):</b>\n<code>${order.crypto_address}</code>\n\n`;
    }

    // Clear guidance depending on whether the buyer already uploaded proof.
    if (isManualMethod) {
      reminderMsg += alreadySubmittedProof
        ? `✅ <b>Bukti transfer Anda sudah kami terima</b> dan sedang menunggu verifikasi admin.\n` +
          `Mohon tunggu, akun otomatis dikirim setelah disetujui.\n\n`
        : `⚠️ <b>Anda belum mengirim bukti transfer.</b>\n` +
          `Silakan transfer sesuai nominal di atas, lalu tekan tombol <b>"${getUI('btn_send_txid', userLang)}"</b> untuk mengunggah foto struk / mutasi Anda agar bisa diverifikasi.\n\n`;
    } else {
      reminderMsg += order.tx_hash
        ? `📝 <b>Bukti Terkirim:</b> <code>${order.tx_hash}</code> (${localizedStatus})\n\n`
        : `Silakan selesaikan pembayaran, lalu cek kembali beberapa saat setelah jaringan mengonfirmasi transaksi.\n\n`;
    }

    const buttons = [];
    if (isManualMethod) {
      // Primary action for manual methods: upload proof (or re-upload).
      buttons.push([Markup.button.callback(
        alreadySubmittedProof ? `🔄 Kirim Ulang Bukti Transfer` : getUI('btn_send_txid', userLang),
        `prompt_txid_${orderId}`
      )]);
      if (order.crypto_address && String(order.crypto_address).startsWith('http')) {
        buttons.push([Markup.button.url(getUI('btn_open_qr', userLang), order.crypto_address)]);
      } else {
        buttons.push([Markup.button.url(getUI('btn_open_qr', userLang), getQrCodeUrl(order.crypto_address || order.order_id, 300))]);
      }
    } else {
      buttons.push([Markup.button.url(getUI('btn_open_qr', userLang), getQrCodeUrl(order.crypto_address, 300))]);
    }
    buttons.push([Markup.button.callback(getUI('btn_check_payment', userLang), `check_pay_${orderId}`)]);
    buttons.push([Markup.button.callback(getUI('btn_cancel_order', userLang), `cancel_order_${orderId}`)]);
    buttons.push([Markup.button.callback(getUI('btn_back', userLang), 'menu_main')]);

    await cleanAndSend(ctx, reminderMsg, Markup.inlineKeyboard(buttons), { state: `order_${orderId}`, translate: true });
  });

  // Action: Cancel Order (Auto-deleted to conserve database storage)
  bot.action(/^cancel_order_(.+)$/, async (ctx) => {
    const orderId = ctx.match[1];
    const userLang = await getUserLang(ctx);
    await ctx.answerCbQuery('Pesanan dibatalkan.');
    // Delete immediately from database storage so database remains lean
    await dbService.deleteOrder(orderId);

    await cleanAndSend(ctx, `❌ <b>Pesanan <code>${orderId}</code> telah dibatalkan & otomatis dihapus dari sistem.</b>`, Markup.inlineKeyboard([
      [Markup.button.callback(getUI('menu_catalog', userLang), 'menu_catalog')],
      [Markup.button.callback(getUI('btn_back', userLang), 'menu_main')]
    ]));
  });

  // Action: My Orders (Interactive with full history & credential retrieval)
  bot.action('menu_orders', async (ctx) => {
    await ctx.answerCbQuery();
    const telegramId = String(ctx.from.id);
    const userLang = await getUserLang(ctx);
    const settings = await dbService.getSettings() || {};
    const orderGuide = getLocalizedOrderGuide(settings, userLang);
    const userOrders = await dbService.getUserOrders(telegramId);

    if (!userOrders || userOrders.length === 0) {
      return cleanAndSend(ctx, '📦 <i>Anda belum memiliki riwayat pesanan.</i>', Markup.inlineKeyboard([
        [Markup.button.callback(getUI('menu_catalog', userLang), 'menu_catalog')],
        [Markup.button.callback(getUI('btn_back', userLang), 'menu_main')]
      ]));
    }

    let text = `${orderGuide}\n\n<b>Daftar Pesanan Terakhir (${userOrders.length}):</b>\n\n`;
    const buttons = [];

    userOrders.slice(0, 6).forEach((o, i) => {
      const statusIcon = o.payment_status === 'PAID' || o.payment_status === 'VERIFIED_BY_ADMIN'
        ? '✅'
        : o.payment_status === 'PENDING'
          ? '⏳'
          : '❌';

      const localizedStatus = getLocalizedPaymentStatus(o.payment_status, userLang);

      text += `${i + 1}. ${statusIcon} <b>${o.product_title}</b> ($${o.amount})\n` +
              `   ID: <code>${o.order_id}</code> | Status: <b>${localizedStatus}</b>\n` +
              (o.tx_hash ? `   TXID: <code>${o.tx_hash.slice(0, 16)}...</code>\n` : '') +
              `\n`;

      buttons.push([
        Markup.button.callback(`${statusIcon} #${o.order_id.slice(-6)} - ${o.product_title.slice(0, 20)}`, `view_order_${o.order_id}`)
      ]);
    });

    buttons.push([Markup.button.callback(getUI('menu_catalog', userLang), 'menu_catalog')]);
    buttons.push([Markup.button.callback(getUI('btn_back', userLang), 'menu_main')]);

    await cleanAndSend(ctx, text, Markup.inlineKeyboard(buttons));
  });

  // Action: View specific order details & retrieve credentials
  bot.action(/^view_order_(.+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const orderId = ctx.match[1];
    const userLang = await getUserLang(ctx);
    const order = await dbService.getOrder(orderId);

    if (!order) {
      return cleanAndSend(ctx, '❌ Pesanan tidak ditemukan.', Markup.inlineKeyboard([
        [Markup.button.callback(getUI('menu_orders', userLang), 'menu_orders')],
        [Markup.button.callback(getUI('btn_back', userLang), 'menu_main')]
      ]));
    }

    const isPaid = order.payment_status === 'PAID' || order.payment_status === 'VERIFIED_BY_ADMIN';
    const isPending = order.payment_status === 'PENDING';

    // Auto-translated rich receipt details
    const detailMsg = formatLocalizedOrderReceipt(order, userLang);

    const actionButtons = [];
    if (isPaid) {
      actionButtons.push([Markup.button.callback(getUI('btn_view_receipt', userLang), `view_receipt_${order.order_id}`)]);
    } else if (isPending) {
      const qrUrl = getQrCodeUrl(order.crypto_address, 300);
      actionButtons.push([Markup.button.callback(getUI('btn_check_payment', userLang), `check_pay_${order.order_id}`)]);
      actionButtons.push([Markup.button.url(getUI('btn_open_qr', userLang), qrUrl)]);
      if (order.payment_method === 'crypto_manual' || order.payment_method === 'qris' || order.payment_method === 'ewallet' || order.payment_method === 'bank_transfer') {
        actionButtons.push([Markup.button.callback(getUI('btn_send_txid', userLang), `prompt_txid_${order.order_id}`)]);
      }
      actionButtons.push([Markup.button.callback(getUI('btn_cancel_order', userLang), `cancel_order_${order.order_id}`)]);
    }
    actionButtons.push([Markup.button.callback(getUI('menu_orders', userLang), 'menu_orders')]);
    actionButtons.push([Markup.button.callback(getUI('btn_back', userLang), 'menu_main')]);

    await cleanAndSend(ctx, detailMsg, Markup.inlineKeyboard(actionButtons));
  });

  // Action: View Official Payment Proof / Receipt (Bukti Pembayaran Berhasil)
  bot.action(/^view_receipt_(.+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const orderId = ctx.match[1];
    const userLang = await getUserLang(ctx);
    const order = await dbService.getOrder(orderId);

    if (!order) {
      return cleanAndSend(ctx, '❌ Pesanan tidak ditemukan.', Markup.inlineKeyboard([
        [Markup.button.callback(getUI('menu_orders', userLang), 'menu_orders')],
        [Markup.button.callback(getUI('btn_back', userLang), 'menu_main')]
      ]));
    }

    const isPaid = order.payment_status === 'PAID' || order.payment_status === 'VERIFIED_BY_ADMIN';
    const dateFormatted = new Date(order.updated_at || order.created_at || Date.now()).toLocaleString('id-ID', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    let credBlock = '';
    if (order.account_delivered) {
      const parsed = parseAccountCredential(order.account_delivered);
      if (parsed.email && parsed.password) {
        credBlock = `📧 <b>Email:</b> <code>${parsed.email}</code>\n` +
                    `🔑 <b>Password:</b> <code>${parsed.password}</code>\n` +
                    (parsed.cookie ? `🍪 <b>Cookie:</b> <code>${parsed.cookie}</code>\n` : '') +
                    (parsed.apiKey ? `🔑 <b>API Key:</b> <code>${parsed.apiKey}</code>\n` : '') +
                    (parsed.note ? `📝 <b>Catatan:</b> ${parsed.note}\n` : '');
      } else {
        credBlock = `<code>${order.account_delivered}</code>`;
      }
    } else {
      credBlock = '<i>Kredensial akun diproses oleh sistem</i>';
    }

    const receiptText = `🧾 <b>STRUK BUKTI PEMBAYARAN BERHASIL</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🆔 <b>Nomor Invoice:</b> <code>${order.order_id}</code>\n` +
      `📦 <b>Produk:</b> ${order.product_title}\n` +
      `💰 <b>Total Dibayar:</b> <code>${order.amount} ${order.currency || 'USD'}</code>\n` +
      `🌐 <b>Metode Pembayaran:</b> ${order.payment_method === 'crypto_auto' ? 'NOWPayments (Otomatis)' : `Transfer Dompet Kripto Manual (${order.crypto_network || 'Kripto'})`}\n` +
      `📬 <b>Alamat Dompet Tujuan:</b>\n<code>${order.crypto_address || '-'}</code>\n` +
      `📝 <b>Bukti Transfer / TXID:</b>\n<code>${order.tx_hash || 'Telah Diverifikasi Resmi'}</code>\n` +
      `📅 <b>Waktu Transaksi:</b> ${dateFormatted} WIB\n` +
      `📊 <b>Status:</b> ${isPaid ? '✅ <b>LUNAS & TERVERIFIKASI</b>' : `⏳ <b>${order.payment_status}</b>`}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🔑 <b>DATA KREDENSIAL AKUN TERKIRIM:</b>\n` +
      `${credBlock}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🔒 <i>Struk ini adalah bukti resmi transaksi yang sah. Kredensial akun dijamin bergaransi.</i>`;

    const buttons = [
      [Markup.button.callback('📦 Lihat Detail Pesanan', `view_order_${order.order_id}`)],
      [Markup.button.callback(getUI('menu_orders', userLang), 'menu_orders')],
      [Markup.button.callback(getUI('btn_back', userLang), 'menu_main')]
    ];

    await cleanAndSend(ctx, receiptText, Markup.inlineKeyboard(buttons));
  });

  // Action: Payments & FAQ (Dynamic from Settings)
  bot.action('menu_payments', async (ctx) => {
    await ctx.answerCbQuery();
    const userLang = await getUserLang(ctx);
    const settings = await dbService.getSettings() || {};
    const text = getLocalizedPaymentGuide(settings, userLang);

    await cleanAndSend(ctx, text, Markup.inlineKeyboard([
      [Markup.button.callback(getUI('menu_catalog', userLang), 'menu_catalog')],
      [Markup.button.callback(getUI('btn_back', userLang), 'menu_main')]
    ]));
  });

  // Action: Terms & Help
  bot.action('menu_help', async (ctx) => {
    await ctx.answerCbQuery();
    const userLang = await getUserLang(ctx);
    const settings = await dbService.getSettings() || {};
    const termsText = getLocalizedTerms(settings, userLang);

    await cleanAndSend(ctx, termsText, Markup.inlineKeyboard([
      [Markup.button.callback(getUI('menu_catalog', userLang), 'menu_catalog')],
      [Markup.button.callback(getUI('btn_back', userLang), 'menu_main')]
    ]));
  });

  // Text message listener for TXID submissions & interactive states
  bot.on('text', async (ctx) => {
    const telegramId = String(ctx.from.id);
    const userLang = await getUserLang(ctx);
    const rawText = ctx.message?.text?.trim() || '';

    try {
      const session = await dbService.getUserSession(telegramId);
      const state = session?.current_state || '';

      // Coupon redemption: buyer typed a coupon code
      if (state.startsWith('coupon_for_')) {
        const productId = state.replace('coupon_for_', '');
        const coupon = await dbService.getCouponByCode(rawText);

        const rawProduct = await dbService.getProduct(productId).catch(() => null);
        const baseIdr = rawProduct?.price_idr || 15000;

        let evaluation = { valid: false, message: 'Kode kupon tidak ditemukan atau tidak valid.' };
        if (coupon) {
          if (coupon.is_active === false) {
            evaluation = { valid: false, message: 'Kode kupon ini sedang tidak aktif.' };
          } else {
            const maxUses = Number(coupon.max_uses) || 0;
            const usedCount = Number(coupon.used_count) || 0;
            if (maxUses > 0 && usedCount >= maxUses) {
              evaluation = { valid: false, message: 'Kode kupon sudah mencapai batas pemakaian.' };
            } else {
              const pct = Number(coupon.discount_percentage) || 0;
              const fixed = Number(coupon.fixed_discount) || 0;
              const discountAmount = Math.round((baseIdr * pct) / 100 + fixed);
              evaluation = {
                valid: true,
                code: coupon.code,
                discount_amount: discountAmount,
                final_amount: Math.max(0, baseIdr - discountAmount),
                message: `Kupon ${coupon.code} berhasil diterapkan!`
              };
            }
          }
        }

        if (!evaluation.valid) {
          return cleanAndSend(ctx, `⚠️ <b>Kupon Tidak Valid</b>\n\n${evaluation.message}`, Markup.inlineKeyboard([
            [Markup.button.callback('🎟️ Coba Kode Lain', `redeem_coupon_${productId}`)],
            [Markup.button.callback(getUI('btn_back', userLang), `buy_manual_${productId}`)]
          ]), { state: `coupon_for_${productId}` });
        }

        await dbService.updateUserSession(telegramId, {
          current_state: 'idle',
          applied_coupon: evaluation,
          updated_at: new Date().toISOString()
        });

        return cleanAndSend(ctx, `✅ <b>KUPON BERHASIL DIPASANG</b>\n\n` +
          `🎟️ Kode: <code>${evaluation.code}</code>\n` +
          `💸 Potongan: <b>Rp ${Number(evaluation.discount_amount || 0).toLocaleString('id-ID')}</b>\n` +
          `💰 Total setelah diskon: <b>Rp ${Number(evaluation.final_amount || 0).toLocaleString('id-ID')}</b>\n\n` +
          `Lanjutkan memilih metode pembayaran Anda.`, Markup.inlineKeyboard([
          [Markup.button.callback('💳 Pilih Metode Pembayaran', `buy_manual_${productId}`)],
          [Markup.button.callback(getUI('btn_back', userLang), 'menu_main')]
        ]), { state: 'idle' });
      }

      if (state.startsWith('submit_txid_')) {
        const orderId = state.replace('submit_txid_', '');
        const order = await dbService.getOrder(orderId);

        // Guard: a stale session state may reference a cancelled/deleted order.
        if (!order) {
          return cleanAndSend(ctx, '❌ <b>Pesanan tidak ditemukan.</b> Sesi sebelumnya mungkin sudah dibatalkan atau dihapus. Silakan buka menu utama.', Markup.inlineKeyboard([
            [Markup.button.callback(getUI('menu_catalog', userLang), 'menu_catalog')],
            [Markup.button.callback(getUI('btn_back', userLang), 'menu_main')]
          ]), { state: 'main_menu' });
        }

        // Anti-Fraud check: Ensure this hash hasn't already been used in an approved order
        const allOrders = await dbService.getOrders();
        const duplicate = allOrders.find(o =>
          o.order_id !== orderId &&
          o.tx_hash === rawText &&
          (o.payment_status === 'APPROVED' || o.payment_status === 'PAID')
        );

        if (duplicate) {
          const warnMsg = `⚠️ <b>PERINGATAN SISTEM ANTI-FRAUD</b>\n\nHash transaksi atau bukti ini sudah terdaftar pada transaksi sebelumnya. Mohon kirimkan hash/bukti mutasi asli pembayaran Anda.`;
          return cleanAndSend(ctx, warnMsg, Markup.inlineKeyboard([
            [Markup.button.callback(getUI('btn_send_txid', userLang), `prompt_txid_${orderId}`)],
            [Markup.button.callback(getUI('btn_back', userLang), 'menu_main')]
          ]));
        }

        await dbService.updateOrder(orderId, {
          tx_hash: rawText,
          payment_status: 'PENDING_VERIFICATION',
          updated_at: new Date().toISOString()
        });

        // Notify Officer / Admin group via Telegram
        const officerChatId = process.env.TELEGRAM_ADMIN_GROUP_ID || process.env.ADMIN_TELEGRAM_ID;
        if (officerChatId) {
          try {
            const officerMsg = `🚨 <b>BUKTI TRANSAKSI BARU MASUK!</b>\n\n` +
              `🆔 <b>Order ID:</b> <code>#${orderId}</code>\n` +
              `👤 <b>Pembeli:</b> @${ctx.from.username || 'Tanpa Username'} (ID: <code>${telegramId}</code>)\n` +
              `📦 <b>Produk:</b> ${order?.product_title || '-'}\n` +
              `💰 <b>Nominal:</b> Rp ${(order?.total_amount_idr || order?.amount || 0).toLocaleString('id-ID')}\n` +
              `📝 <b>Bukti TXID/Teks:</b> <code>${rawText}</code>\n\n` +
              `<i>Klik tombol verifikasi di bawah:</i>`;

            await bot.telegram.sendMessage(officerChatId, officerMsg, {
              parse_mode: 'HTML',
              reply_markup: Markup.inlineKeyboard([
                [
                  Markup.button.callback(`✅ Setujui #${orderId}`, `adm_appr_${orderId}`),
                  Markup.button.callback(`❌ Tolak #${orderId}`, `adm_rejc_${orderId}`)
                ]
              ]).reply_markup
            });
          } catch (notifErr) {
            console.warn('[Officer Notif Error]:', notifErr.message);
          }
        }

        const confirmMsg = `✅ <b>BUKTI TRANSAKSI TELAH DITERIMA & DITERUSKAN!</b>\n\n` +
          `🆔 Order ID: <code>${orderId}</code>\n` +
          `🔗 Hash/TXID: <code>${rawText}</code>\n\n` +
          `Petugas admin sedang memverifikasi pembayaran Anda. Kredensial akun akan langsung dikirim ke chat ini segera setelah disetujui.`;

        const keyboard = Markup.inlineKeyboard([
          [Markup.button.callback(getUI('btn_check_payment', userLang), `check_pay_${orderId}`)],
          [Markup.button.callback(getUI('menu_orders', userLang), 'menu_orders')],
          [Markup.button.callback(getUI('btn_back', userLang), 'menu_main')]
        ]);

        return cleanAndSend(ctx, confirmMsg, keyboard, { state: `order_${orderId}` });
      }
    } catch (e) {
      console.warn('Text listener error:', e.message);
    }
  });

  // Photo & Document receipt listener for TXID submissions
  bot.on(['photo', 'document'], async (ctx) => {
    const telegramId = String(ctx.from.id);
    const userLang = await getUserLang(ctx);
    const caption = ctx.message?.caption?.trim() || '';
    const fileId = ctx.message?.photo ? ctx.message.photo[ctx.message.photo.length - 1]?.file_id : ctx.message?.document?.file_id;

    try {
      const session = await dbService.getUserSession(telegramId);
      const state = session?.current_state || '';

      if (state.startsWith('submit_txid_')) {
        const orderId = state.replace('submit_txid_', '');
        const order = await dbService.getOrder(orderId);

        // Guard: a stale session state may reference a cancelled/deleted order.
        if (!order) {
          return cleanAndSend(ctx, '❌ <b>Pesanan tidak ditemukan.</b> Sesi sebelumnya mungkin sudah dibatalkan atau dihapus. Silakan buka menu utama.', Markup.inlineKeyboard([
            [Markup.button.callback(getUI('menu_catalog', userLang), 'menu_catalog')],
            [Markup.button.callback(getUI('btn_back', userLang), 'menu_main')]
          ]), { state: 'main_menu' });
        }

        // Anti-fraud duplicate check
        if (fileId) {
          const allOrders = await dbService.getOrders();
          const duplicate = allOrders.find(o =>
            o.order_id !== orderId &&
            o.receipt_file_id === fileId &&
            (o.payment_status === 'APPROVED' || o.payment_status === 'PAID')
          );
          if (duplicate) {
            const warnMsg = `⚠️ <b>PERINGATAN SISTEM ANTI-FRAUD</b>\n\nGambar bukti transfer ini telah digunakan pada transaksi sebelumnya. Harap unggah foto resi asli yang sah.`;
            return cleanAndSend(ctx, warnMsg, Markup.inlineKeyboard([
              [Markup.button.callback(getUI('btn_send_txid', userLang), `prompt_txid_${orderId}`)],
              [Markup.button.callback(getUI('btn_back', userLang), 'menu_main')]
            ]));
          }
        }

        let fileUrl = '';
        try {
          const fileLink = await ctx.telegram.getFileLink(fileId);
          fileUrl = fileLink.href || fileLink.toString();
        } catch (e) {
          console.warn('Get file link note:', e.message);
        }

        const cleanProofName = caption || `Foto Bukti Transfer (${new Date().toLocaleDateString('id-ID')})`;
        await dbService.updateOrder(orderId, {
          tx_hash: cleanProofName,
          receipt_file_id: fileId,
          receipt_image_url: fileUrl || `/api/orders/${orderId}/receipt-image`,
          payment_proof: fileUrl || `/api/orders/${orderId}/receipt-image`,
          payment_status: 'PENDING_VERIFICATION',
          updated_at: new Date().toISOString()
        });

        // Forward to Officer / Admin group with one-click approval buttons
        const officerChatId = process.env.TELEGRAM_ADMIN_GROUP_ID || process.env.ADMIN_TELEGRAM_ID;
        if (officerChatId) {
          try {
            const officerMsg = `🚨 <b>FOTO BUKTI PEMBAYARAN BARU MASUK!</b>\n\n` +
              `🆔 <b>Order ID:</b> <code>#${orderId}</code>\n` +
              `👤 <b>Pembeli:</b> @${ctx.from.username || 'Tanpa Username'} (ID: <code>${telegramId}</code>)\n` +
              `📦 <b>Produk:</b> ${order?.product_title || '-'}\n` +
              `💰 <b>Nominal:</b> Rp ${(order?.total_amount_idr || order?.amount || 0).toLocaleString('id-ID')}\n` +
              `🌐 <b>Metode:</b> ${order?.payment_method || 'Manual'}\n` +
              (caption ? `📝 <b>Catatan Pembeli:</b> <i>${caption}</i>\n` : '') +
              `\n<i>Pilih tindakan verifikasi di bawah:</i>`;

            const officerKeyboard = Markup.inlineKeyboard([
              [
                Markup.button.callback(`✅ Setujui #${orderId}`, `adm_appr_${orderId}`),
                Markup.button.callback(`❌ Tolak #${orderId}`, `adm_rejc_${orderId}`)
              ]
            ]);

            if (fileId) {
              await bot.telegram.sendPhoto(officerChatId, fileId, {
                caption: officerMsg,
                parse_mode: 'HTML',
                reply_markup: officerKeyboard.reply_markup
              });
            } else {
              await bot.telegram.sendMessage(officerChatId, officerMsg, {
                parse_mode: 'HTML',
                reply_markup: officerKeyboard.reply_markup
              });
            }
          } catch (notifErr) {
            console.warn('[Officer Notif Error]:', notifErr.message);
          }
        }

        const confirmMsg = `✅ <b>FOTO BUKTI PEMBAYARAN TELAH DITERIMA!</b>\n\n` +
          `🆔 Order ID: <code>${orderId}</code>\n` +
          `📸 Bukti Foto: <b>Tersimpan & diteruskan ke Petugas Admin</b>\n` +
          (caption ? `📝 Catatan: <i>${caption}</i>\n\n` : '\n') +
          `Admin toko sedang memeriksa gambar bukti pembayaran Anda. Kredensial akun digital otomatis dikirim ke chat ini segera setelah diverifikasi.`;

        const keyboard = Markup.inlineKeyboard([
          [Markup.button.callback(getUI('btn_check_payment', userLang), `check_pay_${orderId}`)],
          [Markup.button.callback(getUI('menu_orders', userLang), 'menu_orders')],
          [Markup.button.callback(getUI('btn_back', userLang), 'menu_main')]
        ]);

        return cleanAndSend(ctx, confirmMsg, keyboard, { state: `order_${orderId}` });
      }
    } catch (e) {
      console.warn('Receipt photo listener error:', e.message);
    }
  });

  // Shared helper: notify the registered admin group/channel about a new order
  // with one-tap Approve / Reject buttons.
  async function notifyAdminGroupNewOrder(order, proofFileId = null) {
    const groupChatId = process.env.TELEGRAM_ADMIN_GROUP_ID || process.env.TELEGRAM_CHANNEL_ID;
    if (!groupChatId || !order) return;

    const shortId = String(order.order_id).slice(-8);
    const isManual = ['crypto_manual', 'qris', 'ewallet', 'bank', 'bank_transfer', 'manual_idr'].includes(order.payment_method);
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
      (order.coupon_code ? `🎟️ Kupon: <code>${order.coupon_code}</code>\n` : '') +
      `\n<i>${isManual ? 'Menunggu bukti transfer & verifikasi admin.' : 'Menunggu konfirmasi pembayaran otomatis.'}</i>`;

    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback(`✅ Setujui #${shortId}`, `adm_appr_${order.order_id}`),
        Markup.button.callback(`❌ Tolak #${shortId}`, `adm_rejc_${order.order_id}`)
      ]
    ]);

    try {
      if (proofFileId) {
        await bot.telegram.sendPhoto(groupChatId, proofFileId, {
          caption: msg, parse_mode: 'HTML', reply_markup: keyboard.reply_markup
        });
      } else {
        await bot.telegram.sendMessage(groupChatId, msg, {
          parse_mode: 'HTML', reply_markup: keyboard.reply_markup
        });
      }
    } catch (e) {
      console.warn('[Admin Group Notify] Failed:', e.message);
    }
  }

  // Action: Officer Instant Approval from Telegram Group (STRICT admin auth)
  bot.action(/^adm_appr_(.+)$/, async (ctx) => {
    const clickerId = String(ctx.from?.id || '');
    if (!await isUserAdmin(clickerId)) {
      return ctx.answerCbQuery('⛔ Akses ditolak: Anda bukan admin resmi toko.', { show_alert: true });
    }
    const orderId = ctx.match[1];
    const order = await dbService.getOrder(orderId);
    if (!order) return ctx.answerCbQuery('Pesanan tidak ditemukan.');

    // Atomically claim available stock
    const stock = await dbService.claimAvailableStock(order.product_id, order.order_id);
    const delivered = stock && stock.account_data ? stock.account_data : (order.account_delivered || 'Akun disetujui langsung oleh Petugas');

    await dbService.updateOrder(orderId, {
      payment_status: 'APPROVED',
      account_delivered: delivered,
      verified_by: ctx.from.username || ctx.from.first_name,
      verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    await ctx.answerCbQuery(`✅ Order #${orderId} disetujui!`, { show_alert: false });

    // Send credentials directly to buyer's chat
    const buyerLang = order.user_lang || 'id';
    const parsed = parseAccountCredential(delivered);
    let credBlock = '';
    if (parsed.email && parsed.password) {
      credBlock = `📧 <b>Email:</b> <code>${parsed.email}</code>\n` +
                  `🔑 <b>Password:</b> <code>${parsed.password}</code>\n` +
                  (parsed.cookie ? `🍪 <b>Session Cookie:</b> <code>${parsed.cookie}</code>\n` : '') +
                  (parsed.apiKey ? `🔑 <b>API Key:</b> <code>${parsed.apiKey}</code>\n` : '');
    } else {
      credBlock = `<code>${delivered}</code>`;
    }

    const buyerMsg = `${getUI('payment_success_header', buyerLang)}\n\n` +
      `📦 <b>Produk:</b> ${order.product_title}\n` +
      `🆔 <b>Order ID:</b> <code>${order.order_id}</code>\n\n` +
      `${getUI('credentials_label', buyerLang)}\n` +
      `${credBlock}\n\n` +
      `${getUI('warranty_tip', buyerLang)}`;

    try {
      await bot.telegram.sendMessage(order.user_id, buyerMsg, {
        parse_mode: 'HTML',
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback(getUI('btn_view_receipt', buyerLang), `view_receipt_${order.order_id}`)],
          [Markup.button.callback(getUI('menu_catalog', buyerLang), 'menu_catalog')]
        ]).reply_markup
      });
    } catch (e) {
      console.warn('Failed to send approved message to buyer:', e.message);
    }

    // Update officer group message
    const officerName = `@${ctx.from.username || ctx.from.first_name}`;
    try {
      await ctx.editMessageCaption(`✅ <b>ORDER #${orderId} TELAH DISETUJUI</b> oleh ${officerName}\nProduk: ${order.product_title}\nKredensial akun berhasil terkirim ke pembeli.`, { parse_mode: 'HTML' });
    } catch (e) {
      try {
        await ctx.editMessageText(`✅ <b>ORDER #${orderId} TELAH DISETUJUI</b> oleh ${officerName}\nProduk: ${order.product_title}\nKredensial akun berhasil terkirim ke pembeli.`, { parse_mode: 'HTML' });
      } catch (e2) {}
    }
  });

  // Action: Officer Rejection from Telegram Group (STRICT admin auth)
  bot.action(/^adm_rejc_(.+)$/, async (ctx) => {
    const clickerId = String(ctx.from?.id || '');
    if (!await isUserAdmin(clickerId)) {
      return ctx.answerCbQuery('⛔ Akses ditolak: Anda bukan admin resmi toko.', { show_alert: true });
    }
    const orderId = ctx.match[1];
    const order = await dbService.getOrder(orderId);
    if (!order) return ctx.answerCbQuery('Pesanan tidak ditemukan.');

    await dbService.updateOrder(orderId, {
      payment_status: 'REJECTED',
      rejected_by: ctx.from.username || ctx.from.first_name,
      updated_at: new Date().toISOString()
    });

    await ctx.answerCbQuery(`❌ Order #${orderId} ditolak.`, { show_alert: false });

    const buyerLang = order.user_lang || 'id';
    try {
      await bot.telegram.sendMessage(order.user_id, `❌ <b>PEMBAYARAN DITOLAK: #${order.order_id}</b>\n\nBukti transfer mutasi untuk pesanan Anda belum dapat diverifikasi oleh petugas. Silakan hubungi admin toko atau lakukan pembayaran dengan bukti yang sah.`, {
        parse_mode: 'HTML',
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback(getUI('menu_catalog', buyerLang), 'menu_catalog')],
          [Markup.button.callback(getUI('btn_back', buyerLang), 'menu_main')]
        ]).reply_markup
      });
    } catch (e) {}

    const officerName = `@${ctx.from.username || ctx.from.first_name}`;
    try {
      await ctx.editMessageCaption(`❌ <b>ORDER #${orderId} DITOLAK</b> oleh ${officerName}`, { parse_mode: 'HTML' });
    } catch (e) {
      try {
        await ctx.editMessageText(`❌ <b>ORDER #${orderId} DITOLAK</b> oleh ${officerName}`, { parse_mode: 'HTML' });
      } catch (e2) {}
    }
  });

  // Action: Back to main menu
  bot.action('menu_main', async (ctx) => {
    await ctx.answerCbQuery();
    const telegramId = String(ctx.from.id);
    const userLang = await getUserLang(ctx);
    const isAdmin = await isUserAdmin(telegramId);
    const settings = await dbService.getSettings() || {};
    const welcomeText = getLocalizedWelcome(settings, userLang);
    const keyboard = await buildMainMenuKeyboard(userLang, isAdmin);

    await cleanAndSend(ctx, welcomeText, keyboard, { state: 'main_menu' });
  });

  // ==========================================
  // TELEGRAM BOT ADMIN CONTROL CENTER
  // STRICT ID AUTHORIZATION ENFORCED
  // ==========================================

  // Helper to render main admin dashboard
  async function renderAdminDashboard(ctx) {
    const telegramId = String(ctx.from.id);
    const orders = await dbService.getOrders().catch(() => []);
    const pendingVerif = orders.filter(o =>
      o.payment_status === 'PENDING_VERIFICATION' ||
      (o.payment_status === 'PENDING' && o.tx_hash)
    ).length;
    const products = await dbService.getProducts().catch(() => []);
    const paymentMethods = await dbService.getPaymentMethods().catch(() => []);
    const channels = await dbService.getChannels().catch(() => []);

    const text = `👑 <b>TELEGRAM BOT ADMIN CONTROL CENTER</b>\n\n` +
      `Halo Admin <b>${ctx.from.first_name || ctx.from.username || 'Petugas'}</b> (ID: <code>${ctx.from.id}</code>)\n` +
      `🟢 <b>Server Engine:</b> Aktif & Berjalan Normal\n` +
      `⏳ <b>Menunggu Verifikasi:</b> ${pendingVerif} Transaksi\n` +
      `📦 <b>Katalog Produk:</b> ${products.length} Item\n` +
      `🏦 <b>Metode Pembayaran:</b> ${paymentMethods.length} Metode\n` +
      `📢 <b>Saluran Terdaftar:</b> ${channels.length} Saluran\n\n` +
      `Silakan pilih menu manajemen di bawah:`;

    const buttons = [
      [Markup.button.callback(`💳 Kelola Transaksi (${pendingVerif} Menunggu)`, 'admin_orders')],
      [
        Markup.button.callback('🏦 Metode Pembayaran', 'admin_payments'),
        Markup.button.callback('📢 Saluran / Channel', 'admin_channels')
      ],
      [
        Markup.button.callback('📊 Rekap Keuangan', 'admin_finances'),
        Markup.button.callback('🧹 Pembersihan Sistem', 'admin_cleanup')
      ],
      [Markup.button.callback('🔄 Perbarui Tabel Database', 'admin_sync_db')],
      [
        Markup.button.callback('📢 Broadcast Massal', 'admin_broadcast'),
        Markup.button.callback('🗄️ Backup Database', 'admin_backup')
      ],
      [
        Markup.button.callback('🎟️ Kupon Diskon', 'admin_coupons'),
        Markup.button.callback('📡 Status Engine', 'admin_engine_status')
      ],
      [Markup.button.callback('🔙 Kembali ke Menu Toko', 'menu_main')]
    ];

    await cleanAndSend(ctx, text, Markup.inlineKeyboard(buttons), { state: 'admin_dashboard' });
  }

  // /admin Command (Strict Authorization)
  bot.command('admin', async (ctx) => {
    const telegramId = String(ctx.from.id);
    const isAdmin = await isUserAdmin(telegramId);
    if (!isAdmin) {
      // Regular buyers are completely blocked without disclosing admin panel existence
      return;
    }
    return renderAdminDashboard(ctx);
  });

  // Action: Open Admin Menu
  bot.action('admin_menu', async (ctx) => {
    await ctx.answerCbQuery();
    const telegramId = String(ctx.from.id);
    const isAdmin = await isUserAdmin(telegramId);
    if (!isAdmin) {
      return ctx.answerCbQuery('Akses Ditolak.', { show_alert: true });
    }
    return renderAdminDashboard(ctx);
  });

  // Action: Admin Orders Management
  bot.action('admin_orders', async (ctx) => {
    await ctx.answerCbQuery();
    const telegramId = String(ctx.from.id);
    if (!await isUserAdmin(telegramId)) return;

    const orders = await dbService.getOrders().catch(() => []);
    // Prioritize pending verification, then recent orders
    const pendingOrders = orders
      .filter(o => o.payment_status === 'PENDING_VERIFICATION' || (o.payment_status === 'PENDING' && o.tx_hash))
      .slice(0, 5);

    const otherOrders = orders
      .filter(o => o.payment_status !== 'PENDING_VERIFICATION' && !(o.payment_status === 'PENDING' && o.tx_hash))
      .slice(0, 3);

    let text = `💳 <b>KELOLA TRANSAKSI PEMBELIAN</b>\n\n`;

    if (pendingOrders.length === 0 && otherOrders.length === 0) {
      text += `<i>Belum ada transaksi di database.</i>\n`;
    } else if (pendingOrders.length > 0) {
      text += `⏳ <b>Menunggu Konfirmasi Bukti (${pendingOrders.length}):</b>\n`;
      pendingOrders.forEach((o, i) => {
        const idrFormatted = (o.total_amount_idr || 0).toLocaleString('id-ID');
        text += `\n<b>${i + 1}. Order #${o.order_id}</b>\n` +
          `• Produk: ${o.product_title}\n` +
          `• Pembeli: @${o.username || o.user_id}\n` +
          `• Tagihan: Rp ${idrFormatted} ($${o.amount} USD)\n` +
          `• Metode: ${o.payment_method || 'Manual'}\n` +
          `• Bukti/TXID: <code>${o.tx_hash || '-'}</code>\n`;
      });
    } else {
      text += `✅ <i>Semua transaksi pending sudah diverifikasi! Menampilkan pesanan terbaru:</i>\n`;
      otherOrders.forEach((o, i) => {
        text += `\n<b>${i + 1}. #${o.order_id}</b>: ${o.product_title} [${o.payment_status}] (@${o.username || o.user_id})\n`;
      });
    }

    const buttons = [];

    // Add quick actions for pending orders
    for (const o of pendingOrders) {
      const shortId = o.order_id.slice(-6);
      const row = [];
      const hasPhoto = o.receipt_file_id || (o.tx_hash && (o.tx_hash.includes('AgAC') || o.tx_hash.includes('BAAC')));
      if (hasPhoto) {
        row.push(Markup.button.callback(`📸 Foto #${shortId}`, `adm_view_proof_${o.order_id}`));
      }
      row.push(Markup.button.callback(`✅ Setujui #${shortId}`, `adm_appr_${o.order_id}`));
      row.push(Markup.button.callback(`❌ Tolak #${shortId}`, `adm_rejc_${o.order_id}`));
      buttons.push(row);
    }

    buttons.push([Markup.button.callback('🔄 Muat Ulang Transaksi', 'admin_orders')]);
    buttons.push([Markup.button.callback('🔙 Kembali ke Menu Admin', 'admin_menu')]);

    await cleanAndSend(ctx, text, Markup.inlineKeyboard(buttons), { state: 'admin_orders' });
  });

  // Action: View photo proof
  bot.action(/^adm_view_proof_(.+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const telegramId = String(ctx.from.id);
    if (!await isUserAdmin(telegramId)) return;

    const orderId = ctx.match[1];
    const order = await dbService.getOrder(orderId);
    if (!order) return ctx.answerCbQuery('Pesanan tidak ditemukan.');

    const fileId = order.receipt_file_id ||
      (order.tx_hash && order.tx_hash.startsWith('AgAC') ? order.tx_hash : null);

    const caption = `📸 <b>BUKTI PEMBAYARAN: #${order.order_id}</b>\n\n` +
      `👤 Pembeli: @${order.username || order.user_id} (ID: <code>${order.user_id}</code>)\n` +
      `📦 Produk: ${order.product_title}\n` +
      `💰 Nominal: Rp ${(order.total_amount_idr || 0).toLocaleString('id-ID')} ($${order.amount} USD)\n` +
      `📝 Catatan / TXID: <code>${order.tx_hash || '-'}</code>`;

    const buttons = Markup.inlineKeyboard([
      [
        Markup.button.callback('✅ Setujui & Kirim Akun', `adm_appr_${order.order_id}`),
        Markup.button.callback('❌ Tolak Pembayaran', `adm_rejc_${order.order_id}`)
      ],
      [Markup.button.callback('🔙 Kembali ke Daftar Transaksi', 'admin_orders')]
    ]);

    if (fileId) {
      try {
        await bot.telegram.sendPhoto(ctx.chat.id, fileId, {
          caption: caption,
          parse_mode: 'HTML',
          reply_markup: buttons.reply_markup
        });
        return;
      } catch (e) {
        console.warn('Send photo note:', e.message);
      }
    }

    await cleanAndSend(ctx, caption, buttons, { state: 'admin_view_proof' });
  });

  // Action: Admin Payment Methods Management
  bot.action('admin_payments', async (ctx) => {
    await ctx.answerCbQuery();
    const telegramId = String(ctx.from.id);
    if (!await isUserAdmin(telegramId)) return;

    const methods = await dbService.getPaymentMethods().catch(() => []);
    const cryptoWallets = await dbService.getCryptoWallets().catch(() => []);

    let text = `🏦 <b>METODE PEMBAYARAN TOKO</b>\n\n` +
      `Kelola ketersediaan metode pembayaran E-Wallet, QRIS, Bank, dan Kripto secara langsung:\n\n`;

    if (methods.length === 0 && cryptoWallets.length === 0) {
      text += `<i>Belum ada metode pembayaran yang dikonfigurasi.</i>\n`;
    }

    const buttons = [];

    // Manual Methods (QRIS, E-Wallet, Bank)
    methods.forEach((m) => {
      const statusIcon = m.is_active ? '🟢' : '🔴';
      text += `${statusIcon} <b>${m.name}</b> (${m.type.toUpperCase()})\n` +
        `• No. Rekening: <code>${m.account_number || '-'}</code> (${m.account_name || 'Admin'})\n` +
        `• Status: ${m.is_active ? 'Aktif' : 'Dinonaktifkan'}\n\n`;

      buttons.push([
        Markup.button.callback(
          `${m.is_active ? '🔴 Sembunyikan' : '🟢 Aktifkan'} ${m.name.slice(0, 16)}`,
          `adm_toggle_pm_${m.method_id}`
        )
      ]);
    });

    // Crypto Wallets
    cryptoWallets.forEach((w) => {
      const statusIcon = w.is_active ? '🟢' : '🔴';
      text += `${statusIcon} <b>Crypto ${w.network}</b>\n` +
        `• Alamat: <code>${w.address.slice(0, 12)}...${w.address.slice(-6)}</code>\n` +
        `• Status: ${w.is_active ? 'Aktif' : 'Dinonaktifkan'}\n\n`;
    });

    buttons.push([Markup.button.callback('🔄 Refresh Metode', 'admin_payments')]);
    buttons.push([Markup.button.callback('🔙 Kembali ke Menu Admin', 'admin_menu')]);

    await cleanAndSend(ctx, text, Markup.inlineKeyboard(buttons), { state: 'admin_payments' });
  });

  // Action: Toggle Payment Method Status
  bot.action(/^adm_toggle_pm_(.+)$/, async (ctx) => {
    const methodId = ctx.match[1];
    const telegramId = String(ctx.from.id);
    if (!await isUserAdmin(telegramId)) return;

    try {
      const methods = await dbService.getPaymentMethods();
      const target = methods.find(m => m.method_id === methodId);
      if (target) {
        const newStatus = !target.is_active;
        await dbService.savePaymentMethod({
          ...target,
          is_active: newStatus
        });
        await ctx.answerCbQuery(`${target.name} sekarang: ${newStatus ? 'AKTIF' : 'NONAKTIF'}`);
      }
    } catch (e) {
      await ctx.answerCbQuery('Gagal mengubah status: ' + e.message);
    }

    // Re-render payment methods view
    const updatedMethods = await dbService.getPaymentMethods().catch(() => []);
    let text = `🏦 <b>METODE PEMBAYARAN TOKO</b>\n\n`;
    const buttons = [];
    updatedMethods.forEach((m) => {
      const statusIcon = m.is_active ? '🟢' : '🔴';
      text += `${statusIcon} <b>${m.name}</b> (${m.type.toUpperCase()})\n` +
        `• No. Rekening: <code>${m.account_number || '-'}</code> (${m.account_name || 'Admin'})\n` +
        `• Status: ${m.is_active ? 'Aktif' : 'Dinonaktifkan'}\n\n`;

      buttons.push([
        Markup.button.callback(
          `${m.is_active ? '🔴 Sembunyikan' : '🟢 Aktifkan'} ${m.name.slice(0, 16)}`,
          `adm_toggle_pm_${m.method_id}`
        )
      ]);
    });
    buttons.push([Markup.button.callback('🔙 Kembali ke Menu Admin', 'admin_menu')]);
    await cleanAndSend(ctx, text, Markup.inlineKeyboard(buttons), { state: 'admin_payments' });
  });

  // Action: Admin Channels Management
  bot.action('admin_channels', async (ctx) => {
    await ctx.answerCbQuery();
    const telegramId = String(ctx.from.id);
    if (!await isUserAdmin(telegramId)) return;

    const channels = await dbService.getChannels().catch(() => []);

    let text = `📢 <b>SALURAN / CHANNEL TELEGRAM</b>\n\n` +
      `Daftar saluran resmi & tracking promosi link afiliasi:\n\n`;

    if (channels.length === 0) {
      text += `<i>Belum ada saluran terdaftar. Tambahkan di Web Admin Panel.</i>\n`;
    }

    const buttons = [];

    channels.forEach((ch) => {
      const statusIcon = ch.is_active ? '🟢' : '🔴';
      text += `${statusIcon} <b>${ch.name}</b>\n` +
          `• Link: ${ch.invite_link || (ch.username ? '@' + ch.username : '-')}\n` +
        `• Klik Link: ${ch.clicks_count || 0} | Transaksi: ${ch.orders_count || ch.conversions_count || 0}\n` +
        `• Status: ${ch.is_active ? 'Ditampilkan di Menu' : 'Disembunyikan'}\n\n`;

      buttons.push([
        Markup.button.callback(
          `${ch.is_active ? '🔴 Sembunyikan' : '🟢 Tampilkan'} ${ch.name.slice(0, 16)}`,
          `adm_toggle_ch_${ch.channel_id}`
        )
      ]);
    });

    buttons.push([Markup.button.callback('🔄 Refresh Saluran', 'admin_channels')]);
    buttons.push([Markup.button.callback('🔙 Kembali ke Menu Admin', 'admin_menu')]);

    await cleanAndSend(ctx, text, Markup.inlineKeyboard(buttons), { state: 'admin_channels' });
  });

  // Action: Toggle Channel Status
  bot.action(/^adm_toggle_ch_(.+)$/, async (ctx) => {
    const channelId = ctx.match[1];
    const telegramId = String(ctx.from.id);
    if (!await isUserAdmin(telegramId)) return;

    try {
      const channels = await dbService.getChannels();
      const target = channels.find(c => c.channel_id === channelId);
      if (target) {
        const newStatus = !target.is_active;
        await dbService.saveChannel({
          ...target,
          is_active: newStatus
        });
        await ctx.answerCbQuery(`${target.name} sekarang: ${newStatus ? 'DITAMPILKAN' : 'DISEMBUNYIKAN'}`);
      }
    } catch (e) {
      await ctx.answerCbQuery('Gagal mengubah channel: ' + e.message);
    }

    // Refresh
    const updatedChannels = await dbService.getChannels().catch(() => []);
    let text = `📢 <b>SALURAN / CHANNEL TELEGRAM</b>\n\n`;
    const buttons = [];
    updatedChannels.forEach((ch) => {
      const statusIcon = ch.is_active ? '🟢' : '🔴';
      text += `${statusIcon} <b>${ch.name}</b>\n` +
        `• Link: ${ch.invite_link || (ch.username ? '@' + ch.username : '-')}\n` +
        `• Klik: ${ch.clicks_count || 0} | Transaksi: ${ch.orders_count || 0}\n\n`;

      buttons.push([
        Markup.button.callback(
          `${ch.is_active ? '🔴 Sembunyikan' : '🟢 Tampilkan'} ${ch.name.slice(0, 16)}`,
          `adm_toggle_ch_${ch.channel_id}`
        )
      ]);
    });
    buttons.push([Markup.button.callback('🔙 Kembali ke Menu Admin', 'admin_menu')]);
    await cleanAndSend(ctx, text, Markup.inlineKeyboard(buttons), { state: 'admin_channels' });
  });

  // Action: Admin Finances Recap
  bot.action('admin_finances', async (ctx) => {
    await ctx.answerCbQuery();
    const telegramId = String(ctx.from.id);
    if (!await isUserAdmin(telegramId)) return;

    const orders = await dbService.getOrders().catch(() => []);
    const successfulOrders = orders.filter(o => 
      o.payment_status === 'PAID' || 
      o.payment_status === 'FINISHED' || 
      o.payment_status === 'APPROVED' || 
      o.payment_status === 'VERIFIED_BY_ADMIN'
    );

    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const sevenDays = 7 * oneDay;
    const thirtyDays = 30 * oneDay;
    const oneYear = 365 * oneDay;

    let todayIdr = 0, todayUsd = 0, todayCount = 0;
    let weekIdr = 0, weekUsd = 0, weekCount = 0;
    let monthIdr = 0, monthUsd = 0, monthCount = 0;
    let yearIdr = 0, yearUsd = 0, yearCount = 0;

    for (const o of successfulOrders) {
      const createdTime = new Date(o.created_at || o.timestamp || now).getTime();
      const age = now - createdTime;
      const idr = Number(o.total_amount_idr) || (Number(o.amount || 0) * 16000);
      const usd = Number(o.amount || 0);

      if (age <= oneDay) {
        todayCount++;
        todayIdr += idr;
        todayUsd += usd;
      }
      if (age <= sevenDays) {
        weekCount++;
        weekIdr += idr;
        weekUsd += usd;
      }
      if (age <= thirtyDays) {
        monthCount++;
        monthIdr += idr;
        monthUsd += usd;
      }
      if (age <= oneYear) {
        yearCount++;
        yearIdr += idr;
        yearUsd += usd;
      }
    }

    const text = `📊 <b>REKAPAN & RINGKASAN KEUANGAN TOKO</b>\n\n` +
      `📅 <b>Hari Ini (24 Jam Terakhir):</b>\n` +
      `• Sukses: ${todayCount} pesanan\n` +
      `• Omset: Rp ${todayIdr.toLocaleString('id-ID')} ($${todayUsd.toFixed(2)} USD)\n\n` +
      `🗓️ <b>Minggu Ini (7 Hari):</b>\n` +
      `• Sukses: ${weekCount} pesanan\n` +
      `• Omset: Rp ${weekIdr.toLocaleString('id-ID')} ($${weekUsd.toFixed(2)} USD)\n\n` +
      `📆 <b>Bulan Ini (30 Hari):</b>\n` +
      `• Sukses: ${monthCount} pesanan\n` +
      `• Omset: Rp ${monthIdr.toLocaleString('id-ID')} ($${monthUsd.toFixed(2)} USD)\n\n` +
      `📈 <b>Tahun Ini (365 Hari):</b>\n` +
      `• Total Sukses: ${yearCount} pesanan\n` +
      `• Total Omset: Rp ${yearIdr.toLocaleString('id-ID')} ($${yearUsd.toFixed(2)} USD)\n\n` +
      `<i>Perhitungan dihitung murni dari transaksi valid di database.</i>`;

    const buttons = [
      [Markup.button.callback('🔄 Perbarui Rekap Keuangan', 'admin_finances')],
      [Markup.button.callback('🔙 Kembali ke Menu Admin', 'admin_menu')]
    ];

    await cleanAndSend(ctx, text, Markup.inlineKeyboard(buttons), { state: 'admin_finances' });
  });

  // Action: Admin System Cleanup
  bot.action('admin_cleanup', async (ctx) => {
    await ctx.answerCbQuery();
    const telegramId = String(ctx.from.id);
    if (!await isUserAdmin(telegramId)) return;

    const text = `🧹 <b>PEMBERSIHAN SISTEM & OPTIMASI DATABASE</b>\n\n` +
      `Fitur ini menjaga performa server tetap cepat dan database tetap bersih:\n\n` +
      `1. <b>Bersihkan Cache Sistem:</b> Mengosongkan memori RAM cache dan reset buffer sementara.\n` +
      `2. <b>Hapus Transaksi Batal/Expired:</b> Menghapus permanen seluruh pesanan berstatus CANCELLED & EXPIRED.\n\n` +
      `Silakan pilih tindakan pembersihan di bawah:`;

    const buttons = [
      [Markup.button.callback('🧹 Bersihkan Cache RAM Sekarang', 'adm_clean_cache')],
      [Markup.button.callback('🗑️ Hapus Pesanan Batal / Expired', 'adm_clean_orders')],
      [Markup.button.callback('🔙 Kembali ke Menu Admin', 'admin_menu')]
    ];

    await cleanAndSend(ctx, text, Markup.inlineKeyboard(buttons), { state: 'admin_cleanup' });
  });

  // Action: Execute Cache Cleanup
  bot.action('adm_clean_cache', async (ctx) => {
    await ctx.answerCbQuery('Membersihkan cache...');
    const telegramId = String(ctx.from.id);
    if (!await isUserAdmin(telegramId)) return;

    const res = await cleanSystemCache();

    const text = `✅ <b>CACHE SISTEM BERHASIL DIBERSIHKAN</b>\n\n` +
      `• Hasil: ${res.message}\n` +
      `• Waktu Eksekusi: ${new Date().toLocaleString('id-ID')}\n\n` +
      `Server saat ini beroperasi dengan memori RAM yang optimal.`;

    const buttons = [
      [Markup.button.callback('🔙 Kembali ke Menu Admin', 'admin_menu')]
    ];

    await cleanAndSend(ctx, text, Markup.inlineKeyboard(buttons), { state: 'admin_cleaned' });
  });

  // Action: Execute Cancelled Orders Purge
  bot.action('adm_clean_orders', async (ctx) => {
    await ctx.answerCbQuery('Menghapus pesanan batal...');
    const telegramId = String(ctx.from.id);
    if (!await isUserAdmin(telegramId)) return;

    const res = await cleanCancelledOrders(dbService);

    const text = `✅ <b>PEMBERSIHAN PESANAN BATAL SELESAI</b>\n\n` +
      `• Pesanan Dihapus: <b>${res.purged_count} pesanan</b>\n` +
      `• Pesanan Berhasil & Pending: <b>Tetap Aman Terjaga</b>\n` +
      `• Waktu Eksekusi: ${new Date().toLocaleString('id-ID')}\n\n` +
      `Ruang penyimpanan database telah dikosongkan.`;

    const buttons = [
      [Markup.button.callback('🔙 Kembali ke Menu Admin', 'admin_menu')]
    ];

    await cleanAndSend(ctx, text, Markup.inlineKeyboard(buttons), { state: 'admin_cleaned' });
  });

  // Action: Auto-Migration Database Tables
  bot.action('admin_sync_db', async (ctx) => {
    await ctx.answerCbQuery('Menyelaraskan skema tabel...');
    const telegramId = String(ctx.from.id);
    if (!await isUserAdmin(telegramId)) return;

    await autoMigrateUniversalDatabase(dbService);

    const text = `🔄 <b>AUTO-MIGRATION TABEL DATABASE SUKSES</b>\n\n` +
      `✅ Status: <b>Tabel Database Berhasil Diselaraskan</b>\n` +
      `Tabel yang terverifikasi & aktif:\n` +
      `• <code>admins</code>, <code>settings</code>, <code>products</code>, <code>stocks</code>\n` +
      `• <code>orders</code>, <code>crypto_wallets</code>, <code>wallets</code>, <code>bot_tokens</code>\n` +
      `• <code>users</code>, <code>user_sessions</code>, <code>payment_methods</code>, <code>channels</code>\n\n` +
      `Seluruh kolom & struktur baru telah disinkronkan tanpa menghapus atau merusak data yang sudah ada.`;

    const buttons = [
      [Markup.button.callback('🔙 Kembali ke Menu Admin', 'admin_menu')]
    ];

    await cleanAndSend(ctx, text, Markup.inlineKeyboard(buttons), { state: 'admin_synced' });
  });

  // Action: Engine Status & Realtime Metrics
  bot.action('admin_engine_status', async (ctx) => {
    await ctx.answerCbQuery();
    const telegramId = String(ctx.from.id);
    if (!await isUserAdmin(telegramId)) return;

    const m = getBotEngineMetrics();
    const text = `📡 <b>STATUS TELEGRAM BOT ENGINE</b>\n\n` +
      `• Mode: <b>${m.engine_label}</b>\n` +
      `• Uptime Server: <b>${m.uptime_human}</b>\n` +
      `• Latency: <b>${m.latency_ms} ms</b>\n` +
      `• Total Request Terproses: <b>${m.total_requests}</b>\n` +
      `• Reconnect: <b>${m.reconnects}x</b>\n` +
      `• Bot Aktif: <b>${m.active_bots}</b>\n\n` +
      `<i>Update terakhir: ${m.last_update_at || '-'}</i>`;

    const buttons = [
      [Markup.button.callback('🔄 Refresh Status', 'admin_engine_status')],
      [Markup.button.callback('🔙 Kembali ke Menu Admin', 'admin_menu')]
    ];

    await cleanAndSend(ctx, text, Markup.inlineKeyboard(buttons), { state: 'admin_engine_status' });
  });

  // Action: Manual Database Backup -> delivered as a document to the admin chat
  bot.action('admin_backup', async (ctx) => {
    await ctx.answerCbQuery('Menyiapkan backup database...');
    const telegramId = String(ctx.from.id);
    if (!await isUserAdmin(telegramId)) return;

    try {
      const backup = await buildDatabaseBackup(dbService);
      const json = JSON.stringify(backup, null, 2);
      const buffer = Buffer.from(json, 'utf8');

      await bot.telegram.sendDocument(ctx.chat.id, {
        source: buffer,
        filename: `db_backup_${Date.now()}.json`
      }, { caption: `🗄️ <b>Backup Database Toko</b>\n\nProduk: ${backup.counts.products} | Pesanan: ${backup.counts.orders} | Pengguna: ${backup.counts.users} | Kupon: ${backup.counts.coupons}`, parse_mode: 'HTML' });

      await dbService.addSystemLog({ admin_id: telegramId, action: 'manual_db_backup' }).catch(() => {});
    } catch (e) {
      await cleanAndSend(ctx, `⚠️ <b>Gagal membuat backup:</b> ${e.message}`, Markup.inlineKeyboard([
        [Markup.button.callback('🔙 Kembali ke Menu Admin', 'admin_menu')]
      ]));
    }
  });

  // Action: Broadcast Engine launcher
  bot.action('admin_broadcast', async (ctx) => {
    await ctx.answerCbQuery();
    const telegramId = String(ctx.from.id);
    if (!await isUserAdmin(telegramId)) return;

    const status = getBroadcastStatus();
    const text = `📢 <b>MASS BROADCAST ENGINE</b>\n\n` +
      `Kirim pesan massal ke seluruh pengguna bot dengan antrean (rate-limited).\n\n` +
      `Status Terakhir:\n` +
      `• Berjalan: <b>${status.running ? 'Ya' : 'Tidak'}</b>\n` +
      `• Terkirim: <b>${status.sent}</b> | Gagal: <b>${status.failed}</b>\n` +
      `• Sisa: <b>${status.remaining}</b> dari ${status.total}\n\n` +
      `<i>Gunakan menu Web Admin Panel untuk menyusun isi pesan broadcast baru.</i>`;

    const buttons = [
      [Markup.button.callback('🔄 Refresh Progres', 'admin_broadcast')]
    ];
    if (status.running) {
      buttons.push([Markup.button.callback('⏹️ Hentikan Broadcast', 'adm_broadcast_stop')]);
    }
    buttons.push([Markup.button.callback('🔙 Kembali ke Menu Admin', 'admin_menu')]);

    await cleanAndSend(ctx, text, Markup.inlineKeyboard(buttons), { state: 'admin_broadcast' });
  });

  // Action: Stop a running broadcast
  bot.action('adm_broadcast_stop', async (ctx) => {
    const telegramId = String(ctx.from.id);
    if (!await isUserAdmin(telegramId)) return;
    const res = stopBroadcast();
    await ctx.answerCbQuery(res.message, { show_alert: true });
  });

  // Action: Coupons overview
  bot.action('admin_coupons', async (ctx) => {
    await ctx.answerCbQuery();
    const telegramId = String(ctx.from.id);
    if (!await isUserAdmin(telegramId)) return;

    const coupons = await dbService.getCoupons().catch(() => []);
    let text = `🎟️ <b>KODE KUPON DISKON</b>\n\n`;
    if (!coupons || coupons.length === 0) {
      text += `<i>Belum ada kupon. Tambahkan lewat Web Admin Panel.</i>\n`;
    } else {
      coupons.forEach((c) => {
        const pct = Number(c.discount_percentage) || 0;
        const fixed = Number(c.fixed_discount) || 0;
        const disc = pct > 0 ? `${pct}%` : `Rp ${fixed.toLocaleString('id-ID')}`;
        text += `${c.is_active ? '🟢' : '🔴'} <code>${c.code}</code> - Diskon ${disc} | Kuota: ${c.used_count || 0}/${c.max_uses || '∞'}\n`;
      });
    }
    text += `\n<i>Kelola tambah/hapus kupon melalui Web Admin Panel.</i>`;

    const buttons = [
      [Markup.button.callback('🔄 Refresh Kupon', 'admin_coupons')],
      [Markup.button.callback('🔙 Kembali ke Menu Admin', 'admin_menu')]
    ];

    await cleanAndSend(ctx, text, Markup.inlineKeyboard(buttons), { state: 'admin_coupons' });
  });

  // Launch polling safely with auto-reconnect, exponential backoff & heartbeat
  async function startPolling() {
    try {
      // Step 1: Clear any lingering webhook or pending update lock
      await bot.telegram.deleteWebhook({ drop_pending_updates: true }).catch(wErr => {
        console.warn(`[Bot Engine] Note clearing webhook for "${bot_name}":`, wErr.message);
      });

      // Step 2: Start long polling
      await bot.launch({
        dropPendingUpdates: true
      });
      console.log(`[Bot Engine] Bot "${bot_name}" successfully polling online!`);
      console.log(`[Bot Engine] Bot "${bot_name}" successfully polling online!`);
      engineMetrics.polling_alive = true;
      reconnectAttempts = 0;
      dbService.updateBotToken(token_id, {
        status: 'online',
        is_running: true,
        error_message: null
      }).catch(() => {});

      // Keep-alive heartbeat: periodically verify polling stays registered.
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      heartbeatTimer = setInterval(async () => {
        try {
          await bot.telegram.getMe();
          engineMetrics.polling_alive = true;
        } catch (hbErr) {
          console.warn(`[Bot Engine] Heartbeat warning for "${bot_name}":`, hbErr.message);
          scheduleReconnect();
        }
      }, 60000);
    } catch (err) {
      const isConflict = err.message?.includes('409') || err.message?.includes('Conflict');
      if (isConflict) {
        console.warn(`[Bot Engine] Bot "${bot_name}" conflict (409): Token sedang digunakan oleh proses atau server bot lain.`);
        dbService.updateBotToken(token_id, {
          status: 'conflict',
          is_running: false,
          error_message: '409 Conflict: Token ini sedang aktif di proses/server lain. Pastikan hanya 1 aplikasi yang menjalankan token ini.'
        }).catch(() => {});
      } else {
        console.error(`[Bot Engine] Bot "${bot_name}" failed to start:`, err.message);
        dbService.updateBotToken(token_id, {
          status: 'error',
          is_running: false,
          error_message: err.message
        }).catch(() => {});
        // Auto-reconnect with exponential backoff instead of giving up.
        scheduleReconnect();
      }
    }
  }

  // Exponential backoff reconnect: never kills the Node process, retries forever.
  let reconnectAttempts = 0;
  let reconnectTimer = null;
  let heartbeatTimer = null;

  function scheduleReconnect() {
    if (reconnectTimer) return;
    reconnectAttempts++;
    engineMetrics.reconnects++;
    engineMetrics.polling_alive = false;
    const delay = Math.min(30000, 1000 * Math.pow(2, Math.min(reconnectAttempts, 5)));
    console.warn(`[Bot Engine] Reconnecting "${bot_name}" in ${delay}ms (attempt ${reconnectAttempts}).`);

    reconnectTimer = setTimeout(async () => {
      reconnectTimer = null;
      try {
        await bot.telegram.deleteWebhook({ drop_pending_updates: false }).catch(() => {});
        await bot.launch({ dropPendingUpdates: false });
        reconnectAttempts = 0;
        engineMetrics.polling_alive = true;
        dbService.updateBotToken(token_id, { status: 'online', is_running: true, error_message: null }).catch(() => {});
      } catch (e) {
        scheduleReconnect();
      }
    }, delay);
  }

  function stopPolling() {
    try {
      if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
      if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
      engineMetrics.polling_alive = false;
      bot.stop('SIGINT');
      console.log(`[Bot Engine] Bot "${bot_name}" polling stopped.`);
      dbService.updateBotToken(token_id, { status: 'stopped', is_running: false }).catch(() => {});
    } catch (e) {
      console.warn('Bot stop warning:', e.message);
    }
  }

  return { bot, start: startPolling, stop: stopPolling };
}

/**
 * Serverless / Vercel bootstrap:
 * Instead of long polling (which cannot run on serverless), we register a
 * Telegram webhook pointing at this deployment so updates are pushed to the
 * serverless function. This makes the bot work automatically after deploy
 * when the project is imported from GitHub.
 *
 * @param {object} dbService  Universal DB service
 * @param {string} baseUrl    Public deployment URL (e.g. https://app.vercel.app)
 */
export async function initializeWebhooks(dbService, baseUrl) {
  const webhookBase = (baseUrl || process.env.APP_URL || process.env.VERCEL_URL || '').replace(/\/$/, '');
  if (!webhookBase) {
    console.warn('[Bot Engine] Webhook mode skipped: no public base URL available.');
    return { success: false, message: 'Base URL tidak tersedia.' };
  }

  // Normalize VERCEL_URL (which lacks a protocol)
  const normalizedBase = webhookBase.startsWith('http') ? webhookBase : `https://${webhookBase}`;

  let tokens = [];
  try {
    tokens = await dbService.getBotTokens();
  } catch (e) {
    return { success: false, message: e.message };
  }

  const results = [];
  for (const tokenConfig of tokens) {
    const cleanToken = tokenConfig.bot_token?.trim();
    if (!cleanToken || tokenConfig.is_active === false) continue;

    // Each bot uses a unique webhook path so multiple bots can coexist.
    const webhookPath = `/api/telegram/webhook/${tokenConfig.token_id}`;
    const webhookUrl = `${normalizedBase}${webhookPath}`;

    try {
      const resp = await fetch(`https://api.telegram.org/bot${cleanToken}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: webhookUrl, drop_pending_updates: true })
      });
      const data = await resp.json();
      if (data.ok) {
        results.push({ token_id: tokenConfig.token_id, success: true, url: webhookUrl });
        dbService.updateBotToken(tokenConfig.token_id, { status: 'online', is_running: true, webhook_url: webhookUrl }).catch(() => {});
        console.log(`[Bot Engine] Webhook registered for "${tokenConfig.bot_name}": ${webhookUrl}`);
      } else {
        results.push({ token_id: tokenConfig.token_id, success: false, error: data.description });
      }
    } catch (err) {
      results.push({ token_id: tokenConfig.token_id, success: false, error: err.message });
    }
  }

  return { success: true, registered: results };
}

/**
 * Initializes and starts all configured active bot tokens from database
 */
export async function initializeAllBots(dbService) {
  try {
    const tokens = await dbService.getBotTokens();
    console.log(`[Bot Engine] Found ${tokens.length} bot tokens in database.`);

    const seenTokens = new Set();

    for (const tokenConfig of tokens) {
      const cleanToken = tokenConfig.bot_token?.trim();
      if (!cleanToken) continue;

      // Prevent duplicate instances of the same token in memory
      if (seenTokens.has(cleanToken)) {
        console.warn(`[Bot Engine] Skipping duplicate token ID ${tokenConfig.token_id} for "${tokenConfig.bot_name}".`);
        continue;
      }

      if (tokenConfig.is_active && !activeBots.has(tokenConfig.token_id)) {
        seenTokens.add(cleanToken);
        try {
          const instance = createBotInstance(tokenConfig, dbService);
          await instance.start();
          activeBots.set(tokenConfig.token_id, instance);
        } catch (err) {
          console.error(`[Bot Engine] Error starting bot ${tokenConfig.bot_name}:`, err.message);
        }
      }
    }
  } catch (err) {
    console.error('[Bot Engine] Failed to load bots from database:', err.message);
  }
}

export async function launchSingleBot(botConfig, dbService) {
  const { token_id, bot_token } = botConfig;
  stopSingleBot(token_id);

  // Also stop any other bot instance using the same token
  const cleanToken = bot_token?.trim();
  for (const [id, inst] of activeBots.entries()) {
    if (inst.token === cleanToken || id === token_id) {
      try { inst.stop(); } catch (e) {}
      activeBots.delete(id);
    }
  }

  try {
    const instance = createBotInstance(botConfig, dbService);
    await instance.start();
    activeBots.set(token_id, instance);
    return { success: true, status: 'online' };
  } catch (err) {
    return { success: false, status: 'error', error: err.message };
  }
}

export function stopSingleBot(tokenId) {
  if (activeBots.has(tokenId)) {
    const inst = activeBots.get(tokenId);
    try {
      inst.stop();
    } catch (e) {}
    activeBots.delete(tokenId);
  }
}

export async function startMultiBotManager(dbService) {
  return initializeAllBots(dbService);
}

export default {
  createBotInstance,
  initializeAllBots,
  launchSingleBot,
  stopSingleBot,
  startMultiBotManager,
  activeBots,
  translateText,
  autoTranslate,
  getBotEngineMetrics,
  buildDatabaseBackup,
  initializeWebhooks
};
