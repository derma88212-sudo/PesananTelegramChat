import React, { useState, useEffect, useRef } from 'react';
import { 
  Megaphone, 
  Send, 
  Square, 
  Loader2, 
  Image as ImageIcon,
  Link,
  Globe,
  MessageSquare,
  Eye,
  Loader
} from 'lucide-react';
import { dialogAlert, dialogConfirm, showToast } from '../utils/dialog';
import { safeFetch } from '../utils/safeFetch';

interface BroadcastJob {
  running: boolean;
  stop_requested: boolean;
  total: number;
  sent: number;
  failed: number;
  remaining: number;
  started_at: string | null;
  finished_at: string | null;
  last_error: string | null;
  delay_ms: number;
  message_preview: string;
}

interface BroadcastTabProps {
  currentLang?: string;
}

export const BroadcastTab: React.FC<BroadcastTabProps> = ({ currentLang = 'id' }) => {
  const [broadcast, setBroadcast] = useState<BroadcastJob | null>(null);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    message: '',
    photo_url: '',
    target_language: 'ALL',
    button_label: '',
    button_url: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [polling, setPolling] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      broadcast_title: { id: 'Broadcast Massal', en: 'Mass Broadcast' },
      broadcast_desc: { id: 'Kirim pesan massal ke seluruh pengguna bot Telegram dengan rate-limiting otomatis.', en: 'Send mass messages to all Telegram bot users with automatic rate-limiting.' },
      message: { id: 'Pesan', en: 'Message' },
      photo_url: { id: 'URL Gambar (Opsional)', en: 'Image URL (Optional)' },
      target_language: { id: 'Bahasa Target', en: 'Target Language' },
      all_languages: { id: 'Semua Bahasa', en: 'All Languages' },
      indonesian: { id: 'Bahasa Indonesia', en: 'Indonesian' },
      english: { id: 'Bahasa Inggris', en: 'English' },
      button_label: { id: 'Label Tombol (Opsional)', en: 'Button Label (Optional)' },
      button_url: { id: 'URL Tombol (Opsional)', en: 'Button URL (Optional)' },
      send_broadcast: { id: 'Kirim Broadcast', en: 'Send Broadcast' },
      sending: { id: 'Mengirim...', en: 'Sending...' },
      stop_broadcast: { id: 'Hentikan Broadcast', en: 'Stop Broadcast' },
      broadcast_stopped: { id: 'Broadcast dihentikan', en: 'Broadcast stopped' },
      broadcast_started: { id: 'Broadcast dimulai', en: 'Broadcast started' },
      status: { id: 'Status', en: 'Status' },
      running: { id: 'Berjalan', en: 'Running' },
      stopped: { id: 'Dihentikan', en: 'Stopped' },
      completed: { id: 'Selesai', en: 'Completed' },
      total: { id: 'Total', en: 'Total' },
      sent: { id: 'Terkirim', en: 'Sent' },
      failed: { id: 'Gagal', en: 'Failed' },
      remaining: { id: 'Sisa', en: 'Remaining' },
      started_at: { id: 'Dimulai', en: 'Started' },
      finished_at: { id: 'Selesai', en: 'Finished' },
      no_broadcast: { id: 'Belum ada broadcast berjalan', en: 'No broadcast running' },
      confirm_stop: { id: 'Yakin ingin menghentikan broadcast?', en: 'Stop broadcast?' },
      error_send: { id: 'Gagal mengirim broadcast', en: 'Failed to send broadcast' },
      error_load: { id: 'Gagal memuat status', en: 'Failed to load status' },
      preview: { id: 'Pratinjau', en: 'Preview' },
      delay_info: { id: 'Delay 200ms per pesan (~5 pesan/detik) untuk kecepatan maksimal aman', en: '200ms delay per message (~5 msg/sec) for maximum safe speed' },
    };
    return translations[key]?.[currentLang] || translations[key]?.id || key;
  };

  const fetchStatus = async () => {
    try {
      const result = await safeFetch<{ success: boolean; status: BroadcastJob }>('/api/broadcast/status');
      if (result.success && result.data?.success) {
        setBroadcast(result.data.status);
      }
    } catch (e: any) {
      console.warn('Fetch broadcast status error:', e.message);
    }
  };

  const startPolling = () => {
    if (polling) return;
    setPolling(true);
    pollIntervalRef.current = setInterval(() => {
      fetchStatus();
    }, 2000);
  };

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setPolling(false);
  };

  useEffect(() => {
    fetchStatus();
    return () => stopPolling();
  }, []);

  const handleStartBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.message.trim()) {
      dialogAlert('Pesan broadcast wajib diisi.', 'Input Belum Lengkap', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await safeFetch<{ success: boolean; message?: string }>('/api/broadcast/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (result.success && result.data?.success) {
        showToast('Broadcast dimulai');
        setIsModalOpen(false);
        setFormData({ message: '', photo_url: '', target_language: 'ALL', button_label: '', button_url: '' });
        startPolling();
        fetchStatus();
      } else {
        dialogAlert(result.data?.message || result.error || t('error_send'), 'Gagal', 'error');
      }
    } catch (err: any) {
      dialogAlert(err.message || t('error_send'), 'Gagal', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStopBroadcast = async () => {
    const confirmed = await dialogConfirm({
      title: 'Hentikan Broadcast',
      message: t('confirm_stop'),
      confirmLabel: 'Ya, Hentikan',
      cancelLabel: 'Batal',
      isDestructive: true
    });
    if (!confirmed) return;

    try {
      const result = await safeFetch<{ success: boolean; message?: string }>('/api/broadcast/stop', { method: 'POST' });
      if (result.success && result.data?.success) {
        showToast(t('broadcast_stopped'));
        fetchStatus();
        stopPolling();
      }
    } catch (err: any) {
      dialogAlert(err.message || 'Gagal menghentikan broadcast', 'Gagal', 'error');
    }
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const formatTime = (isoString: string | null) => {
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

  const isRunning = broadcast?.running === true;
  const isFinished = broadcast && !broadcast.running && broadcast.finished_at;

  return (
    <div id="broadcast-tab" className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-purple-600" />
            {t('broadcast_title')}
          </h2>
          <p className="text-sm text-slate-500 mt-1">{t('broadcast_desc')}</p>
        </div>
        <button
          onClick={openModal}
          disabled={isRunning}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white rounded-xl text-sm font-semibold transition-all"
        >
          <Send className="w-4 h-4" />
          {t('send_broadcast')}
        </button>
      </div>

      {/* Broadcast Status Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Loader className="w-4 h-4 text-blue-600 animate-spin" style={{ display: isRunning ? 'block' : 'none' }} />
            Status Broadcast Realtime
          </h3>
        </div>

        {broadcast ? (
          <div className="p-5 space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${
                isRunning ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                isFinished ? 'bg-slate-100 text-slate-600 border-slate-200' :
                'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {isRunning ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {t('running')}
                  </>
                ) : isFinished ? (
                  t('completed')
                ) : (
                  t('stopped')
                )}
              </span>

              {isRunning && (
                <button
                  onClick={handleStopBroadcast}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold hover:bg-rose-100 transition-colors"
                >
                  <Square className="w-3.5 h-3.5" />
                  {t('stop_broadcast')}
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <div className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider">{t('total')}</div>
                <div className="text-2xl font-black text-slate-900 mt-1">{broadcast.total}</div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <div className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider">{t('sent')}</div>
                <div className="text-2xl font-black text-emerald-600 mt-1">{broadcast.sent}</div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <div className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider">{t('failed')}</div>
                <div className="text-2xl font-black text-rose-600 mt-1">{broadcast.failed}</div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <div className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider">{t('remaining')}</div>
                <div className="text-2xl font-black text-amber-600 mt-1">{broadcast.remaining}</div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <div className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider">{t('started_at')}</div>
                <div className="text-xs font-medium text-slate-700 mt-1">{formatTime(broadcast.started_at)}</div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <div className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider">{t('finished_at')}</div>
                <div className="text-xs font-medium text-slate-700 mt-1">{formatTime(broadcast.finished_at)}</div>
              </div>
            </div>

            {broadcast.message_preview && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <div className="text-xs font-semibold text-blue-800 uppercase tracking-wider mb-2">{t('preview')}</div>
                <p className="text-sm text-blue-900 whitespace-pre-wrap text-ellipsis overflow-hidden max-h-24">{broadcast.message_preview}</p>
              </div>
            )}

            {broadcast.last_error && (
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-4">
                <div className="text-xs font-semibold text-rose-800 uppercase tracking-wider mb-2">Error Terakhir</div>
                <p className="text-sm text-rose-900 font-mono text-ellipsis overflow-hidden max-h-24">{broadcast.last_error}</p>
              </div>
            )}

            <p className="text-xs text-slate-500 text-center pt-2">Delay 200ms per pesan (~5 pesan/detik) untuk kecepatan maksimal aman</p>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400">
            <Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-700">{t('no_broadcast')}</p>
            <p className="text-sm text-slate-500 mt-1">Klik tombol "Kirim Broadcast" untuk memulai pengiriman massal ke pengguna bot.</p>
          </div>
        )}
      </div>

      {/* Broadcast Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden p-6 relative">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-purple-600" />
                {t('send_broadcast')}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg">
                <Square className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStartBroadcast} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t('message')} <span className="text-rose-500">*</span></label>
                <textarea
                  rows={4}
                  required
                  placeholder="Ketik pesan broadcast di sini... Mendukung HTML: <b>bold</b>, <i>italic</i>, <code>code</code>, <a href='...'>link</a>"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t('photo_url')}</label>
                <input
                  type="url"
                  placeholder="https://example.com/image.jpg (Opsional - akan dikirim sebagai foto dengan caption)"
                  value={formData.photo_url}
                  onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{t('target_language')}</label>
                  <select
                    value={formData.target_language}
                    onChange={(e) => setFormData({ ...formData, target_language: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-white"
                  >
                    <option value="ALL">{t('all_languages')}</option>
                    <option value="id">{t('indonesian')}</option>
                    <option value="en">{t('english')}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{t('button_label')}</label>
                  <input
                    type="text"
                    placeholder="Contoh: Buka Toko, Lihat Produk"
                    value={formData.button_label}
                    onChange={(e) => setFormData({ ...formData, button_label: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{t('button_url')}</label>
                  <input
                    type="url"
                    placeholder="https://t.me/your_bot?start=produk"
                    value={formData.button_url}
                    onChange={(e) => setFormData({ ...formData, button_url: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-mono text-xs"
                  />
                </div>
              </div>

              <p className="text-xs text-slate-500 pt-2">Delay 200ms per pesan (~5 pesan/detik) untuk kecepatan maksimal aman</p>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl">
                  Batal
                </button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2 text-sm font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-xl disabled:opacity-50">
                  {isSubmitting ? t('sending') : t('send_broadcast')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BroadcastTab;