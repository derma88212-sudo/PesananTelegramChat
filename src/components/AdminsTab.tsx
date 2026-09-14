import React, { useState, useEffect } from 'react';
import { Shield, Plus, Trash2, UserPlus, Key, Check, AlertTriangle, Lock, Edit, X, Eye, EyeOff } from 'lucide-react';
import { AdminUser } from '../types';
import { dialogAlert, dialogConfirm, showToast } from '../utils/dialog';
import { safeFetch } from '../utils/safeFetch';

interface AdminsTabProps {
  currentUser: AdminUser;
}

export const AdminsTab: React.FC<AdminsTabProps> = ({ currentUser }) => {
  const [adminsList, setAdminsList] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'superadmin' | 'admin' | 'manager'>('admin');
  const [newTelegramId, setNewTelegramId] = useState('');
  const [editingTgId, setEditingTgId] = useState<string | null>(null);
  const [editingTgValue, setEditingTgValue] = useState('');
  const [telegramUsers, setTelegramUsers] = useState<any[]>([]);
  const [msg, setMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  // Edit admin modal state
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [editForm, setEditForm] = useState({
    username: '',
    password: '',
    role: 'admin' as 'superadmin' | 'admin' | 'manager',
  });
  const [isEditingSubmitting, setIsEditingSubmitting] = useState(false);

  const isSuperAdmin = currentUser?.role === 'superadmin';

  const fetchTelegramUsers = async () => {
    try {
      const res = await fetch('/api/telegram-users');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setTelegramUsers(data.data);
      }
    } catch (e: any) {
      console.error('Error fetching Telegram users:', e.message);
    }
  };

  const labelForTgUser = (u: any) => {
    const name = [u.first_name, u.last_name].filter(Boolean).join(' ').trim();
    const uname = u.username ? `@${u.username}` : '';
    const who = name || uname || 'Pengguna Telegram';
    return `${who} — ID: ${u.telegram_id}`;
  };

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admins');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setAdminsList(data.data);
      }
    } catch (e: any) {
      console.error('Error fetching admins:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
    fetchTelegramUsers();
  }, []);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      setErrorMsg('Akses ditolak: Hanya Super Admin yang berhak menambah akun admin.');
      return;
    }
    if (!newUsername || !newPassword) return;

    setErrorMsg('');
    setMsg('');

    try {
      const res = await fetch('/api/admins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-role': currentUser.role || 'superadmin'
        },
        body: JSON.stringify({
          username: newUsername.trim(),
          password: newPassword,
          role: newRole,
          telegram_id: newTelegramId.trim() || null,
          requester_role: currentUser.role
        })
      });

      const data = await res.json();
      if (data.success) {
        setNewUsername('');
        setNewPassword('');
        setNewTelegramId('');
        setShowAdd(false);
        setMsg(`Admin ${newUsername} berhasil ditambahkan ke database!`);
        fetchAdmins();
        setTimeout(() => setMsg(''), 4000);
      } else {
        setErrorMsg(data.message || 'Gagal menambahkan admin');
      }
    } catch (err: any) {
      setErrorMsg('Koneksi gagal: ' + err.message);
    }
  };

  const handleSaveTelegramId = async (adminId: string) => {
    if (!isSuperAdmin) return;
    try {
      const res = await fetch(`/api/admins/${adminId}/telegram`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-role': currentUser.role || 'superadmin' },
        body: JSON.stringify({ telegram_id: editingTgValue.trim() || null, requester_role: currentUser.role })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Telegram ID admin berhasil diperbarui');
        setEditingTgId(null);
        setEditingTgValue('');
        fetchAdmins();
      } else {
        dialogAlert(data.message || 'Gagal memperbarui Telegram ID', 'Gagal Simpan', 'error');
      }
    } catch (err: any) {
      dialogAlert('Koneksi gagal: ' + err.message, 'Gagal Simpan', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!isSuperAdmin) {
      dialogAlert('Akses ditolak: Hanya Super Admin yang dapat menghapus akun admin.', 'Akses Ditolak', 'error');
      return;
    }

    if (id === 'root_superadmin' || id === 'root_admin') {
      dialogAlert('Akun Root Superadmin utama tidak dapat dihapus demi keamanan sistem.', 'Perhatian', 'warning');
      return;
    }

    const confirmed = await dialogConfirm({
      title: 'Konfirmasi Hapus Admin',
      message: 'Apakah Anda yakin ingin menghapus akses administrator ini?',
      confirmLabel: 'Ya, Hapus',
      cancelLabel: 'Batal',
      isDestructive: true
    });

    if (confirmed) {
      setErrorMsg('');
      try {
        const res = await fetch(`/api/admins/${id}`, {
          method: 'DELETE',
          headers: {
            'x-admin-role': currentUser.role || 'superadmin'
          }
        });
        const data = await res.json();
        if (data.success) {
          showToast('Akun admin berhasil dihapus');
          fetchAdmins();
        } else {
          dialogAlert(data.message || 'Gagal menghapus admin', 'Gagal Hapus', 'error');
        }
      } catch (err: any) {
        dialogAlert('Gagal menghapus admin: ' + err.message, 'Koneksi Gagal', 'error');
      }
    }
  };

  const openEditAdmin = (admin: AdminUser) => {
    if (!isSuperAdmin) {
      dialogAlert('Hanya Super Admin yang bisa mengubah admin', 'Akses Ditolak', 'error');
      return;
    }
    // Prevent editing root admins
    if (admin.admin_id === 'root_superadmin' || admin.admin_id === 'root_admin') {
      dialogAlert('Root Superadmin tidak bisa diubah', 'Tidak Diizinkan', 'warning');
      return;
    }
    setEditingAdmin(admin);
    setEditForm({
      username: admin.username,
      password: '',
      role: admin.role,
    });
  };

  const handleEditAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdmin) return;
    
    if (!editForm.username.trim()) {
      dialogAlert('Username wajib diisi', 'Input Belum Lengkap', 'warning');
      return;
    }

    setIsEditingSubmitting(true);
    try {
      const result = await safeFetch<{ success: boolean; message?: string }>(`/api/admins/${editingAdmin.admin_id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-role': currentUser.role || 'superadmin'
        },
        body: JSON.stringify({
          ...editForm,
          // Only include password if provided
          password: editForm.password || undefined,
          requester_role: currentUser.role
        })
      });
      
      if (result.success && result.data?.success) {
        showToast(`Admin ${editForm.username} berhasil diperbarui`);
        setEditingAdmin(null);
        setEditForm({ username: '', password: '', role: 'admin' });
        fetchAdmins();
      } else {
        dialogAlert(result.data?.message || result.error || 'Gagal memperbarui admin', 'Gagal Simpan', 'error');
      }
    } catch (err: any) {
      dialogAlert(err.message || 'Gagal memperbarui admin', 'Gagal Simpan', 'error');
    } finally {
      setIsEditingSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Manajemen Akun Admin</span>
            {isSuperAdmin ? (
              <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                Super Admin Access
              </span>
            ) : (
              <span className="text-[11px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                Akses Terbatas: {currentUser?.role}
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola hak akses operator dan super admin toko digital.
          </p>
        </div>

        {isSuperAdmin && (
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all self-start"
          >
            <UserPlus className="w-4 h-4" />
            <span>{showAdd ? 'Batal' : 'Tambah Admin Baru'}</span>
          </button>
        )}
      </div>

      {!isSuperAdmin && (
        <div className="p-4 bg-amber-50 border border-amber-200/90 text-amber-900 rounded-2xl text-xs flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Akses Modifikasi Terkunci</p>
            <p className="text-amber-700 mt-0.5">
              Anda saat ini masuk sebagai peran <b>{currentUser?.role || 'Staff'}</b>. Hanya pengguna dengan level <b>Super Admin</b> yang memiliki izin menambah, mengubah, atau menghapus kredensial administrator.
            </p>
          </div>
        </div>
      )}

      {msg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-medium flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{msg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          <span>{errorMsg}</span>
        </div>
      )}

      {showAdd && isSuperAdmin && (
        <form onSubmit={handleAddAdmin} className="bg-slate-50 border border-slate-200/90 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Buat Akun Administrator Baru</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Username / Email</label>
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="staff@admin.com"
                required
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 8 karakter"
                required
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Peran / Role</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as any)}
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="admin">Admin (Verifikasi Pesanan & Stok)</option>
                <option value="manager">Manager (Lihat Laporan & Pesanan)</option>
                <option value="superadmin">Super Admin (Full Root Access)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Telegram ID (Akses Bot)</label>
              <select
                value={newTelegramId}
                onChange={(e) => setNewTelegramId(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">— Tidak dihubungkan ke bot —</option>
                {telegramUsers.length === 0 && (
                  <option value="" disabled>Belum ada pengguna Telegram terdaftar</option>
                )}
                {telegramUsers.map((u) => (
                  <option key={u.telegram_id} value={u.telegram_id}>
                    {labelForTgUser(u)}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400 mt-1">
                Pilih pengguna Telegram yang boleh membuka /admin di bot. Daftar diambil dari pelanggan yang pernah chat ke bot.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="px-4 py-2 bg-white border border-slate-300 text-slate-600 rounded-xl text-xs font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold"
            >
              Simpan Admin
            </button>
          </div>
        </form>
      )}

      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Username</th>
              <th className="py-3 px-4">Role Akses</th>
              <th className="py-3 px-4">Telegram ID (Bot)</th>
              <th className="py-3 px-4">Terdaftar</th>
              <th className="py-3 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-400">
                  Memuat data administrator...
                </td>
              </tr>
            ) : adminsList.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400">
                  Belum ada data admin tambahan.
                </td>
              </tr>
            ) : (
              adminsList.map((admin) => (
                <tr key={admin.admin_id} className="hover:bg-slate-50/80">
                  <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-blue-600" />
                    <span>{admin.username}</span>
                    {(admin.admin_id === 'root_superadmin' || admin.admin_id === 'root_admin') && (
                      <span className="text-[10px] px-1.5 py-0.2 bg-blue-50 text-blue-700 rounded border border-blue-100 font-semibold">
                        Utama
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className="capitalize font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full text-[11px]">
                      {admin.role}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {editingTgId === admin.admin_id ? (
                      <div className="flex items-center gap-1.5">
                        <select
                          value={editingTgValue}
                          onChange={(e) => setEditingTgValue(e.target.value)}
                          className="w-44 px-2 py-1 border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">— Tidak ada —</option>
                          {admin.telegram_id && (
                            <option value={admin.telegram_id}>Saat ini: {admin.telegram_id}</option>
                          )}
                          {telegramUsers.map((u) => (
                            <option key={u.telegram_id} value={u.telegram_id}>
                              {labelForTgUser(u)}
                            </option>
                          ))}
                        </select>
                        <button onClick={() => handleSaveTelegramId(admin.admin_id)} className="text-emerald-600 hover:text-emerald-700 p-1" title="Simpan">
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => { setEditingTgId(null); setEditingTgValue(''); }} className="text-slate-400 hover:text-slate-600 p-1" title="Batal">
                          <span className="text-xs">✕</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        disabled={!isSuperAdmin}
                        onClick={() => { setEditingTgId(admin.admin_id); setEditingTgValue(admin.telegram_id || ''); }}
                        className="font-mono text-xs text-slate-600 hover:text-blue-600 disabled:cursor-default"
                        title={isSuperAdmin ? 'Klik untuk ubah Telegram ID' : 'Hanya Superadmin'}
                      >
                        {admin.telegram_id ? admin.telegram_id : <span className="text-slate-300 italic">Belum diatur</span>}
                      </button>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    {admin.created_at ? new Date(admin.created_at).toLocaleDateString('id-ID') : '-'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {isSuperAdmin && admin.admin_id !== 'root_superadmin' && admin.admin_id !== 'root_admin' ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditAdmin(admin)}
                          className="text-slate-400 hover:text-blue-600 p-1 transition-colors"
                          title="Ubah Username, Password, Role"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(admin.admin_id)}
                          className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                          title="Hapus Akses Admin"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-300 italic flex items-center justify-end gap-1">
                        <Lock className="w-3 h-3" />
                        <span>Terkunci</span>
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Admin Modal */}
      {editingAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden p-6 relative">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Ubah Admin: {editingAdmin.username}
              </h3>
              <button onClick={() => { setEditingAdmin(null); setEditForm({ username: '', password: '', role: 'admin' }); }} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditAdmin} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Username / Email <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  value={editForm.username}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                  placeholder="staff@admin.com"
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password Baru (Kosongkan jika tidak diubah)</label>
                <input
                  type="password"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  placeholder="Minimal 8 karakter"
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">Biarkan kosong untuk mempertahankan password lama</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Peran / Role</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value as any })}
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="admin">Admin (Verifikasi Pesanan & Stok)</option>
                  <option value="manager">Manager (Lihat Laporan & Pesanan)</option>
                  <option value="superadmin">Super Admin (Full Root Access)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setEditingAdmin(null); setEditForm({ username: '', password: '', role: 'admin' }); }}
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-600 rounded-xl text-xs font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isEditingSubmitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold disabled:opacity-50"
                >
                  {isEditingSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};