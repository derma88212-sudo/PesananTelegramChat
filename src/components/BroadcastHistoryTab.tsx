import React, { useState, useEffect } from 'react';
import { 
  History, 
  Trash2, 
  Eye, 
  Loader2,
  MessageSquare,
  Image as ImageIcon,
  Link,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Send,
  Copy,
  RefreshCw
} from 'lucide-react';
import { BroadcastHistory } from '../types';
import { dialogAlert, dialogConfirm, showToast } from '../utils/dialog';
import { t } from '../utils/languages';

interface BroadcastHistoryTabProps {
  currentLang?: string;
}

export const BroadcastHistoryTab: React.FC<BroadcastHistoryTabProps> = ({ currentLang = 'id' }) => {
  const [history, setHistory] = useState<BroadcastHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewing, setViewing] = useState<BroadcastHistory | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/broadcast/history?limit=100');
      const data = await res.json();
      if (data.success) setHistory(data.data || []);
    } catch (e: any) {
      console.warn('Fetch broadcast history error:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async (id: string) => {
    const confirmed = await dialogConfirm({
      title: 'Hapus Riwayat Broadcast',
      message: 'Hapus riwayat broadcast ini? Data tidak bisa dikembalikan.',
      confirmLabel: 'Ya, Hapus',
      cancelLabel: 'Batal',
      isDestructive: true
    });
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/broadcast/history/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('Riwayat broadcast dihapus');
        fetchHistory();
      }
    } catch (e: any) {
      dialogAlert('Gagal menghapus: ' + e.message, 'Gagal Hapus', 'error');
    }
  };

  const formatTime = (isoString: string | null | undefined) => {
    if (!isoString) return '-';
    try {
      return new Date(isoString).toLocaleString('id-ID', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'running':
        return 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse';
      case 'stopped':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'failed':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Selesai';
      case 'running': return 'Berjalan';
      case 'stopped': return 'Dihentikan';
      case 'failed': return 'Gagal';
      default: return 'Menunggu';
    }
  };

  return (
    <div id="broadcast-history-tab" className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" />
            Riwayat Broadcast Massal
          </h2>
          <p className="text-sm text-slate-500 mt-1">Lacak semua broadcast yang telah dikirim, termasuk status, jumlah terkirim, dan error.</p>
        </div>
        <button onClick={fetchHistory} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold">
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {loading ? (
        <div className="col-span-full text-center py-10 text-slate-400 text-sm">Memuat riwayat...</div>
      ) : history.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border-dashed border-slate-300">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
            <History className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-800">Belum Ada Riwayat Broadcast</h3>
          <p className="text-sm text-slate-500 mt-1">Riwayat akan muncul di sini setelah broadcast pertama dikirim.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-5">Pesan</th>
                  <th className="py-3 px-5">Target</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5">Terkirim / Total</th>
                  <th className="py-3 px-5">Mulai</th>
                  <th className="py-3 px-5">Selesai</th>
                  <th className="py-3 px-5">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((item) => (
                  <tr key={item.broadcast_id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-5">
                      <div className="max-w-xs text-ellipsis overflow-hidden text-slate-800 font-mono text-xs">
                        {item.photo_url ? <ImageIcon className="w-3.5 h-3.5 inline-block mr-1 text-slate-400" /> : <MessageSquare className="w-3.5 h-3.5 inline-block mr-1 text-slate-400" />}
                        {item.message.slice(0, 80)}{item.message.length > 80 ? '...' : ''}
                      </div>
                      {item.button_label && item.button_url && (
                        <div className="mt-1 text-[10px] text-slate-400 flex items-center gap-1">
                          <Link className="w-3 h-3" /> Tombol: {item.button_label}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-5">
                      <span className="text-xs font-medium capitalize">{item.target_language === 'ALL' ? 'Semua Bahasa' : item.target_language.toUpperCase()}</span>
                    </td>
                    <td className="py-3 px-5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[10px] ${getStatusBadge(item.status)}`}>
                        {item.status === 'running' && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
                        {getStatusLabel(item.status)}
                      </span>
                    </td>
                    <td className="py-3 px-5 font-mono font-bold text-slate-900">
                      {item.sent_count} / {item.total_recipients}
                      {item.failed_count > 0 && <span className="text-rose-500 ml-1">({item.failed_count} gagal)</span>}
                    </td>
                    <td className="py-3 px-5 text-slate-500">{formatTime(item.started_at)}</td>
                    <td className="py-3 px-5 text-slate-500">{formatTime(item.finished_at)}</td>
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setViewing(item)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                          title="Lihat Detail"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.broadcast_id)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-3xl bg-white rounded-2xl border border-slate-200 shadow-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 sticky top-0 bg-white z-10">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600" />
                Detail Broadcast
              </h3>
              <button onClick={() => setViewing(null)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider">Status</div>
                  <div className="font-bold text-slate-900 mt-1">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[10px] ${getStatusBadge(viewing.status)}`}>
                      {getStatusLabel(viewing.status)}
                    </span>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider">Total Penerima</div>
                  <div className="font-bold text-slate-900 mt-1">{viewing.total_recipients}</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider">Terkirim</div>
                  <div className="font-bold text-emerald-600 mt-1">{viewing.sent_count}</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider">Gagal</div>
                  <div className="font-bold text-rose-600 mt-1">{viewing.failed_count}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider">Mulai</div>
                  <div className="font-bold text-slate-900 mt-1">{formatTime(viewing.started_at)}</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider">Selesai</div>
                  <div className="font-bold text-slate-900 mt-1">{formatTime(viewing.finished_at)}</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider">Bahasa Target</div>
                  <div className="font-bold text-slate-900 mt-1 capitalize">{viewing.target_language === 'ALL' ? 'Semua' : viewing.target_language}</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider">Dibuat Oleh</div>
                  <div className="font-bold text-slate-900 mt-1">{viewing.created_by || 'system'}</div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <div className="text-xs font-semibold text-blue-800 uppercase tracking-wider mb-2">Pesan</div>
                <p className="text-sm text-blue-900 whitespace-pre-wrap font-mono text-xs">{viewing.message}</p>
              </div>

              {viewing.photo_url && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                  <div className="text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-2">Gambar</div>
                  <img src={viewing.photo_url} alt="Broadcast image" className="max-w-full rounded-lg border border-emerald-200" />
                </div>
              )}

              {viewing.button_label && viewing.button_url && (
                <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
                  <div className="text-xs font-semibold text-purple-800 uppercase tracking-wider mb-2">Tombol</div>
                  <div className="text-sm text-purple-900">{viewing.button_label}</div>
                  <a href={viewing.button_url} target="_blank" rel="noreferrer" className="text-xs text-purple-600 hover:underline font-mono mt-1 inline-block">{viewing.button_url}</a>
                </div>
              )}

              {viewing.error && (
                <div className="bg-rose-50 border border-rose-100 rounded-xl p-4">
                  <div className="text-xs font-semibold text-rose-800 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Error
                  </div>
                  <p className="text-sm text-rose-900 font-mono text-xs">{viewing.error}</p>
                </div>
              )}

              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <div className="text-xs font-semibold text-slate-500 mb-1">Broadcast ID</div>
                <div className="font-mono text-xs text-slate-800 break-all">{viewing.broadcast_id}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BroadcastHistoryTab;