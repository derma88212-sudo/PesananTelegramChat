import React, { useState, useEffect } from 'react';
import { 
  Database, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Server, 
  Copy, 
  Check, 
  ArrowRight, 
  Sparkles, 
  Terminal, 
  HardDrive, 
  Zap, 
  Layers, 
  Cloud,
  FileCode,
  ShieldCheck,
  Cpu,
  Download,
  ExternalLink,
  Code,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { dialogAlert, dialogConfirm, showToast } from '../utils/dialog';

interface DatabaseTabProps {
  onRefreshData?: () => void;
}

export const DatabaseTab: React.FC<DatabaseTabProps> = ({ onRefreshData }) => {
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [isAutoCreating, setIsAutoCreating] = useState(false);
  const [autoCreateResult, setAutoCreateResult] = useState<any | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrateResult, setMigrateResult] = useState<any | null>(null);
  const [targetEngine, setTargetEngine] = useState<string>('supabase');
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [testingEngine, setTestingEngine] = useState<string | null>(null);
  const [engineTestResults, setEngineTestResults] = useState<Record<string, { success: boolean; message: string }>>({});
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [sqlContent, setSqlContent] = useState<string>('');

  const fetchStatus = async () => {
    setIsLoadingStatus(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/db/status');
      const json = await res.json();
      if (json.success) {
        setDbStatus(json.data);
      } else {
        setErrorMsg(json.message || 'Gagal memuat status database');
      }
    } catch (e: any) {
      setErrorMsg('Error koneksi: ' + e.message);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // 1-Click Auto Table Creator in Supabase
  const handleAutoCreateTables = async () => {
    setIsAutoCreating(true);
    setAutoCreateResult(null);
    setErrorMsg(null);
    setSuccessNotice(null);
    try {
      const res = await fetch('/api/db/init-tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ engine: targetEngine })
      });
      const json = await res.json();
      setAutoCreateResult(json);
      if (json.success) {
        setSuccessNotice(`Tabel ${targetEngine.toUpperCase()} berhasil diperiksa & disiapkan otomatis!`);
      }
      fetchStatus();
      if (onRefreshData) onRefreshData();
    } catch (e: any) {
      setErrorMsg('Gagal membuat tabel: ' + e.message);
    } finally {
      setIsAutoCreating(false);
    }
  };

  // Universal migration to the selected target database engine
  const handleMigrateAll = async () => {
    const engineLabel = targetEngine.toUpperCase();
    const confirmed = await dialogConfirm({
      title: `Mulai Migrasi ke ${engineLabel}`,
      message: `Migrasi seluruh data (produk, stok, pesanan, settings, dompet, bot, admin, pelanggan, kupon) ke database ${engineLabel}?`,
      confirmLabel: 'Ya, Mulai Migrasi',
      cancelLabel: 'Batal'
    });
    if (!confirmed) {
      return;
    }
    setIsMigrating(true);
    setMigrateResult(null);
    setErrorMsg(null);
    setSuccessNotice(null);
    try {
      const res = await fetch('/api/db/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ engine: targetEngine })
      });
      const json = await res.json();
      if (json.success) {
        setMigrateResult(json);
        setSuccessNotice(`Semua data berhasil disinkronkan ke ${engineLabel}!`);
        showToast(`Migrasi ke ${engineLabel} berhasil!`);
        fetchStatus();
        if (onRefreshData) onRefreshData();
      } else {
        setErrorMsg(json.message || 'Migrasi gagal');
      }
    } catch (e: any) {
      setErrorMsg('Error migrasi: ' + e.message);
    } finally {
      setIsMigrating(false);
    }
  };

  // Test individual database engine connection
  const handleTestEngine = async (engine: string) => {
    setTestingEngine(engine);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/db/test/${engine}`);
      const json = await res.json();
      setEngineTestResults(prev => ({
        ...prev,
        [engine]: {
          success: json.success,
          message: json.details?.message || json.message || (json.success ? 'Koneksi berhasil!' : 'Gagal terhubung.')
        }
      }));
    } catch (e: any) {
      setEngineTestResults(prev => ({
        ...prev,
        [engine]: {
          success: false,
          message: 'Error: ' + e.message
        }
      }));
    } finally {
      setTestingEngine(null);
    }
  };

  // View & Copy SQL Schema
  const handleOpenSqlModal = async () => {
    setShowSqlModal(true);
    if (!sqlContent) {
      try {
        const res = await fetch('/api/db/schema-sql');
        const text = await res.text();
        setSqlContent(text);
      } catch (e) {
        setSqlContent('-- Gagal memuat skema SQL');
      }
    }
  };

  const handleCopySql = async () => {
    try {
      let text = sqlContent;
      if (!text) {
        const res = await fetch('/api/db/schema-sql');
        text = await res.text();
        setSqlContent(text);
      }
      await navigator.clipboard.writeText(text);
      setCopiedSql(true);
      showToast('SQL Skema berhasil disalin ke clipboard');
      setTimeout(() => setCopiedSql(false), 3000);
    } catch (e) {
      dialogAlert('Gagal menyalin SQL skema', 'Gagal Salin', 'error');
    }
  };

  const handleCopyVercelEnv = () => {
    const envContent = `# Konfigurasi Multi-Database & Zero-DB Login Commerce.OS
# 1. Autentikasi Admin Mandiri (Login langsung tanpa database)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=kucing123

# 2. Supabase Cloud (PostgreSQL)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
SUPABASE_DB_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres

# 3. Redis Cache & High-Speed State (Opsional)
REDIS_URL=redis://default:password@host:port

# 4. MySQL Server (Opsional)
MYSQL_URL=mysql://user:pass@host:3306/dbname

# 5. MongoDB NoSQL (Opsional)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname`;
    navigator.clipboard.writeText(envContent);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 3000);
  };

  // 1-Click Backup Export
  const handleDownloadBackup = () => {
    window.open('/api/db/export-backup', '_blank');
  };

  const databases = dbStatus?.databases || {};
  const counts = dbStatus?.counts || {};

  // Table list for visual verification
  const expectedTables = [
    { name: 'admins', desc: 'Akun Admin & Otentikasi' },
    { name: 'settings', desc: 'Pengaturan Toko, Gateway & 15 Bahasa' },
    { name: 'products', desc: 'Katalog Produk & Terjemahan' },
    { name: 'stocks', desc: 'Stok Akun Email:Pass:Cookie' },
    { name: 'credentials', desc: 'Kredensial / Isi Produk & Lock Status' },
    { name: 'orders', desc: 'Transaksi, TXID & Status Bayar' },
    { name: 'transactions', desc: 'Rekap Transaksi Terpadu' },
    { name: 'coupons', desc: 'Kupon Diskon Dinamis' },
    { name: 'payment_methods', desc: 'Metode Bayar QRIS / E-Wallet / Bank' },
    { name: 'channels', desc: 'Channel Telegram & Tracking Sumber' },
    { name: 'system_logs', desc: 'Audit Trail Aksi Administrator' },
    { name: 'wallets', desc: 'Dompet Kripto Manual/Auto' },
    { name: 'bot_tokens', desc: 'Multi-Bot Engine Telegram' },
    { name: 'users', desc: 'Pelanggan Telegram' },
    { name: 'user_sessions', desc: 'Sesi & Bahasa Aktif Bot' }
  ];

  return (
    <div className="p-3 sm:p-6 lg:p-8 space-y-6 animate-fadeIn">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-blue-500/20 text-blue-300 border border-blue-400/30">
                Multi-Driver Engine v2.5
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Zero-DB Login Ready
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                Active: <b className="text-white">{dbStatus?.active_database || 'Universal Hybrid'}</b>
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>Universal Database & Cloud Migration</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Arsitektur penyimpanan multi-database cerdas: <b>Supabase (PostgreSQL)</b>, <b>Google Firestore</b>, <b>Redis</b>, <b>MySQL</b>, <b>MongoDB</b>, dan <b>Local JSON Store</b>. Jika variabel <code>.env</code> diisi, sistem otomatis mengaktifkannya. Jika kosong, sistem otomatis memakai yang tersedia tanpa error sedikitpun!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={handleDownloadBackup}
              className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold backdrop-blur-xs transition-all flex items-center gap-1.5 border border-white/10 active:scale-95"
              title="Unduh snapshot seluruh data JSON"
            >
              <Download className="w-4 h-4 text-blue-300" />
              <span>Ekspor Backup</span>
            </button>
            <button
              onClick={fetchStatus}
              disabled={isLoadingStatus}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/30 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingStatus ? 'animate-spin' : ''}`} />
              <span>{isLoadingStatus ? 'Memeriksa...' : 'Cek Status DB'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {successNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="flex-1 font-medium">{successNotice}</span>
          <button onClick={() => setSuccessNotice(null)} className="text-emerald-500 hover:text-emerald-700 font-bold">×</button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-center gap-3">
          <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="flex-1 font-medium">{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="text-rose-500 hover:text-rose-700 font-bold">×</button>
        </div>
      )}

      {/* 1-Click Operations Hub (Hero Cards) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: 1-Click Auto Table Creator */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-4 hover:border-blue-300 transition-all">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                <Terminal className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono px-2.5 py-1 bg-blue-100 text-blue-800 font-bold rounded-full">
                1-CLICK DDL ENGINE
              </span>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Otomatis Buat Tabel di Database Pilihan</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Sekali klik untuk membuat/menyiapkan seluruh tabel pada database yang dipilih di dropdown sebelah (Supabase/PostgreSQL, MySQL, MongoDB, Firestore, atau Local) — tanpa migrasi manual.
              </p>
            </div>

            {/* Table Readiness Checklist */}
            <div className="pt-2">
              <div className="text-[11px] font-bold text-slate-700 mb-2 flex items-center justify-between">
                <span>Daftar Tabel Database:</span>
                <span className="text-[10px] text-slate-400 font-normal">9 Tabel Lengkap</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[11px] font-mono">
                {expectedTables.map((t) => {
                  const isReady = databases.supabase?.tablesReady || autoCreateResult?.details?.tables?.[t.name];
                  return (
                    <div
                      key={t.name}
                      className={`p-2 rounded-xl border flex items-center justify-between gap-1 transition-all ${
                        isReady
                          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                      title={t.desc}
                    >
                      <span className="truncate font-semibold">{t.name}</span>
                      {isReady ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-slate-300 shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {autoCreateResult && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">{autoCreateResult.message}</div>
                  {autoCreateResult.details?.method && (
                    <div className="text-[11px] text-emerald-700 font-mono mt-0.5">
                      Metode Eksekusi: {autoCreateResult.details.method}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleAutoCreateTables}
              disabled={isAutoCreating}
              className="flex-1 py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 min-h-[44px]"
            >
              <RefreshCw className={`w-4 h-4 ${isAutoCreating ? 'animate-spin' : ''}`} />
              <span>{isAutoCreating ? 'Membuat Tabel Otomatis...' : `⚡ Buat Tabel di ${targetEngine.toUpperCase()} Sekarang`}</span>
            </button>
            <button
              type="button"
              onClick={handleOpenSqlModal}
              className="py-3 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 min-h-[44px]"
              title="Buka Skema SQL & Panduan Editor"
            >
              <FileCode className="w-4 h-4 text-slate-600" />
              <span className="hidden sm:inline">Lihat SQL</span>
            </button>
          </div>
        </div>

        {/* Card 2: 1-Click Full Data Migration */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-4 hover:border-emerald-300 transition-all">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                <Zap className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-full">
                1-CLICK DATA SYNC
              </span>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Migrasikan Seluruh Data ke Database Mana Pun</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Pilih database tujuan, lalu sinkronkan seluruh data aktif toko (Produk: <b>{counts.products || 0}</b>, Pesanan: <b>{counts.orders || 0}</b>, Stok: <b>{counts.stocks || 0}</b>, Dompet, Pengaturan, Bot, Admin, Pelanggan & Kupon).
              </p>

              <div className="pt-1">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Database Tujuan Migrasi</label>
                <select
                  value={targetEngine}
                  onChange={(e) => setTargetEngine(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                >
                  <option value="supabase">Supabase / PostgreSQL (Cloud)</option>
                  <option value="mysql">MySQL / MariaDB</option>
                  <option value="mongodb">MongoDB (NoSQL)</option>
                  <option value="firestore">Google Cloud Firestore</option>
                  <option value="local">Local JSON Store (Offline fail-safe)</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Untuk MySQL/MongoDB, pastikan variabel <code>MYSQL_URL</code> / <code>MONGODB_URI</code> sudah diisi di environment.
                </p>
              </div>
            </div>

            {/* Quick Live Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-center">
                <div className="text-base font-black text-slate-900">{counts.products || 0}</div>
                <div className="text-[10px] text-slate-400 font-medium uppercase">Produk</div>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-center">
                <div className="text-base font-black text-slate-900">{counts.stocks || 0}</div>
                <div className="text-[10px] text-slate-400 font-medium uppercase">Stok Akun</div>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-center">
                <div className="text-base font-black text-slate-900">{counts.orders || 0}</div>
                <div className="text-[10px] text-slate-400 font-medium uppercase">Pesanan</div>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-center">
                <div className="text-base font-black text-slate-900">{counts.admins || 1}</div>
                <div className="text-[10px] text-slate-400 font-medium uppercase">Admin</div>
              </div>
            </div>

            {migrateResult && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{migrateResult.message}</span>
                </div>
                {migrateResult.data?.migrated && (
                  <div className="text-[11px] font-mono text-emerald-700 grid grid-cols-2 sm:grid-cols-3 gap-1 pt-1 border-t border-emerald-200/60">
                    <span>Produk: {migrateResult.data.migrated.products}</span>
                    <span>Stok: {migrateResult.data.migrated.stocks}</span>
                    <span>Pesanan: {migrateResult.data.migrated.orders}</span>
                    <span>Settings: {migrateResult.data.migrated.settings}</span>
                    <span>Dompet: {migrateResult.data.migrated.wallets}</span>
                    <span>Bot: {migrateResult.data.migrated.bot_tokens}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleMigrateAll}
              disabled={isMigrating}
              className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 min-h-[44px]"
            >
              <RefreshCw className={`w-4 h-4 ${isMigrating ? 'animate-spin' : ''}`} />
              <span>{isMigrating ? 'Memigrasikan Data...' : `🚀 Mulai Migrasi ke ${targetEngine.toUpperCase()}`}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Multi-Database Status Cards Grid (Redis, Supabase, MySQL, MongoDB, Local, Firestore) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-600" />
            <span>Status Semua Mesin Database (Multi-Driver Engine)</span>
          </h3>
          <span className="text-xs text-slate-500 hidden sm:inline">Otomatis Fallback jika kosong</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 1. Supabase Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3 hover:border-slate-300 transition-all flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-3 h-3 rounded-full ${databases.supabase?.connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
                  <span className="text-xs font-bold text-slate-800">Supabase (PostgreSQL)</span>
                </div>
                <span className={`text-[10px] px-2.5 py-0.5 font-bold uppercase rounded-md ${
                  databases.supabase?.connected ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {databases.supabase?.connected ? 'Terhubung' : 'Siap Diisi'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {databases.supabase?.message || 'Database relasional cloud berkecepatan tinggi dengan auto-table generator.'}
              </p>
              <div className="text-[10px] font-mono p-2 bg-slate-50 rounded-xl text-slate-600 border border-slate-100">
                Status Tabel: {databases.supabase?.tablesReady ? '✅ Tabel Lengkap & Siap' : '⚠️ Tabel Belum Dibuat'}
              </div>
              {engineTestResults['supabase'] && (
                <div className={`text-[11px] p-2 rounded-xl font-medium ${
                  engineTestResults['supabase'].success ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                }`}>
                  {engineTestResults['supabase'].message}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => handleTestEngine('supabase')}
              disabled={testingEngine === 'supabase'}
              className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 min-h-[38px]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testingEngine === 'supabase' ? 'animate-spin text-blue-600' : ''}`} />
              <span>{testingEngine === 'supabase' ? 'Menguji...' : 'Uji Koneksi Supabase'}</span>
            </button>
          </div>

          {/* 2. Redis Cache Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3 hover:border-slate-300 transition-all flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-3 h-3 rounded-full ${databases.redis?.connected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                  <span className="text-xs font-bold text-slate-800">Redis Cache & State</span>
                </div>
                <span className={`text-[10px] px-2.5 py-0.5 font-bold uppercase rounded-md ${
                  databases.redis?.connected ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                }`}>
                  {databases.redis?.connected ? 'Connected' : 'In-Memory'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {databases.redis?.message || 'Mempercepat query dan session bot Telegram dengan latensi sub-milidetik.'}
              </p>
              <div className="text-[10px] font-mono p-2 bg-slate-50 rounded-xl text-slate-600 border border-slate-100">
                Driver: ioredis v5+ (Auto Memory Fallback)
              </div>
              {engineTestResults['redis'] && (
                <div className={`text-[11px] p-2 rounded-xl font-medium ${
                  engineTestResults['redis'].success ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
                }`}>
                  {engineTestResults['redis'].message}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => handleTestEngine('redis')}
              disabled={testingEngine === 'redis'}
              className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 min-h-[38px]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testingEngine === 'redis' ? 'animate-spin text-blue-600' : ''}`} />
              <span>{testingEngine === 'redis' ? 'Menguji...' : 'Uji Koneksi Redis'}</span>
            </button>
          </div>

          {/* 3. MySQL Server Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3 hover:border-slate-300 transition-all flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-3 h-3 rounded-full ${databases.mysql?.configured ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <span className="text-xs font-bold text-slate-800">MySQL Server</span>
                </div>
                <span className={`text-[10px] px-2.5 py-0.5 font-bold uppercase rounded-md ${
                  databases.mysql?.configured ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'
                }`}>
                  {databases.mysql?.configured ? 'Configured' : 'Standby'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {databases.mysql?.message || 'Isi MYSQL_URL di env jika ingin menghubungkan ke database MySQL eksternal.'}
              </p>
              <div className="text-[10px] font-mono p-2 bg-slate-50 rounded-xl text-slate-600 border border-slate-100">
                Variabel: MYSQL_URL
              </div>
              {engineTestResults['mysql'] && (
                <div className={`text-[11px] p-2 rounded-xl font-medium ${
                  engineTestResults['mysql'].success ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-700'
                }`}>
                  {engineTestResults['mysql'].message}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => handleTestEngine('mysql')}
              disabled={testingEngine === 'mysql'}
              className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 min-h-[38px]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testingEngine === 'mysql' ? 'animate-spin text-blue-600' : ''}`} />
              <span>{testingEngine === 'mysql' ? 'Menguji...' : 'Uji Status MySQL'}</span>
            </button>
          </div>

          {/* 4. MongoDB Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3 hover:border-slate-300 transition-all flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-3 h-3 rounded-full ${databases.mongodb?.configured ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <span className="text-xs font-bold text-slate-800">MongoDB NoSQL</span>
                </div>
                <span className={`text-[10px] px-2.5 py-0.5 font-bold uppercase rounded-md ${
                  databases.mongodb?.configured ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                }`}>
                  {databases.mongodb?.configured ? 'Configured' : 'Standby'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {databases.mongodb?.message || 'Isi MONGODB_URI di env jika ingin menggunakan cluster MongoDB Atlas.'}
              </p>
              <div className="text-[10px] font-mono p-2 bg-slate-50 rounded-xl text-slate-600 border border-slate-100">
                Variabel: MONGODB_URI
              </div>
              {engineTestResults['mongodb'] && (
                <div className={`text-[11px] p-2 rounded-xl font-medium ${
                  engineTestResults['mongodb'].success ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-700'
                }`}>
                  {engineTestResults['mongodb'].message}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => handleTestEngine('mongodb')}
              disabled={testingEngine === 'mongodb'}
              className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 min-h-[38px]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testingEngine === 'mongodb' ? 'animate-spin text-blue-600' : ''}`} />
              <span>{testingEngine === 'mongodb' ? 'Menguji...' : 'Uji Status MongoDB'}</span>
            </button>
          </div>

          {/* 5. Local Storage Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3 hover:border-slate-300 transition-all flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-slate-800">Local JSON Store</span>
                </div>
                <span className="text-[10px] px-2.5 py-0.5 font-bold uppercase rounded-md bg-emerald-100 text-emerald-800">
                  Always Ready
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Fail-safe offline storage di <code>data/local_store.json</code>. Menjamin sistem tetap berjalan normal meski internet terputus.
              </p>
              <div className="text-[10px] font-mono p-2 bg-slate-50 rounded-xl text-slate-600 border border-slate-100">
                File: data/local_store.json
              </div>
              {engineTestResults['local'] && (
                <div className="text-[11px] p-2 rounded-xl font-medium bg-emerald-50 text-emerald-800">
                  {engineTestResults['local'].message}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => handleTestEngine('local')}
              disabled={testingEngine === 'local'}
              className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 min-h-[38px]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testingEngine === 'local' ? 'animate-spin text-blue-600' : ''}`} />
              <span>{testingEngine === 'local' ? 'Menguji...' : 'Uji Local Store'}</span>
            </button>
          </div>

          {/* 6. Firestore Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3 hover:border-slate-300 transition-all flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-slate-800">Google Cloud Firestore</span>
                </div>
                <span className="text-[10px] px-2.5 py-0.5 font-bold uppercase rounded-md bg-emerald-100 text-emerald-800">
                  Online Realtime
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Database cloud NoSQL primer aktif. Sinkronisasi dokumen instan dan terproteksi aturan keamanan Firestore.
              </p>
              <div className="text-[10px] font-mono p-2 bg-slate-50 rounded-xl text-slate-600 border border-slate-100">
                Total: {counts.products || 0} Produk | {counts.orders || 0} Pesanan
              </div>
              {engineTestResults['firestore'] && (
                <div className="text-[11px] p-2 rounded-xl font-medium bg-emerald-50 text-emerald-800">
                  {engineTestResults['firestore'].message}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => handleTestEngine('firestore')}
              disabled={testingEngine === 'firestore'}
              className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 min-h-[38px]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testingEngine === 'firestore' ? 'animate-spin text-blue-600' : ''}`} />
              <span>{testingEngine === 'firestore' ? 'Menguji...' : 'Uji Firestore Cloud'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Enterprise Multi-Database Architecture & Zero-DB Auth Guide */}
      <div className="bg-slate-900 text-slate-100 rounded-3xl p-6 sm:p-7 shadow-lg space-y-4 border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-slate-800 rounded-2xl border border-slate-700 text-blue-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-bold text-white">Panduan Konfigurasi .env & Enterprise Deployment</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Login, otentikasi ENV, dan API pembayaran bekerja 100% tanpa ketergantungan database.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopyVercelEnv}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shrink-0 active:scale-95 shadow-md shadow-blue-600/20 min-h-[44px]"
          >
            {copiedEnv ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
            <span>{copiedEnv ? 'Tersalin ke Clipboard!' : 'Salin Template .env Lengkap'}</span>
          </button>
        </div>

        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 font-mono text-xs text-slate-300 space-y-2 overflow-x-auto leading-relaxed">
          <div className="text-slate-500"># Masukkan variabel berikut ke file .env atau Vercel / Cloud Run Environment Settings:</div>
          <div><span className="text-emerald-400 font-bold">ADMIN_USERNAME</span>=admin <span className="text-slate-500"># Login langsung tanpa database</span></div>
          <div><span className="text-emerald-400 font-bold">ADMIN_PASSWORD</span>=kucing123 <span className="text-slate-500"># Password admin dari env</span></div>
          <div className="pt-1 text-slate-500"># Supabase PostgreSQL (Jika diisi, 1-Click Auto Table Creator & Sinkronisasi Aktif):</div>
          <div><span className="text-blue-400">SUPABASE_URL</span>=https://xyzproject.supabase.co</div>
          <div><span className="text-blue-400">SUPABASE_ANON_KEY</span>=eyJhbGciOi...</div>
          <div><span className="text-blue-400">SUPABASE_SERVICE_ROLE_KEY</span>=eyJhbGciOi...</div>
          <div><span className="text-blue-400">SUPABASE_DB_URL</span>=postgresql://postgres:password@db.xyzproject.supabase.co:5432/postgres</div>
          <div className="pt-1 text-slate-500"># Database Tambahan (Redis, MySQL, MongoDB - Otomatis dipakai jika diisi, jika kosong fallback aman):</div>
          <div><span className="text-amber-400">REDIS_URL</span>=redis://default:password@host:port</div>
          <div><span className="text-amber-400">MYSQL_URL</span>=mysql://user:pass@host:3306/dbname</div>
          <div><span className="text-amber-400">MONGODB_URI</span>=mongodb+srv://user:pass@cluster.mongodb.net/dbname</div>
        </div>
      </div>

      {/* SQL Modal for Inspection & Manual Execution */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                  <Code className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Skema PostgreSQL Supabase Lengkap</h3>
                  <p className="text-xs text-slate-500">9 Tabel, Indeks, RLS & Data Awal Siap Pakai</p>
                </div>
              </div>
              <button 
                onClick={() => setShowSqlModal(false)}
                className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-slate-900 flex-1 overflow-y-auto">
              <pre className="text-xs font-mono text-emerald-400 whitespace-pre-wrap leading-relaxed">
                {sqlContent || 'Memuat skrip SQL...'}
              </pre>
            </div>

            <div className="p-4 border-t border-slate-100 bg-white flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-500 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Bisa dijalankan langsung di SQL Editor dashboard Supabase Anda.</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                >
                  {copiedSql ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedSql ? 'Tersalin!' : 'Salin Seluruh SQL'}</span>
                </button>
                <a
                  href="https://supabase.com/dashboard/project/_/sql"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <span>Buka Supabase SQL Editor</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatabaseTab;
