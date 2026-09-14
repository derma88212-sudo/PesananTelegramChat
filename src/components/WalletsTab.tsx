import React, { useState } from 'react';
import { Plus, Trash2, Wallet, QrCode, Copy, Check, ExternalLink } from 'lucide-react';
import { CryptoWallet } from '../types';
import { dialogConfirm } from '../utils/dialog';

interface WalletsTabProps {
  wallets: CryptoWallet[];
  onAddWallet: (wallet: Partial<CryptoWallet>) => Promise<void>;
  onDeleteWallet: (id: string) => Promise<void>;
}

export const WalletsTab: React.FC<WalletsTabProps> = ({
  wallets,
  onAddWallet,
  onDeleteWallet
}) => {
  const [showAdd, setShowAdd] = useState(false);
  const [network, setNetwork] = useState('USDT (TRC-20)');
  const [address, setAddress] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (addr: string, id: string) => {
    navigator.clipboard.writeText(addr);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!network || !address) return;

    await onAddWallet({
      network,
      address: address.trim(),
      qr_url: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(address.trim())}`,
      is_active: true
    });

    setAddress('');
    setShowAdd(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Alamat Dompet Kripto Manual</h2>
          <p className="text-xs text-slate-500">
            Digunakan saat pembeli di bot memilih opsi transfer Kripto Manual (TRC-20, BEP-20, BTC, SOL)
          </p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all self-start"
        >
          <Plus className="w-4 h-4" />
          <span>{showAdd ? 'Tutup' : 'Tambah Alamat Wallet'}</span>
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleSubmit} className="bg-slate-50 border border-slate-200/90 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Konfigurasi Alamat Kripto Baru</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Jaringan Blockchain</label>
              <select
                value={network}
                onChange={(e) => setNetwork(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="USDT (TRC-20)">USDT (TRC-20 Tron)</option>
                <option value="USDT (BEP-20)">USDT (BEP-20 BNB Chain)</option>
                <option value="Bitcoin (BTC)">Bitcoin (BTC)</option>
                <option value="Solana (SOL)">Solana (SOL / USDT)</option>
                <option value="Ethereum (ERC-20)">Ethereum (ERC-20)</option>
                <option value="TON (The Open Network)">TON (The Open Network)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Alamat Wallet Publik</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="TXq7... atau 0x71... atau bc1q..."
                required
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
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
              Simpan ke Firestore
            </button>
          </div>
        </form>
      )}

      {/* Wallets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {wallets.map((wallet) => (
          <div
            key={wallet.wallet_id}
            className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex items-center gap-4 hover:border-slate-300 transition-all"
          >
            <div className="w-22 h-22 shrink-0 bg-white border border-slate-200 rounded-xl p-1.5 flex items-center justify-center">
              <img
                src={wallet.qr_url}
                alt="QR Code"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="font-bold text-sm text-slate-900">{wallet.network}</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Aktif
                </span>
              </div>

              <div className="flex items-center gap-1.5 mt-2 bg-slate-50 border border-slate-200/80 rounded-xl p-2">
                <span className="font-mono text-xs text-slate-700 truncate select-all">
                  {wallet.address}
                </span>
                <button
                  onClick={() => handleCopy(wallet.address, wallet.wallet_id)}
                  className="text-slate-400 hover:text-slate-700 shrink-0 p-1"
                  title="Salin Alamat"
                >
                  {copiedId === wallet.wallet_id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="mt-3 flex justify-end">
                <button
                  onClick={async () => {
                    const confirmed = await dialogConfirm({
                      title: 'Konfirmasi Hapus Wallet',
                      message: `Apakah Anda yakin ingin menghapus wallet ${wallet.network}?`,
                      confirmLabel: 'Ya, Hapus',
                      cancelLabel: 'Batal',
                      isDestructive: true
                    });
                    if (confirmed) onDeleteWallet(wallet.wallet_id);
                  }}
                  className="text-xs text-rose-600 hover:text-rose-700 font-medium inline-flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Hapus</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
