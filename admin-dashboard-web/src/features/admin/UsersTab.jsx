import { useMemo, useState } from 'react';
import { Search, UserCog, Users, X } from 'lucide-react';
import { layout, typography } from '@lib/styles';

const FILTERS = [
  { id: 'semua', label: 'Semua' },
  { id: 'admin', label: 'Admin' },
  { id: 'pro', label: 'Pro' },
  { id: 'reguler', label: 'Reguler' },
];

/**
 * UsersTab — Direktori pengguna dengan pencarian & filter peran/langganan.
 * Aksi perubahan role tetap didelegasikan ke onUpdateRole dari App.jsx.
 */
export const UsersTab = ({ users = [], onUpdateRole }) => {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('semua');

  const filteredUsers = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return users.filter((item) => {
      const matchesQuery =
        !needle ||
        String(item.name || '')
          .toLowerCase()
          .includes(needle) ||
        String(item.email || '')
          .toLowerCase()
          .includes(needle);
      const matchesFilter =
        filter === 'semua' ||
        (filter === 'admin'
          ? item.role === 'admin'
          : filter === 'pro'
            ? Boolean(item.isPro)
            : item.role !== 'admin' && !item.isPro);
      return matchesQuery && matchesFilter;
    });
  }, [users, query, filter]);

  const roleBadge = (role) =>
    role === 'admin'
      ? 'bg-brand-50 text-brand-800 border border-brand-200'
      : 'bg-cream-200 text-ink-600 border border-cream-300/60';

  const methodBadge = (method) =>
    method === 'google'
      ? 'bg-semantic-infoLight text-semantic-info border border-semantic-info/30'
      : 'bg-cream-200 text-ink-600 border border-cream-300/60';

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 rounded-2xl border border-cream-200 bg-ui-card p-4 shadow-[0_1px_2px_rgba(20,18,16,0.04)] lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari nama atau email…"
              aria-label="Cari pengguna"
              className="w-full rounded-xl border border-cream-300 bg-cream-50 py-2.5 pl-9 pr-9 text-sm text-ink-800 outline-none transition placeholder:text-ink-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-200"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Hapus pencarian"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-ink-400 hover:bg-cream-200 hover:text-ink-700 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div
            className="flex flex-wrap items-center gap-1.5"
            role="group"
            aria-label="Filter pengguna"
          >
            {FILTERS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setFilter(option.id)}
                className={`rounded-xl px-3 py-2 text-xs font-bold transition cursor-pointer ${
                  filter === option.id
                    ? 'bg-brand-700 text-cream-50 shadow-sm'
                    : 'border border-cream-300 bg-cream-50 text-ink-600 hover:bg-cream-100'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-ink-400">
          <Users className="h-3.5 w-3.5" />
          {filteredUsers.length} dari {users.length} pengguna
        </span>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 sm:hidden">
        {filteredUsers.map((item) => (
          <div
            key={item.id}
            className="space-y-3 rounded-2xl border border-cream-200 bg-ui-card p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-800 ring-1 ring-brand-200">
                  {(item.name || 'U').slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-ink-900">{item.name}</p>
                  <p className="truncate text-xs text-ink-500">{item.email}</p>
                </div>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${roleBadge(item.role)}`}
              >
                {item.role}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 border-t border-cream-200/80 pt-2.5 text-xs">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${methodBadge(item.loginMethod)}`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {item.loginMethod === 'google' ? 'Google' : 'Email'}
                </span>
                <span className={`font-bold ${item.isPro ? 'text-brand-800' : 'text-ink-500'}`}>
                  {item.isPro ? 'Pro' : 'Reguler'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onUpdateRole(item.id, item.role === 'admin' ? 'user' : 'admin')}
                className="inline-flex items-center gap-1 rounded-xl border border-cream-300 bg-cream-50 px-2.5 py-1.5 text-xs font-bold text-ink-700 transition hover:bg-cream-100 cursor-pointer"
              >
                <UserCog className="h-3.5 w-3.5 text-brand-700" />
                {item.role === 'admin' ? 'Jadikan user' : 'Jadikan admin'}
              </button>
            </div>
          </div>
        ))}
        {filteredUsers.length === 0 && (
          <div className="rounded-2xl border border-cream-200 bg-ui-card p-8 text-center">
            <p className="font-bold text-ink-700">Tidak ada pengguna yang cocok</p>
            <p className={typography.helper}>Ubah kata kunci atau filter untuk melihat hasil.</p>
          </div>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-2xl border border-cream-200 bg-ui-card shadow-sm sm:block">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-cream-100 text-xs uppercase tracking-wider text-ink-500">
            <tr>
              <th className="px-4 py-3">Pengguna</th>
              <th className="px-4 py-3">Metode</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody className={layout.divider}>
            {filteredUsers.map((item) => (
              <tr key={item.id} className="transition hover:bg-cream-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[11px] font-bold text-brand-800">
                      {(item.name || 'U').slice(0, 2).toUpperCase()}
                    </span>
                    <div>
                      <p className="font-bold">{item.name}</p>
                      <p className="text-xs text-ink-500">{item.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${methodBadge(item.loginMethod)}`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {item.loginMethod === 'google' ? 'Google' : 'Email'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${roleBadge(item.role)}`}
                  >
                    {item.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs font-bold ${item.isPro ? 'text-brand-800' : 'text-ink-500'}`}
                  >
                    {item.isPro ? 'Pro' : 'Reguler'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => onUpdateRole(item.id, item.role === 'admin' ? 'user' : 'admin')}
                    className="rounded-xl border border-cream-300 bg-cream-50 px-2.5 py-1.5 text-xs font-bold text-ink-700 transition hover:bg-cream-100 cursor-pointer"
                  >
                    <UserCog className="mr-1 inline h-3.5 w-3.5 text-brand-700" />
                    {item.role === 'admin' ? 'Jadikan user' : 'Jadikan admin'}
                  </button>
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center">
                  <p className="font-bold text-ink-700">Tidak ada pengguna yang cocok</p>
                  <p className={typography.helper}>
                    Ubah kata kunci atau filter untuk melihat hasil.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};
