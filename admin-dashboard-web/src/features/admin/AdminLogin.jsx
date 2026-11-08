import React, { useState } from 'react';
import { useApp } from '@context/AppContext';
import { apiJsonSend } from '@lib/api';
import { toast } from 'sonner';

/**
 * AdminLogin — Halaman masuk panel admin yang sengaja dibuat datar dan tenang:
 * tanpa ikon, tanpa gradien/glow, tanpa badge, dan tanpa kalimat promosi.
 */
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
        <div className="w-full max-w-sm rounded-2xl border border-cream-200 bg-ui-card p-8 text-center">
          <h2 className="font-serif text-lg font-bold text-ink-900">Akses Terbatas</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-600">
            Akun {user?.email || 'ini'} tidak memiliki hak administrator.
          </p>
          <button
            type="button"
            onClick={logout}
            className="mt-6 w-full rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-cream-50 transition hover:bg-brand-800 cursor-pointer"
          >
            Keluar
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Isi email dan kata sandi.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiJsonSend('/api/auth/login', {
        email: email.trim(),
        password,
      });

      if (!response.user || response.user.role !== 'admin') {
        throw new Error('Akses ditolak: akun ini bukan administrator.');
      }

      login(response.user, response.token);
      toast.success(`Selamat datang, ${response.user.name || response.user.email}`);
    } catch (error) {
      const message = error?.message || 'Gagal masuk. Periksa email dan kata sandi.';
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream-50 p-4 font-sans">
      <div className="w-full max-w-sm rounded-2xl border border-cream-200 bg-ui-card p-8">
        <h1 className="font-serif text-xl font-bold text-ink-900">Mobile-app-ebook</h1>
        <p className="mt-1 text-sm text-ink-500">Panel admin</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {errorMessage && (
            <p role="alert" className="text-xs leading-relaxed text-semantic-danger">
              {errorMessage}
            </p>
          )}

          <div>
            <label
              htmlFor="admin-email"
              className="mb-1.5 block text-xs font-semibold text-ink-700"
            >
              Email
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@wahidiyah.com"
              className="w-full rounded-lg border border-cream-300 bg-cream-50 px-3 py-2.5 text-sm text-ink-900 outline-none transition placeholder:text-ink-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-200"
            />
          </div>

          <div>
            <label
              htmlFor="admin-password"
              className="mb-1.5 block text-xs font-semibold text-ink-700"
            >
              Kata sandi
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-cream-300 bg-cream-50 px-3 py-2.5 text-sm text-ink-900 outline-none transition placeholder:text-ink-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-200"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-cream-50 transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
          >
            {isLoading ? 'Memeriksa…' : 'Masuk'}
          </button>
        </form>
      </div>
    </div>
  );
}
