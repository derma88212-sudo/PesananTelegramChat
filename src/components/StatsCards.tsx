import React from 'react';
import { DollarSign, Clock, KeyRound, Bot, CheckCircle2, ShoppingBag } from 'lucide-react';
import { StoreStats } from '../types';

interface StatsCardsProps {
  stats: StoreStats;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8">
      {/* 1. Revenue */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between text-slate-500 mb-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Pendapatan</span>
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          ${stats.totalRevenueUsd.toFixed(2)}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>{stats.completedOrders} transaksi kripto sukses</span>
        </div>
      </div>

      {/* 2. Pending Orders */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between text-slate-500 mb-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pesanan Pending</span>
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          {stats.pendingOrders}
          {stats.pendingOrders > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold animate-pulse">
              Butuh Dicek
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400 mt-1.5">Menunggu konfirmasi blockchain / approval</p>
      </div>

      {/* 3. Available Account Stocks */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between text-slate-500 mb-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Stok Akun Siap</span>
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
            <KeyRound className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          {stats.availableStocks}
        </div>
        <p className="text-xs text-slate-400 mt-1.5">
          {stats.soldStocks} akun telah terjual otomatis
        </p>
      </div>

      {/* 4. Active Bots */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between text-slate-500 mb-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Bot Telegram Online</span>
          <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center">
            <Bot className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          {stats.activeBotsOnline}
          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            Polling Aktif
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1.5">
          Dari {stats.totalBotsConfigured} token bot terdaftar
        </p>
      </div>
    </div>
  );
};
