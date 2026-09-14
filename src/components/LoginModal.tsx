import React, { useState } from 'react';
import { ShieldCheck, Lock, User, Eye, EyeOff, Bot } from 'lucide-react';
import { AdminUser } from '../types';

interface LoginModalProps {
  // Accept multiple prop names so the panel works regardless of caller wiring.
  onSuccess?: (user: AdminUser) => void;
  onLoginSuccess?: (user: AdminUser) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onSuccess, onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Send the login request with a timeout + automatic retries so a transient
  // network glitch never blocks the admin from entering the dashboard.
  const requestLogin = async (): Promise<any> => {
    const attempts = 3;
    let lastErr: any = null;

    for (let i = 0; i < attempts; i++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 12000);
        let res: Response;
        try {
          res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
            signal: controller.signal
          });
        } finally {
          clearTimeout(timeout);
        }

        // Some hosts (e.g. a serverless 404/500) may return an HTML error page.
        // Parse defensively so we never throw on non-JSON responses.
        const raw = await res.text();
        try {
          return JSON.parse(raw);
        } catch {
          return { success: false, message: 'Respons server tidak valid. Mencoba ulang...' };
        }
      } catch (err: any) {
        lastErr = err;
        if (i < attempts - 1) await new Promise((r) => setTimeout(r, 800 * (i + 1)));
      }
    }
    throw lastErr || new Error('Network error');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await requestLogin();
      if (data && data.success && data.user) {
        sessionStorage.setItem('admin_user', JSON.stringify(data.user));
        const notify = onSuccess || onLoginSuccess;
        if (typeof notify === 'function') notify(data.user);
        return;
      }
      // Server responded but the credentials were rejected.
      setError(data?.message || 'Username atau password yang Anda masukkan salah. Silakan coba lagi.');
    } catch (err: any) {
      setError('Tidak dapat menghubungi server. Sistem akan mencoba kembali â€” silakan tekan tombol masuk sekali lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
      <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-3xl shadow-2xl p-8 sm:p-10 relative overflow-hidden">
        {/* Top subtle decorative gradient bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500" />

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-50 border border-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xs">
            <Bot className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Admin & Management Login</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Enterprise Multi-Bot & Universal Commerce Panel</p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Username / ID Admin
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all shadow-xs"
                placeholder="Masukkan username Anda..."
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-10 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all shadow-xs"
                placeholder="Masukkan password Anda..."
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white rounded-xl font-semibold shadow-md shadow-blue-600/15 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Masuk ke Dashboard</span>
              </>
            )}
          </button>

        </form>
      </div>
    </div>
  );
};
