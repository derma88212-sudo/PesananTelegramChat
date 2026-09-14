import React, { useState, useEffect, useRef } from 'react';
import { 
  Receipt, 
  Layers, 
  Wallet, 
  Bot, 
  Settings as SettingsIcon, 
  Shield, 
  RefreshCw,
  Bell,
  Database,
  CreditCard,
  Radio,
  LayoutDashboard,
  Megaphone,
  Link2,
  History,
  UserCheck,
  Key
} from 'lucide-react';
import { 
  AdminUser, 
  Order, 
  Product, 
  StockItem, 
  CryptoWallet, 
  BotTokenRecord, 
  StoreSettings, 
  StoreStats,
  PaymentMethod,
  TelegramChannel
} from './types';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardTab } from './components/DashboardTab';
import { StatsCards } from './components/StatsCards';
import { OrdersTab } from './components/OrdersTab';
import { ProductsTab } from './components/ProductsTab';
import { WalletsTab } from './components/WalletsTab';
import { PaymentMethodsTab } from './components/PaymentMethodsTab';
import { CouponsTab } from './components/CouponsTab';
import { ChannelsTab } from './components/ChannelsTab';
import { BotsTab } from './components/BotsTab';
import { DatabaseTab } from './components/DatabaseTab';
import { SettingsTab } from './components/SettingsTab';
import { BroadcastTab } from './components/BroadcastTab';
import { BroadcastHistoryTab } from './components/BroadcastHistoryTab';
import { ReferralTab } from './components/ReferralTab';
import { SuperAdminTab } from './components/SuperAdminTab';
import { AdminsTab } from './components/AdminsTab';
import { EnvVarsTab } from './components/EnvVarsTab';
import { LoginModal } from './components/LoginModal';
import { SimulatorModal } from './components/SimulatorModal';
import { playNotificationSound, unlockAudio } from './utils/audio';
import { registerNotificationServiceWorker, sendScreenNotification } from './utils/notifications';
import { safeFetch } from './utils/safeFetch';
import { t } from './utils/languages';
import { dialogAlert, dialogConfirm, showToast } from './utils/dialog';

