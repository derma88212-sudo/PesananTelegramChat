export interface AdminUser {
  admin_id: string;
  username: string;
  role: 'superadmin' | 'admin' | 'manager';
  token?: string;
  is_fallback?: boolean;
  created_at?: string;
}

export interface ProductTranslation {
  title?: string;
  description?: string;
}

export interface Product {
  product_id: string;
  title: string;
  category: string;
  price_usd: number;
  price_idr: number;
  description: string;
  image_url?: string;
  product_url?: string; // URL untuk produk digital (link download, akses, dll)
  available_stocks?: number;
  translations?: Record<string, ProductTranslation>;
  created_at?: string;
}

export interface StockItem {
  stock_id: string;
  product_id: string;
  account_data: string; // Format: Email:Password:Cookie:ApiKey:Note
  status: 'AVAILABLE' | 'SOLD';
  order_id?: string | null;
  added_at: string;
  sold_at?: string;
}

export interface Order {
  order_id: string;
  user_id: string;
  username?: string;
  user_lang?: string;
  product_id: string;
  product_title: string;
  payment_method: 'crypto_auto' | 'crypto_manual' | 'qris' | 'ewallet' | 'bank';
  payment_method_id?: string;
  payment_gateway?: string;
  payment_status: 'PENDING' | 'PENDING_VERIFICATION' | 'PAID' | 'APPROVED' | 'CANCELLED' | 'REJECTED' | 'VERIFIED_BY_ADMIN';
  crypto_address: string;
  crypto_network: string;
  amount: number;
  currency?: string;
  unique_code?: number;
  total_amount_idr?: number;
  source_channel_id?: string;
  payment_id?: string;
  tx_hash?: string;
  payment_proof?: string;
  receipt_file_id?: string;
  receipt_image_url?: string;
  receipt_hash?: string;
  account_delivered?: string;
  verification_notes?: string;
  payment_status_localized?: string;
  payment_method_localized?: string;
  formatted_receipt?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentMethod {
  id?: string;
  method_id: string;
  type: 'qris' | 'ewallet' | 'bank' | 'crypto' | 'international';
  name: string;
  account_number: string;
  account_name: string;
  qr_image_url?: string;
  instructions?: string;
  scope: 'indonesia' | 'international' | 'global' | 'ALL' | 'ID';
  is_active: boolean;
  created_at?: string;
}

export interface TelegramChannel {
  id?: string;
  channel_id: string;
  name: string;
  username: string;
  invite_link?: string;
  description?: string;
  source_tag?: string;
  is_active: boolean;
  clicks_count?: number;
  orders_count?: number;
  conversions_count?: number;
  created_at?: string;
  
  // Referral/Promo link fields
  referral_code?: string; // Kode referral unik
  referral_link?: string; // Link referral lengkap
  referrer_count?: number; // Jumlah yang join via referral
  total_referral_revenue?: number; // Total pendapatan dari referral
}

export interface ReferralLink {
  referral_id: string;
  channel_id: string;
  channel_name: string;
  bot_token_id?: string;
  bot_name?: string;
  referral_code: string;
  referral_link: string;
  clicks: number;
  joins: number;
  orders: number;
  revenue_usd: number;
  revenue_idr: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReferralClick {
  click_id: string;
  referral_id: string;
  telegram_id: string;
  username?: string;
  first_name?: string;
  clicked_at: string;
  joined: boolean;
  joined_at?: string;
  order_id?: string;
}

export interface BroadcastHistory {
  broadcast_id: string;
  message: string;
  photo_url?: string;
  target_language: string;
  button_label?: string;
  button_url?: string;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  status: 'running' | 'completed' | 'stopped' | 'failed';
  started_at: string;
  finished_at?: string;
  error?: string;
  created_by?: string;
  created_at: string;
}

export interface CryptoWallet {
  wallet_id: string;
  network: string;
  address: string;
  qr_url: string;
  is_active: boolean;
  currency?: string;
  label?: string;
}

export interface BotTokenRecord {
  token_id: string;
  bot_token: string;
  bot_name: string;
  is_active: boolean;
  status: 'online' | 'stopped' | 'error' | 'pending';
  is_running?: boolean;
  last_sync?: string;
}

export type SoundPreset = 
  | 'cash_register' 
  | 'harmony_chime' 
  | 'crystal_bell' 
  | 'radar_pulse' 
  | 'gentle_marimba' 
  | 'retro_coin' 
  | 'alarm_trill' 
  | 'custom';

export interface StoreSettings {
  welcome_text: string;
  terms_text: string;
  welcome_translations?: Record<string, string>;
  terms_translations?: Record<string, string>;
  payment_guide_text?: string;
  payment_guide_translations?: Record<string, string>;
  order_guide_text?: string;
  order_guide_translations?: Record<string, string>;
  audio_alert_url?: string;
  sound_preset?: SoundPreset;
  sound_volume?: number;
  sound_custom_url?: string;
  notify_on_new_order?: boolean;
  notify_on_paid?: boolean;
  notify_on_txid?: boolean;
  notify_on_cancel?: boolean;
  notify_on_low_stock?: boolean;
  notify_on_broadcast?: boolean;
  auto_purge_cancelled?: boolean;
  nowpayments_api_key?: string;
  nowpayments_ipn_secret?: string;
  nowpayments_sandbox?: boolean;
  notification_templates?: Record<string, string>; // Custom notification templates
}

export interface StoreStats {
  totalRevenueUsd: number;
  totalRevenueIdr: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalProducts: number;
  availableStocks: number;
  soldStocks: number;
  totalBotsConfigured: number;
  activeBotsOnline: number;
  totalTelegramUsers: number;
}
