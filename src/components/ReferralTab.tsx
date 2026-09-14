import React, { useState, useEffect } from 'react';
import { 
  Link2, 
  Plus, 
  Trash2, 
  Edit, 
  Check, 
  X, 
  ExternalLink,
  Copy,
  BarChart2,
  MousePointer,
  Users,
  DollarSign,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { ReferralLink } from '../types';
import { dialogAlert, dialogConfirm, showToast } from '../utils/dialog';
import { t } from '../utils/languages';
import { safeFetch } from '../utils/safeFetch';

interface ReferralTabProps {
  currentLang?: string;
  channels: any[];
  bots: any[];
  refreshData: () => void;
}

export const ReferralTab: React.FC<ReferralTabProps> = ({ 
  currentLang = 'id', 
  channels, 
  bots, 
  refreshData 
}) => {
  const [referralLinks, setReferralLinks] = useState<ReferralLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<ReferralLink | null>(null);
  const [form, setForm] = useState({
    channel_id: '',
    bot_token_id: '',
    custom_code: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generating, setGenerating] = useState(false);

  const fetchReferralLinks = async () => {
    setLoading(true);
    try {
      const result = await safeFetch<{ success: boolean; data: ReferralLink[] }>('/api/referral-links');
      if (result.success && result.data?.success) setReferralLinks(result.data.data || []);
    } catch (e: any) {
      console.warn('Fetch referral links error:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferralLinks();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ channel_id: '', bot_token_id: '', custom_code: '' });
    setIsModalOpen(true);
  };

  const openEdit = (link: ReferralLink) => {
    setEditing(link);
    setForm({ 
      channel_id: link.channel_id, 
      bot_token_id: link.bot_token_id || '',
      custom_code: link.referral_code 
    });
    setIsModalOpen(true);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.channel_id) {
      dialogAlert('Pilih channel terlebih dahulu', 'Input Belum Lengkap', 'warning');
      return;
    }
    setGenerating(true);
    try {
      const result = await safeFetch<{ success: boolean; message?: string }>('/api/referral-links/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel_id: form.channel_id,
          bot_token_id: form.bot_token_id,
          custom_code: form.custom_code
        })
      });
      if (result.success && result.data?.success) {
        showToast('Referral link berhasil dibuat');
        setIsModalOpen(false);
        fetchReferralLinks();
        refreshData();
      } else {
        dialogAlert(result.data?.message || result.error || 'Gagal membuat referral link', 'Gagal', 'error');
      }
    } catch (err: any) {
      dialogAlert(err.message || 'Gagal membuat referral link', 'Gagal', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (link: ReferralLink) => {
    const confirmed = await dialogConfirm({
      title: 'Hapus Referral Link',
      message: `Hapus referral link "${link.referral_code}"? Data klik & join akan ikut terhapus.`,
      confirmLabel: 'Ya, Hapus',
      cancelLabel: 'Batal',
      isDestructive: true
    });
    if (!confirmed) return;
    try {
      const result = await safeFetch<{ success: boolean; message?: string }>(`/api/referral-links/${link.referral_id}`, { method: 'DELETE' });
      if (result.success && result.data?.success) {
        showToast('Referral link dihapus');
        fetchReferralLinks();
      } else {
        dialogAlert(result.data?.message || result.error || 'Gagal menghapus', 'Gagal Hapus', 'error');
      }
    } catch (e: any) {
      dialogAlert('Gagal menghapus: ' + e.message, 'Gagal Hapus', 'error');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setGenerating(true);
    try {
      const result = await safeFetch<{ success: boolean; message?: string }>(`/api/referral-links/${editing.referral_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, referral_id: editing.referral_id })
      });
      if (result.success && result.data?.success) {
        showToast('Referral link diperbarui');
        setIsModalOpen(false);
        setEditing(null);
        fetchReferralLinks();
        refreshData();
      } else {
        dialogAlert(result.data?.message || result.error || 'Gagal memperbarui', 'Gagal', 'error');
      }
    } catch (err: any) {
      dialogAlert(err.message || 'Gagal memperbarui', 'Gagal', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Link disalin ke clipboard');
  };

  const formatNumber = (n: number) => n.toLocaleString('id-ID');

  // Filter bot terdaftar yang aktif / berjalan pada koneksi polling
  const activeBots = bots.filter(b => 
    b.is_active !== false && 
    (b.status === 'online' || b.status === 'running' || b.status === 'active' || !b.status)
  );

  return (
    <div id="referral-tab" className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Link2 className="w-5 h-5 text-purple-600" />
            Tautan Promosi Khusus (Referral)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Buat link referral per channel/bot untuk tracking klik, join, order & pendapatan dari mitra/affiliate.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold transition-all"
        >
          <Plus className="w-4 h-4" />
          Buat Referral Link
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-10 text-slate-400 text-sm">Memuat data...</div>
        ) : referralLinks.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-2xl border-dashed border-slate-300">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-3">
              <Link2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">Belum Ada Referral Link</h3>
            <p className="text-sm text-slate-500 mt-1">Buat link referral pertama untuk channel/bot Anda.</p>
            <button
              onClick={openAdd}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-medium transition-all"
            >
              <Plus className="w-4 h-4" /> Buat Referral Link
            </button>
          </div>
        ) : (
          referralLinks.map((link) => (
            <div key={link.referral_id} className={`bg-white rounded-2xl border p-5 flex-col justify-between ${link.is_active ? 'border-slate-200/80' : 'border-slate-200 bg-slate-50/50 opacity-75'}`}>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono font-black text-lg text-slate-900 tracking-wider">{link.referral_code}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase ${link.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                    {link.is_active ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div className="bg-slate-50 rounded-xl p-2.5 border-slate-100">
                    <div className="text-slate-500 flex items-center gap-1"><MousePointer className="w-3.5 h-3.5" /> Klik</div>
                    <div className="font-bold text-slate-900 mt-0.5">{formatNumber(link.clicks)}</div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-2.5 border-slate-100">
                    <div className="text-slate-500 flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Join</div>
                    <div className="font-bold text-slate-900 mt-0.5">{formatNumber(link.joins)}</div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-2.5 border-slate-100">
                    <div className="text-slate-500 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Order</div>
                    <div className="font-bold text-slate-900 mt-0.5">{formatNumber(link.orders)}</div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-2.5 border-slate-100">
                    <div className="text-slate-500 flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" /> Pendapatan</div>
                    <div className="font-bold text-emerald-600 mt-0.5">${link.revenue_usd.toFixed(2)} / Rp {formatNumber(link.revenue_idr)}</div>
                  </div>
                </div>
                <div className="text-xs text-slate-500 mb-2">
                  <span className="font-medium">Channel:</span> {link.channel_name} 
                  {link.bot_name && (
                    <>
                      <span className="ml-2 font-medium">| Bot:</span> {link.bot_name}
                    </>
                  )}
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => copyToClipboard(link.referral_link)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 transition-colors"
                  title="Salin link referral"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Link</span>
                </button>
                <div className="flex items-center gap-1.5">
                  <a
                    href={link.referral_link}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg"
                    title="Buka Link"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button onClick={() => openEdit(link)} className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg" title="Ubah">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(link)} className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg" title="Hapus">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Generate Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-2xl border-slate-200 shadow-2xl p-6">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Link2 className="w-5 h-5 text-purple-600" />
                {editing ? 'Ubah Referral Link' : 'Buat Referral Link Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={editing ? handleUpdate : handleGenerate} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Channel <span className="text-rose-500">*</span></label>
                <select
                  value={form.channel_id}
                  onChange={(e) => setForm({ ...form, channel_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-white"
                  required
                >
                  <option value="">-- Pilih Channel --</option>
                  {channels.filter(c => c.is_active).map(c => (
                    <option key={c.channel_id || c.id} value={c.channel_id || c.id}>
                      {c.name} (@{c.username || 'no-username'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Bot Telegram (Opsional)</label>
                <select
                  value={form.bot_token_id}
                  onChange={(e) => setForm({ ...form, bot_token_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-white"
                >
                  <option value="">-- Pilih Bot (untuk generate link t.me/bot?start=code) --</option>
                  {activeBots.map(b => (
                    <option key={b.token_id || b.bot_id || b.id} value={b.token_id || b.bot_id || b.id}>
                      {b.bot_name || b.name || 'Telegram Bot'} (@{b.username || (b.bot_token || b.token)?.split(':')[0]?.slice(-6) || 'unknown'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Kode Referral Kustom (Opsional)</label>
                <input
                  type="text"
                  value={form.custom_code}
                  onChange={(e) => setForm({ ...form, custom_code: e.target.value.toUpperCase() })}
                  placeholder="Biarkan kosong untuk auto-generate (contoh: PROMO2024)"
                  className="w-full px-3.5 py-2.5 border-slate-200 rounded-xl text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
                <p className="text-xs text-slate-500 mt-1">Jika dikosongkan, kode akan di-generate otomatis dari username channel + timestamp</p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl">
                  Batal
                </button>
                <button type="submit" disabled={isSubmitting || generating} className="px-5 py-2 text-sm font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-xl disabled:opacity-50">
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2 inline-block" />
                      {editing ? 'Memperbarui...' : 'Membuat...'}
                    </>
                  ) : (
                    editing ? 'Simpan Perubahan' : 'Buat Referral Link'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReferralTab;
