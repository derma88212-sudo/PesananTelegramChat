import React from 'react';
import {
  Receipt,
  Layers,
  Wallet,
  Bot,
  Settings as SettingsIcon,
  Shield,
  Database,
  CreditCard,
  Radio,
  LayoutDashboard,
  Ticket,
  X
} from 'lucide-react';
import { AdminUser } from '../types';
import { t } from '../utils/languages';

export interface SidebarNavItem {
  id: string;
  label: string;
  icon: any;
  badge?: any;
  isHighlight?: boolean;
}

interface SidebarProps {
  currentUser: AdminUser;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  pendingOrdersCount?: number;
  activeBotsCount?: number;
  currentLang?: string;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

/**
 * Persistent navigation sidebar.
 * - Large screens (lg+): fixed left rail, always visible.
 * - Small screens: slide-over drawer toggled from the Header hamburger.
 */
export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  activeTab,
  onSelectTab,
  pendingOrdersCount = 0,
  activeBotsCount = 0,
  currentLang = 'id',
  mobileOpen = false,
  onCloseMobile
}) => {
  const navItems: SidebarNavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'orders', label: t('tab_orders', currentLang), icon: Receipt, badge: pendingOrdersCount > 0 ? pendingOrdersCount : null },
    { id: 'products', label: t('tab_products', currentLang), icon: Layers },
    { id: 'payment_methods', label: 'Metode Bayar', icon: CreditCard },
    { id: 'coupons', label: 'Kupon Diskon', icon: Ticket },
    { id: 'wallets', label: t('tab_wallets', currentLang), icon: Wallet },
    { id: 'channels', label: 'Channel & Sumber', icon: Radio },
    { id: 'bots', label: t('tab_bots', currentLang), icon: Bot, badge: activeBotsCount > 0 ? `${activeBotsCount}` : null },
    { id: 'database', label: t('tab_database', currentLang), icon: Database, isHighlight: true },
    { id: 'settings', label: t('tab_settings', currentLang), icon: SettingsIcon },
    { id: 'admins', label: t('tab_admins', currentLang), icon: Shield }
  ];

  const NavList = (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              onSelectTab(item.id);
              if (onCloseMobile) onCloseMobile();
            }}
            className={`w-full py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
              isActive
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25 font-bold'
                : item.isHighlight
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200/80 hover:bg-emerald-100'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span className="flex items-center gap-3">
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : item.isHighlight ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span className="truncate">{item.label}</span>
            </span>
            {item.badge ? (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'}`}>
                {item.badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </nav>
  );

  const profileCard = (
    <div className="p-3 bg-slate-50 border-slate-200/80 rounded-xl flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
        <Shield className="w-4 h-4 text-blue-600" />
      </div>
      <div className="overflow-hidden">
        <div className="text-xs font-bold text-slate-900 truncate">{currentUser?.username}</div>
        <div className="text-[10px] text-emerald-600 font-bold uppercase">{currentUser?.role}</div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop persistent rail */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 bg-white border-r border-slate-200/90 z-30">
        <div className="h-16 flex items-center gap-2.5 px-5 border-b border-slate-100">
          <div className="w-9 h-9 bg-linear-to-tr from-blue-700 via-indigo-600 to-blue-500 text-white rounded-xl flex items-center justify-center shadow-md shadow-blue-600/25">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div className="leading-tight">
            <div className="font-black text-slate-900 text-sm tracking-tight">
              COMMERCE<span className="text-blue-600">.OS</span>
            </div>
            <div className="text-[10px] text-slate-400 font-medium">Enterprise Admin</div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {profileCard}
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-2">Menu Navigasi</div>
            {NavList}
          </div>
        </div>
      </aside>

      {/* Mobile off-canvas drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => onCloseMobile && onCloseMobile()}
          />
          <div className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl flex-col z-10">
            <div className="flex items-center justify-between border-b border-slate-100 p-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-blue-600 text-white rounded-xl flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">COMMERCE.OS</h3>
                  <p className="text-[10px] font-mono text-slate-400">Enterprise Admin</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onCloseMobile && onCloseMobile()}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {profileCard}
              {NavList}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
