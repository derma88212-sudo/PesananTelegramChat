import React, { useState, useMemo } from 'react';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Calendar, 
  CalendarDays, 
  CalendarRange, 
  Coins, 
  Receipt, 
  CheckCircle2, 
  Clock, 
  Users 
} from 'lucide-react';
import { Order, StoreStats } from '../types';

interface DashboardTabProps {
  orders: Order[];
  stats: StoreStats;
  currentLang?: string;
}

type RangePreset = 'today' | 'week' | 'month' | 'year' | 'custom' | 'all';

const PAID_STATUSES = ['PAID', 'FINISHED', 'APPROVED', 'VERIFIED_BY_ADMIN'];

const rupiah = (n: number) => 'Rp ' + Math.round(n || 0).toLocaleString('id-ID');

export const DashboardTab: React.FC<DashboardTabProps> = ({ orders, stats }) => {
  const [preset, setPreset] = useState<RangePreset>('today');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');

  // Compute the [start, end] window for the selected preset.
  const range = useMemo(() => {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    let start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    if (preset === 'week') {
      const day = now.getDay(); // 0 (Sun) - 6 (Sat)
      const diffToMonday = (day + 6) % 7;
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday, 0, 0, 0, 0);
    } else if (preset === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    } else if (preset === 'year') {
      start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    } else if (preset === 'all') {
      start = new Date(2000, 0, 1);
    } else if (preset === 'custom') {
      start = customStart ? new Date(customStart + 'T00:00:00') : new Date(2000, 0, 1);
      const customEndDate = customEnd ? new Date(customEnd + 'T23:59:59') : end;
      return { start, end: customEndDate };
    }
    return { start, end };
  }, [preset, customStart, customEnd]);

  const report = useMemo(() => {
    const inRange = (orders || []).filter((o) => {
      const t = new Date(o.created_at || (o as any).updated_at || Date.now()).getTime();
      return t >= range.start.getTime() && t <= range.end.getTime();
    });

    const paid = inRange.filter((o) => PAID_STATUSES.includes(o.payment_status));
    const pending = inRange.filter((o) => o.payment_status === 'PENDING' || o.payment_status === 'PENDING_VERIFICATION');

    const revenueUsd = paid.reduce((sum, o) => {
      const isIdr = o.currency === 'IDR' || (o as any).total_amount_idr;
      if (isIdr) return sum;
      return sum + (Number(o.amount) || 0);
    }, 0);

    const revenueIdr = paid.reduce((sum, o) => {
      const isIdr = o.currency === 'IDR' || (o as any).total_amount_idr;
      if (isIdr) return sum + (Number((o as any).total_amount_idr) || Number(o.amount) || 0);
      return sum + (Number(o.amount) || 0) * 16000;
    }, 0);

    const uniqueBuyers = new Set(paid.map((o) => String(o.user_id)));

    return {
      total: inRange.length,
      paidCount: paid.length,
      pendingCount: pending.length,
      revenueUsd,
      revenueIdr,
      uniqueBuyers: uniqueBuyers.size,
      paidOrders: paid
    };
  }, [orders, range]);

  // Top-selling products within the range
  const topProducts = useMemo(() => {
    const map = new Map<string, { title: string; count: number; revenue: number }>();
    for (const o of report.paidOrders) {
      const key = o.product_id || o.product_title || 'unknown';
      const prev = map.get(key) || { title: o.product_title || key, count: 0, revenue: 0 };
      prev.count += 1;
      if (o.currency === 'IDR' || (o as any).total_amount_idr) {
        prev.revenue += Number((o as any).total_amount_idr) || Number(o.amount) || 0;
      } else {
        prev.revenue += (Number(o.amount) || 0) * 16000;
      }
      map.set(key, prev);
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [report.paidOrders]);

  const presets: { key: RangePreset; label: string; icon: any }[] = [
    { key: 'today', label: 'Hari Ini', icon: Calendar },
    { key: 'week', label: 'Minggu Ini', icon: CalendarDays },
    { key: 'month', label: 'Bulan Ini', icon: CalendarRange },
    { key: 'year', label: 'Tahun Ini', icon: CalendarRange },
    { key: 'all', label: 'Semua Waktu', icon: Clock },
    { key: 'custom', label: 'Rentang Kustom', icon: CalendarDays }
  ];

  return (
    <div id="dashboard-tab" className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-blue-600" />
            Dashboard & Laporan Realtime
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Ringkasan performa penjualan berdasarkan rentang waktu, dihitung langsung dari data transaksi.
          </p>
        </div>
      </div>

      {/* Range selector */}
      <div className="flex flex-wrap items-center gap-2">
        {presets.map((p) => {
          const Icon = p.icon;
          const active = preset === p.key;
          return (
            <button
              key={p.key}
              onClick={() => setPreset(p.key)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                active
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-blue-200 hover:text-blue-600'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {p.label}
            </button>
          );
        })}
      </div>

      {preset === 'custom' && (
        <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-2xl border-slate-200">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Dari Tanggal</label>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-3 py-2 border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Sampai Tanggal</label>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-3 py-2 border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="text-[11px] text-slate-500 self-end pb-2">
            Laporan menampilkan {report.total} transaksi pada rentang ini.
          </div>
        </div>
      )}

      {/* Report metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl border-slate-200 p-4">
          <div className="flex items-center gap-2 text-emerald-600 mb-2">
            <Coins className="w-4 h-4" />
            <span className="text-[11px] font-semibold uppercase tracking-wide">Total Omset</span>
          </div>
          <div className="text-lg font-black text-slate-900">{rupiah(report.revenueIdr)}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">${report.revenueUsd.toFixed(2)} USD</div>
        </div>

        <div className="bg-white rounded-2xl border-slate-200 p-4">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <Receipt className="w-4 h-4" />
            <span className="text-[11px] font-semibold uppercase tracking-wide">Total Transaksi</span>
          </div>
          <div className="text-lg font-black text-slate-900">{report.total}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Semua status dalam rentang</div>
        </div>

        <div className="bg-white rounded-2xl border-slate-200 p-4">
          <div className="flex items-center gap-2 text-emerald-600 mb-2">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-[11px] font-semibold uppercase tracking-wide">Berhasil</span>
          </div>
          <div className="text-lg font-black text-slate-900">{report.paidCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Terbayar / terverifikasi</div>
        </div>

        <div className="bg-white rounded-2xl border-slate-200 p-4">
          <div className="flex items-center gap-2 text-amber-600 mb-2">
            <Clock className="w-4 h-4" />
            <span className="text-[11px] font-semibold uppercase tracking-wide">Menunggu</span>
          </div>
          <div className="text-lg font-black text-slate-900">{report.pendingCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Belum dibayar / verifikasi</div>
        </div>
      </div>

      {/* Secondary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl border-slate-200 p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500">Pembeli Unik (Berhasil)</div>
            <div className="text-base font-bold text-slate-900">{report.uniqueBuyers}</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border-slate-200 p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500">Total Pengguna Bot</div>
            <div className="text-base font-bold text-slate-900">{stats.totalTelegramUsers || 0}</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border-slate-200 p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500">Stok Tersedia</div>
            <div className="text-base font-bold text-slate-900">{stats.availableStocks || 0}</div>
          </div>
        </div>
      </div>

      {/* Top products */}
      <div className="bg-white rounded-2xl border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">Produk Terlaris (Rentang Terpilih)</h3>
        </div>
        {topProducts.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-400">
            Belum ada penjualan berhasil pada rentang waktu ini.
          </div>
        ) : (
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-5">Produk</th>
                <th className="py-3 px-5">Terjual</th>
                <th className="py-3 px-5 text-right">Omset</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {topProducts.map((p, i) => (
                <tr key={i} className="hover:bg-slate-50/70">
                  <td className="py-3 px-5 font-semibold text-slate-800">{p.title}</td>
                  <td className="py-3 px-5">{p.count} unit</td>
                  <td className="py-3 px-5 text-right font-semibold text-emerald-600">{rupiah(p.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default DashboardTab;
