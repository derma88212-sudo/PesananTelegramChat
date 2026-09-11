-- ==============================================================================
-- SUPABASE POSTGRESQL SCHEMA FOR TELEGRAM DIGITAL GOODS STORE & ADMIN PANEL
-- Jalankan skrip ini langsung di SQL Editor Supabase Anda untuk membuat semua tabel.
-- ==============================================================================

-- 1. Tabel Admins (Autentikasi Administrator Web)
CREATE TABLE IF NOT EXISTS admins (
  admin_id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert Default Root Admin (root@admin.com / kucing123)
INSERT INTO admins (admin_id, username, password_hash, role)
VALUES ('root_admin', 'root@admin.com', 'kucing123', 'superadmin')
ON CONFLICT (admin_id) DO NOTHING;

-- 2. Tabel Settings (Konfigurasi Toko, Gateway, Teks & Terjemahan)
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY DEFAULT 'config',
  welcome_text TEXT,
  terms_text TEXT,
  payment_guide_text TEXT,
  order_guide_text TEXT,
  audio_alert_url TEXT DEFAULT 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
  nowpayments_api_key TEXT DEFAULT '',
  nowpayments_ipn_secret TEXT DEFAULT '',
  nowpayments_sandbox BOOLEAN DEFAULT TRUE,
  welcome_translations JSONB DEFAULT '{}'::jsonb,
  terms_translations JSONB DEFAULT '{}'::jsonb,
  payment_guide_translations JSONB DEFAULT '{}'::jsonb,
  order_guide_translations JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO settings (id, welcome_text, terms_text, audio_alert_url)
VALUES (
  'config',
  '🤖 <b>SELAMAT DATANG DI STORE AKUN CHATGPT & DIGITAL PRODUCTS!</b>\n\n⚡ <i>Semua transaksi instan, otomatis & bergaransi penuh.</i>\n💎 <b>Katalog Produk:</b>\n• Akun ChatGPT Plus 1 Bulan (Private & Shared)\n• Claude Pro & OpenAI API Credits\n• VPN Premium & Dev Tools\n\nSilakan pilih menu di bawah ini:',
  'ℹ️ <b>SYARAT KETENTUAN & GARANSI TOKO:</b>\n\n1. Garansi replace penuh selama 30 hari.\n2. Format akun berupa <code>Email:Password:Cookie</code>.\n3. Dilarang mengubah password/email untuk akun shared.\n4. Verifikasi kripto diproses otomatis via NOWPayments atau Manual Admin.',
  'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'
)
ON CONFLICT (id) DO NOTHING;

-- 3. Tabel Products (Katalog Produk Digital)
CREATE TABLE IF NOT EXISTS products (
  product_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  price_usd NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  price_idr NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  description TEXT,
  translations JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Initial Products
INSERT INTO products (product_id, title, category, price_usd, price_idr, description)
VALUES 
  ('prod_chatgpt_plus', 'ChatGPT Plus 1 Month (Private)', 'OpenAI / ChatGPT', 15.00, 235000, 'Akun ChatGPT Plus 1 Bulan Private. Fitur GPT-4o, DALL-E 3, Voice Chat, dan Browsing. Full garansi 30 hari.'),
  ('prod_chatgpt_shared', 'ChatGPT Plus 1 Month (Shared Max 2 User)', 'OpenAI / ChatGPT', 6.50, 99000, 'Akun ChatGPT Plus hemat untuk 2 pengguna terpisah. Akses model GPT-4o lancar & stabil.'),
  ('prod_claude_pro', 'Claude 3.7 Sonnet Pro 1 Month', 'Anthropic Claude', 18.00, 280000, 'Akun Claude Pro resmi 1 bulan dengan limit token 5x lebih tinggi, Projects feature & Artifacts.'),
  ('prod_openai_api', 'OpenAI API Account ($120 Credits Tier 1)', 'Developer API', 25.00, 395000, 'Akun OpenAI API siap pakai dengan limit usage tier 1 dan free credits valid 3 bulan.')
ON CONFLICT (product_id) DO NOTHING;

-- 4. Tabel Stocks (Stok Akun Email:Password:Cookie)
CREATE TABLE IF NOT EXISTS stocks (
  stock_id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
  account_data TEXT NOT NULL,
  status TEXT DEFAULT 'AVAILABLE',
  order_id TEXT,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  sold_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_stocks_product_status ON stocks(product_id, status);

-- Seed Sample Stocks
INSERT INTO stocks (stock_id, product_id, account_data, status)
VALUES
  ('stk_01', 'prod_chatgpt_plus', 'chatgpt.user101@proton.me:SuperSecurePass2026:session_token_xyz998', 'AVAILABLE'),
  ('stk_02', 'prod_chatgpt_plus', 'chatgpt.user102@proton.me:PlusPower2026!:session_token_abc776', 'AVAILABLE'),
  ('stk_03', 'prod_chatgpt_shared', 'shared.openai99@gmail.com:PasswordShared99:cookie_sess_5511', 'AVAILABLE'),
  ('stk_04', 'prod_claude_pro', 'claude.pro2026@gmail.com:AnthropicPass77#:cookie_claude_9901', 'AVAILABLE')
ON CONFLICT (stock_id) DO NOTHING;

-- 5. Tabel Orders (Pesanan & Riwayat Transaksi)
CREATE TABLE IF NOT EXISTS orders (
  order_id TEXT PRIMARY KEY,
  user_id TEXT,
  username TEXT,
  user_lang TEXT DEFAULT 'id',
  product_id TEXT,
  product_title TEXT,
  payment_method TEXT,
  payment_gateway TEXT,
  payment_status TEXT DEFAULT 'PENDING',
  crypto_address TEXT,
  crypto_network TEXT,
  amount NUMERIC(10, 2) DEFAULT 0.00,
  currency TEXT DEFAULT 'USD',
  tx_hash TEXT,
  receipt_file_id TEXT,
  receipt_image_url TEXT,
  payment_id TEXT,
  account_delivered TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(payment_status);

-- 6. Tabel Crypto Wallets (Alamat Kripto Manual TRC20, BEP20, BTC, SOL)
CREATE TABLE IF NOT EXISTS crypto_wallets (
  wallet_id TEXT PRIMARY KEY,
  network TEXT NOT NULL,
  address TEXT NOT NULL,
  currency TEXT DEFAULT 'USDT',
  qr_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alias Table: wallets (for compatibility with both naming conventions)
CREATE TABLE IF NOT EXISTS wallets (
  wallet_id TEXT PRIMARY KEY,
  network TEXT,
  crypto_network TEXT,
  address TEXT NOT NULL,
  currency TEXT DEFAULT 'USDT',
  qr_url TEXT,
  qr_code_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO crypto_wallets (wallet_id, network, address, currency, qr_url, is_active)
VALUES
  ('w_trc20', 'USDT (TRC-20)', 'TYDzsYUEpvnYmQCWt6VbJ2tYgB5Gsmz7kK', 'USDT', 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=TYDzsYUEpvnYmQCWt6VbJ2tYgB5Gsmz7kK', TRUE),
  ('w_bep20', 'USDT / BNB (BEP-20)', '0x71C7656EC7ab88b098defB751B7401B5f6d8976F', 'USDT', 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=0x71C7656EC7ab88b098defB751B7401B5f6d8976F', TRUE),
  ('w_btc', 'Bitcoin (BTC)', 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq', 'BTC', 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq', TRUE),
  ('w_sol', 'Solana (SOL / USDT)', '8b3JzX5oVqM7kG4mF8wX9aD2jB1nC3eK6rL9pQ8sT4vY', 'SOL', 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=8b3JzX5oVqM7kG4mF8wX9aD2jB1nC3eK6rL9pQ8sT4vY', TRUE)
ON CONFLICT (wallet_id) DO NOTHING;

-- 7. Tabel Bot Tokens (Multi-Bot Engine)
CREATE TABLE IF NOT EXISTS bot_tokens (
  token_id TEXT PRIMARY KEY,
  bot_token TEXT NOT NULL,
  bot_name TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'stopped',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Tabel Users (Pelanggan Telegram)
CREATE TABLE IF NOT EXISTS users (
  telegram_id TEXT PRIMARY KEY,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  language TEXT DEFAULT 'id',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Tabel User Sessions (Clean UI State Telegram)
CREATE TABLE IF NOT EXISTS user_sessions (
  telegram_id TEXT PRIMARY KEY,
  last_bot_message_id INT,
  language TEXT DEFAULT 'id',
  active_order_id TEXT,
  current_product_id TEXT,
  state TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Tabel Payment Methods (E-Wallet, QRIS, Bank & Custom Manual)
CREATE TABLE IF NOT EXISTS payment_methods (
  method_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'qris',
  account_number TEXT,
  account_name TEXT,
  qr_image_url TEXT,
  instructions TEXT,
  scope TEXT DEFAULT 'indonesia',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Tabel Channels (Saluran Telegram Resmi & Mitra)
CREATE TABLE IF NOT EXISTS channels (
  channel_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  username TEXT,
  invite_link TEXT,
  description TEXT,
  source_tag TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  clicks_count INT DEFAULT 0,
  orders_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disable Row Level Security (RLS) for seamless direct service access
-- or set to allow all operations for anon/service_role
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE crypto_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;

-- Allow anonymous & authenticated access (matching backend API rules)
DO $$
BEGIN
  CREATE POLICY "Allow all on admins" ON admins FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Allow all on settings" ON settings FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Allow all on products" ON products FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Allow all on stocks" ON stocks FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Allow all on orders" ON orders FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Allow all on crypto_wallets" ON crypto_wallets FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Allow all on wallets" ON wallets FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Allow all on bot_tokens" ON bot_tokens FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Allow all on users" ON users FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Allow all on user_sessions" ON user_sessions FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Allow all on payment_methods" ON payment_methods FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Allow all on channels" ON channels FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
-- ==============================================================================
-- EXTENDED SCHEMA: Kredensial, Transaksi, Kupon Diskon & System Logs
-- Semua tabel dibuat dengan pola "IF NOT EXISTS" sehingga aman dijalankan
-- berulang kali tanpa menghapus data yang sudah ada (additive auto-migration).
-- ==============================================================================

-- 12. Tabel Credentials (Penyimpanan Kredensial/Isi Produk & Lock Status)
CREATE TABLE IF NOT EXISTS credentials (
  credential_id TEXT PRIMARY KEY,
  product_id TEXT,
  data_content TEXT NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  used_by_transaction_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  used_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_credentials_product_used ON credentials(product_id, is_used);

-- 13. Tabel Transactions (Rekap Transaksi Terpadu untuk Rekapan Keuangan)
CREATE TABLE IF NOT EXISTS transactions (
  transaction_id TEXT PRIMARY KEY,
  user_id TEXT,
  product_id TEXT,
  amount NUMERIC(12, 2) DEFAULT 0.00,
  unique_code INT,
  payment_method TEXT,
  proof_image_url TEXT,
  status TEXT DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

-- 14. Tabel Coupons (Kupon Diskon Dinamis - Persen / Nominal & Batas Pemakaian)
CREATE TABLE IF NOT EXISTS coupons (
  coupon_id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_percentage NUMERIC(5, 2) DEFAULT 0,
  fixed_discount NUMERIC(12, 2) DEFAULT 0,
  max_uses INT DEFAULT 0,
  used_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);

-- 15. Tabel SystemLogs (Audit Trail Aksi Administrator)
CREATE TABLE IF NOT EXISTS system_logs (
  log_id TEXT PRIMARY KEY,
  admin_id TEXT,
  action TEXT NOT NULL,
  ip_address TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_logs_admin ON system_logs(admin_id);

-- RLS & Policy untuk tabel baru (akses konsisten dengan backend service)
ALTER TABLE credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  CREATE POLICY "Allow all on credentials" ON credentials FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Allow all on transactions" ON transactions FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Allow all on coupons" ON coupons FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Allow all on system_logs" ON system_logs FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
