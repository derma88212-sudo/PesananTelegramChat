import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Plus, 
  Trash2, 
  Edit, 
  Check, 
  X, 
  Lock,
  UserCheck,
  AlertCircle,
  Loader2,
  Key
} from 'lucide-react';
import { dialogAlert, dialogConfirm, showToast } from '../utils/dialog';
import { t } from '../utils/languages';

interface SuperAdmin {
  admin_id: string;
  username: string;
  password_hash: string;
  role: string;
  permissions: Record<string, boolean>;
  is_root: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

interface SuperAdminTabProps {
  currentUser: any;
  currentLang?: string;
}

export const SuperAdminTab: React.FC<SuperAdminTabProps> = ({ 
  currentUser, 
  currentLang = 'id' 
}) => {
  const [superAdmins, setSuperAdmins] = useState<SuperAdmin[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<SuperAdmin | null>(null);
  const [form, setForm] = useState({
    username: '',
    password: '',
    permissions: {
      manage_admins: true,
      manage_channels: true,
      manage_products: true,
      manage_settings: true,
      view_all: true
    },
    is_root: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isCurrentUserRoot = currentUser?.username === 'root@admin.com' || currentUser?.admin_id === 'root_admin';

  const fetchSuperAdmins = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/super-admins');
      const data = await res.json();
      if (data.success) setSuperAdmins(data.data || []);
    } catch (e: any) {
      console.warn('Fetch super admins error:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuperAdmins();
  }, []);

  const openAdd = () => {
    if (!isCurrentUserRoot) {
      dialogAlert('Hanya Root Admin yang bisa menambah Super Admin', 'Akses Ditolak', 'error');
      return;
    }
    setEditing(null);
    setForm({ 
      username: '', 
      password: '', 
      permissions: { manage_admins: true, manage_channels: true, manage_products: true, manage_settings: true, view_all: true },
      is_root: false 
    });
    setIsModalOpen(true);
  };

  const openEdit = (admin: SuperAdmin) => {
    // Regular admins cannot edit root admins
    if (!isCurrentUserRoot && admin.is_root) {
      dialogAlert('Hanya Root Admin yang bisa mengubah Root Admin', 'Akses Ditolak', 'error');
      return;
    }
    // Regular admins cannot edit other admins (only root can)
    if (!isCurrentUserRoot && admin.admin_id !== currentUser?.admin_id && admin.username !== currentUser?.username) {
      dialogAlert('Tidak diizinkan mengubah admin lain', 'Akses Ditolak', 'error');
      return;
    }
    setEditing(admin);
    setForm({ 
      username: admin.username, 
      password: '', 
      permissions: admin.permissions || {}, 
      is_root: admin.is_root 
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username.trim()) {
      dialogAlert('Username wajib diisi', 'Input Belum Lengkap', 'warning');
      return;
    }
    if (!editing && !form.password.trim()) {
      dialogAlert('Password wajib diisi untuk Super Admin baru', 'Input Belum Lengkap', 'warning');
      return;
    }
    if (!isCurrentUserRoot && form.is_root) {
      dialogAlert('Hanya Root Admin yang bisa membuat/mengubah Root Admin', 'Akses Ditolak', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const url = editing ? `/api/super-admins/${editing.admin_id}` : '/api/super-admins';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          // Send password only if provided (for edit), required for new
          password: form.password || (editing ? undefined : form.password),
          permissions: form.permissions,
          current_user: currentUser?.username || currentUser?.admin_id
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(editing ? 'Super Admin diperbarui' : 'Super Admin baru dibuat');
        setIsModalOpen(false);
        fetchSuperAdmins();
      } else {
        dialogAlert(data.message || 'Gagal menyimpan Super Admin', 'Gagal Simpan', 'error');
      }
    } catch (err: any) {
      dialogAlert(err.message || 'Gagal menyimpan Super Admin', 'Gagal Simpan', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (admin: SuperAdmin) => {
    if (!isCurrentUserRoot) {
      dialogAlert('Hanya Root Admin yang bisa menghapus Super Admin', 'Akses Ditolak', 'error');
      return;
    }
    // Allow root to delete any super admin including themselves (but warn if deleting themselves)
    const isSelfDelete = admin.admin_id === currentUser?.admin_id || admin.username === currentUser?.username;
    if (isSelfDelete) {
      const confirmedSelf = await dialogConfirm({
        title: 'Hapus Akun Sendiri',
        message: 'Anda akan menghapus akun ROOT ADMIN Anda sendiri. Yakin ingin melanjutkan?',
        confirmLabel: 'Ya, Hapus Akun Saya',
        cancelLabel: 'Batal',
        isDestructive: true
      });
      if (!confirmedSelf) return;
    } else {
      const confirmed = await dialogConfirm({
        title: 'Hapus Super Admin',
        message: `Hapus Super Admin "${admin.username}"?`,
        confirmLabel: 'Ya, Hapus',
        cancelLabel: 'Batal',
        isDestructive: true
      });
      if (!confirmed) return;
    }
    try {
      const res = await fetch(`/api/super-admins/${admin.admin_id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('Super Admin dihapus');
        fetchSuperAdmins();
      } else {
        dialogAlert(data.message || 'Gagal menghapus', 'Gagal Hapus', 'error');
      }
    } catch (e: any) {
      dialogAlert('Gagal menghapus: ' + e.message, 'Gagal Hapus', 'error');
    }
  };

  const formatTime = (isoString: string | null | undefined) => {
    if (!isoString) return 'Belum pernah login';
    try {
      return new Date(isoString).toLocaleString('id-ID', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  const permissionLabels: Record<string, string> = {
    manage_admins: 'Kelola Admin',
    manage_channels: 'Kelola Channel',
    manage_products: 'Kelola Produk',
    manage_settings: 'Kelola Pengaturan',
    view_all: 'Lihat Semua Data'
  };

  return (
    <div id="super-admin-tab" className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-rose-600" />
            Manajemen Super Admin (Root)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Hanya Root Admin (root@admin.com) yang dapat CRUD Super Admin. Super Admin biasa tidak bisa mengubah Root.
          </p>
        </div>
        <button
          onClick={openAdd}
          disabled={!isCurrentUserRoot}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 text-white rounded-xl text-sm font-semibold transition-all"
        >
          <Plus className="w-4 h-4" />
          Tambah Super Admin
        </button>
      </div>

      {!isCurrentUserRoot && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="text-sm text-amber-800">
            <span className="font-semibold">Akses Terbatas:</span> Anda login sebagai Super Admin biasa. 
            Hanya Root Admin (root@admin.com) yang bisa menambah/mengubah/menghapus Super Admin lain.
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-10 text-slate-400 text-sm">Memuat data...</div>
        ) : superAdmins.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-2xl border-dashed border-slate-300">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">Belum Ada Super Admin</h3>
            <p className="text-sm text-slate-500 mt-1">Tambah Super Admin pertama untuk delegasi manajemen.</p>
          </div>
        ) : (
          superAdmins.map((admin) => {
            const isCurrentUser = admin.admin_id === currentUser?.admin_id;
            const isRoot = admin.is_root;
            
            return (
              <div key={admin.admin_id} className={`bg-white rounded-2xl border p-5 flex-col justify-between ${isRoot ? 'border-rose-200 bg-rose-50/30' : 'border-slate-200/80'} ${isCurrentUser ? 'ring-2 ring-blue-500' : ''}`}>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-xl ${isRoot ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'}`}>
                        <Shield className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 leading-tight">{admin.username}</h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {isRoot && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold flex items-center gap-1">
                              <UserCheck className="w-2.5 h-2.5" /> ROOT ADMIN
                            </span>
                          )}
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                            {admin.role || 'superadmin'}
                          </span>
                          {isCurrentUser && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold">
                              Anda
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs mb-3">
                    <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
                      <div className="text-slate-500 flex items-center gap-1"><Key className="w-3.5 h-3.5" /> Hak Akses</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {Object.entries(admin.permissions || {}).map(([key, value]) => (
                          <span key={key} className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${value ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                            {permissionLabels[key] || key}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-2 border border-slate-100 flex justify-between items-center">
                      <span className="text-slate-500 flex items-center gap-1"><Lock className="w-3.5 h-3.5" /> Terakhir Login</span>
                      <span className="font-bold text-slate-900">{formatTime(admin.last_login)}</span>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-2 border border-slate-100 flex justify-between items-center">
                      <span className="text-slate-500">Dibuat</span>
                      <span className="font-bold text-slate-900">{formatTime(admin.created_at)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {isRoot && isCurrentUserRoot && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                        <UserCheck className="w-3 h-3" /> Root Admin (klik edit untuk ubah password/username)
                      </span>
                    )}
                    {isRoot && !isCurrentUserRoot && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                        <UserCheck className="w-3 h-3" /> Tidak bisa dihapus/diubah
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {/* Root admin can edit any admin including other root admins */}
                    {isCurrentUserRoot && (
                      <button onClick={() => openEdit(admin)} className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg" title="Ubah (Username, Password, Hak Akses)">
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    {/* Non-root can only edit themselves */}
                    {!isCurrentUserRoot && !isRoot && isCurrentUser && (
                      <button onClick={() => openEdit(admin)} className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg" title="Ubah Hak Akses">
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    {/* Root admin can delete any admin including other root admins */}
                    {isCurrentUserRoot && (
                      <button onClick={() => handleDelete(admin)} className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg" title="Hapus Super Admin">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    {/* Non-root can delete non-root admins (not themselves) */}
                    {!isCurrentUserRoot && !isRoot && !isCurrentUser && (
                      <button onClick={() => handleDelete(admin)} className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg" title="Hapus Super Admin">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-2xl border-slate-200 shadow-2xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-rose-600" />
                {editing ? 'Ubah Super Admin' : 'Tambah Super Admin Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Username <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase() })}
                  placeholder="superadmin1"
                  // Allow username editing for root admin editing themselves or other admins
                  disabled={editing && !isCurrentUserRoot}
                  className="w-full px-3.5 py-2.5 border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 disabled:bg-slate-50"
                />
              </div>

              {!editing && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Password <span className="text-rose-500">*</span></label>
                  <input
                    type="password"
                    required
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Minimal 6 karakter"
                    className="w-full px-3.5 py-2.5 border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                </div>
              )}

              {editing && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Password Baru (Kosongkan jika tidak diubah)</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Biarkan kosong untuk mempertahankan password lama"
                    className="w-full px-3.5 py-2.5 border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Hak Akses (Permissions)</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(form.permissions).map(([key, value]) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => setForm({ ...form, permissions: { ...form.permissions, [key]: e.target.checked } })}
                        className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
                      />
                      <span className="text-xs font-medium text-slate-700">{permissionLabels[key] || key}</span>
                    </label>
                  ))}
                </div>
              </div>

              {isCurrentUserRoot && !editing && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="is_root"
                    checked={form.is_root}
                    onChange={(e) => setForm({ ...form, is_root: e.target.checked })}
                    className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
                  />
                  <label htmlFor="is_root" className="text-xs font-semibold text-slate-700 select-none">
                    Buat sebagai Root Admin (tidak bisa dihapus/diubah oleh siapapun kecuali root sendiri)
                  </label>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl">
                  Batal
                </button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2 text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl disabled:opacity-50">
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Super Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const permissionLabels: Record<string, string> = {
  manage_admins: 'Kelola Admin',
  manage_channels: 'Kelola Channel',
  manage_products: 'Kelola Produk',
  manage_settings: 'Kelola Pengaturan',
  view_all: 'Lihat Semua Data'
};

export default SuperAdminTab;