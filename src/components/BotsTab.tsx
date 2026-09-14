import React, { useState } from 'react';
import { Bot, Play, Square, Trash2, Plus, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { BotTokenRecord } from '../types';
import { dialogConfirm } from '../utils/dialog';

interface BotsTabProps {
  bots: BotTokenRecord[];
  onAddBot: (name: string, token: string) => Promise<void>;
  onLaunchBot: (id: string) => Promise<void>;
  onStopBot: (id: string) => Promise<void>;
  onDeleteBot: (id: string) => Promise<void>;
  refreshBots: () => void;
}

export const BotsTab: React.FC<BotsTabProps> = ({
  bots,
  onAddBot,
  onLaunchBot,
  onStopBot,
  onDeleteBot,
  refreshBots
}) => {
  const [botName, setBotName] = useState('');
  const [botToken, setBotToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!botToken.trim()) return;
    setIsSubmitting(true);
    try {
      await onAddBot(botName.trim() || 'Telegram Shop Bot', botToken.trim());
      setBotName('');
      setBotToken('');
      refreshBots();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLaunch = async (id: string) => {
    setActionId(id);
    try {
      await onLaunchBot(id);
      refreshBots();
    } finally {
      setActionId(null);
    }
  };

  const handleStop = async (id: string) => {
    setActionId(id);
    try {
      await onStopBot(id);
      refreshBots();
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Multi-Bot Telegram Engine</h2>
          <p className="text-xs text-slate-500">
            Node.js Telegram long-polling engine. Tambahkan token dari @BotFather untuk menjalankan bot jualan secara real-time.
          </p>
        </div>
        <button
          onClick={refreshBots}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold self-start"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Status</span>
        </button>
      </div>

      {/* Add Bot Form */}
      <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-5 shadow-xs">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
          Daftarkan Token Bot Telegram Baru
        </h3>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={botName}
            onChange={(e) => setBotName(e.target.value)}
            placeholder="Nama Bot (misal: @ChatGPTShopBot)"
            className="sm:w-1/3 px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            value={botToken}
            onChange={(e) => setBotToken(e.target.value)}
            placeholder="Token BotFather (contoh: 123456789:AAH...)"
            required
            className="flex-1 px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold whitespace-nowrap shadow-xs transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Menghubungkan...' : 'Simpan & Start Polling'}
          </button>
        </form>
      </div>

      {/* Bots List */}
      <div className="space-y-3">
        {bots.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-400 space-y-2">
            <Bot className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-700 text-sm">Belum Ada Bot Telegram Yang Didaftarkan</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Daftarkan token dari @BotFather di atas untuk mulai menerima transaksi langsung dari pengguna Telegram, atau gunakan <b>Simulator Bot Telegram</b> di bar atas untuk mencoba flow toko sekarang.
            </p>
          </div>
        ) : (
          bots.map((b) => {
            const botAny = b as any;
            const isOnline = Boolean(
              b.status === 'online' ||
              b.status === 'running' ||
              b.status === 'active' ||
              b.status === 'connected' ||
              botAny.running ||
              botAny.is_running ||
              (b.is_active !== false && botAny.connected !== false)
            );

            return (
              <div
                key={b.token_id || botAny.id}
                className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                      isOnline ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    <Bot className="w-5 h-5" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{b.bot_name || botAny.name}</span>
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isOnline
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {isOnline ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Polling Online (Terkoneksi)
                          </>
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            Offline (Terputus)
                          </>
                        )}
                      </span>
                    </div>

                    <p className="font-mono text-xs text-slate-400 mt-0.5 truncate max-w-xs sm:max-w-md">
                      {b.bot_token && b.bot_token.length > 15
                        ? `${b.bot_token.slice(0, 10)}...${b.bot_token.slice(-6)}`
                        : b.bot_token || '-'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {isOnline ? (
                    <button
                      disabled={actionId === (b.token_id || botAny.id)}
                      onClick={() => handleStop(b.token_id || botAny.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                      title="Hentikan sementara bot polling ini"
                    >
                      <Square className="w-3.5 h-3.5" />
                      <span>Stop Polling</span>
                    </button>
                  ) : (
                    <button
                      disabled={actionId === (b.token_id || botAny.id)}
                      onClick={() => handleLaunch(b.token_id || botAny.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
                      title="Nyalakan long-polling Telegram bot ini"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Start Polling</span>
                    </button>
                  )}

                  <button
                    onClick={async () => {
                      const confirmed = await dialogConfirm({
                        title: 'Konfirmasi Hapus Bot',
                        message: `Apakah Anda yakin ingin menghapus token bot "${b.bot_name || botAny.name}"?`,
                        confirmLabel: 'Ya, Hapus',
                        cancelLabel: 'Batal',
                        isDestructive: true
                      });
                      if (confirmed) onDeleteBot(b.token_id || botAny.id);
                    }}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    title="Hapus Token"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