export function App() {
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'products' | 'payment_methods' | 'coupons' | 'wallets' | 'channels' | 'bots' | 'database' | 'settings' | 'admins' | 'broadcast' | 'referral' | 'broadcast_history' | 'super_admin' | 'env_vars'>('dashboard');
  const [showSimulator, setShowSimulator] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState<string>(() => {
    return localStorage.getItem('app_lang') || 'id';
  });

  const handleSelectLang = (lang: string) => {
    setCurrentLang(lang);
    localStorage.setItem('app_lang', lang);
  };

  // Core Data States
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [wallets, setWallets] = useState<CryptoWallet[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [channels, setChannels] = useState<TelegramChannel[]>([]);
  const [bots, setBots] = useState<BotTokenRecord[]>([]);
  const [settings, setSettings] = useState<StoreSettings>({
    welcome_text: '',
    terms_text: '',
    nowpayments_sandbox: true,
    sound_preset: 'cash_register',
    sound_volume: 80,
    notify_on_new_order: true,
    notify_on_paid: true,
    notify_on_txid: true,
    auto_purge_cancelled: true
  });
  const [stats, setStats] = useState<StoreStats>({
    totalRevenueUsd: 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalProducts: 0,
    availableStocks: 0,
    soldStocks: 0,
    totalBotsConfigured: 0,
    activeBotsOnline: 0,
    totalTelegramUsers: 0
  });
  
  // Broadcast state
  const [broadcastStatus, setBroadcastStatus] = useState<any>(null);

  const [loadingOrders, setLoadingOrders] = useState(false);

  // Track previous orders to detect new incoming orders, payments, and TXID submissions
  const previousOrdersMapRef = useRef<Map<string, Order>>(new Map());
  const isFirstLoadRef = useRef(true);

  // Register Service Worker and audio unlocker on mount
  useEffect(() => {
    registerNotificationServiceWorker();

    const handleUnlock = () => {
      unlockAudio();
      window.removeEventListener('click', handleUnlock);
      window.removeEventListener('keydown', handleUnlock);
      window.removeEventListener('touchstart', handleUnlock);
    };
    window.addEventListener('click', handleUnlock);
    window.addEventListener('keydown', handleUnlock);
    window.addEventListener('touchstart', handleUnlock);

    return () => {
      window.removeEventListener('click', handleUnlock);
      window.removeEventListener('keydown', handleUnlock);
      window.removeEventListener('touchstart', handleUnlock);
    };
  }, []);

  // Check saved session on mount
  useEffect(() => {
    const saved = sessionStorage.getItem('admin_user');
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved));
      } catch {
        sessionStorage.removeItem('admin_user');
      }
    }
  }, []);

  // Fetch all collections
  const refreshAll = async () => {
    if (!currentUser) return;
    fetchOrders();
    fetchProducts();
    fetchStocks();
    fetchWallets();
    fetchPaymentMethods();
    fetchChannels();
    fetchBots();
    fetchSettings();
    fetchStats();
    fetchBroadcastStatus();
  };

  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);
      const result = await safeFetch<{ success: boolean; data: Order[] }>('/api/orders');
      if (result.success && result.data?.success && Array.isArray(result.data.data)) {
        const newOrders: Order[] = result.data.data;

        // Compare against previous orders to trigger background screen notifications & custom sound
        if (!isFirstLoadRef.current) {
          const prevMap = previousOrdersMapRef.current;

          for (const order of newOrders) {
            const prev = prevMap.get(order.order_id);

            // 1. BRAND NEW ORDER ARRIVED
            if (!prev) {
              if (settings.notify_on_new_order !== false) {
                sendScreenNotification({
                  title: `📦 Pesanan Baru Masuk! #${order.order_id}`,
                  body: `${order.product_title} • $${order.amount} USD • ${order.username ? '@' + order.username : 'ID: ' + order.user_id}`,
                  orderId: order.order_id,
                  soundPreset: settings.sound_preset || 'cash_register',
                  soundVolume: settings.sound_volume ?? 80,
                  customSoundUrl: settings.sound_custom_url,
                  playSound: true
                });
              }
            }
            // 2. ORDER CHANGED TO PAID / VERIFIED
            else if (
              prev.payment_status === 'PENDING' &&
              (order.payment_status === 'PAID' || order.payment_status === 'VERIFIED_BY_ADMIN')
            ) {
              if (settings.notify_on_paid !== false) {
                sendScreenNotification({
                  title: `💰 Pembayaran Terverifikasi! #${order.order_id}`,
                  body: `${order.product_title} telah dibayar ($${order.amount}). Kredensial akun dikirim!`,
                  orderId: order.order_id,
                  soundPreset: settings.sound_preset || 'cash_register',
                  soundVolume: settings.sound_volume ?? 80,
                  customSoundUrl: settings.sound_custom_url,
                  playSound: true
                });
              }
            }
            // 3. BUYER SUBMITTED TXID
            else if (!prev.tx_hash && order.tx_hash) {
              if (settings.notify_on_txid !== false) {
                sendScreenNotification({
                  title: `📝 Bukti Bayar / TXID Masuk! #${order.order_id}`,
                  body: `Pembeli @${order.username || order.user_id} mengirim TXID: ${order.tx_hash}`,
                  orderId: order.order_id,
                  soundPreset: settings.sound_preset || 'cash_register',
                  soundVolume: settings.sound_volume ?? 80,
                  customSoundUrl: settings.sound_custom_url,
                  playSound: true
                });
              }
            }
          }
        }

        // Auto purge cancelled orders if enabled in settings
        if (settings.auto_purge_cancelled) {
          const hasCancelled = newOrders.some(o => o.payment_status === 'CANCELLED');
          if (hasCancelled) {
            safeFetch('/api/orders/purge-cancelled', { method: 'POST' }).catch(() => {});
          }
        }

        // Update map
        const newMap = new Map<string, Order>();
        newOrders.forEach(o => newMap.set(o.order_id, o));
        previousOrdersMapRef.current = newMap;
        isFirstLoadRef.current = false;

        setOrders(newOrders);
      }
    } catch (e) {
      console.warn('Orders fetch error:', e);
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const result = await safeFetch<{ success: boolean; data: Product[] }>('/api/products');
      if (result.success && result.data?.success) setProducts(result.data.data || []);
    } catch (e) {}
  };

  const fetchStocks = async () => {
    try {
      const result = await safeFetch<{ success: boolean; data: StockItem[] }>('/api/stocks');
      if (result.success && result.data?.success) setStocks(result.data.data || []);
    } catch (e) {}
  };

  const fetchWallets = async () => {
    try {
      const result = await safeFetch<{ success: boolean; data: CryptoWallet[] }>('/api/wallets');
      if (result.success && result.data?.success) setWallets(result.data.data || []);
    } catch (e) {}
  };

  const fetchPaymentMethods = async () => {
    try {
      const result = await safeFetch<{ success: boolean; data: PaymentMethod[] }>('/api/payment-methods');
      if (result.success && result.data?.success) setPaymentMethods(result.data.data || []);
    } catch (e) {}
  };

  const fetchChannels = async () => {
    try {
      const result = await safeFetch<{ success: boolean; data: TelegramChannel[] }>('/api/channels');
      if (result.success && result.data?.success) setChannels(result.data.data || []);
    } catch (e) {}
  };

  const fetchBots = async () => {
    try {
      const result = await safeFetch<{ success: boolean; data: BotTokenRecord[] }>('/api/bots');
      if (result.success && result.data?.success) setBots(result.data.data || []);
    } catch (e) {}
  };

  const fetchSettings = async () => {
    try {
      const result = await safeFetch<{ success: boolean; data: StoreSettings }>('/api/settings');
      if (result.success && result.data?.success && result.data.data) {
        setSettings(result.data.data);
      }
    } catch (e) {}
  };

  const fetchStats = async () => {
    try {
      const result = await safeFetch<{ success: boolean; data: StoreStats }>('/api/stats');
      if (result.success && result.data?.success && result.data.data) setStats(result.data.data);
    } catch (e) {}
  };

  const fetchBroadcastStatus = async () => {
    try {
      const result = await safeFetch<{ success: boolean; data: any }>('/api/broadcast/status');
      if (result.success && result.data?.success) setBroadcastStatus(result.data.data);
    } catch (e) {}
  };

  // Real-time polling interval when logged in
  useEffect(() => {
    if (!currentUser) return;
    refreshAll();
    fetchBroadcastStatus();
    const interval = setInterval(() => {
      fetchOrders();
      fetchStats();
      fetchBots();
      fetchBroadcastStatus();
    }, 4000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // Handlers for Orders
  const handleApproveOrder = async (orderId: string) => {
    const result = await safeFetch<{ success: boolean; message?: string }>(`/api/orders/${orderId}/approve`, { method: 'POST' });
    if (result.success && result.data?.success) {
      showToast(`Pesanan #${orderId} berhasil disetujui`);
      refreshAll();
    } else {
      dialogAlert(result.data?.message || result.error || 'Gagal menyetujui pesanan', 'Gagal Setujui', 'error');
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    const result = await safeFetch<{ success: boolean; message?: string }>(`/api/orders/${orderId}/cancel`, { method: 'POST' });
    if (result.success && result.data?.success) {
      showToast(`Pesanan #${orderId} telah dibatalkan`);
      refreshAll();
    } else {
      dialogAlert(result.data?.message || result.error || 'Gagal membatalkan pesanan', 'Gagal Batal', 'error');
    }
  };

  const handleResetOrder = async (orderId: string) => {
    const result = await safeFetch<{ success: boolean; message?: string }>(`/api/orders/${orderId}/reset`, { method: 'POST' });
    if (result.success && result.data?.success) {
      showToast(`Pesanan #${orderId} telah direset ke Menunggu`);
      refreshAll();
    } else {
      dialogAlert(result.data?.message || result.error || 'Gagal mereset pesanan', 'Gagal Reset', 'error');
    }
  };

  const handleResetCompletedOrders = async (mode: 'to_pending' | 'purge' = 'to_pending') => {
    const result = await safeFetch<{ success: boolean; message?: string; count?: number }>('/api/orders/reset-completed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode })
    });
    if (result.success && result.data?.success) {
      showToast(`Berhasil memproses ${result.data.count || 0} pesanan selesai`);
      refreshAll();
    } else {
      dialogAlert(result.data?.message || result.error || 'Gagal mereset pesanan selesai', 'Gagal Reset', 'error');
    }
  };

  const handleBackupOrders = (format: 'json' | 'csv') => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const a = document.createElement('a');
    a.href = `/api/orders/backup?format=${format}&download=true`;
    a.download = `orders_backup_${timestamp}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleRejectOrder = async (orderId: string) => {
    const result = await safeFetch<{ success: boolean; message?: string }>(`/api/orders/${orderId}/reject`, { method: 'POST' });
    if (result.success && result.data?.success) {
      showToast(`Pesanan #${orderId} telah ditolak`);
      refreshAll();
    } else {
      dialogAlert(result.data?.message || result.error || 'Gagal reject pesanan', 'Gagal Tolak', 'error');
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    const result = await safeFetch<{ success: boolean; message?: string }>(`/api/orders/${orderId}`, { method: 'DELETE' });
    if (result.success && result.data?.success) {
      showToast(`Pesanan #${orderId} telah dihapus`);
      refreshAll();
    } else {
      dialogAlert(result.data?.message || result.error || 'Gagal hapus pesanan', 'Gagal Hapus', 'error');
    }
  };

  const handlePurgeCancelledOrders = async () => {
    const result = await safeFetch<{ success: boolean; purged_count?: number }>('/api/orders/purge-cancelled', { method: 'POST' });
    if (result.success && result.data?.success) {
      showToast(`Berhasil menghapus ${result.data.purged_count} pesanan yang dibatalkan`);
      refreshAll();
    }
  };

  // Handlers for Payment Methods
  const handleSavePaymentMethod = async (method: Partial<PaymentMethod>) => {
    const methodId = method.method_id;
    const url = methodId ? `/api/payment-methods/${methodId}` : '/api/payment-methods';
    const methodHttp = methodId ? 'PUT' : 'POST';
    const result = await safeFetch<{ success: boolean; message?: string }>(url, {
      method: methodHttp,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(method)
    });
    if (!result.success || !result.data?.success) throw new Error(result.data?.message || result.error || 'Gagal menyimpan metode pembayaran');
    fetchPaymentMethods();
  };

  const handleDeletePaymentMethod = async (methodId: string) => {
    const result = await safeFetch<{ success: boolean; message?: string }>(`/api/payment-methods/${methodId}`, { method: 'DELETE' });
    if (!result.success || !result.data?.success) throw new Error(result.data?.message || result.error || 'Gagal menghapus metode pembayaran');
    fetchPaymentMethods();
  };

  const handleTogglePaymentMethod = async (methodId: string) => {
    const result = await safeFetch<{ success: boolean; message?: string }>(`/api/payment-methods/${methodId}/toggle`, { method: 'PATCH' });
    if (result.success && result.data?.success) {
      fetchPaymentMethods();
      showToast('Status tampilan metode pembayaran diperbarui');
    }
  };

  // Handlers for Channels
  const handleSaveChannel = async (channel: Partial<TelegramChannel>) => {
    const channelId = channel.channel_id;
    const url = channelId ? `/api/channels/${channelId}` : '/api/channels';
    const methodHttp = channelId ? 'PUT' : 'POST';
    const result = await safeFetch<{ success: boolean; message?: string }>(url, {
      method: methodHttp,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(channel)
    });
    if (!result.success || !result.data?.success) throw new Error(result.data?.message || result.error || 'Gagal menyimpan channel');
    fetchChannels();
  };

  const handleDeleteChannel = async (channelId: string) => {
    const result = await safeFetch<{ success: boolean; message?: string }>(`/api/channels/${channelId}`, { method: 'DELETE' });
    if (!result.success || !result.data?.success) throw new Error(result.data?.message || result.error || 'Gagal menghapus channel');
    fetchChannels();
  };

  const handleToggleChannel = async (channelId: string) => {
    const result = await safeFetch<{ success: boolean; message?: string }>(`/api/channels/${channelId}/toggle`, { method: 'PATCH' });
    if (result.success && result.data?.success) {
      fetchChannels();
      showToast('Status tampilan tombol channel diperbarui');
    }
  };

  // Handlers for Products
  const handleAddProduct = async (prod: Partial<Product>) => {
    const result = await safeFetch<{ success: boolean; message?: string }>('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prod)
    });
    if (result.success && result.data?.success) {
      fetchProducts();
      fetchStats();
    }
  };

  const handleDeleteProduct = async (id: string) => {
    const result = await safeFetch<{ success: boolean; message?: string }>(`/api/products/${id}`, { method: 'DELETE' });
    if (result.success && result.data?.success) {
      fetchProducts();
      fetchStats();
    }
  };

  const handleAddBulkStocks = async (productId: string, accountsText: string): Promise<number> => {
    const result = await safeFetch<{ success: boolean; message?: string; added_count?: number }>('/api/stocks/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: productId, accounts_text: accountsText })
    });
    if (result.success && result.data?.success) {
      fetchProducts();
      fetchStocks();
      fetchStats();
      return result.data.added_count || 0;
    }
    throw new Error(result.data?.message || result.error || 'Gagal menambahkan stok');
  };

  const handleDeleteStock = async (stockId: string) => {
    const result = await safeFetch<{ success: boolean; message?: string }>(`/api/stocks/${stockId}`, { method: 'DELETE' });
    if (result.success && result.data?.success) {
      fetchStocks();
      fetchProducts();
      fetchStats();
    }
  };

  // Handlers for Wallets
  const handleAddWallet = async (w: Partial<CryptoWallet>) => {
    const result = await safeFetch<{ success: boolean; message?: string }>('/api/wallets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(w)
    });
    if (result.success && result.data?.success) fetchWallets();
  };

  const handleDeleteWallet = async (id: string) => {
    const result = await safeFetch<{ success: boolean; message?: string }>(`/api/wallets/${id}`, { method: 'DELETE' });
    if (result.success && result.data?.success) fetchWallets();
  };

  // Handlers for Bots
  const handleAddBot = async (name: string, token: string) => {
    const result = await safeFetch<{ success: boolean; message?: string }>('/api/bots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bot_name: name, bot_token: token, auto_start: true })
    });
    if (result.success && result.data?.success) {
      showToast('Bot Telegram berhasil ditambahkan');
      fetchBots();
      fetchStats();
    } else {
      dialogAlert(result.data?.message || result.error || 'Gagal menambah bot', 'Gagal Tambah Bot', 'error');
    }
  };

  const handleLaunchBot = async (id: string) => {
    const result = await safeFetch<{ success: boolean; message?: string }>(`/api/bots/${id}/launch`, { method: 'POST' });
    if (result.success && result.data?.success) {
      showToast('Bot Telegram berhasil diaktifkan');
      fetchBots();
      fetchStats();
    } else {
      dialogAlert(result.data?.message || result.error || 'Gagal menjalankan bot', 'Gagal Menjalankan Bot', 'error');
    }
  };

  const handleStopBot = async (id: string) => {
    const result = await safeFetch<{ success: boolean; message?: string }>(`/api/bots/${id}/stop`, { method: 'POST' });
    if (result.success && result.data?.success) {
      showToast('Bot Telegram dinonaktifkan');
      fetchBots();
      fetchStats();
    }
  };

  const handleDeleteBot = async (id: string) => {
    const result = await safeFetch<{ success: boolean; message?: string }>(`/api/bots/${id}`, { method: 'DELETE' });
    if (result.success && result.data?.success) {
      showToast('Bot Telegram dihapus');
      fetchBots();
      fetchStats();
    }
  };

  // Handlers for Settings
  const handleSaveSettings = async (newSettings: Partial<StoreSettings>) => {
    const result = await safeFetch<{ success: boolean; message?: string }>('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettings)
    });
    if (result.success && result.data?.success) {
      setSettings(prev => ({ ...prev, ...newSettings }));
      showToast('Pengaturan toko berhasil disimpan');
    } else {
      dialogAlert(result.data?.message || result.error || 'Gagal menyimpan pengaturan', 'Gagal Simpan', 'error');
    }
  };

  const handleLoginSuccess = (user: AdminUser) => {
    setCurrentUser(user);
    sessionStorage.setItem('admin_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_user');
    setCurrentUser(null);
  };

  if (!currentUser) {
    return <LoginModal onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased pb-20 lg:pb-8 lg:pl-64">
      {/* Persistent navigation sidebar (desktop rail + mobile drawer) */}
      <Sidebar
        currentUser={currentUser}
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab as any)}
        pendingOrdersCount={stats.pendingOrders}
        activeBotsCount={stats.activeBotsOnline || 0}
        currentLang={currentLang}
        mobileOpen={sidebarOpen}
        onCloseMobile={() => setSidebarOpen(false)}
      />

      {/* Top Enterprise Navbar */}
      <Header
        currentUser={currentUser}
        settings={settings}
        onLogout={handleLogout}
        onOpenSimulator={() => setShowSimulator(true)}
        activeBotsCount={stats.activeBotsOnline || 0}
        activeTab={activeTab}
        onSelectTab={(t) => setActiveTab(t as any)}
        pendingOrdersCount={stats.pendingOrders}
        currentLang={currentLang}
        onSelectLang={handleSelectLang}
        onOpenSidebar={() => setSidebarOpen(true)}
      />

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-6 sm:space-y-8">
        {/* Global business analytics are shown ONLY on the Dashboard tab so each
            work tab (orders, products, etc.) shows just its own module. */}
        {activeTab === 'dashboard' && (
          <>
            <StatsCards stats={stats} />
            <div className="bg-white border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
              <DashboardTab orders={orders} stats={stats} currentLang={currentLang} />
            </div>
          </>
        )}
        <div className={`bg-white border-slate-200/90 rounded-2xl shadow-xs overflow-hidden ${activeTab === 'dashboard' ? 'hidden' : ''}`}>

          {/* Active Tab View */}
          <div>
            {activeTab === 'orders' && (
              <OrdersTab
                orders={orders}
                onApprove={handleApproveOrder}
                onReject={handleRejectOrder}
                onCancelOrder={handleCancelOrder}
                onResetOrder={handleResetOrder}
                onDeleteOrder={handleDeleteOrder}
                onPurgeCancelled={handlePurgeCancelledOrders}
                onResetCompleted={handleResetCompletedOrders}
                onBackupOrders={handleBackupOrders}
                loading={loadingOrders}
                currentLang={currentLang}
              />
            )}

            {activeTab === 'products' && (
              <ProductsTab
                products={products}
                stocks={stocks}
                onAddProduct={handleAddProduct}
                onDeleteProduct={handleDeleteProduct}
                onAddBulkStocks={handleAddBulkStocks}
                onDeleteStock={handleDeleteStock}
                refreshData={refreshAll}
                currentLang={currentLang}
              />
            )}

            {activeTab === 'payment_methods' && (
              <PaymentMethodsTab
                paymentMethods={paymentMethods}
                onSavePaymentMethod={handleSavePaymentMethod}
                onDeletePaymentMethod={handleDeletePaymentMethod}
                onToggleStatus={handleTogglePaymentMethod}
                onSave={handleSavePaymentMethod}
                onDelete={handleDeletePaymentMethod}
                onToggle={handleTogglePaymentMethod}
                refreshData={fetchPaymentMethods}
                currentLang={currentLang}
              />
            )}

            {activeTab === 'coupons' && (
              <CouponsTab currentLang={currentLang} />
            )}

            {activeTab === 'wallets' && (
              <WalletsTab
                wallets={wallets}
                onAddWallet={handleAddWallet}
                onDeleteWallet={handleDeleteWallet}
              />
            )}

            {activeTab === 'channels' && (
              <ChannelsTab
                channels={channels}
                onSave={handleSaveChannel}
                onDelete={handleDeleteChannel}
                onToggle={handleToggleChannel}
                refreshData={fetchChannels}
                currentLang={currentLang}
              />
            )}

            {activeTab === 'bots' && (
              <BotsTab
                bots={bots}
                onAddBot={handleAddBot}
                onLaunchBot={handleLaunchBot}
                onStopBot={handleStopBot}
                onDeleteBot={handleDeleteBot}
                refreshBots={fetchBots}
              />
            )}

            {activeTab === 'broadcast' && (
              <BroadcastTab currentLang={currentLang} />
            )}

            {activeTab === 'referral' && (
              <ReferralTab 
                currentLang={currentLang} 
                channels={channels} 
                bots={bots} 
                refreshData={refreshAll} 
              />
            )}

            {activeTab === 'broadcast_history' && (
              <BroadcastHistoryTab currentLang={currentLang} />
            )}

            {activeTab === 'database' && (
              <DatabaseTab onRefreshData={refreshAll} />
            )}

            {activeTab === 'settings' && (
              <SettingsTab
                settings={settings}
                onSaveSettings={handleSaveSettings}
                onBatchTranslateProducts={refreshAll}
              />
            )}

            {activeTab === 'admins' && (
              <AdminsTab currentUser={currentUser} />
            )}

            {activeTab === 'super_admin' && (
              <SuperAdminTab currentUser={currentUser} currentLang={currentLang} />
            )}

            {activeTab === 'env_vars' && (
              <EnvVarsTab currentLang={currentLang} />
            )}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar (Optimized for Smartphones / Layar HP) */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/90 py-1.5 px-3 flex items-center justify-around shadow-lg lg:hidden">
        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all relative min-w-[56px] ${
            activeTab === 'orders' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Receipt className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">{t('tab_orders', currentLang)}</span>
          {stats.pendingOrders > 0 && (
            <span className="absolute top-0 right-2 w-4 h-4 bg-rose-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
              {stats.pendingOrders}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all min-w-[56px] ${
            activeTab === 'products' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">{t('tab_products', currentLang)}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('bots')}
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all min-w-[56px] ${
            activeTab === 'bots' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Bot className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">{t('tab_bots', currentLang)}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('broadcast')}
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all min-w-[56px] ${
            activeTab === 'broadcast' ? 'text-purple-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Megaphone className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Broadcast</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('referral')}
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all min-w-[56px] ${
            activeTab === 'referral' ? 'text-purple-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Link2 className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Referral</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('database')}
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all min-w-[56px] ${
            activeTab === 'database' ? 'text-blue-600 font-bold' : 'text-emerald-600 hover:text-emerald-700'
          }`}
        >
          <Database className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Cloud DB</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all min-w-[56px] ${
            activeTab === 'settings' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <SettingsIcon className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">{t('tab_settings', currentLang)}</span>
        </button>
      </nav>

      {/* Telegram Bot Simulator Modal */}
      {showSimulator && (
        <SimulatorModal
          onClose={() => setShowSimulator(false)}
          products={products}
          wallets={wallets}
          onOrderCreated={refreshAll}
        />
      )}
    </div>
  );
}

export default App;
