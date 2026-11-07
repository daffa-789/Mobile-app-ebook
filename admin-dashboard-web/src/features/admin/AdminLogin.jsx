import React, { useState } from 'react';
import { useApp } from '@context/AppContext';
import { apiJsonSend } from '@lib/api';
import { toast } from 'sonner';
import {
  Shield,
  Lock,
  Mail,
  AlertCircle,
  ArrowRight,
  Loader2,
  LogOut,
  BookOpenCheck,
} from 'lucide-react';

export function AdminLogin() {
  const { user, isLoggedIn, login, logout } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Jika sudah login tapi role-nya bukan admin
  if (isLoggedIn && user?.role !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream-50 p-4 font-sans">
        <div className="w-full max-w-md rounded-3xl border border-cream-200 bg-ui-card p-8 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-300/25 text-gold-700 ring-1 ring-gold-400/40">
            <AlertCircle className="h-7 w-7" />
          </div>
          <h2 className="mb-2 font-serif text-xl font-bold text-brand-900">Akses Terbatas</h2>
          <p className="mb-6 text-sm leading-relaxed text-ink-600">
            Akun Anda (<strong className="text-ink-800">{user?.email || 'Pengguna'}</strong>) saat
            ini berstatus peran{' '}
            <span className="rounded border border-cream-300 bg-cream-100 px-2 py-0.5 text-xs font-semibold uppercase text-brand-700">
              {user?.role || 'user'}
            </span>
            . Panel ini hanya dapat diakses oleh administrator terotorisasi.
          </p>
          <button
            type="button"
            onClick={logout}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-900 px-4 py-3 text-sm font-semibold text-cream-50 shadow-sm transition hover:bg-brand-800 cursor-pointer"
          >
            <LogOut className="h-4 w-4" /> Keluar & Ganti Akun Admin
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
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
    } catch (error) {
      const message = error?.message || 'Gagal masuk. Periksa kembali email dan kata sandi Anda.';
      setErrorMessage(message);
      toast.error(message);
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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 p-4 font-sans sm:p-6">
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-gold-400/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-brand-500/20 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-cream-200/60 bg-ui-card shadow-2xl">
        <div className="relative border-b border-gold-400/20 bg-gradient-to-r from-brand-900 via-brand-800 to-brand-900 px-7 py-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 text-brand-950 shadow-lg">
            <BookOpenCheck className="h-6 w-6" strokeWidth={2.2} />
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-gold-400/40 bg-gold-400/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-gold-300">
            <Shield className="h-3.5 w-3.5" />
            Portal Administrator
          </div>
          <h1 className="mt-4 font-serif text-2xl font-bold tracking-tight text-cream-50">
            Wahidiyah Book
          </h1>
          <p className="mt-1 text-xs text-cream-200/80">
            Kelola buku, pengguna, agenda, dan analitik perpustakaan digital
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-7 py-7">
          {errorMessage && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-xl border border-semantic-danger/30 bg-semantic-dangerLight p-3.5 text-xs text-semantic-danger"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="leading-relaxed">{errorMessage}</div>
            </div>
          )}

          <div>
            <label
              htmlFor="admin-email"
              className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-700"
            >
              Email Administrator
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <input
                id="admin-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@wahidiyah.com"
                className="w-full rounded-xl border border-cream-300 bg-cream-50 py-2.5 pl-10 pr-4 text-sm text-ink-900 outline-none transition placeholder:text-ink-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-200"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="admin-password"
              className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-700"
            >
              Kata Sandi
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-xl border border-cream-300 bg-cream-50 py-2.5 pl-10 pr-4 text-sm text-ink-900 outline-none transition placeholder:text-ink-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-200"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-900 px-4 py-3 text-sm font-bold text-cream-50 shadow-md transition hover:bg-brand-800 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-gold-300" />
                <span>Memverifikasi Akses...</span>
              </>
            ) : (
              <>
                <span>Masuk ke Dashboard</span>
                <ArrowRight className="h-4 w-4 text-gold-300" />
              </>
            )}
          </button>

          <div className="border-t border-cream-200/80 pt-4 text-center">
            <button
              type="button"
              onClick={fillSeededAdmin}
              className="text-xs font-semibold text-brand-700 underline-offset-2 transition hover:text-brand-900 hover:underline cursor-pointer"
            >
              Isi otomatis kredensial admin bawaan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
