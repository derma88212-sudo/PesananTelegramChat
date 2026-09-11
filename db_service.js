/**
 * Universal Database Service Layer
 * Supports seamless hybrid operation between Supabase and Google Cloud Firestore.
 * Automatically detects SUPABASE_URL / SUPABASE_ANON_KEY from environment.
 * If Supabase is active, reads/writes sync to Supabase with Firestore redundancy.
 * If Supabase is not configured, operations seamlessly run on Firestore with zero errors.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  runTransaction
} from 'firebase/firestore';
import { db } from './firebase_config.js';
import { getSupabase, isSupabaseEnabled } from './supabase_client.js';

class DatabaseService {
  constructor() {
    this.db = db;
    this.initialized = false;
    // Properti string pendukung agar tidak error saat dioper ke handler yang mengekspektasikan string/path
    this.path = '/';
    this.root = '/';
  }

  // String coercion conversion agar aman dari TS2345 jika instance dioper langsung sebagai string
  toString() {
    return 'DatabaseService';
  }

  valueOf() {
    return 'DatabaseService';
  }

  get supabase() {
    return getSupabase();
  }

  get hasSupabase() {
    return isSupabaseEnabled() && Boolean(this.supabase);
  }

  // --- Seed Defaults to both Supabase & Firestore ---
  async ensureSeeded() {
    if (this.initialized) return;
    // Prevent concurrent duplicate seeding attempts.
    if (this._seeding) return this._seeding;

    this._seeding = this._runSeeding();
    try {
      await this._seeding;
    } finally {
      this._seeding = null;
    }
  }

  async _runSeeding() {
    // 1. Seed Firestore defaults
    try {
      // 1.1 Root Admin in Firestore
      const adminDoc = await getDoc(doc(this.db, 'admins', 'root_admin'));
      if (!adminDoc.exists()) {
        console.log('[Firestore] Seeding default Root Admin (root@admin.com / kucing123)...');
        await setDoc(doc(this.db, 'admins', 'root_admin'), {
          admin_id: 'root_admin',
          username: 'root@admin.com',
          password_hash: 'kucing123',
          role: 'superadmin',
          created_at: new Date().toISOString()
        });
      }

      // 1.2 Settings in Firestore
      const settingsSnap = await getDoc(doc(this.db, 'settings', 'config'));
      if (!settingsSnap.exists()) {
        console.log('[Firestore] Seeding default settings...');
        await setDoc(doc(this.db, 'settings', 'config'), {
          welcome_text: `🤖 <b>SELAMAT DATANG DI STORE AKUN CHATGPT & DIGITAL PRODUCTS!</b>\n\n` +
            `⚡ <i>Semua transaksi instan, otomatis & bergaransi penuh.</i>\n` +
            `💎 <b>Katalog Produk Unggulan:</b>\n` +
            `• Akun ChatGPT Plus 1 Bulan (Private & Shared)\n` +
            `• Claude Pro & OpenAI API Credits\n` +
            `• VPN Premium & Dev Tools\n\n` +
            `Silakan tekan tombol di bawah ini untuk memulai:`,
          terms_text: `ℹ️ <b>SYARAT KETENTUAN & GARANSI TOKO:</b>\n\n` +
            `1. Garansi replace penuh selama durasi langganan (30 hari).\n` +
            `2. Format akun berupa <code>Email:Password:Cookie</code>.\n` +
            `3. Dilarang mengubah password/email untuk akun shared.\n` +
            `4. Verifikasi kripto diproses otomatis via NOWPayments atau Manual Admin.`,
          audio_alert_url: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
          nowpayments_api_key: '',
          nowpayments_ipn_secret: '',
          nowpayments_sandbox: true
        });
      }

      // 1.3 Sample Products in Firestore
      const prodsSnap = await getDocs(collection(this.db, 'products'));
      if (prodsSnap.empty) {
        console.log('[Firestore] Seeding initial digital products...');
        const initialProducts = [
          {
            product_id: 'prod_chatgpt_plus',
            title: 'ChatGPT Plus 1 Month (Private)',
            category: 'OpenAI / ChatGPT',
            price_usd: 15.00,
            price_idr: 235000,
            description: 'Akun ChatGPT Plus 1 Bulan Private. Fitur GPT-4o, DALL-E 3, Voice Chat, dan Browsing. Full garansi 30 hari.',
            created_at: new Date().toISOString()
          },
          {
            product_id: 'prod_chatgpt_shared',
            title: 'ChatGPT Plus 1 Month (Shared Max 2 User)',
            category: 'OpenAI / ChatGPT',
            price_usd: 6.50,
            price_idr: 99000,
            description: 'Akun ChatGPT Plus hemat untuk 2 pengguna terpisah. Akses model GPT-4o lancar & stabil.',
            created_at: new Date().toISOString()
          },
          {
            product_id: 'prod_claude_pro',
            title: 'Claude 3.7 Sonnet Pro 1 Month',
            category: 'Anthropic Claude',
            price_usd: 18.00,
            price_idr: 280000,
            description: 'Akun Claude Pro resmi 1 bulan dengan limit token 5x lebih tinggi, Projects feature & Artifacts.',
            created_at: new Date().toISOString()
          },
          {
            product_id: 'prod_openai_api',
            title: 'OpenAI API Account ($120 Credits Tier 1)',
            category: 'Developer API',
            price_usd: 25.00,
            price_idr: 395000,
            description: 'Akun OpenAI API siap pakai dengan limit usage tier 1 dan free credits valid 3 bulan.',
            created_at: new Date().toISOString()
          }
        ];

        for (const p of initialProducts) {
          await setDoc(doc(this.db, 'products', p.product_id), p);
        }

        const sampleStocks = [
          {
            stock_id: 'stk_01',
            product_id: 'prod_chatgpt_plus',
            account_data: 'chatgpt.user101@proton.me:SuperSecurePass2026:session_token_xyz998',
            status: 'AVAILABLE',
            order_id: null,
            added_at: new Date().toISOString()
          },
          {
            stock_id: 'stk_02',
            product_id: 'prod_chatgpt_plus',
            account_data: 'chatgpt.user102@proton.me:PlusPower2026!:session_token_abc776',
            status: 'AVAILABLE',
            order_id: null,
            added_at: new Date().toISOString()
          },
          {
            stock_id: 'stk_03',
            product_id: 'prod_chatgpt_shared',
            account_data: 'shared.openai99@gmail.com:PasswordShared99:cookie_sess_5511',
            status: 'AVAILABLE',
            order_id: null,
            added_at: new Date().toISOString()
          },
          {
            stock_id: 'stk_04',
            product_id: 'prod_claude_pro',
            account_data: 'claude.pro2026@gmail.com:AnthropicPass77#:cookie_claude_9901',
            status: 'AVAILABLE',
            order_id: null,
            added_at: new Date().toISOString()
          }
        ];

        for (const s of sampleStocks) {
          await setDoc(doc(this.db, 'stocks', s.stock_id), s);
        }
      }

      // 1.4 Sample Crypto Wallets
      const walletsSnap = await getDocs(collection(this.db, 'crypto_wallets'));
      if (walletsSnap.empty) {
        console.log('[Firestore] Seeding crypto wallets...');
        const initialWallets = [
          {
            wallet_id: 'w_trc20',
            network: 'USDT (TRC-20)',
            address: 'TYDzsYUEpvnYmQCWt6VbJ2tYgB5Gsmz7kK',
            qr_url: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=TYDzsYUEpvnYmQCWt6VbJ2tYgB5Gsmz7kK',
            is_active: true
          },
          {
            wallet_id: 'w_bep20',
            network: 'USDT / BNB (BEP-20)',
            address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
            qr_url: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
            is_active: true
          },
          {
            wallet_id: 'w_btc',
            network: 'Bitcoin (BTC)',
            address: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
            qr_url: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
            is_active: true
          },
          {
            wallet_id: 'w_sol',
            network: 'Solana (SOL / USDT)',
            address: '8b3JzX5oVqM7kG4mF8wX9aD2jB1nC3eK6rL9pQ8sT4vY',
            qr_url: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=8b3JzX5oVqM7kG4mF8wX9aD2jB1nC3eK6rL9pQ8sT4vY',
            is_active: true
          }
        ];

        for (const w of initialWallets) {
          await setDoc(doc(this.db, 'crypto_wallets', w.wallet_id), w);
        }
      }
    } catch (err) {
      console.warn('[Firestore] Initialization warning:', err.message);
      // A failed seed must not mark the service as initialized, otherwise the
      // process would never retry and the database could stay unseeded forever.
      this.initialized = false;
      throw err;
    }

    // 2. Seed Supabase if enabled and tables exist
    if (this.hasSupabase) {
      try {
        console.log('[Supabase] Checking and seeding defaults to Supabase...');
        const sb = this.supabase;

        // Seed Root Admin in Supabase
        await sb.from('admins').upsert({
          admin_id: 'root_admin',
          username: 'root@admin.com',
          password_hash: 'kucing123',
          role: 'superadmin'
        }, { onConflict: 'admin_id' });

        // Seed Settings in Supabase
        await sb.from('settings').upsert({
          id: 'config',
          welcome_text: `🤖 <b>SELAMAT DATANG DI STORE AKUN CHATGPT & DIGITAL PRODUCTS!</b>\n\n` +
            `⚡ <i>Semua transaksi instan, otomatis & bergaransi penuh.</i>\n` +
            `💎 <b>Katalog Produk Unggulan:</b>\n` +
            `• Akun ChatGPT Plus 1 Bulan (Private & Shared)\n` +
            `• Claude Pro & OpenAI API Credits\n` +
            `• VPN Premium & Dev Tools\n\n` +
            `Silakan tekan tombol di bawah ini untuk memulai:`,
          terms_text: `ℹ️ <b>SYARAT KETENTUAN & GARANSI TOKO:</b>\n\n` +
            `1. Garansi replace penuh selama durasi langganan (30 hari).\n` +
            `2. Format akun berupa <code>Email:Password:Cookie</code>.\n` +
            `3. Dilarang mengubah password/email untuk akun shared.\n` +
            `4. Verifikasi kripto diproses otomatis via NOWPayments atau Manual Admin.`,
          audio_alert_url: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'
        }, { onConflict: 'id' });

        // Seed Products in Supabase if table empty
        const { count } = await sb.from('products').select('*', { count: 'exact', head: true });
        if (!count || count === 0) {
          await sb.from('products').upsert([
            {
              product_id: 'prod_chatgpt_plus',
              title: 'ChatGPT Plus 1 Month (Private)',
              category: 'OpenAI / ChatGPT',
              price_usd: 15.00,
              price_idr: 235000,
              description: 'Akun ChatGPT Plus 1 Bulan Private. Fitur GPT-4o, DALL-E 3, Voice Chat, dan Browsing. Full garansi 30 hari.'
            },
            {
              product_id: 'prod_chatgpt_shared',
              title: 'ChatGPT Plus 1 Month (Shared Max 2 User)',
              category: 'OpenAI / ChatGPT',
              price_usd: 6.50,
              price_idr: 99000,
              description: 'Akun ChatGPT Plus hemat untuk 2 pengguna terpisah. Akses model GPT-4o lancar & stabil.'
            },
            {
              product_id: 'prod_claude_pro',
              title: 'Claude 3.7 Sonnet Pro 1 Month',
              category: 'Anthropic Claude',
              price_usd: 18.00,
              price_idr: 280000,
              description: 'Akun Claude Pro resmi 1 bulan dengan limit token 5x lebih tinggi, Projects feature & Artifacts.'
            },
            {
              product_id: 'prod_openai_api',
              title: 'OpenAI API Account ($120 Credits Tier 1)',
              category: 'Developer API',
              price_usd: 25.00,
              price_idr: 395000,
              description: 'Akun OpenAI API siap pakai dengan limit usage tier 1 dan free credits valid 3 bulan.'
            }
          ], { onConflict: 'product_id' });
        }

        console.log('[Supabase] Initial seed completed.');
      } catch (sbErr) {
        console.warn('[Supabase] Seeding note (tables may need creation):', sbErr.message);
      }
    }

    // Only mark as initialized once every seed step has completed successfully.
    this.initialized = true;
  }

  /**
   * Generic read helper that unifies the "try Supabase, else fall back to
   * Firestore" pattern used across every getter.
   *
   * @param supabaseQuery  A pre-built Supabase query builder (already chained
   *                       with any .eq/.order calls) or null.
   * @param firestoreRead  Async function returning the Firestore result.
   * @param options.emptyCheck  Predicate deciding whether a Supabase result is
   *                       usable (default: non-empty array / truthy object).
   */
  async queryWithFallback(supabaseQuery, firestoreRead, options = {}) {
    const { treatEmptyAsFallback = true } = options;

    if (this.hasSupabase && supabaseQuery) {
      try {
        const { data, error } = await supabaseQuery;
        if (!error && data !== null && data !== undefined) {
          const isEmpty = Array.isArray(data) ? data.length === 0 : false;
          if (!(treatEmptyAsFallback && isEmpty)) {
            return data;
          }
        }
      } catch (e) {
        // Swallow and fall back to Firestore
      }
    }

    return firestoreRead();
  }

  // --- Users ---
  async upsertUser(userData) {
    // 1. Supabase
    if (this.hasSupabase) {
      try {
        await this.supabase.from('users').upsert({
          telegram_id: String(userData.telegram_id),
          username: userData.username || '',
          first_name: userData.first_name || '',
          last_name: userData.last_name || '',
          language: userData.language || 'id',
          last_active: new Date().toISOString()
        }, { onConflict: 'telegram_id' });
      } catch (e) {
        console.warn('[Supabase User Upsert Note]:', e.message);
      }
    }

    // 2. Firestore
    try {
      const userRef = doc(this.db, 'users', String(userData.telegram_id));
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        await setDoc(userRef, {
          ...userData,
          created_at: new Date().toISOString()
        });
      } else {
        await updateDoc(userRef, {
          username: userData.username || snap.data().username,
          language: userData.language || snap.data().language,
          last_active: new Date().toISOString()
        });
      }
    } catch (e) {}
  }

  async getUsers() {
    return this.queryWithFallback(
      this.hasSupabase ? this.supabase.from('users').select('*') : null,
      async () => {
        const snap = await getDocs(collection(this.db, 'users'));
        return snap.docs.map(d => d.data());
      }
    );
  }

  // --- User Sessions ---
  async getUserSession(telegramId) {
    const tId = String(telegramId);
    if (this.hasSupabase) {
      try {
        const { data, error } = await this.supabase.from('user_sessions').select('*').eq('telegram_id', tId).single();
        if (!error && data) return data;
      } catch (e) {}
    }
    const snap = await getDoc(doc(this.db, 'user_sessions', tId));
    return snap.exists() ? snap.data() : null;
  }

  async updateUserSession(telegramId, sessionData) {
    const tId = String(telegramId);
    if (this.hasSupabase) {
      try {
        await this.supabase.from('user_sessions').upsert({
          telegram_id: tId,
          ...sessionData,
          updated_at: new Date().toISOString()
        }, { onConflict: 'telegram_id' });
      } catch (e) {}
    }
    try {
      await setDoc(doc(this.db, 'user_sessions', tId), {
        telegram_id: tId,
        ...sessionData,
        updated_at: new Date().toISOString()
      }, { merge: true });
    } catch (e) {}
  }

  // --- Products ---
  async getProducts() {
    return this.queryWithFallback(
      this.hasSupabase ? this.supabase.from('products').select('*') : null,
      async () => {
        const snap = await getDocs(collection(this.db, 'products'));
        return snap.docs.map(d => d.data());
      }
    );
  }

  async getProduct(productId) {
    if (!productId) return null;
    if (this.hasSupabase) {
      try {
        const { data, error } = await this.supabase.from('products').select('*').eq('product_id', productId).single();
        if (!error && data) return data;
      } catch (e) {}
    }
    try {
      const snap = await getDoc(doc(this.db, 'products', productId));
      if (snap.exists()) return snap.data();
    } catch (e) {}

    const all = await this.getProducts();
    return all.find(p => p.product_id === productId || p.id === productId || (p.product_id && productId.startsWith(p.product_id))) || null;
  }

  async saveProduct(product) {
    const pId = product.product_id || `prod_${Date.now()}`;
    const payload = {
      ...product,
      product_id: pId,
      created_at: product.created_at || new Date().toISOString()
    };

    if (this.hasSupabase) {
      try {
        await this.supabase.from('products').upsert(payload, { onConflict: 'product_id' });
      } catch (e) {
        console.warn('[Supabase saveProduct note]:', e.message);
      }
    }

    await setDoc(doc(this.db, 'products', pId), payload, { merge: true });
    return pId;
  }

  async updateProduct(productId, updateData) {
    if (this.hasSupabase) {
      try {
        await this.supabase.from('products').update({
          ...updateData,
          updated_at: new Date().toISOString()
        }).eq('product_id', productId);
      } catch (e) {}
    }

    await setDoc(doc(this.db, 'products', productId), {
      ...updateData,
      updated_at: new Date().toISOString()
    }, { merge: true });
  }

  async deleteProduct(productId) {
    if (this.hasSupabase) {
      try {
        await this.supabase.from('products').delete().eq('product_id', productId);
      } catch (e) {}
    }
    await deleteDoc(doc(this.db, 'products', productId));
  }

  // --- Stocks Inventory ---
  async getAvailableStockCount(productId) {
    if (this.hasSupabase) {
      try {
        const { count, error } = await this.supabase
          .from('stocks')
          .select('*', { count: 'exact', head: true })
          .eq('product_id', productId)
          .eq('status', 'AVAILABLE');
        if (!error && count !== null) return count;
      } catch (e) {}
    }

    const q = query(
      collection(this.db, 'stocks'),
      where('product_id', '==', productId),
      where('status', '==', 'AVAILABLE')
    );
    const snap = await getDocs(q);
    return snap.size;
  }

  async getStocks(productId = null) {
    let supabaseQuery = null;
    if (this.hasSupabase) {
      supabaseQuery = this.supabase.from('stocks').select('*');
      if (productId) supabaseQuery = supabaseQuery.eq('product_id', productId);
    }

    return this.queryWithFallback(supabaseQuery, async () => {
      let q = collection(this.db, 'stocks');
      if (productId) {
        q = query(q, where('product_id', '==', productId));
      }
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data());
    });
  }

  async addStockItem(productId, accountData) {
    const stockId = `stk_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const stockDoc = {
      stock_id: stockId,
      product_id: productId,
      account_data: accountData.trim(),
      status: 'AVAILABLE',
      order_id: null,
      added_at: new Date().toISOString()
    };

    if (this.hasSupabase) {
      try {
        await this.supabase.from('stocks').insert(stockDoc);
      } catch (e) {
        console.warn('[Supabase addStock note]:', e.message);
      }
    }

    await setDoc(doc(this.db, 'stocks', stockId), stockDoc);
    return stockDoc;
  }

  async deleteStockItem(stockId) {
    if (this.hasSupabase) {
      try {
        await this.supabase.from('stocks').delete().eq('stock_id', stockId);
      } catch (e) {}
    }
    await deleteDoc(doc(this.db, 'stocks', stockId));
  }

  /**
   * Atomic stock claim: ensures no two users receive the same credential
   */
  async claimAvailableStock(productId, orderId) {
    // 1. If Supabase is available, try Supabase claim
    if (this.hasSupabase) {
      try {
        const { data: availableItems, error } = await this.supabase
          .from('stocks')
          .select('*')
          .eq('product_id', productId)
          .eq('status', 'AVAILABLE')
          .limit(1);

        if (!error && availableItems && availableItems.length > 0) {
          const item = availableItems[0];
          const { error: updateErr } = await this.supabase
            .from('stocks')
            .update({
              status: 'SOLD',
              order_id: orderId,
              sold_at: new Date().toISOString()
            })
            .eq('stock_id', item.stock_id)
            .eq('status', 'AVAILABLE');

          if (!updateErr) {
            // Also mark in Firestore if doc exists
            setDoc(doc(this.db, 'stocks', item.stock_id), {
              status: 'SOLD',
              order_id: orderId,
              sold_at: new Date().toISOString()
            }, { merge: true }).catch(() => {});

            return {
              ...item,
              status: 'SOLD',
              order_id: orderId
            };
          }
        }
      } catch (e) {
        console.warn('[Supabase claimStock fallback to Firestore]:', e.message);
      }
    }

    // 2. Firestore Transaction Fallback
    const q = query(
      collection(this.db, 'stocks'),
      where('product_id', '==', productId),
      where('status', '==', 'AVAILABLE')
    );
    const snap = await getDocs(q);

    if (snap.empty) {
      return null;
    }

    const firstDoc = snap.docs[0];
    const stockRef = doc(this.db, 'stocks', firstDoc.id);

    try {
      await runTransaction(this.db, async (transaction) => {
        const sDoc = await transaction.get(stockRef);
        if (!sDoc.exists() || sDoc.data().status !== 'AVAILABLE') {
          throw new Error('Stock already claimed or missing');
        }
        transaction.update(stockRef, {
          status: 'SOLD',
          order_id: orderId,
          sold_at: new Date().toISOString()
        });
      });

      return {
        ...firstDoc.data(),
        status: 'SOLD',
        order_id: orderId
      };
    } catch (err) {
      console.warn('Atomic transaction retry or collision:', err.message);
      return null;
    }
  }

  // --- Orders ---
  async createOrder(orderData) {
    if (this.hasSupabase) {
      try {
        await this.supabase.from('orders').upsert({
          ...orderData,
          created_at: orderData.created_at || new Date().toISOString()
        }, { onConflict: 'order_id' });
      } catch (e) {
        console.warn('[Supabase createOrder note]:', e.message);
      }
    }
    await setDoc(doc(this.db, 'orders', orderData.order_id), orderData);
  }

  async getOrder(orderId) {
    if (this.hasSupabase) {
      try {
        const { data, error } = await this.supabase.from('orders').select('*').eq('order_id', orderId).single();
        if (!error && data) return data;
      } catch (e) {}
    }
    const snap = await getDoc(doc(this.db, 'orders', orderId));
    return snap.exists() ? snap.data() : null;
  }

  async getOrders() {
    return this.queryWithFallback(
      this.hasSupabase ? this.supabase.from('orders').select('*').order('created_at', { ascending: false }) : null,
      async () => {
        const snap = await getDocs(collection(this.db, 'orders'));
        return snap.docs.map(d => d.data()).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }
    );
  }

  async getUserOrders(userId) {
    const uId = String(userId);
    if (this.hasSupabase) {
      try {
        const { data, error } = await this.supabase.from('orders').select('*').eq('user_id', uId).order('created_at', { ascending: false });
        if (!error && data && data.length > 0) return data;
      } catch (e) {}
    }
    const q = query(collection(this.db, 'orders'), where('user_id', '==', uId));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data()).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async updateOrder(orderId, updateData) {
    const payload = {
      ...updateData,
      updated_at: new Date().toISOString()
    };
    if (this.hasSupabase) {
      try {
        await this.supabase.from('orders').update(payload).eq('order_id', orderId);
      } catch (e) {}
    }
    try {
      await setDoc(doc(this.db, 'orders', orderId), payload, { merge: true });
    } catch (e) {
      try {
        await updateDoc(doc(this.db, 'orders', orderId), payload);
      } catch (e2) {}
    }
    return payload;
  }

  async releaseClaimedStock(orderId) {
    if (!orderId) return 0;
    let released = 0;
    if (this.hasSupabase) {
      try {
        const { data, error } = await this.supabase
          .from('stocks')
          .update({ status: 'AVAILABLE', order_id: null, sold_at: null })
          .eq('order_id', orderId)
          .select();
        if (!error && data) released += data.length;
      } catch (e) {}
    }
    try {
      const q = query(collection(this.db, 'stocks'), where('order_id', '==', orderId));
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        await setDoc(doc(this.db, 'stocks', d.id), {
          status: 'AVAILABLE',
          order_id: null,
          sold_at: null
        }, { merge: true });
        released++;
      }
    } catch (e) {
      console.warn('[Firestore releaseClaimedStock note]:', e.message);
    }
    return released;
  }

  async resetOrder(orderId) {
    if (!orderId) return null;
    // Release claimed stocks so they become available again
    await this.releaseClaimedStock(orderId);

    const payload = {
      payment_status: 'PENDING',
      account_delivered: null,
      updated_at: new Date().toISOString()
    };
    await this.updateOrder(orderId, payload);
    return await this.getOrder(orderId);
  }

  async resetCompletedOrders(mode = 'to_pending') {
    let count = 0;
    const allOrders = await this.getOrders();
    const completedOrders = allOrders.filter(o => o.payment_status === 'VERIFIED_BY_ADMIN');

    for (const order of completedOrders) {
      if (mode === 'purge') {
        await this.deleteOrder(order.order_id);
      } else {
        await this.resetOrder(order.order_id);
      }
      count++;
    }
    return count;
  }

  async deleteOrder(orderId) {
    if (this.hasSupabase) {
      try {
        await this.supabase.from('orders').delete().eq('order_id', orderId);
      } catch (e) {}
    }
    try {
      await deleteDoc(doc(this.db, 'orders', orderId));
      return true;
    } catch (err) {
      console.error(`Failed to delete order ${orderId}:`, err.message);
      return false;
    }
  }

  async purgeCancelledOrders() {
    let count = 0;
    if (this.hasSupabase) {
      try {
        const { data } = await this.supabase.from('orders').select('order_id').eq('payment_status', 'CANCELLED');
        if (data && data.length > 0) {
          await this.supabase.from('orders').delete().eq('payment_status', 'CANCELLED');
          count = data.length;
        }
      } catch (e) {}
    }

    try {
      const q = query(collection(this.db, 'orders'), where('payment_status', '==', 'CANCELLED'));
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        await deleteDoc(doc(this.db, 'orders', d.id));
        count++;
      }
      return count;
    } catch (err) {
      return count;
    }
  }

  // --- Crypto Wallets ---
  async getCryptoWallets() {
    return this.queryWithFallback(
      this.hasSupabase ? this.supabase.from('crypto_wallets').select('*') : null,
      async () => {
        const snap = await getDocs(collection(this.db, 'crypto_wallets'));
        return snap.docs.map(d => d.data());
      }
    );
  }

  async getWallets() {
    return this.getCryptoWallets();
  }

  async getActiveCryptoWallets() {
    return this.queryWithFallback(
      this.hasSupabase ? this.supabase.from('crypto_wallets').select('*').eq('is_active', true) : null,
      async () => {
        const q = query(collection(this.db, 'crypto_wallets'), where('is_active', '==', true));
        const snap = await getDocs(q);
        return snap.docs.map(d => d.data());
      }
    );
  }

  async getCryptoWallet(walletId) {
    if (!walletId) return null;
    if (this.hasSupabase) {
      try {
        const { data, error } = await this.supabase.from('crypto_wallets').select('*').eq('wallet_id', walletId).single();
        if (!error && data) return data;
      } catch (e) {}
    }
    try {
      const snap = await getDoc(doc(this.db, 'crypto_wallets', walletId));
      if (snap.exists()) return snap.data();
    } catch (e) {}
    const wallets = await this.getCryptoWallets();
    return wallets.find(w => w.wallet_id === walletId || w.id === walletId || (w.wallet_id && walletId.endsWith(w.wallet_id))) || null;
  }

  async saveCryptoWallet(wallet) {
    const wId = wallet.wallet_id || `w_${Date.now()}`;
    const payload = {
      ...wallet,
      wallet_id: wId
    };
    if (this.hasSupabase) {
      try {
        await this.supabase.from('crypto_wallets').upsert(payload, { onConflict: 'wallet_id' });
      } catch (e) {}
    }
    await setDoc(doc(this.db, 'crypto_wallets', wId), payload, { merge: true });
    return wId;
  }

  async deleteCryptoWallet(walletId) {
    if (this.hasSupabase) {
      try {
        await this.supabase.from('crypto_wallets').delete().eq('wallet_id', walletId);
      } catch (e) {}
    }
    await deleteDoc(doc(this.db, 'crypto_wallets', walletId));
  }

  // --- Bot Tokens ---
  async getBotTokens() {
    return this.queryWithFallback(
      this.hasSupabase ? this.supabase.from('bot_tokens').select('*') : null,
      async () => {
        const snap = await getDocs(collection(this.db, 'bot_tokens'));
        return snap.docs.map(d => d.data());
      }
    );
  }

  async saveBotToken(tokenData) {
    const tId = tokenData.token_id || `bot_${Date.now()}`;
    const payload = {
      ...tokenData,
      token_id: tId
    };
    if (this.hasSupabase) {
      try {
        await this.supabase.from('bot_tokens').upsert(payload, { onConflict: 'token_id' });
      } catch (e) {}
    }
    await setDoc(doc(this.db, 'bot_tokens', tId), payload, { merge: true });
    return tId;
  }

  async updateBotToken(tokenId, updateData) {
    if (this.hasSupabase) {
      try {
        await this.supabase.from('bot_tokens').update({
          ...updateData,
          updated_at: new Date().toISOString()
        }).eq('token_id', tokenId);
      } catch (e) {}
    }
    await updateDoc(doc(this.db, 'bot_tokens', tokenId), updateData).catch(() => {});
  }

  async deleteBotToken(tokenId) {
    if (this.hasSupabase) {
      try {
        await this.supabase.from('bot_tokens').delete().eq('token_id', tokenId);
      } catch (e) {}
    }
    await deleteDoc(doc(this.db, 'bot_tokens', tokenId)).catch(() => {});
  }

  // --- Settings ---
  async getSettings() {
    if (this.hasSupabase) {
      try {
        const { data, error } = await this.supabase.from('settings').select('*').eq('id', 'config').single();
        if (!error && data) return data;
      } catch (e) {}
    }
    const snap = await getDoc(doc(this.db, 'settings', 'config'));
    return snap.exists() ? snap.data() : {};
  }

  async getSetting(key) {
    const settings = await this.getSettings();
    return settings[key];
  }

  async updateSettings(newSettings) {
    const payload = {
      ...newSettings,
      id: 'config',
      updated_at: new Date().toISOString()
    };
    if (this.hasSupabase) {
      try {
        await this.supabase.from('settings').upsert(payload, { onConflict: 'id' });
      } catch (e) {}
    }
    await setDoc(doc(this.db, 'settings', 'config'), payload, { merge: true });
  }

  // --- Admins ---
  async getAdmins() {
    return this.queryWithFallback(
      this.hasSupabase ? this.supabase.from('admins').select('admin_id, username, role, telegram_id, created_at') : null,
      async () => {
        try {
          const snap = await getDocs(collection(this.db, 'admins'));
          const list = snap.docs.map(d => {
            const data = d.data();
            return {
              admin_id: data.admin_id,
              username: data.username,
              role: data.role,
              telegram_id: data.telegram_id || null,
              created_at: data.created_at
            };
          });
          if (list.length > 0) return list;
        } catch (e) {}

        // Fallback to the local store so admin Telegram IDs always resolve.
        try {
          const { getLocalAdmins } = await import('./multi_db.js');
          const locals = getLocalAdmins();
          if (Array.isArray(locals) && locals.length > 0) {
            return locals.map(a => ({
              admin_id: a.admin_id,
              username: a.username,
              role: a.role,
              telegram_id: a.telegram_id || null,
              created_at: a.created_at
            }));
          }
        } catch (e) {}

        return [];
      }
    );
  }

  /**
   * Update an admin's linked Telegram ID (used for strict bot admin access).
   */
  async updateAdminTelegramId(adminId, telegramId) {
    const tId = telegramId ? String(telegramId).trim() : null;
    if (this.hasSupabase) {
      try {
        await this.supabase.from('admins').update({ telegram_id: tId, updated_at: new Date().toISOString() }).eq('admin_id', adminId);
      } catch (e) {}
    }
    try {
      await updateDoc(doc(this.db, 'admins', adminId), {
        telegram_id: tId,
        updated_at: new Date().toISOString()
      });
    } catch (e) {
      try {
        await setDoc(doc(this.db, 'admins', adminId), { admin_id: adminId, telegram_id: tId }, { merge: true });
      } catch (e2) {}
    }
    return { admin_id: adminId, telegram_id: tId };
  }

  async verifyAdminLogin(username, password) {
    if (!username || !password) return null;
    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    // 1. Direct ENV fallback (Vercel / Cloud Run production environment instant login)
    const envUser = (process.env.ADMIN_USERNAME || 'root@admin.com').toLowerCase();
    const envPass = process.env.ADMIN_PASSWORD || 'kucing123';
    if ((cleanUser === envUser || cleanUser === 'root' || cleanUser === 'admin') && cleanPass === envPass) {
      return {
        admin_id: 'root_admin',
        username: envUser,
        role: 'superadmin'
      };
    }

    // 2. Supabase Admins verification
    if (this.hasSupabase) {
      try {
        const { data, error } = await this.supabase
          .from('admins')
          .select('*')
          .or(`username.ilike.${cleanUser},admin_id.eq.${username.trim()}`)
          .limit(1);

        if (!error && data && data.length > 0) {
          const matched = data[0];
          if (matched.password_hash === cleanPass) {
            return {
              admin_id: matched.admin_id,
              username: matched.username,
              role: matched.role || 'admin'
            };
          }
        }
      } catch (e) {
        console.warn('[Supabase verifyAdmin note]:', e.message);
      }
    }

    // 3. Firestore Admins verification
    try {
      const snap = await getDocs(collection(this.db, 'admins'));
      const matched = snap.docs.find(d => {
        const a = d.data();
        return (a.username?.toLowerCase() === cleanUser || a.admin_id === username) && a.password_hash === cleanPass;
      });
      if (matched) {
        const data = matched.data();
        return {
          admin_id: data.admin_id,
          username: data.username,
          role: data.role
        };
      }
    } catch (e) {}

    // 4. Default fallback guarantee
    if ((cleanUser === 'root@admin.com' || cleanUser === 'root') && cleanPass === 'kucing123') {
      return {
        admin_id: 'root_admin',
        username: 'root@admin.com',
        role: 'superadmin'
      };
    }

    return null;
  }

  async addAdmin(adminData) {
    const aId = adminData.admin_id || `adm_${Date.now()}`;
    const payload = {
      ...adminData,
      admin_id: aId,
      telegram_id: adminData.telegram_id ? String(adminData.telegram_id).trim() : (adminData.telegram_id || null),
      created_at: new Date().toISOString()
    };

    if (this.hasSupabase) {
      try {
        await this.supabase.from('admins').upsert(payload, { onConflict: 'admin_id' });
      } catch (e) {}
    }

    try {
      await setDoc(doc(this.db, 'admins', aId), payload, { merge: true });
    } catch (e) {}

    // Persist to the local store too so the Telegram bot can authorize this
    // admin even if the cloud database is temporarily unreachable.
    try {
      const { saveLocalAdmin } = await import('./multi_db.js');
      saveLocalAdmin(payload);
    } catch (e) {}

    return aId;
  }

  async deleteAdmin(adminId) {
    if (adminId === 'root_admin' || adminId === 'root_superadmin') {
      throw new Error('Root admin cannot be deleted');
    }
    if (this.hasSupabase) {
      try {
        await this.supabase.from('admins').delete().eq('admin_id', adminId);
      } catch (e) {}
    }
    await deleteDoc(doc(this.db, 'admins', adminId));
  }

  async updateAdminPassword(username, newPassword) {
    if (this.hasSupabase) {
      try {
        await this.supabase.from('admins').update({ password_hash: newPassword, updated_at: new Date().toISOString() }).ilike('username', username);
      } catch (e) {}
    }
    try {
      const snap = await getDocs(collection(this.db, 'admins'));
      for (const d of snap.docs) {
        if (d.data().username?.toLowerCase() === username.toLowerCase()) {
          await updateDoc(doc(this.db, 'admins', d.id), {
            password_hash: newPassword,
            updated_at: new Date().toISOString()
          });
        }
      }
    } catch (e) {}
  }

  // --- Channels (Telegram Channels Management & Source Tracking) ---
  async getChannels() {
    return this.queryWithFallback(
      this.hasSupabase ? this.supabase.from('channels').select('*').order('created_at', { ascending: false }) : null,
      async () => {
        try {
          const snap = await getDocs(collection(this.db, 'channels'));
          if (!snap.empty) {
            return snap.docs.map(d => d.data());
          }
        } catch (e) {}

        // Fallback to local store
        try {
          const { getLocalChannels } = await import('./multi_db.js');
          return getLocalChannels();
        } catch (e) {
          return [];
        }
      }
    );
  }

  async getActiveChannels() {
    const all = await this.getChannels();
    return all.filter(c => c.is_active !== false);
  }

  async saveChannel(channel) {
    const chId = channel.channel_id || `ch_${Date.now()}`;
    const ordersCount = Number(channel.orders_count ?? channel.conversions_count ?? 0) || 0;
    const payload = {
      ...channel,
      channel_id: chId,
      name: channel.name || 'Channel Telegram',
      username: channel.username ? String(channel.username).replace('@', '').trim() : '',
      invite_link: channel.invite_link || '',
      description: channel.description || '',
      // source_tag is used by the bot for referral/source tracking.
      source_tag: channel.source_tag || channel.channel_id || chId,
      is_active: channel.is_active !== undefined ? channel.is_active : true,
      clicks_count: Number(channel.clicks_count) || 0,
      // Keep the two counter names in sync so web & bot always agree.
      orders_count: ordersCount,
      conversions_count: ordersCount,
      created_at: channel.created_at || new Date().toISOString(),
      updated_at: channel.updated_at || new Date().toISOString()
    };

    if (this.hasSupabase) {
      try {
        await this.supabase.from('channels').upsert(payload, { onConflict: 'channel_id' });
      } catch (e) {
        console.warn('[Supabase saveChannel note]:', e.message);
      }
    }

    try {
      await setDoc(doc(this.db, 'channels', chId), payload, { merge: true });
    } catch (e) {
      console.warn('[Firestore saveChannel note]:', e.message);
    }

    try {
      const { saveLocalChannel } = await import('./multi_db.js');
      saveLocalChannel(payload);
    } catch (e) {}

    return payload;
  }

  /**
   * Increment a channel's click or order counter atomically (best-effort).
   */
  async incrementChannelCounter(channelId, field = 'clicks_count', amount = 1) {
    if (!channelId) return null;
    try {
      const channels = await this.getChannels();
      const target = channels.find(c => c.channel_id === channelId);
      if (!target) return null;
      const nextValue = (Number(target[field]) || 0) + amount;
      return this.saveChannel({ ...target, [field]: nextValue });
    } catch (e) {
      return null;
    }
  }

  async deleteChannel(channelId) {
    if (this.hasSupabase) {
      try {
        await this.supabase.from('channels').delete().eq('channel_id', channelId);
      } catch (e) {}
    }
    try {
      await deleteDoc(doc(this.db, 'channels', channelId));
    } catch (e) {}
    try {
      const { deleteLocalChannel } = await import('./multi_db.js');
      deleteLocalChannel(channelId);
    } catch (e) {}
  }

  // --- Payment Methods (E-Wallet, QRIS, Bank, Crypto & Scope) ---
  async getPaymentMethods() {
    return this.queryWithFallback(
      this.hasSupabase ? this.supabase.from('payment_methods').select('*').order('created_at', { ascending: false }) : null,
      async () => {
        try {
          const snap = await getDocs(collection(this.db, 'payment_methods'));
          if (!snap.empty) {
            return snap.docs.map(d => d.data());
          }
        } catch (e) {}

        // Fallback to local store
        try {
          const { getLocalPaymentMethods } = await import('./multi_db.js');
          return getLocalPaymentMethods();
        } catch (e) {
          return [];
        }
      }
    );
  }

  async getActivePaymentMethods() {
    const all = await this.getPaymentMethods();
    return all.filter(p => p.is_active !== false);
  }

  async savePaymentMethod(method) {
    const id = method.id || `pm_${Date.now()}`;
    const payload = {
      ...method,
      id,
      created_at: method.created_at || new Date().toISOString()
    };

    if (this.hasSupabase) {
      try {
        await this.supabase.from('payment_methods').upsert(payload, { onConflict: 'id' });
      } catch (e) {}
    }

    try {
      await setDoc(doc(this.db, 'payment_methods', id), payload, { merge: true });
    } catch (e) {}

    try {
      const { saveLocalPaymentMethod } = await import('./multi_db.js');
      saveLocalPaymentMethod(payload);
    } catch (e) {}

    return payload;
  }

  async deletePaymentMethod(methodId) {
    if (this.hasSupabase) {
      try {
        await this.supabase.from('payment_methods').delete().eq('id', methodId);
      } catch (e) {}
    }
    try {
      await deleteDoc(doc(this.db, 'payment_methods', methodId));
    } catch (e) {}
    try {
      const { deleteLocalPaymentMethod } = await import('./multi_db.js');
      deleteLocalPaymentMethod(methodId);
    } catch (e) {}
  }

  // --- Coupons (Dynamic Discount Codes) ---
  async getCoupons() {
    return this.queryWithFallback(
      this.hasSupabase ? this.supabase.from('coupons').select('*').order('created_at', { ascending: false }) : null,
      async () => {
        try {
          const snap = await getDocs(collection(this.db, 'coupons'));
          return snap.docs.map(d => d.data());
        } catch (e) {
          return [];
        }
      }
    );
  }

  async getCouponByCode(code) {
    if (!code) return null;
    const clean = String(code).trim().toUpperCase();
    const all = await this.getCoupons();
    return all.find(c => String(c.code || '').toUpperCase() === clean) || null;
  }

  async saveCoupon(coupon) {
    const couponId = coupon.coupon_id || `cpn_${Date.now()}`;
    const payload = {
      coupon_id: couponId,
      code: String(coupon.code || '').trim().toUpperCase(),
      discount_percentage: Number(coupon.discount_percentage) || 0,
      fixed_discount: Number(coupon.fixed_discount) || 0,
      max_uses: Number(coupon.max_uses) || 0,
      used_count: Number(coupon.used_count) || 0,
      is_active: coupon.is_active !== undefined ? coupon.is_active : true,
      created_at: coupon.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (this.hasSupabase) {
      try {
        await this.supabase.from('coupons').upsert(payload, { onConflict: 'coupon_id' });
      } catch (e) {
        console.warn('[Supabase saveCoupon note]:', e.message);
      }
    }

    try {
      await setDoc(doc(this.db, 'coupons', couponId), payload, { merge: true });
    } catch (e) {}

    return payload;
  }

  async incrementCouponUsage(couponId) {
    try {
      const all = await this.getCoupons();
      const target = all.find(c => c.coupon_id === couponId);
      if (!target) return null;
      return this.saveCoupon({ ...target, used_count: (Number(target.used_count) || 0) + 1 });
    } catch (e) {
      return null;
    }
  }

  async deleteCoupon(couponId) {
    if (this.hasSupabase) {
      try {
        await this.supabase.from('coupons').delete().eq('coupon_id', couponId);
      } catch (e) {}
    }
    try {
      await deleteDoc(doc(this.db, 'coupons', couponId));
    } catch (e) {}
  }

  // --- System Logs (Admin Audit Trail) ---
  async addSystemLog(log) {
    const logId = log.log_id || `log_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const payload = {
      log_id: logId,
      admin_id: log.admin_id || 'unknown',
      action: log.action || 'unknown_action',
      ip_address: log.ip_address || null,
      timestamp: log.timestamp || new Date().toISOString()
    };

    if (this.hasSupabase) {
      try {
        await this.supabase.from('system_logs').insert(payload);
      } catch (e) {}
    }
    try {
      await setDoc(doc(this.db, 'system_logs', logId), payload, { merge: true });
    } catch (e) {}
    return payload;
  }

  async getSystemLogs(limit = 100) {
    const logs = await this.queryWithFallback(
      this.hasSupabase ? this.supabase.from('system_logs').select('*').order('timestamp', { ascending: false }).limit(limit) : null,
      async () => {
        try {
          const snap = await getDocs(collection(this.db, 'system_logs'));
          return snap.docs.map(d => d.data()).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        } catch (e) {
          return [];
        }
      }
    );
    return (logs || []).slice(0, limit);
  }
}

export const dbService = new DatabaseService();
export default dbService;
