import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Key, 
  Shield, 
  RefreshCw, 
  Save, 
  Plus, 
  Trash2, 
  Copy, 
  Eye, 
  EyeOff, 
  Download, 
  Upload, 
  FileText,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RotateCcw,
  Search,
  Filter,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { dialogAlert, dialogConfirm, showToast } from '../utils/dialog';

interface EnvVar {
  key: string;
  value: string;
  isSecret: boolean;
  isInEnvFile: boolean;
  isInProcessEnv: boolean;
}

interface EnvCategory {
  label: string;
  vars: EnvVar[];
  icon: string;
}

interface EnvVarsTabProps {
  currentLang?: string;
}

export const EnvVarsTab: React.FC<EnvVarsTabProps> = ({ currentLang = 'id' }) => {
  const [categorized, setCategorized] = useState<Record<string, EnvCategory>>({});
  const [flat, setFlat] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  interface EnvApiResponse {
    success: boolean;
    data: {
      categorized: Record<string, EnvCategory>;
      flat: Record<string, string>;
    };
  }
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [editMode, setEditMode] = useState<Record<string, boolean>>({});
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [addingKey, setAddingKey] = useState<string>('');
  const [addingValue, setAddingValue] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      env_title: { id: 'Manajemen Environment Variables (.env)', en: 'Environment Variables Management (.env)' },
      env_subtitle: { id: 'Kelola variabel lingkungan secara dinamis. Perubahan disimpan ke file .env dan berlaku instan.', en: 'Manage environment variables dynamically. Changes saved to .env file and apply instantly.' },
      btn_refresh: { id: 'Muat Ulang', en: 'Refresh' },
      btn_backup: { id: 'Backup .env', en: 'Backup .env' },
      btn_restore: { id: 'Restore', en: 'Restore' },
      btn_add_new: { id: 'Tambah Variabel Baru', en: 'Add New Variable' },
      btn_save_all: { id: 'Simpan Semua Perubahan', en: 'Save All Changes' },
      btn_cancel: { id: 'Batal', en: 'Cancel' },
      btn_save: { id: 'Simpan', en: 'Save' },
      btn_delete: { id: 'Hapus', en: 'Delete' },
      btn_edit: { id: 'Edit', en: 'Edit' },
      btn_copy: { id: 'Salin', en: 'Copy' },
      btn_show: { id: 'Tampilkan', en: 'Show' },
      btn_hide: { id: 'Sembunyikan', en: 'Hide' },
      label_key: { id: 'Kunci (Key)', en: 'Key' },
      label_value: { id: 'Nilai (Value)', en: 'Value' },
      label_search: { id: 'Cari variabel...', en: 'Search variables...' },
      placeholder_key: { id: 'CONTOH_KEY', en: 'EXAMPLE_KEY' },
      placeholder_value: { id: 'nilai rahasia atau konfigurasi', en: 'secret or config value' },
      status_in_env: { id: 'Di .env', en: 'In .env' },
      status_in_process: { id: 'Di process.env', en: 'In process.env' },
      status_secret: { id: 'Rahasia', en: 'Secret' },
      status_public: { id: 'Publik', en: 'Public' },
      msg_loaded: { id: 'Environment variables berhasil dimuat', en: 'Environment variables loaded successfully' },
      msg_saved: { id: 'Perubahan berhasil disimpan ke .env', en: 'Changes saved to .env successfully' },
      msg_deleted: { id: 'Variabel berhasil dihapus', en: 'Variable deleted successfully' },
      msg_added: { id: 'Variabel baru ditambahkan', en: 'New variable added' },
      msg_copied: { id: 'Disalin ke clipboard', en: 'Copied to clipboard' },
      msg_backup_created: { id: 'Backup .env berhasil dibuat', en: '.env backup created successfully' },
      msg_restored: { id: 'Environment berhasil direstore. Restart server direkomendasikan.', en: 'Environment restored. Server restart recommended.' },
      err_load: { id: 'Gagal memuat environment variables', en: 'Failed to load environment variables' },
      err_save: { id: 'Gagal menyimpan perubahan', en: 'Failed to save changes' },
      err_delete: { id: 'Gagal menghapus variabel', en: 'Failed to delete variable' },
      err_add: { id: 'Gagal menambah variabel', en: 'Failed to add variable' },
      err_backup: { id: 'Gagal membuat backup', en: 'Failed to create backup' },
      err_restore: { id: 'Gagal restore environment', en: 'Failed to restore environment' },
      confirm_delete: { id: 'Apakah Anda yakin ingin menghapus variabel ini?', en: 'Are you sure you want to delete this variable?' },
      confirm_restore: { id: 'Restore akan menimpa .env saat ini. Lanjutkan?', en: 'Restore will overwrite current .env. Continue?' },
      warn_secret: { id: 'Variabel ini terdeteksi sebagai rahasia (password, secret, key, token).', en: 'This variable is detected as secret (password, secret, key, token).' },
      warn_restart: { id: 'Beberapa perubahan memerlukan restart server agar berlaku penuh.', en: 'Some changes require server restart to take full effect.' },
      category_application: { id: 'Aplikasi', en: 'Application' },
      category_admin: { id: 'Admin Authentication', en: 'Admin Authentication' },
      category_telegram: { id: 'Telegram Bot', en: 'Telegram Bot' },
      category_supabase: { id: 'Supabase (PostgreSQL)', en: 'Supabase (PostgreSQL)' },
      category_firestore: { id: 'Google Cloud Firestore', en: 'Google Cloud Firestore' },
      category_redis: { id: 'Redis Cache', en: 'Redis Cache' },
      category_mysql: { id: 'MySQL / MariaDB', en: 'MySQL / MariaDB' },
      category_mongodb: { id: 'MongoDB', en: 'MongoDB' },
      category_nowpayments: { id: 'NOWPayments (Crypto)', en: 'NOWPayments (Crypto)' },
      category_ai: { id: 'Google Gemini AI', en: 'Google Gemini AI' },
      category_audio: { id: 'Audio Alerts', en: 'Audio Alerts' },
      category_other: { id: 'Lainnya', en: 'Other' },
    };
    return translations[key]?.[currentLang] || translations[key]?.en || key;
  };

  const fetchEnvVars = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/env');
      const data: EnvApiResponse = await res.json();
      if (data.success) {
        setCategorized(data.data.categorized || {});
        setFlat(data.data.flat || {});
        showToast(t('msg_loaded'));
      } else {
        dialogAlert(t('err_load') + ': ' + (data.message || 'Unknown error'), 'Error', 'error');
      }
    } catch (err: any) {
      dialogAlert(t('err_load') + ': ' + err.message, 'Error', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = async () => {
    const variables: Record<string, string> = {};
    Object.entries(editValues).forEach(([key, value]) => {
      if (value !== flat[key]) {
        variables[key] = value;
      }
    });

    if (Object.keys(variables).length === 0) {
      showToast('Tidak ada perubahan untuk disimpan');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/env', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variables })
      });
      const data = await res.json();
      if (data.success) {
        showToast(t('msg_saved'));
        setLastSaved(new Date().toLocaleTimeString('id-ID'));
        setEditMode({});
        fetchEnvVars();
      } else {
        dialogAlert(t('err_save') + ': ' + (data.message || data.errors?.join(', ') || 'Unknown error'), 'Error', 'error');
      }
    } catch (err: any) {
      dialogAlert(t('err_save') + ': ' + err.message, 'Error', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSingle = async (key: string) => {
    const value = editValues[key];
    if (value === undefined || value === flat[key]) {
      setEditMode(prev => ({ ...prev, [key]: false }));
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/env', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
      });
      const data = await res.json();
      if (data.success) {
        showToast(t('msg_saved'));
        setEditMode(prev => ({ ...prev, [key]: false }));
        fetchEnvVars();
      } else {
        dialogAlert(t('err_save') + ': ' + (data.message || data.error || 'Unknown error'), 'Error', 'error');
      }
    } catch (err: any) {
      dialogAlert(t('err_save') + ': ' + err.message, 'Error', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (key: string) => {
    const confirmed = await dialogConfirm({
      title: 'Konfirmasi Hapus',
      message: t('confirm_delete'),
      confirmLabel: 'Ya, Hapus',
      cancelLabel: 'Batal',
      isDestructive: true
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/env/${key}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast(t('msg_deleted'));
        fetchEnvVars();
      } else {
        dialogAlert(t('err_delete') + ': ' + (data.message || 'Unknown error'), 'Error', 'error');
      }
    } catch (err: any) {
      dialogAlert(t('err_delete') + ': ' + err.message, 'Error', 'error');
    }
  };

  const handleAddVariable = async () => {
    if (!addingKey.trim() || addingValue === undefined) {
      dialogAlert('Key dan Value wajib diisi', 'Perhatian', 'warning');
      return;
    }

    if (!/^[A-Z_][A-Z0-9_]*$/.test(addingKey.trim())) {
      dialogAlert('Format key tidak valid. Gunakan UPPER_SNAKE_CASE (contoh: MY_API_KEY)', 'Format Tidak Valid', 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/env', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: addingKey.trim(), value: addingValue })
      });
      const data = await res.json();
      if (data.success) {
        showToast(t('msg_added'));
        setAddingKey('');
        setAddingValue('');
        setShowAddForm(false);
        fetchEnvVars();
      } else {
        dialogAlert(t('err_add') + ': ' + (data.message || data.error || 'Unknown error'), 'Error', 'error');
      }
    } catch (err: any) {
      dialogAlert(t('err_add') + ': ' + err.message, 'Error', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleBackup = async () => {
    try {
      const res = await fetch('/api/env/backup', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast(t('msg_backup_created'));
      } else {
        dialogAlert(t('err_backup') + ': ' + (data.message || 'Unknown error'), 'Error', 'error');
      }
    } catch (err: any) {
      dialogAlert(t('err_backup') + ': ' + err.message, 'Error', 'error');
    }
  };

  const handleRestore = async () => {
    try {
      const res = await fetch('/api/env/backups');
      const data = await res.json();
      if (!data.success || !data.data || data.data.length === 0) {
        dialogAlert('Tidak ada file backup tersedia', 'Tidak Ada Backup', 'warning');
        return;
      }

      const backup = data.data[0]; // Use latest backup
      const confirmed = await dialogConfirm({
        title: 'Restore Environment',
        message: t('confirm_restore'),
        confirmLabel: 'Ya, Restore',
        cancelLabel: 'Batal',
        isDestructive: true
      });
      if (!confirmed) return;

      const restoreRes = await fetch('/api/env/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backupPath: backup.path })
      });
      const restoreData = await restoreRes.json();
      if (restoreData.success) {
        showToast(t('msg_restored'));
        fetchEnvVars();
      } else {
        dialogAlert(t('err_restore') + ': ' + (restoreData.message || 'Unknown error'), 'Error', 'error');
      }
    } catch (err: any) {
      dialogAlert(t('err_restore') + ': ' + err.message, 'Error', 'error');
    }
  };

  const handleCopy = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      showToast(t('msg_copied'));
    } catch {
      dialogAlert('Gagal menyalin ke clipboard', 'Error', 'error');
    }
  };

  const toggleSecret = (key: string) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleExpand = (category: string) => {
    setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }));
  };

  const startEdit = (key: string, value: string) => {
    setEditMode(prev => ({ ...prev, [key]: true }));
    setEditValues(prev => ({ ...prev, [key]: value }));
  };

  const cancelEdit = (key: string) => {
    setEditMode(prev => ({ ...prev, [key]: false }));
    setEditValues(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const filteredCategories = Object.entries(categorized).filter(([_, cat]) => {
    if (!searchQuery) return true;
    return cat.vars.some(v => 
      v.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.value.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  useEffect(() => {
    fetchEnvVars();
  }, []);

  const getCategoryLabel = (key: string) => {
    return t(`category_${key}` as any) || key;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="ml-3 text-slate-600">Memuat environment variables...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            <span>{t('env_title')}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">{t('env_subtitle')}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleBackup}
            className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t('btn_backup')}</span>
          </button>
          <button
            type="button"
            onClick={handleRestore}
            className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t('btn_restore')}</span>
          </button>
          <button
            type="button"
            onClick={fetchEnvVars}
            disabled={loading}
            className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{t('btn_refresh')}</span>
          </button>
        </div>
      </div>

      {/* Search & Add New */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('label_search')}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('btn_add_new')}</span>
          </button>
        </div>

        {showAddForm && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-3 animate-fadeIn">
            <h4 className="font-bold text-slate-900 text-sm">{t('btn_add_new')}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t('label_key')}</label>
                <input
                  type="text"
                  value={addingKey}
                  onChange={(e) => setAddingKey(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))}
                  placeholder={t('placeholder_key')}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t('label_value')}</label>
                <input
                  type="text"
                  value={addingValue}
                  onChange={(e) => setAddingValue(e.target.value)}
                  placeholder={t('placeholder_value')}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => { setShowAddForm(false); setAddingKey(''); setAddingValue(''); }}
                className="px-3 py-1.5 bg-white border border-slate-300 text-slate-600 rounded-xl text-xs font-medium hover:bg-slate-100"
              >
                {t('btn_cancel')}
              </button>
              <button
                type="button"
                onClick={handleAddVariable}
                disabled={saving}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1" />}{t('btn_save')}
              </button>
            </div>
          </div>
        )}

        {/* Warning about restart */}
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <span className="text-xs text-amber-800">{t('warn_restart')}</span>
        </div>

        {lastSaved && (
          <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-1.5 text-xs text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Terakhir disimpan: {lastSaved}</span>
          </div>
        )}
      </div>

      {/* Environment Variables List */}
      <div className="space-y-4">
        {filteredCategories.length === 0 ? (
          <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center">
            <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Tidak ada variabel yang cocok dengan pencarian</p>
          </div>
        ) : (
          filteredCategories.map(([catKey, category]) => (
            <div key={catKey} className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
              <button
                type="button"
                onClick={() => toggleExpand(catKey)}
                className="w-full px-5 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{category.icon}</span>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{getCategoryLabel(catKey)}</h3>
                    <p className="text-[11px] text-slate-500">{category.vars.length} variabel</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded">
                    {category.vars.filter(v => v.isInEnvFile).length}/{category.vars.length} di .env
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expandedCategories[catKey] ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {expandedCategories[catKey] && (
                <div className="divide-y divide-slate-100">
                  {category.vars.filter(v => {
                    if (!searchQuery) return true;
                    return v.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           v.value.toLowerCase().includes(searchQuery.toLowerCase());
                  }).map((variable) => {
                    const isEditing = editMode[variable.key];
                    const displayValue = isEditing ? editValues[variable.key] : variable.value;
                    const showSecret = showSecrets[variable.key] || !variable.isSecret;
                    
                    return (
                      <div key={variable.key} className="px-5 py-3 hover:bg-slate-50/50 transition-colors">
                        {isEditing ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                              <div className="sm:col-span-1">
                                <label className="block text-xs font-semibold text-slate-700 mb-1">{t('label_key')}</label>
                                <input
                                  type="text"
                                  value={variable.key}
                                  readOnly
                                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 font-mono"
                                />
                              </div>
                              <div className="sm:col-span-3">
                                <label className="block text-xs font-semibold text-slate-700 mb-1">{t('label_value')}</label>
                                <input
                                  type={showSecret && variable.isSecret ? 'text' : variable.isSecret ? 'password' : 'text'}
                                  value={editValues[variable.key] || variable.value}
                                  onChange={(e) => setEditValues(prev => ({ ...prev, [variable.key]: e.target.value }))}
                                  placeholder={t('placeholder_value')}
                                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                                />
                              </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                              <button
                                type="button"
                                onClick={() => cancelEdit(variable.key)}
                                className="px-3 py-1.5 bg-white border border-slate-300 text-slate-600 rounded-xl text-xs font-medium hover:bg-slate-100"
                              >
                                {t('btn_cancel')}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveSingle(variable.key)}
                                disabled={saving}
                                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1"
                              >
                                <Save className="w-3.5 h-3.5" />
                                <span>{t('btn_save')}</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">{variable.key}</span>
                                {variable.isSecret && (
                                  <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 text-[10px] font-bold rounded border border-rose-200">
                                    {t('status_secret')}
                                  </span>
                                )}
                                {variable.isInEnvFile && (
                                  <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded border border-emerald-200">
                                    {t('status_in_env')}
                                  </span>
                                )}
                                {variable.isInProcessEnv && !variable.isInEnvFile && (
                                  <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded border border-blue-200">
                                    {t('status_in_process')}
                                  </span>
                                )}
                              </div>
                              <div className="mt-2 flex items-center gap-2 flex-wrap">
                                <span className="text-xs text-slate-500">{t('label_value')}: </span>
                                <code className="flex-1 min-w-0 break-all bg-slate-50 px-2 py-1 rounded font-mono text-xs text-slate-700 border border-slate-200 max-w-md sm:max-w-lg">
                                  {showSecret ? displayValue : '•'.repeat(Math.min(displayValue.length, 30))}
                                </code>
                                {variable.isSecret && (
                                  <button
                                    type="button"
                                    onClick={() => toggleSecret(variable.key)}
                                    className="px-2 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-600 rounded-lg text-[10px] font-semibold flex items-center gap-1 shadow-2xs"
                                  >
                                    {showSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                    <span>{showSecret ? t('btn_hide') : t('btn_show')}</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleCopy(variable.key, variable.value)}
                                  className="px-2 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-600 rounded-lg text-[10px] font-semibold flex items-center gap-1 shadow-2xs"
                                >
                                  <Copy className="w-3 h-3" />
                                  <span>{t('btn_copy')}</span>
                                </button>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 sm:ml-4">
                              <button
                                type="button"
                                onClick={() => startEdit(variable.key, variable.value)}
                                className="px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-600 rounded-lg shadow-2xs transition-all"
                                title={t('btn_edit')}
                              >
                                <Settings className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(variable.key)}
                                className="px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-rose-50 hover:border-rose-300 text-slate-600 hover:text-rose-600 rounded-lg shadow-2xs transition-all"
                                title={t('btn_delete')}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default EnvVarsTab;