import React, { useState } from 'react';
import { useApp } from '@context/AppContext';
import { apiJsonSend } from '@lib/api';
import { toast } from 'sonner';
import { Shield, Lock, Mail, AlertCircle, ArrowRight, Loader2, LogOut } from 'lucide-react';

export function AdminLogin() {
  const { user, isLoggedIn, login, logout } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Jika sudah login tapi role-nya bukan admin
  if (isLoggedIn && user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-cream-200 shadow-xl p-8 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-serif font-bold text-brand-900 mb-2">Akses Terbatas</h2>
          <p className="text-sm text-ink-600 mb-6 leading-relaxed">
            Akun Anda (<strong className="text-ink-800">{user?.email || 'Pengguna'}</strong>) saat
            ini berstatus peran{' '}
            <span className="font-semibold text-brand-700 uppercase text-xs px-2 py-0.5 bg-cream-100 rounded border border-cream-300">
              {user?.role || 'user'}
            </span>
            . Panel ini hanya dapat diakses oleh administrator terotorisasi.
          </p>
          <button
            type="button"
            onClick={logout}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-brand-900 hover:bg-brand-800 text-white font-medium text-sm transition shadow-sm cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Keluar & Ganti Akun Admin
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Silakan isi email dan kata sandi.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiJsonSend('/api/auth/login', {
        email: email.trim(),
        password,
      });

      if (!response.user || response.user.role !== 'admin') {
        throw new Error('Akses ditolak: Akun ini tidak memiliki hak akses administrator.');
      }

      login(response.user, response.token);
      toast.success(`Selamat datang, ${response.user.name || response.user.email}`);
    } catch (err) {
      const msg = err?.message || 'Gagal masuk. Periksa kembali email dan kata sandi Anda.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const fillSeededAdmin = () => {
    setEmail('admin@wahidiyah.com');
    setPassword('AdminWahidiyah2026!');
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-cream-200/40 overflow-hidden">
        {/* Header Kartu */}
        <div className="bg-brand-900/90 text-white p-7 text-center border-b border-brand-800/80 relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/20 border border-gold-400/40 text-gold-300 text-xs font-semibold mb-3">
            <Shield className="w-3.5 h-3.5 text-gold-400" />
            <span>PORTAL ADMINISTRATOR</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-cream-50 tracking-tight">
            Wahidiyah Book
          </h1>
          <p className="text-xs text-cream-200 mt-1">
            Masuk untuk mengelola buku, pengguna, agenda, dan analitik
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-7 space-y-5">
          {errorMessage && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5 animate-in fade-in duration-200"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <div className="leading-relaxed">{errorMessage}</div>
            </div>
          )}

          <div>
            <label
              htmlFor="admin-email"
              className="block text-xs font-semibold text-ink-700 mb-1.5 uppercase tracking-wider"
            >
              Email Administrator
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-ink-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="admin-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@wahidiyah.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-cream-300 focus:border-brand-600 focus:ring-2 focus:ring-brand-200 text-sm text-ink-900 placeholder:text-ink-300 outline-none transition"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="admin-password"
              className="block text-xs font-semibold text-ink-700 mb-1.5 uppercase tracking-wider"
            >
              Kata Sandi
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-ink-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-cream-300 focus:border-brand-600 focus:ring-2 focus:ring-brand-200 text-sm text-ink-900 placeholder:text-ink-300 outline-none transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-brand-900 hover:bg-brand-800 active:bg-brand-950 text-white font-semibold text-sm transition shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-gold-400" />
                <span>Memverifikasi Akses...</span>
              </>
            ) : (
              <>
                <span>Masuk ke Dashboard</span>
                <ArrowRight className="w-4 h-4 text-gold-400" />
              </>
            )}
          </button>

          {/* Seeded Admin Hint Button */}
          <div className="pt-2 border-t border-cream-200/80 text-center">
            <button
              type="button"
              onClick={fillSeededAdmin}
              className="text-xs text-brand-700 hover:text-brand-900 font-medium underline-offset-2 hover:underline cursor-pointer transition"
            >
              Isi otomatis kredensial admin bawaan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
