import { useMemo } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { BookOpen, FileSpreadsheet, ShieldCheck, Users } from 'lucide-react';
import { TxStatusBadge } from './TxStatusBadge';
import { formatWIB } from '@lib/date';
import { formatRupiah } from '@lib/formatUtils';
import { layout, typography, surfaces } from '@lib/styles';
import { DEFAULT_PLAN } from '@lib/plans';

const formatCurrency = formatRupiah;

/**
 * OverviewTab — Sub-tab Ringkasan / Overview Admin Dashboard (§Fase 5 Roadmap).
 *
 * Menampilkan:
 * 1. Tombol Ekspor Laporan Lengkap (.xlsx)
 * 2. Tiga kartu KPI (Total Pengguna, Koleksi Aktif, Langganan Aktif)
 * 3. Grafik Donut Status Langganan (Pro vs Reguler via Recharts)
 * 4. Kartu Pendapatan Tervalidasi
 * 5. Riwayat 10 Transaksi Pembayaran Terakhir (responsif: Card pada mobile, Table pada desktop)
 */
export const OverviewTab = ({ stats, books = [], users = [], transactions = [], onExportFull }) => {
  const subscriptionShare = useMemo(() => {
    const pro = users.filter((item) => Boolean(item.isPro)).length;
    const regular = Math.max(users.length - pro, 0);
    return [
      { name: 'Pro', value: pro, color: '#14523A' },
      { name: 'Reguler', value: regular, color: '#B9DBC9' },
    ].filter((item) => item.value > 0);
  }, [users]);

  const kpis = [
    {
      label: 'Total pengguna',
      value: stats?.totalUsers ?? 0,
      icon: Users,
      tone: 'text-ink-700 bg-cream-100 border-cream-200',
    },
    {
      label: 'Koleksi aktif',
      value: stats?.totalBooks ?? books.length,
      icon: BookOpen,
      tone: 'text-brand-700 bg-brand-50 border-brand-200',
    },
    {
      label: 'Langganan aktif',
      value: stats?.activeSubscriptions ?? 0,
      icon: ShieldCheck,
      tone: 'text-brand-700 bg-brand-50 border-brand-200',
    },
  ];

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-end pb-1">
        <button
          type="button"
          onClick={onExportFull}
          className="inline-flex items-center gap-2 rounded-2xl bg-brand-700 px-4 py-2.5 text-small font-bold text-cream-50 shadow-sm transition hover:bg-brand-800 cursor-pointer"
          title="Ekspor buku kerja lengkap (Semua sheet: KPI, Transaksi, Pengguna, Buku, Agenda)"
        >
          <FileSpreadsheet className="h-4 w-4 text-brand-100" />
          Export Laporan Lengkap (.xlsx)
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="rounded-3xl border border-cream-300 bg-cream-50 p-4 sm:p-5 shadow-sm"
            >
              <div
                className={`mb-4 flex h-10 w-10 items-center justify-center rounded-2xl border ${kpi.tone}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-2xl font-black tracking-tight">{kpi.value}</p>
              <p className="mt-1 text-caption font-medium text-ink-500">{kpi.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-5 lg:grid-cols-2 items-stretch">
        {/* Kolom Kiri: Status Langganan (PieChart) */}
        <div className={`${surfaces.panel} flex flex-col justify-between`}>
          <div>
            <h3 className="font-bold text-body text-ink-900">Status langganan</h3>
            <div className="mt-4 h-52">
              {subscriptionShare.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={subscriptionShare}
                      dataKey="value"
                      innerRadius={50}
                      outerRadius={76}
                      paddingAngle={3}
                    >
                      {subscriptionShare.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-cream-300 bg-cream-100 text-center text-caption text-ink-500">
                  Belum ada pengguna.
                </div>
              )}
            </div>
          </div>
          <div className="mt-3 flex items-center justify-around border-t border-cream-200/60 pt-3">
            {subscriptionShare.map((entry) => (
              <div key={entry.name} className="flex items-center gap-2 text-caption">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: entry.color }} />
                <span className="text-ink-500 font-medium">{entry.name}:</span>
                <strong className="text-ink-900">{entry.value}</strong>
              </div>
            ))}
          </div>
        </div>

        {/* Kolom Kanan: Pendapatan Tervalidasi */}
        <div className={`${surfaces.panel} flex flex-col justify-center`}>
          <div>
            <h3 className="font-bold text-body text-ink-900">Pendapatan tervalidasi</h3>
            <p className="mt-4 text-3xl font-black tracking-tight text-brand-800">
              {formatCurrency(stats?.totalRevenue)}
            </p>
          </div>
        </div>
      </div>

      <div className={surfaces.panelSpaced}>
        <div className={layout.toolbarRow}>
          <div>
            <h3 className="font-bold text-ink-900">Riwayat Transaksi Langganan</h3>
            <p className={typography.helperTight}>
              Daftar transaksi pembayaran Pro melalui QRIS Midtrans ({transactions.length} total).
            </p>
          </div>
        </div>

        {/* Mobile Transaction Cards (< sm) */}
        <div className="space-y-2.5 sm:hidden">
          {transactions.slice(0, 10).map((tx) => (
            <div
              key={tx.id || tx.refNo}
              className="rounded-2xl border border-cream-200 bg-cream-50 p-3.5 shadow-sm space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-caption font-bold text-ink-700">{tx.refNo}</span>
                <TxStatusBadge status={tx.status} />
              </div>
              <div className="flex items-start justify-between text-caption">
                <div>
                  <p className="font-bold text-ink-900">{tx.userName || '-'}</p>
                  <p className={typography.helperInline}>{tx.userEmail || ''}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-ink-900">{formatCurrency(tx.totalPaid)}</p>
                  <p className="text-caption text-ink-500">{tx.planName || DEFAULT_PLAN.title}</p>
                </div>
              </div>
              <p className="text-micro text-ink-400 pt-1.5 border-t border-cream-100">
                {formatWIB(tx.createdAt, { withSeconds: false })}
              </p>
            </div>
          ))}
          {transactions.length === 0 && (
            <div className="p-6 text-center text-caption text-ink-500">
              Belum ada riwayat transaksi pembayaran.
            </div>
          )}
        </div>

        {/* Desktop Table (sm and up) */}
        <div className="hidden sm:block overflow-x-auto rounded-2xl border border-cream-200">
          <table className="min-w-full text-left text-caption">
            <thead className="bg-cream-100 uppercase tracking-wider text-ink-400">
              <tr>
                <th className="px-3.5 py-2.5">No. Referensi</th>
                <th className="px-3.5 py-2.5">Pelanggan</th>
                <th className="px-3.5 py-2.5">Paket</th>
                <th className="px-3.5 py-2.5">Total Bayar</th>
                <th className="px-3.5 py-2.5">Status</th>
                <th className="px-3.5 py-2.5">Waktu</th>
              </tr>
            </thead>
            <tbody className={layout.divider}>
              {transactions.slice(0, 10).map((tx) => (
                <tr key={tx.id || tx.refNo}>
                  <td className="px-3.5 py-2.5 font-mono font-bold text-ink-700">{tx.refNo}</td>
                  <td className="px-3.5 py-2.5">
                    <p className="font-bold text-ink-900">{tx.userName || '-'}</p>
                    <p className={typography.helperInline}>{tx.userEmail || ''}</p>
                  </td>
                  <td className="px-3.5 py-2.5">{tx.planName || DEFAULT_PLAN.title}</td>
                  <td className="px-3.5 py-2.5 font-bold text-ink-900">
                    {formatCurrency(tx.totalPaid)}
                  </td>
                  <td className="px-3.5 py-2.5">
                    <TxStatusBadge status={tx.status} />
                  </td>
                  <td className="px-3.5 py-2.5 text-ink-400">
                    {formatWIB(tx.createdAt, { withSeconds: false })}
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-ink-400">
                    Belum ada riwayat transaksi pembayaran.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
