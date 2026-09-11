import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings, 
  Key, 
  ShieldAlert, 
  FileText, 
  Check, 
  Volume2, 
  Globe, 
  Sparkles, 
  RefreshCw,
  Bell,
  BellRing,
  Smartphone,
  Laptop,
  Trash2,
  Play,
  Upload,
  AlertTriangle,
  Download,
  FileSpreadsheet,
  FileCode,
  Database,
  Archive,
  Server,
  Copy,
  ExternalLink,
  Terminal,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { StoreSettings, SoundPreset } from '../types';
import { SUPPORTED_LANGUAGES } from '../utils/languages';
import { SOUND_PRESETS_META, playNotificationSound, unlockAudio } from '../utils/audio';
import { 
  getNotificationPermissionStatus, 
  requestNotificationPermission, 
  sendScreenNotification 
} from '../utils/notifications';
import { dialogAlert, dialogConfirm, showToast } from '../utils/dialog';

interface SettingsTabProps {
  settings: StoreSettings;
  onSaveSettings: (newSettings: Partial<StoreSettings>) => Promise<void>;
  onBatchTranslateProducts?: () => Promise<void>;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  settings,
  onSaveSettings,
  onBatchTranslateProducts
}) => {
  const [apiKey, setApiKey] = useState(settings.nowpayments_api_key || '');
  const [ipnSecret, setIpnSecret] = useState(settings.nowpayments_ipn_secret || '');
  const [sandbox, setSandbox] = useState(settings.nowpayments_sandbox ?? true);
  const [welcomeText, setWelcomeText] = useState(settings.welcome_text || '');
  const [termsText, setTermsText] = useState(settings.terms_text || '');
  const [paymentGuideText, setPaymentGuideText] = useState(settings.payment_guide_text || '');
  const [orderGuideText, setOrderGuideText] = useState(settings.order_guide_text || '');

  const [welcomeTranslations, setWelcomeTranslations] = useState<Record<string, string>>(settings.welcome_translations || {});
  const [termsTranslations, setTermsTranslations] = useState<Record<string, string>>(settings.terms_translations || {});
  const [paymentGuideTranslations, setPaymentGuideTranslations] = useState<Record<string, string>>(settings.payment_guide_translations || {});
  const [orderGuideTranslations, setOrderGuideTranslations] = useState<Record<string, string>>(settings.order_guide_translations || {});
  
  // Custom Sound & Background Notification State
  const [soundPreset, setSoundPreset] = useState<SoundPreset>(settings.sound_preset || 'cash_register');
  const [soundVolume, setSoundVolume] = useState<number>(settings.sound_volume ?? 80);
  const [soundCustomUrl, setSoundCustomUrl] = useState<string>(settings.sound_custom_url || '');
  const [notifyOnNewOrder, setNotifyOnNewOrder] = useState<boolean>(settings.notify_on_new_order ?? true);
  const [notifyOnPaid, setNotifyOnPaid] = useState<boolean>(settings.notify_on_paid ?? true);
  const [notifyOnTxid, setNotifyOnTxid] = useState<boolean>(settings.notify_on_txid ?? true);
  const [autoPurgeCancelled, setAutoPurgeCancelled] = useState<boolean>(settings.auto_purge_cancelled ?? true);

  const [permissionStatus, setPermissionStatus] = useState<string>('default');
  const [isTestingNotif, setIsTestingNotif] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [purgeResult, setPurgeResult] = useState<string | null>(null);

  const [activeLang, setActiveLang] = useState<string>('id');
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isTranslatingProducts, setIsTranslatingProducts] = useState(false);
  const [singleTranslatingField, setSingleTranslatingField] = useState<string | null>(null);
  const [translateSuccessMsg, setTranslateSuccessMsg] = useState('');

  // Export Data & Local Backup State
  const [exportingDataset, setExportingDataset] = useState<string | null>(null);
  const [exportSuccessMsg, setExportSuccessMsg] = useState<string | null>(null);

  const handleExport = async (dataset: 'orders' | 'products' | 'stocks' | 'all', format: 'csv' | 'json') => {
    const exportKey = `${dataset}_${format}`;
    setExportingDataset(exportKey);
    setExportSuccessMsg(null);
    try {
      const res = await fetch(`/api/export/${dataset}?format=${format}`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || `Gagal mengekspor data ${dataset}`);
      }

      const blob = await res.blob();
      const disposition = res.headers.get('content-disposition');
      let filename = `${dataset}_backup_${new Date().toISOString().slice(0, 10)}.${format}`;
      if (disposition && disposition.indexOf('filename=') !== -1) {
        const match = disposition.match(/filename="?([^";]+)"?/);
        if (match && match[1]) filename = match[1];
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setExportSuccessMsg(`File ${filename} berhasil diunduh!`);
      showToast(`File ${filename} berhasil diunduh`);
      setTimeout(() => setExportSuccessMsg(null), 5000);
    } catch (err: any) {
      dialogAlert('Gagal mengekspor data: ' + err.message, 'Gagal Ekspor', 'error');
    } finally {
      setExportingDataset(null);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Supabase & Cloud Database Status
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [loadingDbStatus, setLoadingDbStatus] = useState(false);
  const [isInitializingTables, setIsInitializingTables] = useState(false);
  const [initTablesResult, setInitTablesResult] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);

  const fetchDbStatus = async () => {
    setLoadingDbStatus(true);
    try {
      const res = await fetch('/api/db/status');
      const json = await res.json();
      if (json.success) {
        setDbStatus(json.data);
      }
    } catch (e: any) {
      console.warn('Failed to load DB status:', e.message);
    } finally {
      setLoadingDbStatus(false);
    }
  };

  useEffect(() => {
    fetchDbStatus();
  }, []);

  const handleInitTables = async () => {
    setIsInitializingTables(true);
    setInitTablesResult(null);
    try {
      const res = await fetch('/api/db/init-tables', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setInitTablesResult('Tabel database & data awal berhasil diinisialisasi dan disinkronkan!');
        showToast('Database berhasil diinisialisasi');
        fetchDbStatus();
      } else {
        setInitTablesResult('Gagal inisialisasi: ' + (json.message || 'Error'));
      }
    } catch (err: any) {
      setInitTablesResult('Error: ' + err.message);
    } finally {
      setIsInitializingTables(false);
    }
  };

  const handleCopySchemaSql = async () => {
    try {
      const res = await fetch('/api/db/schema-sql');
      const sqlText = await res.text();
      await navigator.clipboard.writeText(sqlText);
      setCopiedSql(true);
      showToast('SQL Skema berhasil disalin ke clipboard');
      setTimeout(() => setCopiedSql(false), 3000);
    } catch (e) {
      dialogAlert('Gagal menyalin SQL skema', 'Gagal Salin', 'error');
    }
  };

  const handleCopyVercelEnv = () => {
    const envText = `# Vercel Environment Variables untuk Supabase & Admin
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
ADMIN_USERNAME=admin
ADMIN_PASSWORD=kucing123`;
    navigator.clipboard.writeText(envText);
    setCopiedEnv(true);
    showToast('Environment variables berhasil disalin');
    setTimeout(() => setCopiedEnv(false), 3000);
  };

  useEffect(() => {
    setApiKey(settings.nowpayments_api_key || '');
    setIpnSecret(settings.nowpayments_ipn_secret || '');
    setSandbox(settings.nowpayments_sandbox ?? true);
    setWelcomeText(settings.welcome_text || '');
    setTermsText(settings.terms_text || '');
    setPaymentGuideText(settings.payment_guide_text || '');
    setOrderGuideText(settings.order_guide_text || '');
    setWelcomeTranslations(settings.welcome_translations || {});
    setTermsTranslations(settings.terms_translations || {});
    setPaymentGuideTranslations(settings.payment_guide_translations || {});
    setOrderGuideTranslations(settings.order_guide_translations || {});
    setSoundPreset(settings.sound_preset || 'cash_register');
    setSoundVolume(settings.sound_volume ?? 80);
    setSoundCustomUrl(settings.sound_custom_url || '');
    setNotifyOnNewOrder(settings.notify_on_new_order ?? true);
    setNotifyOnPaid(settings.notify_on_paid ?? true);
    setNotifyOnTxid(settings.notify_on_txid ?? true);
    setAutoPurgeCancelled(settings.auto_purge_cancelled ?? true);

    if (typeof window !== 'undefined') {
      setPermissionStatus(getNotificationPermissionStatus());
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setIsSaved(false);
    try {
      const updatedWelcomeTrans = { ...welcomeTranslations, [activeLang]: welcomeText };
      const updatedTermsTrans = { ...termsTranslations, [activeLang]: termsText };
      const updatedPayTrans = { ...paymentGuideTranslations, [activeLang]: paymentGuideText };
      const updatedOrderTrans = { ...orderGuideTranslations, [activeLang]: orderGuideText };

      await onSaveSettings({
        nowpayments_api_key: apiKey.trim(),
        nowpayments_ipn_secret: ipnSecret.trim(),
        nowpayments_sandbox: sandbox,
        welcome_text: activeLang === 'id' ? welcomeText : (settings.welcome_text || welcomeText),
        terms_text: activeLang === 'id' ? termsText : (settings.terms_text || termsText),
        payment_guide_text: activeLang === 'id' ? paymentGuideText : (settings.payment_guide_text || paymentGuideText),
        order_guide_text: activeLang === 'id' ? orderGuideText : (settings.order_guide_text || orderGuideText),
        welcome_translations: updatedWelcomeTrans,
        terms_translations: updatedTermsTrans,
        payment_guide_translations: updatedPayTrans,
        order_guide_translations: updatedOrderTrans,
        sound_preset: soundPreset,
        sound_volume: soundVolume,
        sound_custom_url: soundCustomUrl.trim(),
        notify_on_new_order: notifyOnNewOrder,
        notify_on_paid: notifyOnPaid,
        notify_on_txid: notifyOnTxid,
        auto_purge_cancelled: autoPurgeCancelled
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectLanguage = (code: string) => {
    setWelcomeTranslations(prev => ({ ...prev, [activeLang]: welcomeText }));
    setTermsTranslations(prev => ({ ...prev, [activeLang]: termsText }));
    setPaymentGuideTranslations(prev => ({ ...prev, [activeLang]: paymentGuideText }));
    setOrderGuideTranslations(prev => ({ ...prev, [activeLang]: orderGuideText }));

    setActiveLang(code);
    if (code === 'id') {
      setWelcomeText(welcomeTranslations['id'] || settings.welcome_text || '');
      setTermsText(termsTranslations['id'] || settings.terms_text || '');
      setPaymentGuideText(paymentGuideTranslations['id'] || settings.payment_guide_text || '');
      setOrderGuideText(orderGuideTranslations['id'] || settings.order_guide_text || '');
    } else {
      setWelcomeText(welcomeTranslations[code] || '');
      setTermsText(termsTranslations[code] || '');
      setPaymentGuideText(paymentGuideTranslations[code] || '');
      setOrderGuideText(orderGuideTranslations[code] || '');
    }
  };

  const handleTranslateSingleField = async (field: 'welcome' | 'terms' | 'payment_guide' | 'order_guide') => {
    let sourceText = '';
    if (field === 'welcome') sourceText = welcomeText;
    else if (field === 'terms') sourceText = termsText;
    else if (field === 'payment_guide') sourceText = paymentGuideText;
    else if (field === 'order_guide') sourceText = orderGuideText;

    if (!sourceText) {
      dialogAlert('Teks belum diisi. Silakan tulis teks terlebih dahulu.', 'Perhatian', 'warning');
      return;
    }

    setSingleTranslatingField(field);
    try {
      const res = await fetch('/api/translate/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: sourceText,
          source_lang: activeLang
        })
      });
      const data = await res.json();
      if (data.success && data.translations) {
        if (field === 'welcome') setWelcomeTranslations(data.translations);
        else if (field === 'terms') setTermsTranslations(data.translations);
        else if (field === 'payment_guide') setPaymentGuideTranslations(data.translations);
        else if (field === 'order_guide') setOrderGuideTranslations(data.translations);

        showToast('Teks berhasil diterjemahkan ke 10 bahasa');
        setTranslateSuccessMsg(`Teks berhasil diterjemahkan ke 10 bahasa!`);
        setTimeout(() => setTranslateSuccessMsg(''), 4000);
      } else {
        dialogAlert('Gagal menerjemahkan: ' + (data.message || 'Terjadi kesalahan'), 'Gagal Terjemah', 'error');
      }
    } catch (err: any) {
      dialogAlert('Error translating text: ' + err.message, 'Gagal Terjemah', 'error');
    } finally {
      setSingleTranslatingField(null);
    }
  };

  const handleTranslateAllFields = async () => {
    setIsTranslating(true);
    try {
      const fields = [
        { field: 'welcome', text: welcomeText },
        { field: 'terms', text: termsText },
        { field: 'payment_guide', text: paymentGuideText },
        { field: 'order_guide', text: orderGuideText }
      ];

      for (const item of fields) {
        if (item.text.trim()) {
          const res = await fetch('/api/translate/text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: item.text, source_lang: activeLang })
          });
          const data = await res.json();
          if (data.success && data.translations) {
            if (item.field === 'welcome') setWelcomeTranslations(data.translations);
            else if (item.field === 'terms') setTermsTranslations(data.translations);
            else if (item.field === 'payment_guide') setPaymentGuideTranslations(data.translations);
            else if (item.field === 'order_guide') setOrderGuideTranslations(data.translations);
          }
        }
      }
      showToast('Seluruh teks toko berhasil diterjemahkan ke 10 bahasa');
      setTranslateSuccessMsg('Seluruh teks toko berhasil diterjemahkan ke 10 bahasa!');
      setTimeout(() => setTranslateSuccessMsg(''), 5000);
    } catch (err: any) {
      dialogAlert('Error batch translating: ' + err.message, 'Gagal Terjemah', 'error');
    } finally {
      setIsTranslating(false);
    }
  };

  // Sound Test Handler
  const handlePlaySoundPreview = (preset: SoundPreset) => {
    unlockAudio();
    playNotificationSound(preset, soundVolume, soundCustomUrl);
  };

  // Notification Permission Request
  const handleRequestPermission = async () => {
    try {
      const status = await requestNotificationPermission();
      setPermissionStatus(status);
      if (status === 'granted') {
        dialogAlert('Izin notifikasi berhasil diaktifkan! Notifikasi layar belakang sekarang siap bekerja di Android, iPhone, dan PC.', 'Notifikasi Aktif', 'success');
      } else if (status === 'denied') {
        dialogAlert('Izin notifikasi ditolak oleh browser. Silakan klik ikon gembok di bilah alamat browser untuk mengizinkan notifikasi.', 'Izin Ditolak', 'warning');
      }
    } catch (err: any) {
      dialogAlert('Gagal meminta izin: ' + err.message, 'Error Notifikasi', 'error');
    }
  };

  // Test Native Screen Banner Notification
  const handleTestScreenNotification = async () => {
    unlockAudio();
    setIsTestingNotif(true);
    try {
      if (permissionStatus !== 'granted') {
        const res = await requestNotificationPermission();
        setPermissionStatus(res);
        if (res !== 'granted') {
          dialogAlert('Silakan izinkan notifikasi terlebih dahulu agar banner dapat muncul di atas layar.', 'Izin Diperlukan', 'warning');
          return;
        }
      }

      await sendScreenNotification({
        title: '🔔 Test Notifikasi Layar Belakang Berhasil!',
        body: `Notifikasi sistem aktif. Suara: ${SOUND_PRESETS_META.find(p => p.id === soundPreset)?.name || 'Custom'} (${soundVolume}%). Siap pakai di Android, iOS & PC!`,
        soundPreset,
        soundVolume,
        customSoundUrl: soundCustomUrl,
        playSound: true
      });
    } finally {
      setIsTestingNotif(false);
    }
  };

  // Audio file upload handler (converts file to data URL)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('audio') && !file.name.endsWith('.mp3') && !file.name.endsWith('.wav')) {
      dialogAlert('Silakan pilih file audio berformat .mp3 atau .wav.', 'Format File', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setSoundCustomUrl(dataUrl);
      setSoundPreset('custom');
      unlockAudio();
      playNotificationSound('custom', soundVolume, dataUrl);
      showToast('File suara audio berhasil dimuat dan siap digunakan!');
    };
    reader.readAsDataURL(file);
  };

  // Manual purge cancelled orders
  const handlePurgeCancelledOrders = async () => {
    const confirmed = await dialogConfirm({
      title: 'Bersihkan Pesanan Dibatalkan',
      message: 'Apakah Anda yakin ingin menghapus semua pesanan yang dibatalkan dari database? Tindakan ini akan mengosongkan ruang penyimpanan.',
      confirmLabel: 'Ya, Bersihkan',
      cancelLabel: 'Batal',
      isDestructive: true
    });
    if (!confirmed) {
      return;
    }
    setIsPurging(true);
    setPurgeResult(null);
    try {
      const res = await fetch('/api/orders/purge-cancelled', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast(`Berhasil menghapus ${data.purged_count} pesanan dibatalkan`);
        setPurgeResult(`✅ Berhasil menghapus ${data.purged_count} pesanan yang tercancel dari database!`);
        setTimeout(() => setPurgeResult(null), 5000);
      } else {
        dialogAlert('Gagal membersihkan pesanan: ' + data.message, 'Gagal', 'error');
      }
    } catch (err: any) {
      dialogAlert('Error purge orders: ' + err.message, 'Error', 'error');
    } finally {
      setIsPurging(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            Pengaturan Sistem Toko, Notifikasi & Gateway
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Konfigurasi gateway NOWPayments, multibahasa otomatis, notifikasi layar belakang, dan manajemen penyimpanan.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ==================================================================== */}
        {/* NOTIFIKASI LAYAR BELAKANG & SUARA KUSTOM (ANDROID, IPHONE, PC) */}
        {/* ==================================================================== */}
        <div className="bg-white border border-blue-200/90 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                <BellRing className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  Notifikasi Layar Belakang & Suara Kustom
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full uppercase">
                    Siap Pakai
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Notifikasi banner di atas layar Android, iPhone (PWA iOS 16.4+), dan PC saat aplikasi ditutup/diminimalkan.
                </p>
              </div>
            </div>

            {/* Permission Indicator */}
            <div className="flex items-center gap-2">
              {permissionStatus === 'granted' ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Layar Belakang Aktif
                </div>
              ) : permissionStatus === 'denied' ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Notifikasi Diblokir di Browser
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleRequestPermission}
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all"
                >
                  <Bell className="w-3.5 h-3.5" />
                  Aktifkan Izin Notifikasi
                </button>
              )}

              <button
                type="button"
                onClick={handleTestScreenNotification}
                disabled={isTestingNotif}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all active:scale-[0.98]"
              >
                {isTestingNotif ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                🧪 Test Notifikasi Banner & Suara
              </button>
            </div>
          </div>

          {/* Platform Guide Chips */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5">
              <Smartphone className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <span className="text-xs font-bold text-slate-800 block">Android</span>
                <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                  Heads-up banner di atas layar, laci notifikasi & getaran getar otomatis.
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5">
              <Smartphone className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <span className="text-xs font-bold text-slate-800 block">iPhone (iOS 16.4+)</span>
                <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                  Tambahkan ke Home Screen (PWA Standalone) untuk notifikasi lock screen & banner.
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5">
              <Laptop className="w-5 h-5 text-purple-600 mt-0.5 shrink-0" />
              <div>
                <span className="text-xs font-bold text-slate-800 block">PC & Laptop</span>
                <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                  Windows Action Center & Mac Notification Center saat browser diminimalkan.
                </span>
              </div>
            </div>
          </div>

          {/* Preset Suara Kustom */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-blue-600" />
                Pilihan Suara Notifikasi (Pilih & Dengarkan Langsung):
              </label>
              <span className="text-xs text-slate-500">
                Volume: <b>{soundVolume}%</b>
              </span>
            </div>

            {/* Sound Preset Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {SOUND_PRESETS_META.map((preset) => {
                const isSelected = soundPreset === preset.id;
                return (
                  <div
                    key={preset.id}
                    onClick={() => {
                      setSoundPreset(preset.id);
                      handlePlaySoundPreview(preset.id);
                    }}
                    className={`cursor-pointer p-3 rounded-xl border transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-lg">{preset.icon}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSoundPreset(preset.id);
                            handlePlaySoundPreview(preset.id);
                          }}
                          title="Dengarkan suara"
                          className="px-2 py-0.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-[10px] font-bold text-blue-600 flex items-center gap-1 shadow-2xs"
                        >
                          <Play className="w-2.5 h-2.5" />
                          Tes
                        </button>
                      </div>
                      <span className="text-xs font-bold text-slate-900 block line-clamp-1">
                        {preset.name}
                      </span>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-tight">
                        {preset.desc}
                      </p>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[10px]">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isSelected ? 'bg-blue-600' : 'bg-slate-300'
                        }`}
                      />
                      <span className={isSelected ? 'font-bold text-blue-700' : 'text-slate-400'}>
                        {isSelected ? 'Terpilih' : 'Pilih Suara Ini'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Custom Sound URL / Upload Section */}
            {soundPreset === 'custom' && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 mt-3 animate-fadeIn">
                <label className="block text-xs font-bold text-slate-700">
                  URL Audio Kustom atau Upload File Sendiri (.mp3, .wav):
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={soundCustomUrl}
                    onChange={(e) => setSoundCustomUrl(e.target.value)}
                    placeholder="https://example.com/sound.mp3 atau pilih file di samping"
                    className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="audio/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs whitespace-nowrap"
                  >
                    <Upload className="w-3.5 h-3.5 text-blue-600" />
                    Pilih File Audio Lokal
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePlaySoundPreview('custom')}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Tes Audio Kustom
                  </button>
                </div>
              </div>
            )}

            {/* Volume Slider */}
            <div className="pt-2 flex items-center gap-4">
              <Volume2 className="w-4 h-4 text-slate-500" />
              <input
                type="range"
                min="0"
                max="100"
                value={soundVolume}
                onChange={(e) => setSoundVolume(Number(e.target.value))}
                className="w-full max-w-xs accent-blue-600 cursor-pointer"
              />
              <span className="text-xs font-mono font-bold text-slate-700 min-w-[40px]">
                {soundVolume}%
              </span>
            </div>
          </div>

          {/* Trigger Toggles */}
          <div className="pt-2 border-t border-slate-100 space-y-2.5">
            <span className="text-xs font-bold text-slate-800 block">
              Pemicu Notifikasi & Suara Otomatis:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyOnNewOrder}
                  onChange={(e) => setNotifyOnNewOrder(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                Bunyikan saat <b>Pesanan Baru</b> Masuk
              </label>

              <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyOnPaid}
                  onChange={(e) => setNotifyOnPaid(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                Bunyikan saat <b>Pembayaran Terverifikasi</b>
              </label>

              <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyOnTxid}
                  onChange={(e) => setNotifyOnTxid(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                Bunyikan saat Pembeli Kirim <b>TXID</b>
              </label>
            </div>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* MANAJEMEN PENYIMPANAN & PEMBERSIHAN OTOMATIS PESANAN BATAL */}
        {/* ==================================================================== */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Pembersihan Otomatis Pesanan Dibatalkan (Storage Cleanup)
                </h3>
                <p className="text-xs text-slate-500">
                  Mencegah database Firestore penuh dengan menghapus pesanan yang dibatalkan oleh pengguna atau admin.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handlePurgeCancelledOrders}
              disabled={isPurging}
              className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              {isPurging ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              🧹 Bersihkan Semua Pesanan Batal Sekarang
            </button>
          </div>

          {purgeResult && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold animate-fadeIn">
              {purgeResult}
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="auto-purge-toggle"
              checked={autoPurgeCancelled}
              onChange={(e) => setAutoPurgeCancelled(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="auto-purge-toggle" className="text-xs font-medium text-slate-700 cursor-pointer">
              <b>Otomatis hapus pesanan yang dibatalkan secara instan</b> saat pengguna klik "Batal" di bot atau admin klik "Tolak & Hapus" di panel.
            </label>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* MULTIBAHASA OTOMATIS & TEKS TOKO */}
        {/* ==================================================================== */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-slate-900 text-sm">
                Teks Bot Toko & Terjemahan Otomatis (10 Bahasa)
              </h3>
            </div>

            <div className="flex items-center gap-2">
              {onBatchTranslateProducts && (
                <button
                  type="button"
                  onClick={async () => {
                    setIsTranslatingProducts(true);
                    try {
                      await onBatchTranslateProducts();
                    } finally {
                      setIsTranslatingProducts(false);
                    }
                  }}
                  disabled={isTranslatingProducts}
                  className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {isTranslatingProducts ? 'Menerjemahkan Katalog...' : '✨ Terjemahkan Seluruh Katalog Produk'}
                </button>
              )}

              <button
                type="button"
                onClick={handleTranslateAllFields}
                disabled={isTranslating}
                className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all"
              >
                {isTranslating ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                {isTranslating ? 'Menerjemahkan Semua...' : '✨ Terjemahkan Semua Teks Toko'}
              </button>
            </div>
          </div>

          {translateSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium animate-fadeIn">
              {translateSuccessMsg}
            </div>
          )}

          {/* Language Selector Bar */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">
              Pilih Bahasa untuk Mengedit Teks:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleSelectLanguage(lang.code)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    activeLang === lang.code
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <span>{lang.flag}</span>
                  <span>{lang.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Welcome Text */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                Pesan Sambutan (/start) [{activeLang.toUpperCase()}]
              </label>
              <button
                type="button"
                onClick={() => handleTranslateSingleField('welcome')}
                disabled={singleTranslatingField === 'welcome'}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                {singleTranslatingField === 'welcome' ? 'Menerjemahkan...' : 'Auto Translate 10 Bahasa'}
              </button>
            </div>
            <textarea
              rows={3}
              value={welcomeText}
              onChange={(e) => setWelcomeText(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Selamat datang di Toko Akun Digital Resmi..."
            />
          </div>

          {/* Terms Text */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-blue-600" />
                Syarat, Ketentuan & Kebijakan Garansi [{activeLang.toUpperCase()}]
              </label>
              <button
                type="button"
                onClick={() => handleTranslateSingleField('terms')}
                disabled={singleTranslatingField === 'terms'}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                {singleTranslatingField === 'terms' ? 'Menerjemahkan...' : 'Auto Translate 10 Bahasa'}
              </button>
            </div>
            <textarea
              rows={3}
              value={termsText}
              onChange={(e) => setTermsText(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Kebijakan garansi akun 100% replace jika invalid dalam 24 jam..."
            />
          </div>

          {/* Payment Guide Text */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-blue-600" />
                Panduan Cara Bayar [{activeLang.toUpperCase()}]
              </label>
              <button
                type="button"
                onClick={() => handleTranslateSingleField('payment_guide')}
                disabled={singleTranslatingField === 'payment_guide'}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                {singleTranslatingField === 'payment_guide' ? 'Menerjemahkan...' : 'Auto Translate 10 Bahasa'}
              </button>
            </div>
            <textarea
              rows={3}
              value={paymentGuideText}
              onChange={(e) => setPaymentGuideText(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Panduan cara pembayaran manual dan otomatis..."
            />
          </div>

          {/* Order Guide Text */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                Panduan Menu 'Pesanan Saya' [{activeLang.toUpperCase()}]
              </label>
              <button
                type="button"
                onClick={() => handleTranslateSingleField('order_guide')}
                disabled={singleTranslatingField === 'order_guide'}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                {singleTranslatingField === 'order_guide' ? 'Menerjemahkan...' : 'Auto Translate 10 Bahasa'}
              </button>
            </div>
            <textarea
              rows={3}
              value={orderGuideText}
              onChange={(e) => setOrderGuideText(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Gunakan menu ini untuk melihat riwayat pembelian dan mengambil akun Anda..."
            />
          </div>
        </div>

        {/* ==================================================================== */}
        {/* GATEWAY NOWPAYMENTS */}
        {/* ==================================================================== */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Key className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-sm">Integrasi Kripto Otomatis (NOWPayments API)</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                NOWPayments API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Masukkan API Key dari dashboard NOWPayments"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                NOWPayments IPN Secret Key
              </label>
              <input
                type="password"
                value={ipnSecret}
                onChange={(e) => setIpnSecret(e.target.value)}
                placeholder="IPN Secret untuk verifikasi HMAC-SHA512"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="sandbox-toggle"
              checked={sandbox}
              onChange={(e) => setSandbox(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="sandbox-toggle" className="text-xs font-medium text-slate-700 cursor-pointer">
              Gunakan mode NOWPayments Sandbox (api-sandbox.nowpayments.io)
            </label>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* EXPORT DATA & LOCAL BACKUP */}
        {/* ==================================================================== */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-600" />
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Ekspor & Cadangkan Data Toko (Export Backup)</h3>
                <p className="text-[11px] text-slate-500">
                  Unduh data pesanan, katalog produk, dan inventaris stok akun ke format CSV atau JSON untuk arsip lokal.
                </p>
              </div>
            </div>
            {exportSuccessMsg && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-lg animate-fadeIn">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>{exportSuccessMsg}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* 1. Orders */}
            <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-xl flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                    Data Pesanan
                  </span>
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 bg-blue-100/60 text-blue-700 rounded">
                    Orders
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Daftar transaksi, user Telegram, metode bayar, TXID, status verifikasi, dan catatan.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleExport('orders', 'csv')}
                  disabled={exportingDataset !== null}
                  className="flex-1 py-2 px-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 shadow-2xs active:scale-[0.98] disabled:opacity-50"
                  title="Unduh format spreadsheet CSV"
                >
                  {exportingDataset === 'orders_csv' ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  ) : (
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                  )}
                  <span>CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExport('orders', 'json')}
                  disabled={exportingDataset !== null}
                  className="flex-1 py-2 px-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 shadow-2xs active:scale-[0.98] disabled:opacity-50"
                  title="Unduh format JSON mentah"
                >
                  {exportingDataset === 'orders_json' ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  ) : (
                    <FileCode className="w-3.5 h-3.5 text-slate-500" />
                  )}
                  <span>JSON</span>
                </button>
              </div>
            </div>

            {/* 2. Products */}
            <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-xl flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    Katalog Produk
                  </span>
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 bg-emerald-100/60 text-emerald-700 rounded">
                    Products
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Daftar judul produk, harga USD, kategori, dan deskripsi terjemahan multi-bahasa.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleExport('products', 'csv')}
                  disabled={exportingDataset !== null}
                  className="flex-1 py-2 px-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 shadow-2xs active:scale-[0.98] disabled:opacity-50"
                  title="Unduh format spreadsheet CSV"
                >
                  {exportingDataset === 'products_csv' ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  ) : (
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                  )}
                  <span>CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExport('products', 'json')}
                  disabled={exportingDataset !== null}
                  className="flex-1 py-2 px-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 shadow-2xs active:scale-[0.98] disabled:opacity-50"
                  title="Unduh format JSON mentah"
                >
                  {exportingDataset === 'products_json' ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  ) : (
                    <FileCode className="w-3.5 h-3.5 text-slate-500" />
                  )}
                  <span>JSON</span>
                </button>
              </div>
            </div>

            {/* 3. Stocks */}
            <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-xl flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-purple-600" />
                    Stok Akun
                  </span>
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 bg-purple-100/60 text-purple-700 rounded">
                    Stocks
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Inventaris data akun digital, status AVAILABLE atau SOLD, tanggal masuk, dan riwayat klaim.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleExport('stocks', 'csv')}
                  disabled={exportingDataset !== null}
                  className="flex-1 py-2 px-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 shadow-2xs active:scale-[0.98] disabled:opacity-50"
                  title="Unduh format spreadsheet CSV"
                >
                  {exportingDataset === 'stocks_csv' ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  ) : (
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                  )}
                  <span>CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExport('stocks', 'json')}
                  disabled={exportingDataset !== null}
                  className="flex-1 py-2 px-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 shadow-2xs active:scale-[0.98] disabled:opacity-50"
                  title="Unduh format JSON mentah"
                >
                  {exportingDataset === 'stocks_json' ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  ) : (
                    <FileCode className="w-3.5 h-3.5 text-slate-500" />
                  )}
                  <span>JSON</span>
                </button>
              </div>
            </div>

            {/* 4. Complete Store Backup (All in One) */}
            <div className="p-4 bg-blue-50/50 border border-blue-200/80 rounded-xl flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                    <Archive className="w-4 h-4 text-blue-600" />
                    Full Store Backup
                  </span>
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 bg-blue-200/80 text-blue-800 rounded">
                    All-in-One
                  </span>
                </div>
                <p className="text-[11px] text-blue-800/80 leading-relaxed">
                  Cadangkan seluruh database: Pesanan, Produk, Stok, Dompet Kripto, dan Pengaturan Toko.
                </p>
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => handleExport('all', 'json')}
                  disabled={exportingDataset !== null}
                  className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-xs active:scale-[0.98] disabled:opacity-50"
                  title="Unduh seluruh database toko dalam 1 file JSON"
                >
                  {exportingDataset === 'all_json' ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span>Unduh Backup Lengkap (JSON)</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 6. Cloud Database & Supabase Integration + Vercel Deployment */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
                <Database className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span>Database Cloud: Supabase & Firestore</span>
                  <span className="text-[10px] font-mono font-medium px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                    Hybrid Realtime
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Status koneksi database, otomatisasi pembuatan tabel, dan panduan deploy live Vercel.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={fetchDbStatus}
              disabled={loadingDbStatus}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all"
              title="Perbarui status database"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingDbStatus ? 'animate-spin' : ''}`} />
              <span>Cek Status</span>
            </button>
          </div>

          {/* Status Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Supabase Status Card */}
            <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${dbStatus?.supabase?.connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
                  <span className="text-xs font-bold text-slate-800">Supabase Database</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 font-bold uppercase rounded ${
                  dbStatus?.supabase?.connected 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {dbStatus?.supabase?.connected ? 'Terhubung' : 'Siap Diisi ENV'}
                </span>
              </div>
              <p className="text-[11px] text-slate-600">
                {dbStatus?.supabase?.message || 'Isi SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY di .env / Vercel.'}
              </p>
              <div className="text-[10px] font-mono text-slate-500 bg-white/90 p-2 rounded border border-slate-200/80">
                URL: {dbStatus?.supabase?.configured ? 'Terkonfigurasi di Environment' : 'Belum diisi di environment'}
              </div>
            </div>

            {/* Firestore Status Card */}
            <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-slate-800">Google Cloud Firestore</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 font-bold uppercase bg-emerald-100 text-emerald-800 rounded">
                  Aktif & Sinkron
                </span>
              </div>
              <p className="text-[11px] text-slate-600">
                Database primer cloud aktif: Produk, Stok, Pesanan, Bot Token, & Pengaturan selalu tersimpan permanen.
              </p>
              <div className="text-[10px] font-mono text-slate-500 bg-white/90 p-2 rounded border border-slate-200/80 flex items-center justify-between">
                <span>Total Data: {dbStatus?.counts ? `${dbStatus.counts.products} Produk | ${dbStatus.counts.orders} Pesanan` : 'Memuat...'}</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              </div>
            </div>
          </div>

          {/* Action Buttons: Auto-Create Tables & Copy SQL Schema */}
          <div className="p-4 bg-emerald-50/40 border border-emerald-200/70 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-emerald-600" />
                  Otomatisasi Tabel Database (Supabase & Firestore)
                </h4>
                <p className="text-[11px] text-emerald-800/80 mt-0.5">
                  Klik tombol di bawah agar tabel-tabel langsung otomatis terbuat dan terisi data default (Admin root, sampel produk, settings).
                </p>
              </div>
            </div>

            {initTablesResult && (
              <div className="p-2.5 bg-white border border-emerald-300 rounded-lg text-xs font-medium text-emerald-800 flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{initTablesResult}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleInitTables}
                disabled={isInitializingTables}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isInitializingTables ? 'animate-spin' : ''}`} />
                <span>{isInitializingTables ? 'Memproses Pembuatan Tabel...' : '⚡ Inisialisasi & Sinkronkan Tabel Database Sekarang'}</span>
              </button>

              <button
                type="button"
                onClick={handleCopySchemaSql}
                className="px-3 py-2 bg-white hover:bg-slate-50 border border-emerald-300 text-emerald-900 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5"
                title="Salin skema SQL lengkap untuk dijalankan di Supabase SQL Editor"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span>{copiedSql ? 'Tersalin!' : 'Salin SQL Skema Supabase (supabase_schema.sql)'}</span>
              </button>
            </div>
          </div>

          {/* Vercel Deployment Helper */}
          <div className="p-4 bg-slate-900 text-slate-100 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-blue-400" />
                <h4 className="text-xs font-bold text-white">Panduan Deploy Vercel (Langsung Terhubung Supabase)</h4>
              </div>
              <button
                type="button"
                onClick={handleCopyVercelEnv}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-all"
              >
                {copiedEnv ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span>{copiedEnv ? 'Tersalin ke Clipboard!' : 'Salin ENV Vercel'}</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed">
              Semua API login, katalog, pesanan, dan verifikasi pembayaran sudah disesuaikan agar bisa dideploy ke <b>Vercel</b> (serverless function) dan langsung terhubung ke Supabase & Firestore.
            </p>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-[10px] text-slate-300 space-y-1 overflow-x-auto">
              <div><span className="text-blue-400">SUPABASE_URL</span>=https://your-project.supabase.co</div>
              <div><span className="text-blue-400">SUPABASE_ANON_KEY</span>=eyJhbGciOi...</div>
              <div><span className="text-blue-400">SUPABASE_SERVICE_ROLE_KEY</span>=eyJhbGciOi...</div>
              <div><span className="text-emerald-400">ADMIN_USERNAME</span>=admin</div>
              <div><span className="text-emerald-400">ADMIN_PASSWORD</span>=kucing123</div>
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {isSaved && (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-semibold animate-fadeIn">
              <Check className="w-4 h-4" />
              Tersimpan di Google Cloud Firestore!
            </span>
          )}
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white rounded-xl text-xs font-semibold shadow-xs transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {isSaving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            {isSaving ? 'Menyimpan ke Database...' : 'Simpan Seluruh Pengaturan'}
          </button>
        </div>
      </form>
    </div>
  );
};
