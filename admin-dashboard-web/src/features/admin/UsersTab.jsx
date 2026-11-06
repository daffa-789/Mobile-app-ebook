import { UserCog } from 'lucide-react';
import { layout, typography } from '@lib/styles';

/**
 * UsersTab — Sub-tab Manajemen Pengguna Admin Dashboard (§Fase 5 Roadmap).
 *
 * Menampilkan:
 * 1. Daftar pengguna (Mobile card untuk < sm, Desktop table untuk sm+)
 * 2. Informasi nama, email, metode login (Google vs Email/Password)
 * 3. Status role (admin vs user) dan langganan (Pro vs Reguler)
 * 4. Aksi pengalihan role (Jadikan user / Jadikan admin)
 * 5. Tampilan kosong (empty state) jika belum ada pengguna
 */
export const UsersTab = ({ users = [], onUpdateRole }) => {
  return (
    <section className="space-y-5">
      {/* Mobile User Cards (< sm) */}
      <div className="space-y-3 sm:hidden">
        {users.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl border border-cream-300 bg-cream-50 p-4 shadow-sm space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-full bg-brand-100 border border-brand-200 text-brand-800 flex items-center justify-center font-bold text-caption shrink-0">
                  {(item.name || 'U').slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-ink-900 truncate text-body">{item.name}</p>
                  <p className="text-caption text-ink-500 truncate">{item.email}</p>
                </div>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-caption font-bold ${
                  item.role === 'admin'
                    ? 'bg-brand-50 text-brand-800 border border-brand-200'
                    : 'bg-cream-200 text-ink-600'
                }`}
              >
                {item.role}
              </span>
            </div>
            <div className="flex items-center justify-between text-caption pt-2.5 border-t border-cream-200/80">
              <div className="flex items-center gap-2">
                {item.loginMethod === 'google' ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-semantic-infoLight px-2 py-0.5 text-micro font-bold text-semantic-info border border-semantic-info/30">
                    <span className="h-1.5 w-1.5 rounded-full bg-semantic-info" /> Google
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-cream-200 px-2 py-0.5 text-micro font-bold text-ink-600 border border-cream-300/60">
                    <span className="h-1.5 w-1.5 rounded-full bg-ink-400" /> Email
                  </span>
                )}
                <span
                  className={`text-caption font-bold ${item.isPro ? 'text-brand-800' : 'text-ink-500'}`}
                >
                  {item.isPro ? 'Pro' : 'Reguler'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onUpdateRole(item.id, item.role === 'admin' ? 'user' : 'admin')}
                className="inline-flex items-center gap-1 rounded-xl border border-cream-300 bg-cream-50 px-2.5 py-1.5 text-caption font-bold text-ink-700 hover:bg-cream-100 active:scale-95 transition cursor-pointer"
              >
                <UserCog className="h-3.5 w-3.5 text-brand-700" />
                {item.role === 'admin' ? 'Jadikan user' : 'Jadikan admin'}
              </button>
            </div>
          </div>
        ))}
        {users.length === 0 && (
          <div className="p-8 text-center text-ink-400 rounded-2xl bg-cream-50 border border-cream-300">
            <p className="font-bold text-ink-700">Belum ada pengguna</p>
            <p className={typography.helper}>
              Akun yang mendaftar atau masuk lewat Google akan muncul di daftar ini.
            </p>
          </div>
        )}
      </div>

      {/* Desktop Table (sm and up) */}
      <div className="hidden sm:block overflow-x-auto rounded-3xl border border-cream-300 bg-cream-50 shadow-sm">
        <table className="min-w-full text-left text-body">
          <thead className="bg-cream-100 text-caption uppercase tracking-wider text-ink-500">
            <tr>
              <th className="px-4 py-3">Pengguna</th>
              <th className="px-4 py-3">Metode</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody className={layout.divider}>
            {users.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3">
                  <p className="font-bold">{item.name}</p>
                  <p className="text-caption text-ink-500">{item.email}</p>
                </td>
                <td className="px-4 py-3">
                  {item.loginMethod === 'google' ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-semantic-infoLight px-2.5 py-1 text-caption font-bold text-semantic-info border border-semantic-info/30">
                      <span className="h-1.5 w-1.5 rounded-full bg-semantic-info" />
                      Google
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-cream-200 px-2.5 py-1 text-caption font-bold text-ink-500 border border-cream-300/60">
                      <span className="h-1.5 w-1.5 rounded-full bg-ink-300" />
                      Email
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-caption font-bold ${
                      item.role === 'admin'
                        ? 'bg-brand-50 text-brand-800 border border-brand-200'
                        : 'bg-cream-200 text-ink-500'
                    }`}
                  >
                    {item.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-caption font-bold ${item.isPro ? 'text-brand-800' : 'text-ink-500'}`}
                  >
                    {item.isPro ? 'Pro' : 'Reguler'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => onUpdateRole(item.id, item.role === 'admin' ? 'user' : 'admin')}
                    className="rounded-xl border border-cream-300 px-2.5 py-1.5 text-small font-bold text-ink-700 hover:bg-cream-100 cursor-pointer"
                  >
                    <UserCog className="mr-1 inline h-3.5 w-3.5 text-brand-700" />
                    {item.role === 'admin' ? 'Jadikan user' : 'Jadikan admin'}
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center">
                  <p className="font-bold text-ink-700">Belum ada pengguna</p>
                  <p className={typography.helper}>
                    Akun yang mendaftar atau masuk lewat Google akan muncul di daftar ini.
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
