import React, { useState } from 'react';
import { 
  Radio, 
  Plus, 
  Trash2, 
  Edit, 
  Copy, 
  ExternalLink, 
  Check, 
  X, 
  Eye, 
  EyeOff, 
  BarChart2, 
  Share2, 
  Send
} from 'lucide-react';
import { TelegramChannel } from '../types';
import { dialogAlert, dialogConfirm, showToast } from '../utils/dialog';

interface ChannelsTabProps {
  channels: TelegramChannel[];
  botUsername?: string;
  // Accept both prop naming conventions so wiring mistakes never break the tab.
  onSaveChannel?: (channel: Partial<TelegramChannel>) => Promise<void>;
  onDeleteChannel?: (channelId: string) => Promise<void>;
  onToggleStatus?: (channelId: string) => Promise<void>;
  onSave?: (channel: Partial<TelegramChannel>) => Promise<void>;
  onDelete?: (channelId: string) => Promise<void>;
  onToggle?: (channelId: string) => Promise<void>;
  refreshData?: () => void;
  currentLang?: string;
}

export const ChannelsTab: React.FC<ChannelsTabProps> = ({
  channels,
  botUsername = 'MyDigitalBot',
  onSaveChannel,
  onDeleteChannel,
  onToggleStatus,
  onSave,
  onDelete,
  onToggle
}) => {
  // Resolve the effective handlers regardless of which prop names were passed.
  const handleSave = onSaveChannel || onSave;
  const handleDeleteCb = onDeleteChannel || onDelete;
  const handleToggleCb = onToggleStatus || onToggle;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<TelegramChannel | null>(null);
  const [formData, setFormData] = useState<Partial<TelegramChannel>>({
    name: '',
    username: '',
    invite_link: '',
    description: '',
    is_active: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const openAddModal = () => {
    setEditingChannel(null);
    setFormData({
      name: '',
      username: '',
      invite_link: '',
      description: '',
      is_active: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (channel: TelegramChannel) => {
    setEditingChannel(channel);
    setFormData({
      name: channel.name,
      username: channel.username,
      invite_link: channel.invite_link || '',
      description: channel.description || '',
      is_active: channel.is_active
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      dialogAlert('Silakan isi nama channel telegram.', 'Input Belum Lengkap', 'warning');
      return;
    }

    if (typeof handleSave !== 'function') {
      dialogAlert('Fungsi simpan channel tidak tersedia. Muat ulang halaman web admin.', 'Gagal Simpan', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await handleSave({
        ...(editingChannel ? { channel_id: editingChannel.channel_id } : {}),
        ...formData,
        username: formData.username ? formData.username.replace('@', '').trim() : ''
      });
      showToast(editingChannel ? 'Channel berhasil diperbarui' : 'Channel baru berhasil ditambahkan');
      setIsModalOpen(false);
    } catch (err: any) {
      dialogAlert(err.message || 'Gagal menyimpan channel', 'Gagal Simpan', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (channel: TelegramChannel) => {
    const confirmed = await dialogConfirm(
      `Apakah Anda yakin ingin menghapus tautan channel "${channel.name}"? Tombol channel akan dilepas dari menu utama Bot Telegram.`,
      'Hapus Channel',
      'warning',
      'Ya, Hapus',
      'Batal'
    );
    if (!confirmed) return;

    if (typeof handleDeleteCb !== 'function') {
      dialogAlert('Fungsi hapus channel tidak tersedia. Muat ulang halaman web admin.', 'Gagal Hapus', 'error');
      return;
    }

    try {
      await handleDeleteCb(channel.channel_id);
      showToast('Channel berhasil dihapus');
    } catch (err: any) {
      dialogAlert(err.message || 'Gagal menghapus channel', 'Gagal Hapus', 'error');
    }
  };

  const copyTrackingLink = (channelId: string) => {
    const cleanBot = botUsername.replace('@', '');
    const trackingLink = `https://t.me/${cleanBot}?start=ref_${channelId}`;
    navigator.clipboard.writeText(trackingLink);
    setCopiedId(channelId);
    showToast('Tautan pelacak sumber berhasil disalin!');
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div id="channels-tab" className="space-y-6">
      {/* Header & Overview */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Radio className="w-5 h-5 text-indigo-600" />
            Kelola Channel Telegram & Pelacak Sumber
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Hubungkan channel Telegram resmi untuk ditampilkan sebagai tombol di bot, serta generate tautan khusus untuk melacak asal muasal pengunjung / pembeli.
          </p>
        </div>
        <button
          id="btn-add-channel"
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white rounded-xl text-sm font-semibold transition-all shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Tambah Channel Baru
        </button>
      </div>

      {/* Channel Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {channels.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300 p-8">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
              <Radio className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">Belum Ada Channel Terhubung</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
              Tambahkan channel resmi atau channel promosi Anda. Channel yang aktif akan otomatis muncul sebagai tombol di menu utama Bot Telegram.
            </p>
            <button
              onClick={openAddModal}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-all"
            >
              <Plus className="w-4 h-4" /> Tambah Channel Pertama
            </button>
          </div>
        ) : (
          channels.map((ch) => {
            const cleanBot = botUsername.replace('@', '');
            const trackingLink = `https://t.me/${cleanBot}?start=ref_${ch.channel_id}`;

            return (
              <div
                key={ch.channel_id}
                id={`channel-card-${ch.channel_id}`}
                className={`bg-white rounded-2xl border transition-all p-5 flex flex-col justify-between ${
                  ch.is_active
                    ? 'border-slate-200/80 shadow-xs hover:border-indigo-200 hover:shadow-md'
                    : 'border-slate-200 bg-slate-50/50 opacity-75'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                        <Send className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-slate-900 leading-tight">{ch.name}</h4>
                        {ch.username ? (
                          <span className="text-xs font-mono text-indigo-600">@{ch.username}</span>
                        ) : (
                          <span className="text-xs text-slate-400">Tautan Undangan Privat</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {ch.description && (
                    <p className="mt-2 text-xs text-slate-500 line-clamp-2">
                      {ch.description}
                    </p>
                  )}

                  {/* Tracking Statistics */}
                  <div className="mt-4 grid grid-cols-2 gap-2 bg-slate-50/80 p-3 rounded-xl border border-slate-100 text-xs">
                    <div>
                      <span className="text-slate-500 block">Total Pengunjung:</span>
                      <span className="font-bold text-slate-900 text-sm flex items-center gap-1 mt-0.5">
                        <BarChart2 className="w-3.5 h-3.5 text-indigo-500" />
                        {ch.clicks_count || 0} Klik
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Pesanan / Konversi:</span>
                      <span className="font-bold text-emerald-600 text-sm flex items-center gap-1 mt-0.5">
                        <Check className="w-3.5 h-3.5" />
                        {ch.conversions_count || ch.orders_count || 0} Order
                      </span>
                    </div>
                  </div>

                  {/* Deep Link Referral Copy Box */}
                  <div className="mt-3 bg-slate-100/70 p-2.5 rounded-xl border border-slate-200/60">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                      <span className="font-medium">Tautan Promosi Khusus Channel:</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={trackingLink}
                        className="w-full bg-white px-2 py-1 text-[11px] font-mono text-slate-700 border border-slate-200 rounded-lg select-all"
                      />
                      <button
                        type="button"
                        onClick={() => copyTrackingLink(ch.channel_id)}
                        className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-colors shrink-0"
                        title="Salin Tautan"
                      >
                        {copiedId === ch.channel_id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => { if (typeof handleToggleCb === 'function') handleToggleCb(ch.channel_id); }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      ch.is_active
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                        : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                    }`}
                    title={ch.is_active ? 'Tombol channel tampil di menu bot' : 'Tombol channel disembunyikan dari bot'}
                  >
                    {ch.is_active ? (
                      <>
                        <Eye className="w-3.5 h-3.5 text-emerald-600" /> Aktif di Bot
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5 text-slate-400" /> Disembunyikan
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-1.5">
                    {ch.invite_link && (
                      <a
                        href={ch.invite_link}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Buka Channel"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      onClick={() => openEditModal(ch)}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Ubah Rincian"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(ch)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Hapus Channel"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Form: Tambah / Ubah Channel */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden p-6 relative">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Radio className="w-5 h-5 text-indigo-600" />
                {editingChannel ? 'Ubah Rincian Channel' : 'Tambah Channel Telegram Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Label Channel <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Official Channel, Grup Diskusi, Testimoni"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Username Channel Telegram (Opsional)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-mono text-sm">@</span>
                  <input
                    type="text"
                    placeholder="channel_resmi"
                    value={formData.username || ''}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full pl-8 pr-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tautan Undangan / Invite Link
                </label>
                <input
                  type="url"
                  placeholder="https://t.me/+joinchat... atau https://t.me/channel"
                  value={formData.invite_link || ''}
                  onChange={(e) => setFormData({ ...formData, invite_link: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Keterangan / Catatan</label>
                <textarea
                  rows={2}
                  placeholder="Catatan tujuan channel ini (misal: channel update stok, giveaway, promosi)"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="ch_active_check"
                  checked={formData.is_active ?? true}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <label htmlFor="ch_active_check" className="text-xs font-semibold text-slate-700 select-none">
                  Tampilkan tombol channel ini di menu utama Bot Telegram
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white rounded-xl transition-all shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Channel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
