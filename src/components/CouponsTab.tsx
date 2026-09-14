import React, { useState, useEffect } from 'react';
import { Ticket, Plus, Trash2, Edit, Check, X, Percent, Coins, Eye, EyeOff } from 'lucide-react';
import { dialogAlert, dialogConfirm, showToast } from '../utils/dialog';

interface Coupon {
  coupon_id?: string;
  code: string;
  discount_percentage: number;
  fixed_discount: number;
  max_uses: number;
  used_count?: number;
  is_active: boolean;
}

interface CouponsTabProps {
  currentLang?: string;
}

export const CouponsTab: React.FC<CouponsTabProps> = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState<Coupon>({
    code: '',
    discount_percentage: 0,
    fixed_discount: 0,
    max_uses: 0,
    is_active: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/coupons');
      const data = await res.json();
      if (data.success) setCoupons(data.data || []);
    } catch (e: any) {
      console.warn('Fetch coupons error:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ code: '', discount_percentage: 0, fixed_discount: 0, max_uses: 0, is_active: true });
    setIsModalOpen(true);
  };

  const openEdit = (c: Coupon) => {
    setEditing(c);
    setForm({ ...c });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code?.trim()) {
      dialogAlert('Kode kupon wajib diisi.', 'Input Belum Lengkap', 'warning');
      return;
    }
    if (!Number(form.discount_percentage) && !Number(form.fixed_discount)) {
      dialogAlert('Isi diskon persen atau diskon nominal (minimal salah satu).', 'Diskon Kosong', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const url = editing?.coupon_id ? `/api/coupons/${editing.coupon_id}` : '/api/coupons';
      const method = editing?.coupon_id ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          code: form.code.trim().toUpperCase(),
          discount_percentage: Number(form.discount_percentage) || 0,
          fixed_discount: Number(form.fixed_discount) || 0,
          max_uses: Number(form.max_uses) || 0
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(editing ? 'Kupon berhasil diperbarui' : 'Kupon baru berhasil dibuat');
        setIsModalOpen(false);
        fetchCoupons();
      } else {
        dialogAlert(data.message || 'Gagal menyimpan kupon', 'Gagal Simpan', 'error');
      }
    } catch (err: any) {
      dialogAlert(err.message || 'Gagal menyimpan kupon', 'Gagal Simpan', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (c: Coupon) => {
    const confirmed = await dialogConfirm({
      title: 'Hapus Kupon',
      message: `Hapus kupon "${c.code}"? Pembeli tidak akan bisa memakainya lagi.`,
      confirmLabel: 'Ya, Hapus',
      cancelLabel: 'Batal',
      isDestructive: true
    });
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/coupons/${c.coupon_id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('Kupon dihapus');
        fetchCoupons();
      }
    } catch (e: any) {
      dialogAlert('Gagal menghapus kupon: ' + e.message, 'Gagal Hapus', 'error');
    }
  };

  const handleToggle = async (c: Coupon) => {
    try {
      const res = await fetch(`/api/coupons/${c.coupon_id}/toggle`, { method: 'PATCH' });
      const data = await res.json();
      if (data.success) {
        showToast('Status kupon diperbarui');
        fetchCoupons();
      }
    } catch (e: any) {
      dialogAlert('Gagal mengubah status kupon: ' + e.message, 'Gagal', 'error');
    }
  };

  return (
    <div id="coupons-tab" className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Ticket className="w-5 h-5 text-indigo-600" />
            Kupon Diskon
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Buat kode kupon yang otomatis memotong tagihan pembeli saat checkout di bot Telegram.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all"
        >
          <Plus className="w-4 h-4" />
          Tambah Kupon
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-10 text-slate-400 text-sm">Memuat kupon...</div>
        ) : coupons.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-2xl border-dashed border-slate-300">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
              <Ticket className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">Belum Ada Kupon</h3>
            <p className="text-sm text-slate-500 mt-1">Tambahkan kupon diskon pertama Anda.</p>
          </div>
        ) : (
          coupons.map((c) => {
            const pct = Number(c.discount_percentage) || 0;
            const fixed = Number(c.fixed_discount) || 0;
            return (
              <div key={c.coupon_id} className={`bg-white rounded-2xl border p-5 flex-col justify-between ${c.is_active ? 'border-slate-200/80' : 'border-slate-200 bg-slate-50/50 opacity-75'}`}>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono font-black text-lg text-slate-900 tracking-wider">{c.code}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase ${c.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                      {c.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-50 rounded-xl p-2.5 border-slate-100">
                      <div className="text-slate-500 flex items-center gap-1"><Percent className="w-3.5 h-3.5" /> Diskon</div>
                      <div className="font-bold text-slate-900 mt-0.5">{pct > 0 ? `${pct}%` : `Rp ${fixed.toLocaleString('id-ID')}`}</div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-2.5 border-slate-100">
                      <div className="text-slate-500 flex items-center gap-1"><Coins className="w-3.5 h-3.5" /> Pemakaian</div>
                      <div className="font-bold text-slate-900 mt-0.5">{c.used_count || 0} / {c.max_uses > 0 ? c.max_uses : '∞'}</div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => handleToggle(c)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${c.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}
                  >
                    {c.is_active ? <><Eye className="w-3.5 h-3.5" /> Aktif</> : <><EyeOff className="w-3.5 h-3.5" /> Nonaktif</>}
                  </button>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => openEdit(c)} className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Ubah">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(c)} className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg" title="Hapus">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-2xl border-slate-200 shadow-2xl p-6">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Ticket className="w-5 h-5 text-indigo-600" />
                {editing ? 'Ubah Kupon' : 'Tambah Kupon Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Kode Kupon <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="DISKON10"
                  className="w-full px-3.5 py-2.5 border-slate-200 rounded-xl text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Diskon Persen (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={form.discount_percentage}
                    onChange={(e) => setForm({ ...form, discount_percentage: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Diskon Nominal (Rp)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.fixed_discount}
                    onChange={(e) => setForm({ ...form, fixed_discount: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Batas Pemakaian (0 = tanpa batas)</label>
                <input
                  type="number"
                  min={0}
                  value={form.max_uses}
                  onChange={(e) => setForm({ ...form, max_uses: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="coupon_active"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <label htmlFor="coupon_active" className="text-xs font-semibold text-slate-700 select-none">
                  Aktifkan kupon ini (bisa dipakai pembeli)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl">
                  Batal
                </button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl disabled:opacity-50">
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Kupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CouponsTab;
