import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Volume2, 
  LogOut, 
  PlayCircle, 
  Shield, 
  Bell, 
  BellRing, 
  Menu, 
  X, 
  Database, 
  Receipt, 
  Layers, 
  Wallet, 
  Settings, 
  Users, 
  Sparkles,
  ChevronRight,
  Globe,
  CreditCard,
  Radio
} from 'lucide-react';
import { AdminUser, StoreSettings } from '../types';
import { playNotificationSound, unlockAudio } from '../utils/audio';
import { getNotificationPermissionStatus, requestNotificationPermission, sendScreenNotification } from '../utils/notifications';
import { SUPPORTED_LANGUAGES, t } from '../utils/languages';
import { dialogAlert } from '../utils/dialog';

interface HeaderProps {
  currentUser: AdminUser;
  settings?: StoreSettings;
  onLogout: () => void;
  onOpenSimulator: () => void;
  activeBotsCount: number;
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
  pendingOrdersCount?: number;
  currentLang?: string;
  onSelectLang?: (lang: string) => void;
  onOpenSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  settings,
  onLogout,
  onOpenSimulator,
  activeBotsCount,
  activeTab = 'orders',
  onSelectTab,
  pendingOrdersCount = 0,
  currentLang = 'id',
  onSelectLang,
  onOpenSidebar
}) => {
  const [permission, setPermission] = useState<string>('default');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dbName, setDbName] = useState<string>('Cloud DB');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPermission(getNotificationPermissionStatus());
    }

    // Quick check active database
    fetch('/api/db/status')
      .then(r => r.json())
      .then(j => {
        if (j.success && j.data?.active_database) {
          setDbName(j.data.active_database.split(' ')[0] || 'Cloud DB');
        }
      })
      .catch(() => {});
  }, []);

  const handleNotificationClick = async () => {
    unlockAudio();
    if (permission !== 'granted') {
      const status = await requestNotificationPermission();
      setPermission(status);
      if (status !== 'granted') {
        dialogAlert('Izin notifikasi belum diberikan. Silakan izinkan melalui pengaturan browser Anda.', 'Izin Notifikasi Diperlukan', 'warning');
        return;
      }
    }

    // Trigger test screen banner & sound
    await sendScreenNotification({
      title: '🔔 Notifikasi Layar Aktif',
      body: 'Sistem siap menerima pesanan bot Telegram dan memunculkan banner di atas layar.',
      soundPreset: settings?.sound_preset || 'cash_register',
      soundVolume: settings?.sound_volume ?? 80,
      customSoundUrl: settings?.sound_custom_url,
      playSound: true
    });
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Sparkles },
    { id: 'orders', label: t('tab_orders', currentLang), icon: Receipt, badge: pendingOrdersCount > 0 ? pendingOrdersCount : null },
    { id: 'products', label: t('tab_products', currentLang), icon: Layers },
    { id: 'payment_methods', label: 'Metode Bayar', icon: CreditCard },
    { id: 'wallets', label: t('tab_wallets', currentLang), icon: Wallet },
    { id: 'channels', label: 'Channel & Sumber', icon: Radio },
    { id: 'bots', label: t('tab_bots', currentLang), icon: Bot, badge: activeBotsCount > 0 ? `${activeBotsCount} On` : null },
    { id: 'database', label: t('tab_database', currentLang), icon: Database, isHighlight: true },
    { id: 'settings', label: t('tab_settings', currentLang), icon: Settings },
    { id: 'admins', label: t('tab_admins', currentLang), icon: Users }
  ];

  return (
    <>
      <header className="bg-white border-b border-slate-200/90 sticky top-0 z-40 shadow-xs backdrop-blur-md bg-white/95 w-full">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-2">

          {/* Left branding & mobile menu toggle */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => { if (onOpenSidebar) onOpenSidebar(); else setMobileMenuOpen(!mobileMenuOpen); }}
              className="p-1.5 sm:p-2 -ml-1 sm:-ml-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl lg:hidden transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Corporate Logo Emblem */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-tr from-blue-700 via-indigo-600 to-blue-500 text-white rounded-xl sm:rounded-2xl flex items-center justify-center shadow-md shadow-blue-600/25 shrink-0">
                <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="leading-tight">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="font-black text-slate-900 text-sm sm:text-lg tracking-tight">
                    COMMERCE<span className="text-blue-600">.OS</span>
                  </span>
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    ENTERPRISE
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-[11px] text-slate-400 font-medium hidden md:block">
                    Multi-Bot Digital Products Engine
                  </p>
                  {/* Active DB indicator */}
                  <button
                    type="button"
                    onClick={() => onSelectTab && onSelectTab('database')}
                    className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 rounded-full text-[9px] sm:text-[10px] font-bold transition-all"
                    title="Klik untuk membuka Pengelola Database & Migrasi Cloud"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="truncate max-w-[60px] sm:max-w-none">{dbName}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right action controls */}
          <div className="flex items-center gap-1 sm:gap-3 shrink-0">
            {/* Global Multi-Language Selector */}
            <div className="relative">
              <select
                value={currentLang}
                onChange={(e) => onSelectLang && onSelectLang(e.target.value)}
                className="appearance-none bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl px-2 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold pr-6 sm:pr-7 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs transition-all"
                title="Pilih Bahasa / Change Language"
              >
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.flag} {l.name.split(' ')[0]} ({l.code.toUpperCase()})
                  </option>
                ))}
              </select>
              <Globe className="w-3.5 h-3.5 text-slate-400 absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Quick DB Migration Shortcut (Desktop) */}
            <button
              onClick={() => onSelectTab && onSelectTab('database')}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
                activeTab === 'database'
                  ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-xs'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
              }`}
              title="Kelola Database, Supabase & Migrasi"
            >
              <Database className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden md:inline">Cloud DB</span>
            </button>

            {/* Background Notification Button */}
            <button
              onClick={handleNotificationClick}
              className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 border rounded-xl text-xs font-semibold transition-all hover:shadow-xs active:scale-95 ${
                permission === 'granted'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
              }`}
              title={
                permission === 'granted'
                  ? 'Notifikasi Layar Belakang Aktif (Klik untuk Tes)'
                  : 'Klik untuk Mengaktifkan Notifikasi Layar Belakang'
              }
            >
              {permission === 'granted' ? (
                <BellRing className="w-4 h-4 text-emerald-600 animate-bounce" />
              ) : (
                <Bell className="w-4 h-4 text-amber-600" />
              )}
              <span className="hidden xl:inline">
                {permission === 'granted' ? 'Notif Layar: Aktif' : 'Aktifkan Notif Layar'}
              </span>
            </button>

            {/* Simulator launch button */}
            <button
              onClick={onOpenSimulator}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-all hover:shadow-xs active:scale-95"
              title="Buka Simulator Bot Telegram Interaktif di Browser"
            >
              <PlayCircle className="w-4 h-4 text-blue-600" />
              <span className="hidden md:inline">{t('btn_simulator', currentLang)}</span>
            </button>

            {/* Sound test button */}
            <button
              onClick={() => {
                unlockAudio();
                playNotificationSound(
                  settings?.sound_preset || 'cash_register',
                  settings?.sound_volume ?? 80,
                  settings?.sound_custom_url
                );
              }}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl text-xs font-medium transition-all"
              title="Tes Suara Notifikasi"
            >
              <Volume2 className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden lg:inline">Tes Suara</span>
            </button>

            <div className="h-6 w-px bg-slate-200 mx-0.5 hidden sm:block" />

            {/* User profile badge */}
            <div className="flex items-center gap-2 pl-0.5 sm:pl-1">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-slate-100 to-slate-200 border border-slate-300 text-slate-700 flex items-center justify-center text-xs font-bold shadow-2xs shrink-0">
                <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-xs font-bold text-slate-900 leading-tight max-w-[120px] truncate">{currentUser.username}</div>
                <div className="text-[10px] font-mono text-emerald-600 font-semibold uppercase">{currentUser.role}</div>
              </div>
            </div>

            {/* Logout button */}
            <button
              onClick={onLogout}
              className="p-1.5 sm:p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all active:scale-95"
              title={t('btn_logout', currentLang)}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      {/* Mobile Navigation Drawer (For Smartphones & Small Screens) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fadeIn"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl flex flex-col justify-between z-10 animate-slideRight">
            <div className="p-4 sm:p-5 space-y-5 sm:space-y-6 overflow-y-auto">
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-md shadow-blue-600/20">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">COMMERCE.OS</h3>
                    <p className="text-[10px] font-mono text-slate-400">Enterprise Admin</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User Profile Mini Card */}
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                  <Shield className="w-4 h-4 text-blue-600" />
                </div>
                <div className="overflow-hidden">
                  <div className="text-xs font-bold text-slate-900 truncate">{currentUser.username}</div>
                  <div className="text-[10px] text-emerald-600 font-bold uppercase">{currentUser.role}</div>
                </div>
              </div>

              {/* Navigation Items */}
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-2">
                  Menu Navigasi
                </div>
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (onSelectTab) onSelectTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full py-3 px-3.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25 font-bold'
                          : item.isHighlight
                          ? 'bg-emerald-50 text-emerald-900 border border-emerald-200/80 hover:bg-emerald-100'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.isHighlight ? 'text-emerald-600' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          isActive ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Quick Actions */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <button
                  onClick={() => {
                    onOpenSimulator();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all"
                >
                  <PlayCircle className="w-4 h-4 text-blue-600" />
                  <span>Buka Simulator Bot</span>
                </button>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-100">
              <button
                onClick={() => {
                  onLogout();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all border border-rose-200/70"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar Akun (Logout)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
export default Header;
