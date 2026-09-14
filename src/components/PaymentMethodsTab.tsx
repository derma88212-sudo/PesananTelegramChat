import React, { useState } from 'react';
import { 
  CreditCard, 
  Plus, 
  Trash2, 
  Edit, 
  Check, 
  X, 
  QrCode, 
  Smartphone, 
  Building, 
  Globe, 
  Eye, 
  EyeOff, 
  HelpCircle,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { PaymentMethod } from '../types';
import { dialogAlert, dialogConfirm, showToast } from '../utils/dialog';

interface PaymentMethodsTabProps {
  paymentMethods: PaymentMethod[];
  // Accept multiple prop naming conventions so wiring mistakes never break the tab.
  onSavePaymentMethod?: (method: Partial<PaymentMethod>) => Promise<void>;
  onDeletePaymentMethod?: (methodId: string) => Promise<void>;
  onToggleStatus?: (methodId: string) => Promise<void>;
  onSave?: (method: Partial<PaymentMethod>) => Promise<void>;
  onDelete?: (methodId: string) => Promise<void>;
  onToggle?: (methodId: string) => Promise<void>;
  refreshData?: () => void;
  currentLang?: string;
}

export const PaymentMethodsTab: React.FC<PaymentMethodsTabProps> = ({
  paymentMethods,
  onSavePaymentMethod,
  onDeletePaymentMethod,
  onToggleStatus,
  onSave,
  onDelete,
  onToggle
}) => {
  const saveHandler = onSavePaymentMethod || onSave;
  const deleteHandler = onDeletePaymentMethod || onDelete;
  const toggleHandler = onToggleStatus || onToggle;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [formData, setFormData] = useState<Partial<PaymentMethod>>({
    name: '',
    type: 'qris',
    account_number: '',
    account_name: '',
    qr_image_url: '',
    instructions: '',
    scope: 'ALL',
    is_active: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openAddModal = () => {
    setEditingMethod(null);
    setFormData({
      name: '',
      type: 'qris',
      account_number: '',
      account_name: '',
      qr_image_url: '',
      instructions: '',
      scope: 'ALL',
      is_active: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (method: PaymentMethod) => {
    setEditingMethod(method);
    setFormData({
      name: method.name,
      type: method.type,
      account_number: method.account_number,
      account_name: method.account_name,
      qr_image_url: method.qr_image_url || '',
      instructions: method.instructions || '',
      scope: method.scope || 'ALL',
      is_active: method.is_active
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      dialogAlert('Silakan isi nama metode pembayaran.', 'Input Belum Lengkap', 'warning');
      return;
    }

    if (typeof saveHandler !== 'function') {
      dialogAlert('Fungsi simpan tidak tersedia. Muat ulang halaman web admin.', 'Gagal Simpan', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const methodId = editingMethod ? (editingMethod.id || editingMethod.method_id) : null;
      await saveHandler({
        ...(methodId ? { method_id: methodId, id: methodId } : {}),
        ...formData
      });
      showToast(editingMethod ? 'Metode pembayaran berhasil diperbarui' : 'Metode pembayaran baru berhasil disimpan');
      setIsModalOpen(false);
    } catch (err: any) {
      dialogAlert(err.message || 'Gagal menyimpan metode pembayaran', 'Gagal Simpan', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (method: PaymentMethod) => {
    const confirmed = await dialogConfirm(
      `Apakah Anda yakin ingin menghapus metode pembayaran "${method.name}"? Pelanggan tidak akan dapat memilih metode ini di Bot Telegram.`,
      'Hapus Metode Pembayaran',
      'warning',
      'Ya, Hapus',
      'Batal'
    );
    if (!confirmed) return;

    if (typeof deleteHandler !== 'function') {
      dialogAlert('Fungsi hapus tidak tersedia. Muat ulang halaman web admin.', 'Gagal Hapus', 'error');
      return;
    }

    try {
      const methodId = method.id || method.method_id;
      await deleteHandler(methodId);
      showToast('Metode pembayaran berhasil dihapus');
    } catch (err: any) {
      dialogAlert(err.message || 'Gagal menghapus metode pembayaran', 'Gagal Hapus', 'error');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'qris':
        return <QrCode className="w-5 h-5 text-indigo-500" />;
      case 'ewallet':
        return <Smartphone className="w-5 h-5 text-emerald-500" />;
      case 'bank':
        return <Building className="w-5 h-5 text-blue-500" />;
      default:
        return <CreditCard className="w-5 h-5 text-purple-500" />;
    }
  };

  const getScopeBadge = (scope?: string) => {
    switch (scope) {
      case 'ID':
      case 'indonesia':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">🇮🇩 Khusus Indonesia</span>;
      case 'international':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">🌐 Internasional</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">🌍 Semua Wilayah</span>;
    }
  };

  return (
    <div id="payment-methods-tab" className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-600" />
            Kelola Metode Pembayaran
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Atur rekening bank, QRIS, e-wallet, dan gerbang pembayaran manual yang tampil di bot Telegram pembeli.
          </p>
        </div>
        <button
          id="btn-add-payment-method"
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white rounded-xl text-sm font-semibold transition-all shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Tambah Metode Baru
        </button>
      </div>

      {/* Payment Methods Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {paymentMethods.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300 p-8">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
              <CreditCard className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">Belum Ada Metode Pembayaran Tambahan</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
              Sistem menggunakan konfigurasi QRIS bawaan dan dompet kripto. Anda dapat menambahkan metode baru seperti DANA, BCA, OVO, atau QRIS kustom di sini.
            </p>
            <button
              onClick={openAddModal}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-all"
            >
              <Plus className="w-4 h-4" /> Tambah Metode Pertama
            </button>
          </div>
        ) : (
          paymentMethods.map((method) => (
            <div
              key={method.method_id}
              id={`method-card-${method.method_id}`}
              className={`bg-white rounded-2xl border transition-all p-5 flex flex-col justify-between ${
                method.is_active
                  ? 'border-slate-200/80 shadow-xs hover:border-indigo-200 hover:shadow-md'
                  : 'border-slate-200 bg-slate-50/50 opacity-75'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-slate-100 border border-slate-200">
                      {getTypeIcon(method.type)}
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900 leading-tight">{method.name}</h4>
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                        {method.type}
                      </span>
                    </div>
                  </div>
                  {getScopeBadge(method.scope)}
                </div>

                <div className="space-y-2 mt-4 text-sm bg-slate-50/80 p-3.5 rounded-xl border border-slate-100">
                  {method.account_number && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Nomor Rekening/Akun:</span>
                      <span className="font-mono font-bold text-slate-800">{method.account_number}</span>
                    </div>
                  )}
                  {method.account_name && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Atas Nama:</span>
                      <span className="font-medium text-slate-800">{method.account_name}</span>
                    </div>
                  )}
                  {method.qr_image_url && (
                    <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-200/60">
                      <span className="text-slate-500 flex items-center gap-1">
                        <QrCode className="w-3.5 h-3.5" /> Gambar QR
                      </span>
                      <a
                        href={method.qr_image_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 hover:underline inline-flex items-center gap-1 font-medium"
                      >
                        Buka Gambar <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>

                {method.instructions && (
                  <p className="mt-3 text-xs text-slate-500 italic line-clamp-2">
                    "{method.instructions}"
                  </p>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => { if (typeof toggleHandler === 'function') toggleHandler(method.method_id); }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    method.is_active
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                      : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                  }`}
                  title={method.is_active ? 'Metode tampil di Telegram bot' : 'Metode disembunyikan dari Telegram bot'}
                >
                  {method.is_active ? (
                    <>
                      <Eye className="w-3.5 h-3.5 text-emerald-600" /> Tampil di Bot
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3.5 h-3.5 text-slate-400" /> Disembunyikan
                    </>
                  )}
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(method)}
                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Ubah Rincian"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(method)}
                    className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Hapus Metode"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Form: Tambah / Edit Metode Pembayaran */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden p-6 relative">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-600" />
                {editingMethod ? 'Ubah Metode Pembayaran' : 'Tambah Metode Pembayaran Baru'}
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
                  Nama Metode Pembayaran <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: QRIS (Semua Bank & E-Wallet), DANA Transfer, BCA Auto"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tipe / Kategori</label>
                  <select
                    value={formData.type || 'qris'}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                  >
                    <option value="qris">QRIS Standar</option>
                    <option value="ewallet">E-Wallet (DANA/OVO/GoPay)</option>
                    <option value="bank">Transfer Bank</option>
                    <option value="crypto">Kripto Manual</option>
                    <option value="international">Internasional</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cakupan Wilayah</label>
                  <select
                    value={formData.scope || 'ALL'}
                    onChange={(e) => setFormData({ ...formData, scope: e.target.value as any })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                  >
                    <option value="ALL">Semua Negara (Global)</option>
                    <option value="ID">Khusus Indonesia</option>
                    <option value="international">Khusus Luar Negeri</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Rekening / No. HP</label>
                  <input
                    type="text"
                    placeholder="0812xxxx atau no. rekening"
                    value={formData.account_number || ''}
                    onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Pemilik Akun</label>
                  <input
                    type="text"
                    placeholder="Nama penerima / admin"
                    value={formData.account_name || ''}
                    onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">URL Gambar QR Code (Opsional)</label>
                <input
                  type="url"
                  placeholder="https://... (Link gambar QR code statis jika ada)"
                  value={formData.qr_image_url || ''}
                  onChange={(e) => setFormData({ ...formData, qr_image_url: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Petunjuk Pembayaran untuk Pembeli</label>
                <textarea
                  rows={2}
                  placeholder="Petunjuk singkat yang dikirim bot (cth: Transfer nominal pas, sertakan bukti screenshot)"
                  value={formData.instructions || ''}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="is_active_check"
                  checked={formData.is_active ?? true}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <label htmlFor="is_active_check" className="text-xs font-semibold text-slate-700 select-none">
                  Tampilkan metode ini di Bot Telegram pembeli sekarang
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
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Metode'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
