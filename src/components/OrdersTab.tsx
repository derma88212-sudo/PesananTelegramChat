import React, { useState } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Copy, 
  Search, 
  Filter, 
  Check, 
  KeyRound,
  ShieldCheck,
  CreditCard,
  Lock,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Globe,
  Trash2,
  RefreshCw,
  FileText,
  X,
  ExternalLink,
  QrCode,
  Image as ImageIcon,
  Download,
  ZoomIn,
  RotateCcw,
  Database,
  FileSpreadsheet
} from 'lucide-react';
import { Order } from '../types';
import { 
  SUPPORTED_LANGUAGES, 
  parseAccountCredentialClient, 
  t, 
  getLocalizedProduct 
} from '../utils/languages';
import { dialogAlert, dialogConfirm, showToast } from '../utils/dialog';

const getQrCodeUrl = (text: string, size = 250) => {
  if (!text) return '';
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`;
};

const getReceiptImageUrl = (order: Order): string | null => {
  if (order.receipt_image_url) return order.receipt_image_url;
  if (order.receipt_file_id) return `/api/telegram-file/${order.receipt_file_id}`;
  if (order.payment_proof && (order.payment_proof.startsWith('http') || order.payment_proof.startsWith('/api/'))) {
    return order.payment_proof;
  }
  const match = (order.tx_hash || '').match(/(?:\[(?:Bukti Gambar ID|Photo):\s*([a-zA-Z0-9_\-]+)\])/i);
  if (match) return `/api/orders/${order.order_id}/receipt-image`;
  if (order.tx_hash && (order.tx_hash.startsWith('AgAC') || order.tx_hash.startsWith('BAAC'))) {
    return `/api/orders/${order.order_id}/receipt-image`;
  }
  return null;
};

const formatDisplayTx = (txHash?: string) => {
  if (!txHash) return null;
  if (txHash.includes('[Bukti Gambar ID:') || txHash.includes('[Photo:')) {
    const cleaned = txHash.replace(/\[(?:Bukti Gambar ID|Photo):\s*[a-zA-Z0-9_\-]+\]/g, '').trim();
    return cleaned || 'Foto Bukti Pembayaran';
  }
  if (txHash.startsWith('AgAC') || txHash.startsWith('BAAC')) {
    return 'Foto Bukti Pembayaran';
  }
  return txHash;
};

interface OrdersTabProps {
  orders: Order[];
  onApprove: (orderId: string) => Promise<void>;
  onReject: (orderId: string) => Promise<void>;
  onCancelOrder?: (orderId: string) => Promise<void>;
  onResetOrder?: (orderId: string) => Promise<void>;
  onDeleteOrder?: (orderId: string) => Promise<void>;
  onPurgeCancelled?: () => Promise<void>;
  onResetCompleted?: (mode: 'to_pending' | 'purge') => Promise<void>;
  onBackupOrders?: (format: 'json' | 'csv') => void;
  loading: boolean;
  currentLang?: string;
}

export const OrdersTab: React.FC<OrdersTabProps> = ({
  orders,
  onApprove,
  onReject,
  onCancelOrder,
  onResetOrder,
  onDeleteOrder,
  onPurgeCancelled,
  onResetCompleted,
  onBackupOrders,
  loading,
  currentLang = 'id'
}) => {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<Order | null>(null);
  const [zoomImage, setZoomImage] = useState<{ url: string; title: string } | null>(null);
  const [isPurging, setIsPurging] = useState(false);
  const [isResettingCompleted, setIsResettingCompleted] = useState(false);
  const [showBackupMenu, setShowBackupMenu] = useState(false);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleApproveClick = async (orderId: string) => {
    const confirmed = await dialogConfirm({
      title: 'Konfirmasi Persetujuan Pesanan',
      message: `Konfirmasi pembayaran dan kirim akun kredensial ke pembeli untuk pesanan #${orderId}?`,
      confirmLabel: 'Ya, Setujui & Kirim Akun',
      cancelLabel: 'Batal'
    });
    if (!confirmed) return;

    setProcessingId(orderId);
    try {
      await onApprove(orderId);
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancelClick = async (orderId: string) => {
    const confirmed = await dialogConfirm({
      title: 'Konfirmasi Pembatalan Pesanan',
      message: `Batalkan pesanan #${orderId}? Stok akun yang dialokasikan akan dikembalikan ke stok tersedia.`,
      confirmLabel: 'Ya, Batalkan Pesanan',
      cancelLabel: 'Kembali',
      isDestructive: true
    });
    if (!confirmed) return;

    setProcessingId(orderId);
    try {
      if (onCancelOrder) {
        await onCancelOrder(orderId);
      } else {
        await onReject(orderId);
      }
    } finally {
      setProcessingId(null);
    }
  };

  const handleResetClick = async (orderId: string) => {
    const confirmed = await dialogConfirm({
      title: 'Reset Status Pesanan',
      message: `Reset pesanan #${orderId} kembali ke status Menunggu (Pending)? Akun yang terkirim akan ditarik kembali ke persediaan.`,
      confirmLabel: 'Ya, Reset Pesanan',
      cancelLabel: 'Batal'
    });
    if (!confirmed) return;

    setProcessingId(orderId);
    try {
      if (onResetOrder) {
        await onResetOrder(orderId);
      } else {
        const res = await fetch(`/api/orders/${orderId}/reset`, { method: 'POST' });
        const data = await res.json();
        if (!data.success) {
          dialogAlert(data.message || 'Gagal mereset pesanan', 'Gagal Reset', 'error');
        } else {
          showToast(`Pesanan #${orderId} berhasil direset`);
        }
      }
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteClick = async (orderId: string) => {
    const confirmed = await dialogConfirm({
      title: 'Konfirmasi Hapus Pesanan',
      message: `Hapus permanen pesanan #${orderId} dari database? Tindakan ini tidak dapat dibatalkan.`,
      confirmLabel: 'Ya, Hapus Permanen',
      cancelLabel: 'Batal',
      isDestructive: true
    });
    if (!confirmed) return;

    setProcessingId(orderId);
    try {
      if (onDeleteOrder) {
        await onDeleteOrder(orderId);
      } else {
        await onReject(orderId);
      }
    } finally {
      setProcessingId(null);
    }
  };

  const handlePurgeAllCancelled = async () => {
    const confirmed = await dialogConfirm({
      title: 'Bersihkan Pesanan Dibatalkan',
      message: 'Hapus seluruh pesanan yang dibatalkan dari penyimpanan database sekarang?',
      confirmLabel: 'Ya, Bersihkan',
      cancelLabel: 'Batal',
      isDestructive: true
    });
    if (!confirmed) return;

    setIsPurging(true);
    try {
      if (onPurgeCancelled) {
        await onPurgeCancelled();
      } else {
        await fetch('/api/orders/purge-cancelled', { method: 'POST' });
      }
    } finally {
      setIsPurging(false);
    }
  };

  const handleResetAllCompleted = async (mode: 'to_pending' | 'purge' = 'to_pending') => {
    const promptTitle = mode === 'purge' ? 'Hapus Pesanan Selesai' : 'Reset Pesanan Selesai';
    const promptMsg = mode === 'purge'
      ? 'Hapus semua pesanan yang sudah selesai (Lunas) dari database? Tindakan ini tidak dapat dibatalkan.'
      : 'Reset semua pesanan yang sudah selesai kembali ke status Menunggu (Pending)?';

    const confirmed = await dialogConfirm({
      title: promptTitle,
      message: promptMsg,
      confirmLabel: mode === 'purge' ? 'Ya, Hapus Semua' : 'Ya, Reset Semua',
      cancelLabel: 'Batal',
      isDestructive: mode === 'purge'
    });
    if (!confirmed) return;

    setIsResettingCompleted(true);
    try {
      if (onResetCompleted) {
        await onResetCompleted(mode);
      } else {
        const res = await fetch('/api/orders/reset-completed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode })
        });
        const data = await res.json();
        if (data.success) {
          showToast(`Berhasil memproses ${data.count} pesanan selesai`);
        } else {
          dialogAlert(data.message || 'Gagal reset pesanan selesai', 'Gagal Reset', 'error');
        }
      }
    } finally {
      setIsResettingCompleted(false);
    }
  };

  const handleTriggerBackup = (format: 'json' | 'csv') => {
    setShowBackupMenu(false);
    if (onBackupOrders) {
      onBackupOrders(format);
      return;
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const a = document.createElement('a');
    a.href = `/api/orders/backup?format=${format}&download=true`;
    a.download = `orders_backup_${timestamp}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const completedCount = orders.filter(o => o.payment_status === 'PAID' || o.payment_status === 'VERIFIED_BY_ADMIN').length;
  const cancelledCount = orders.filter(o => o.payment_status === 'CANCELLED').length;

  const filteredOrders = orders.filter((o) => {
    const localizedTitle = getLocalizedProduct({ title: o.product_title }, currentLang).title;
    const matchesSearch =
      o.order_id.toLowerCase().includes(search.toLowerCase()) ||
      (o.username && o.username.toLowerCase().includes(search.toLowerCase())) ||
      o.product_title.toLowerCase().includes(search.toLowerCase()) ||
      localizedTitle.toLowerCase().includes(search.toLowerCase()) ||
      (o.crypto_address && o.crypto_address.toLowerCase().includes(search.toLowerCase()));

    if (filterStatus === 'ALL') return matchesSearch;
    if (filterStatus === 'PENDING') return matchesSearch && o.payment_status === 'PENDING';
    if (filterStatus === 'PAID') return matchesSearch && (o.payment_status === 'PAID' || o.payment_status === 'VERIFIED_BY_ADMIN');
    if (filterStatus === 'CANCELLED') return matchesSearch && o.payment_status === 'CANCELLED';
    return matchesSearch;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header & Functional Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            {t('orders_title', currentLang)}
          </h2>
          <p className="text-xs text-slate-500 max-w-2xl mt-0.5">
            {t('orders_subtitle', currentLang)}
          </p>
        </div>

        {/* Global Orders Action Tools */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Backup Orders Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowBackupMenu(!showBackupMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-all shadow-2xs"
              title="Backup Data Pesanan ke CSV atau JSON"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>{t('btn_backup_orders', currentLang)}</span>
              <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
            </button>

            {showBackupMenu && (
              <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1 text-xs">
                <button
                  onClick={() => handleTriggerBackup('json')}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2"
                >
                  <Database className="w-3.5 h-3.5 text-blue-600" />
                  <span>{t('btn_export_json', currentLang)}</span>
                </button>
                <button
                  onClick={() => handleTriggerBackup('csv')}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2 border-t border-slate-100"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{t('btn_export_csv', currentLang)}</span>
                </button>
              </div>
            )}
          </div>

          {/* Reset Completed Orders Button */}
          {completedCount > 0 && (
            <button
              onClick={() => handleResetAllCompleted('to_pending')}
              disabled={isResettingCompleted}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-semibold transition-all shadow-2xs"
              title="Reset semua pesanan yang sudah selesai kembali ke status Pending tanpa error"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isResettingCompleted ? 'animate-spin' : ''}`} />
              <span>{t('btn_reset_completed', currentLang)} ({completedCount})</span>
            </button>
          )}

          {/* Purge Cancelled Orders Button */}
          {cancelledCount > 0 && (
            <button
              onClick={handlePurgeAllCancelled}
              disabled={isPurging}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition-all shadow-2xs"
              title="Bersihkan pesanan batal dari database agar hemat ruang"
            >
              {isPurging ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              <span>{t('btn_purge_cancelled', currentLang)} ({cancelledCount})</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 bg-blue-50 text-blue-700 border border-blue-200/80 rounded-xl">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="hidden sm:inline">Anti-Bypass</span>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('search_orders_placeholder', currentLang)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-xs"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          {[
            { key: 'ALL', labelKey: 'filter_all' },
            { key: 'PENDING', labelKey: 'filter_pending' },
            { key: 'PAID', labelKey: 'filter_paid' },
            { key: 'CANCELLED', labelKey: 'filter_cancelled' }
          ].map(({ key, labelKey }) => (
            <button
              key={key}
              onClick={() => setFilterStatus(key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                filterStatus === key
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {t(labelKey, currentLang)}
              {key === 'CANCELLED' && cancelledCount > 0 && ` (${cancelledCount})`}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="text-[11px] uppercase bg-slate-50 text-slate-500 border-b border-slate-200/90 font-semibold tracking-wider">
              <tr>
                <th className="py-3.5 px-4">{t('th_order_time', currentLang)}</th>
                <th className="py-3.5 px-4">{t('th_buyer', currentLang)}</th>
                <th className="py-3.5 px-4">{t('th_product', currentLang)}</th>
                <th className="py-3.5 px-4">{t('th_amount', currentLang)}</th>
                <th className="py-3.5 px-4">{t('th_status', currentLang)}</th>
                <th className="py-3.5 px-4">{t('th_credentials', currentLang)}</th>
                <th className="py-3.5 px-4 text-right">{t('th_actions', currentLang)}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="max-w-xs mx-auto text-center space-y-2">
                      <Clock className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="font-medium text-slate-600">Tidak ada data pesanan</p>
                      <p className="text-slate-400 text-xs">Pesanan baru dari bot Telegram akan masuk di sini secara real-time.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const isPaid = order.payment_status === 'PAID' || order.payment_status === 'VERIFIED_BY_ADMIN';
                  const isCancelled = order.payment_status === 'CANCELLED';
                  const isExpanded = expandedOrderId === order.order_id;
                  const parsed = order.account_delivered ? parseAccountCredentialClient(order.account_delivered) : null;
                  const localizedProduct = getLocalizedProduct({ title: order.product_title }, currentLang);
                  const displayProductTitle = localizedProduct.title || order.product_title;
                  const hasReceiptImage = Boolean(getReceiptImageUrl(order));
                  const displayTx = formatDisplayTx(order.tx_hash);

                  return (
                    <React.Fragment key={order.order_id}>
                      <tr className={`hover:bg-slate-50/70 transition-colors ${isCancelled ? 'opacity-65 bg-slate-50/30' : ''}`}>
                        {/* Order ID & Time */}
                        <td className="py-3.5 px-4">
                          <div className="font-mono font-bold text-slate-800 flex items-center gap-1.5">
                            <span className="text-blue-600">#</span>{order.order_id}
                            <button
                              onClick={() => handleCopy(order.order_id, `id_${order.order_id}`)}
                              className="text-slate-400 hover:text-slate-600 p-0.5 rounded"
                              title={t('btn_copy', currentLang)}
                            >
                              {copiedId === `id_${order.order_id}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                            {new Date(order.created_at).toLocaleString(currentLang === 'id' ? 'id-ID' : 'en-US', {
                              dateStyle: 'short',
                              timeStyle: 'short'
                            })}
                          </div>
                        </td>

                        {/* Buyer Info */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                            <span>@{order.username || 'user'}</span>
                            {order.user_lang && (
                              <span className="px-1.5 py-0.2 bg-blue-50 border border-blue-200 text-blue-700 rounded text-[9px] font-bold uppercase" title={`Bahasa: ${order.user_lang}`}>
                                {order.user_lang}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            ID: {order.user_id}
                          </div>
                        </td>

                        {/* Product Title (Dynamically Localized) */}
                        <td className="py-3.5 px-4 max-w-[200px]">
                          <div className="font-bold text-slate-800 line-clamp-2" title={displayProductTitle}>
                            {displayProductTitle}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            ID: {order.product_id}
                          </div>
                        </td>

                        {/* Amount */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 font-mono text-sm">
                            ${order.amount} <span className="text-xs font-normal text-slate-500">{order.currency || 'USD'}</span>
                          </div>
                          {order.crypto_network && (
                            <span className="inline-block mt-0.5 px-1.5 py-0.2 bg-slate-100 border border-slate-200 rounded text-slate-600 font-bold uppercase text-[9px]">
                              {order.crypto_network}
                            </span>
                          )}
                        </td>

                        {/* Status & Proof */}
                        <td className="py-3.5 px-4">
                          {isPaid ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                              {t('filter_paid', currentLang)}
                            </span>
                          ) : isCancelled ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold">
                              <XCircle className="w-3.5 h-3.5 text-rose-600" />
                              {t('filter_cancelled', currentLang)}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs font-bold">
                              <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                              {t('filter_pending', currentLang)}
                            </span>
                          )}

                          {hasReceiptImage && (
                            <div className="mt-1 flex items-center gap-1 text-[10px] text-blue-600 font-semibold">
                              <ImageIcon className="w-3 h-3 text-blue-600" />
                              <span>Ada Bukti Foto</span>
                            </div>
                          )}
                        </td>

                        {/* Credentials Preview */}
                        <td className="py-3.5 px-4">
                          {isPaid && order.account_delivered ? (
                            <div className="flex items-center gap-1.5 font-mono text-xs text-slate-700 max-w-[160px] truncate">
                              <KeyRound className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <span className="truncate">
                                {parsed?.email ? parsed.email : order.account_delivered}
                              </span>
                              <button
                                onClick={() => handleCopy(order.account_delivered!, `acc_${order.order_id}`)}
                                className="text-slate-400 hover:text-slate-600 p-0.5 rounded shrink-0"
                                title={t('btn_copy', currentLang)}
                              >
                                {copiedId === `acc_${order.order_id}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-slate-400 italic text-[11px]">
                              <Lock className="w-3 h-3" />
                              Terkunci aman
                            </span>
                          )}
                        </td>

                        {/* Admin Actions */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1.5">
                          {/* Struk Button */}
                          <button
                            onClick={() => setSelectedReceiptOrder(order)}
                            className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-medium inline-flex items-center gap-1 transition-all"
                            title="Lihat Struk / Bukti Pembayaran"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>{t('btn_receipt', currentLang)}</span>
                          </button>

                          {/* Action Logic based on Status */}
                          {!isPaid && !isCancelled ? (
                            <>
                              <button
                                disabled={processingId === order.order_id}
                                onClick={() => handleApproveClick(order.order_id)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all active:scale-95 disabled:opacity-50"
                                title="Setujui dan otomatis alokasikan stok akun tanpa error"
                              >
                                {processingId === order.order_id ? t('btn_processing', currentLang) : t('btn_approve', currentLang)}
                              </button>
                              <button
                                disabled={processingId === order.order_id}
                                onClick={() => handleCancelClick(order.order_id)}
                                className="px-2.5 py-1.5 bg-white hover:bg-rose-50 hover:text-rose-700 text-slate-600 border border-slate-200 rounded-lg text-xs font-medium transition-all"
                                title="Batalkan pesanan & kembalikan stok tanpa error"
                              >
                                {t('btn_cancel', currentLang)}
                              </button>
                            </>
                          ) : isPaid ? (
                            <>
                              {/* Reset Order Button for Completed Orders */}
                              <button
                                disabled={processingId === order.order_id}
                                onClick={() => handleResetClick(order.order_id)}
                                className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-medium inline-flex items-center gap-1 transition-all"
                                title="Reset pesanan selesai kembali ke Pending tanpa error"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>{t('btn_reset', currentLang)}</span>
                              </button>
                              <button
                                onClick={() => setExpandedOrderId(isExpanded ? null : order.order_id)}
                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium inline-flex items-center gap-1"
                              >
                                <span>{t('btn_detail', currentLang)}</span>
                                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              </button>
                            </>
                          ) : (
                            <>
                              {/* Reset Button for Cancelled Orders */}
                              <button
                                disabled={processingId === order.order_id}
                                onClick={() => handleResetClick(order.order_id)}
                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium inline-flex items-center gap-1 transition-all"
                                title="Reset kembali pesanan yang dibatalkan ke Pending"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>{t('btn_reset', currentLang)}</span>
                              </button>
                              <button
                                onClick={() => handleDeleteClick(order.order_id)}
                                disabled={processingId === order.order_id}
                                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-medium inline-flex items-center gap-1 transition-all"
                                title="Hapus permanen dari database"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>{t('btn_delete', currentLang)}</span>
                              </button>
                            </>
                          )}
                        </td>
                      </tr>

                      {/* Expanded Details Row for Paid Orders */}
                      {isExpanded && order.account_delivered && (
                        <tr className="bg-slate-50/70 border-b border-slate-200/80">
                          <td colSpan={7} className="p-4">
                            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs space-y-2">
                              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                                  <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                                  Kredensial Akun Terkirim ke Pembeli
                                </span>
                                <button
                                  onClick={() => handleCopy(order.account_delivered!, `full_acc_${order.order_id}`)}
                                  className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                                >
                                  {copiedId === `full_acc_${order.order_id}` ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                  {copiedId === `full_acc_${order.order_id}` ? t('btn_copied', currentLang) : t('btn_copy', currentLang)}
                                </button>
                              </div>

                              {parsed?.email && parsed?.password ? (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
                                  <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg">
                                    <span className="text-[10px] text-slate-400 block font-sans">Email:</span>
                                    <span className="font-semibold text-slate-800 break-all">{parsed.email}</span>
                                  </div>
                                  <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg">
                                    <span className="text-[10px] text-slate-400 block font-sans">Password:</span>
                                    <span className="font-semibold text-slate-800 break-all">{parsed.password}</span>
                                  </div>
                                  <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg">
                                    <span className="text-[10px] text-slate-400 block font-sans">Session Cookie / Token:</span>
                                    <span className="font-semibold text-slate-800 break-all truncate block" title={parsed.cookie}>
                                      {parsed.cookie || '-'}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <pre className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg font-mono text-xs text-slate-800 overflow-x-auto">
                                  {order.account_delivered}
                                </pre>
                              )}

                              <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                                <span>Deposit Wallet: <code className="font-mono text-slate-600">{order.crypto_address || '-'}</code></span>
                                <span>Payment ID: <code className="font-mono text-slate-600">{order.payment_id || '-'}</code></span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Receipt / Proof Modal */}
      {selectedReceiptOrder && (() => {
        const o = selectedReceiptOrder;
        const isPaid = o.payment_status === 'PAID' || o.payment_status === 'VERIFIED_BY_ADMIN';
        const parsed = o.account_delivered ? parseAccountCredentialClient(o.account_delivered) : null;
        const dateFormatted = new Date(o.updated_at || o.created_at || Date.now()).toLocaleString('id-ID', {
          dateStyle: 'medium',
          timeStyle: 'short'
        });
        const qrUrl = o.crypto_address ? getQrCodeUrl(o.crypto_address, 240) : '';
        const receiptImgUrl = getReceiptImageUrl(o);
        const displayTx = formatDisplayTx(o.tx_hash);

        const receiptText = `🧾 STRUK BUKTI PEMBAYARAN RESMI\n` +
          `==============================\n` +
          `Nomor Invoice: ${o.order_id}\n` +
          `Produk: ${o.product_title}\n` +
          `Total: ${o.amount} ${o.currency || 'USD'}\n` +
          `Metode: ${o.payment_method === 'crypto_auto' ? 'NOWPayments (Otomatis)' : `Transfer Manual (${o.crypto_network || 'Kripto'})`}\n` +
          `Alamat Tujuan: ${o.crypto_address || '-'}\n` +
          `Bukti Pembayaran: ${receiptImgUrl ? `Foto Bukti Asli (${window.location.origin}${receiptImgUrl})` : (displayTx || 'Telah Diverifikasi')}\n` +
          `Waktu: ${dateFormatted} WIB\n` +
          `Status: ${isPaid ? 'LUNAS & TERVERIFIKASI' : o.payment_status}\n` +
          `Pembeli: @${o.username || 'user'} (${o.user_id})\n` +
          (o.account_delivered ? `\nKREDENSIAL AKUN:\n${o.account_delivered}\n` : '') +
          `==============================\n` +
          `Bukti transaksi resmi. Garansi akun aktif.`;

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
              {/* Modal Header */}
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{t('btn_receipt', currentLang)}</h3>
                    <p className="text-[11px] text-slate-500 font-mono">#{o.order_id}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedReceiptOrder(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 overflow-y-auto space-y-4 text-xs">
                {/* Status Card */}
                <div className={`p-4 rounded-xl border flex items-center justify-between ${
                  isPaid 
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900' 
                    : o.payment_status === 'CANCELLED'
                    ? 'bg-rose-50/80 border-rose-200 text-rose-900'
                    : 'bg-amber-50/80 border-amber-200 text-amber-900'
                }`}>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider opacity-75">{t('th_status', currentLang)}</span>
                    <div className="font-bold text-sm flex items-center gap-1.5 mt-0.5">
                      {isPaid ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <Clock className="w-4 h-4 text-amber-600" />}
                      {isPaid ? t('filter_paid', currentLang) : o.payment_status === 'CANCELLED' ? t('filter_cancelled', currentLang) : t('filter_pending', currentLang)}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] opacity-75 block font-sans">Waktu Pembayaran</span>
                    <span className="font-mono text-[11px] font-medium">{dateFormatted}</span>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <span className="text-slate-500 font-medium">{t('th_product', currentLang)}:</span>
                    <span className="font-bold text-slate-800">{getLocalizedProduct({ title: o.product_title }, currentLang).title}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <span className="text-slate-500 font-medium">{t('th_amount', currentLang)}:</span>
                    <span className="font-bold text-slate-900 font-mono text-sm">
                      ${o.amount} {o.currency || 'USD'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <span className="text-slate-500 font-medium">Metode:</span>
                    <span className="font-semibold text-slate-700">
                      {o.payment_method === 'crypto_auto' ? 'NOWPayments (Otomatis)' : `Transfer Manual (${o.crypto_network || 'Kripto'})`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <span className="text-slate-500 font-medium">{t('th_buyer', currentLang)}:</span>
                    <span className="font-mono text-slate-700">
                      @{o.username || 'user'} (ID: <code>{o.user_id}</code>)
                    </span>
                  </div>
                  {o.crypto_address && (
                    <div className="pt-1">
                      <span className="text-slate-500 block mb-1 font-medium">Alamat Dompet Tujuan:</span>
                      <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 font-mono text-[11px] text-slate-700 break-all">
                        <span className="flex-1">{o.crypto_address}</span>
                        <button
                          onClick={() => handleCopy(o.crypto_address!, 'rcpt_addr')}
                          className="text-blue-600 hover:text-blue-800 p-1 shrink-0"
                          title={t('btn_copy', currentLang)}
                        >
                          {copiedId === 'rcpt_addr' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Receipt Photo Proof if Available */}
                {receiptImgUrl && (
                  <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-blue-900 flex items-center gap-1.5 text-xs">
                        <ImageIcon className="w-4 h-4 text-blue-600" />
                        Foto Struk / Bukti Transfer Asli dari Pembeli
                      </span>
                      <button
                        onClick={() => setZoomImage({ url: receiptImgUrl, title: `Bukti Foto Order #${o.order_id}` })}
                        className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                        Perbesar
                      </button>
                    </div>

                    <div 
                      onClick={() => setZoomImage({ url: receiptImgUrl, title: `Bukti Foto Order #${o.order_id}` })}
                      className="relative max-h-56 overflow-hidden rounded-lg border border-blue-200 bg-white cursor-pointer group flex items-center justify-center"
                    >
                      <img 
                        src={receiptImgUrl} 
                        alt="Bukti Struk Transfer" 
                        className="max-h-56 w-auto object-contain transition-transform duration-200 group-hover:scale-105" 
                      />
                      <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="px-3 py-1 bg-slate-900/80 text-white rounded-full text-xs font-semibold shadow-md flex items-center gap-1.5">
                          <ZoomIn className="w-3.5 h-3.5" />
                          Klik untuk Zoom Foto
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Delivered Credentials */}
                {isPaid && o.account_delivered && (
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                        {t('th_credentials', currentLang)}:
                      </span>
                      <button
                        onClick={() => handleCopy(o.account_delivered!, 'rcpt_acc')}
                        className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                      >
                        {copiedId === 'rcpt_acc' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedId === 'rcpt_acc' ? t('btn_copied', currentLang) : t('btn_copy', currentLang)}
                      </button>
                    </div>
                    <pre className="p-2.5 bg-white border border-slate-200 rounded-lg font-mono text-[11px] text-slate-800 whitespace-pre-wrap break-all">
                      {o.account_delivered}
                    </pre>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
                <button
                  onClick={() => handleCopy(receiptText, 'raw_receipt')}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  {copiedId === 'raw_receipt' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === 'raw_receipt' ? t('btn_copied', currentLang) : t('btn_copy', currentLang)}</span>
                </button>

                <div className="flex items-center gap-2">
                  {!isPaid && !o.payment_status?.includes('CANCEL') && (
                    <button
                      onClick={() => {
                        handleApproveClick(o.order_id);
                        setSelectedReceiptOrder(null);
                      }}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95"
                    >
                      {t('btn_approve', currentLang)}
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedReceiptOrder(null)}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition-all"
                  >
                    {t('btn_close', currentLang)}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Zoom Image Modal */}
      {zoomImage && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-60 animate-in fade-in duration-200">
          <div className="relative max-w-4xl w-full max-h-[95vh] flex flex-col items-center">
            <div className="w-full flex items-center justify-between pb-3 text-white">
              <span className="font-bold text-sm truncate">{zoomImage.title}</span>
              <div className="flex items-center gap-2">
                <a
                  href={zoomImage.url}
                  download="bukti_struk_pembayaran"
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
                  title="Unduh Gambar Asli"
                >
                  <Download className="w-4 h-4" />
                </a>
                <button
                  onClick={() => setZoomImage(null)}
                  className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="overflow-auto max-h-[85vh] rounded-2xl bg-black/40 p-2 border border-white/10">
              <img
                src={zoomImage.url}
                alt={zoomImage.title}
                className="max-h-[80vh] w-auto object-contain rounded-xl mx-auto shadow-2xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
