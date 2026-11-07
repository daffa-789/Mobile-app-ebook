import { useMemo } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import {
  BookOpen,
  CreditCard,
  FileSpreadsheet,
  ShieldCheck,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import { StatCard } from './components/StatCard';
import { TxStatusBadge } from './TxStatusBadge';
import { formatWIB } from '@lib/date';
import { formatRupiah } from '@lib/formatUtils';
import { layout, typography, surfaces } from '@lib/styles';
import { DEFAULT_PLAN } from '@lib/plans';

const formatCurrency = formatRupiah;
const CHART_COLORS = { pro: '#14523A', regular: '#D4AF4F' };

/**
 * OverviewTab — Ringkasan eksekutif panel admin.
 * 4 kartu KPI dinamis, komposisi langganan, pendapatan, dan transaksi terakhir.
 * Seluruh data bersumber dari props (hook useAdminDashboardData), tanpa perubahan alur CRUD.
 */
export const OverviewTab = ({ stats, books = [], users = [], transactions = [], onExportFull }) => {
  const proCount = useMemo(() => users.filter((item) => Boolean(item.isPro)).length, [users]);
  const regularCount = Math.max(users.length - proCount, 0);
  const conversionRate = users.length > 0 ? (proCount / users.length) * 100 : 0;

  const subscriptionShare = useMemo(
    () =>
      [
        { name: 'Pro', value: proCount, color: CHART_COLORS.pro },
        { name: 'Reguler', value: regularCount, color: CHART_COLORS.regular },
      ].filter((item) => item.value > 0),
    [proCount, regularCount],
  );

  const paidTransactions = useMemo(
    () =>
      transactions.reduce((sum, tx) => {
        const status = String(tx.status || '').toLowerCase();
        return status === 'paid' || status === 'settlement' || status === 'success'
          ? sum + Number(tx.totalPaid || 0)
          : sum;
      }, 0),
    [transactions],
  );

  const kpis = [
    {
      label: 'Total Pengguna',
      value: (stats?.totalUsers ?? users.length).toLocaleString('id-ID'),
      hint: 'Akun terdaftar di sistem',
      icon: Users,
      tone: 'emerald',
    },
    {
      label: 'Koleksi Buku',
      value: (stats?.totalBooks ?? books.length).toLocaleString('id-ID'),
      hint: `${books.filter((b) => b.isLocked).length} judul eksklusif Pro`,
      icon: BookOpen,
      tone: 'gold',
    },
    {
      label: 'Langganan Pro',
      value: (stats?.activeSubscriptions ?? proCount).toLocaleString('id-ID'),
      hint: `Konversi ${conversionRate.toFixed(1)}% dari total pengguna`,
      icon: ShieldCheck,
      tone: 'deep',
      trend: `${conversionRate.toFixed(1)}%`,
    },
    {
      label: 'Pendapatan Tervalidasi',
      value: formatCurrency(stats?.totalRevenue),
      hint: `${transactions.length} transaksi tercatat`,
      icon: Wallet,
      tone: 'sand',
    },
  ];

  return (
    <section className="space-y-6">
      {/* Judul halaman + aksi ekspor */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold-600">
            Dashboard Eksekutif
          </p>
          <h2 className="mt-1 font-serif text-2xl font-bold tracking-tight text-brand-900">
            Selamat datang di Wahidiyah Book
          </h2>
          <p className="mt-1 text-sm text-ink-500">
            Pantau katalog, pengguna, dan performa langganan dalam satu tampilan.
          </p>
        </div>
        <button
          type="button"
          onClick={onExportFull}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-brand-700 bg-brand-700 px-4 py-2.5 text-xs font-bold text-cream-50 shadow-sm transition hover:bg-brand-800 hover:shadow-md cursor-pointer"
          title="Ekspor buku kerja lengkap (KPI, Transaksi, Pengguna, Buku, Agenda)"
        >
          <FileSpreadsheet className="h-4 w-4 text-gold-300" />
          Export Laporan (.xlsx)
        </button>
      </div>

      {/* 4 KPI grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <StatCard key={kpi.label} {...kpi} />
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        {/* Komposisi langganan */}
        <div className="rounded-2xl border border-cream-200 bg-ui-card p-5 shadow-[0_1px_2px_rgba(20,18,16,0.04)] lg:col-span-3">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-serif text-base font-bold text-ink-900">Komposisi Langganan</h3>
              <p className={typography.helperInline}>Perbandingan akun Pro dan Reguler.</p>
            </div>
            <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-bold text-brand-700">
              {users.length} akun
            </span>
          </div>

          <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row">
            <div className="relative h-48 w-48 shrink-0">
              {subscriptionShare.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={subscriptionShare}
                      dataKey="value"
                      innerRadius={58}
                      outerRadius={84}
                      paddingAngle={4}
                      stroke="none"
                    >
                      {subscriptionShare.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [`${value} akun`, name]}
                      contentStyle={{
                        borderRadius: 12,
                        border: '1px solid #E4D9C6',
                        background: '#FFFDFA',
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-full border border-dashed border-cream-300 bg-cream-100 text-center text-xs text-ink-500">
                  Belum ada pengguna
                </div>
              )}
              {subscriptionShare.length > 0 && (
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-brand-900">{users.length}</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">
                    Total
                  </span>
                </div>
              )}
            </div>

            <div className="w-full space-y-2.5">
              {[
                { name: 'Pro', value: proCount, color: CHART_COLORS.pro },
                { name: 'Reguler', value: regularCount, color: CHART_COLORS.regular },
              ].map((entry) => (
                <div
                  key={entry.name}
                  className="flex items-center justify-between rounded-xl border border-cream-200 bg-cream-50 px-3 py-2.5"
                >
                  <span className="flex items-center gap-2 text-xs font-semibold text-ink-600">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: entry.color }}
                    />
                    {entry.name}
                  </span>
                  <span className="text-sm font-black text-ink-900">{entry.value}</span>
                </div>
              ))}
              <div className="flex items-center gap-1.5 rounded-xl bg-gold-300/20 px-3 py-2 text-[11px] font-bold text-gold-700">
                <TrendingUp className="h-3.5 w-3.5" />
                Rasio konversi {conversionRate.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        {/* Ringkasan keuangan */}
        <div className="flex flex-col justify-between gap-4 rounded-2xl border border-cream-200 bg-gradient-to-br from-brand-900 via-brand-800 to-brand-950 p-5 text-cream-50 shadow-md lg:col-span-2">
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-400/20 text-gold-300 ring-1 ring-gold-400/30">
              <CreditCard className="h-5 w-5" />
            </div>
            <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.16em] text-gold-300/90">
              Pendapatan Tervalidasi
            </p>
            <p className="mt-1 text-3xl font-black tracking-tight">
              {formatCurrency(stats?.totalRevenue)}
            </p>
            <p className="mt-1 text-xs text-cream-200/70">
              Akumulasi pembayaran Pro yang telah dikonfirmasi.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 border-t border-cream-50/15 pt-4">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-cream-300/70">Transaksi</p>
              <p className="text-lg font-bold">{transactions.length}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-cream-300/70">Total Masuk</p>
              <p className="text-lg font-bold">{formatCurrency(paidTransactions)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Riwayat transaksi */}
      <div className={surfaces.panelSpaced}>
        <div className={layout.toolbarRow}>
          <div>
            <h3 className="font-serif text-base font-bold text-ink-900">
              Riwayat Transaksi Langganan
            </h3>
            <p className={typography.helperTight}>
              Pembayaran Pro melalui QRIS Midtrans ({transactions.length} total).
            </p>
          </div>
        </div>

        <div className="space-y-2.5 sm:hidden">
          {transactions.slice(0, 10).map((tx) => (
            <div
              key={tx.id || tx.refNo}
              className="space-y-2 rounded-2xl border border-cream-200 bg-ui-card p-3.5 shadow-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-bold text-ink-700">{tx.refNo}</span>
                <TxStatusBadge status={tx.status} />
              </div>
              <div className="flex items-start justify-between text-xs">
                <div>
                  <p className="font-bold text-ink-900">{tx.userName || '-'}</p>
                  <p className={typography.helperInline}>{tx.userEmail || ''}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-ink-900">{formatCurrency(tx.totalPaid)}</p>
                  <p className="text-xs text-ink-500">{tx.planName || DEFAULT_PLAN.title}</p>
                </div>
              </div>
              <p className="border-t border-cream-100 pt-1.5 text-[11px] text-ink-400">
                {formatWIB(tx.createdAt, { withSeconds: false })}
              </p>
            </div>
          ))}
          {transactions.length === 0 && (
            <div className="p-6 text-center text-xs text-ink-500">
              Belum ada riwayat transaksi pembayaran.
            </div>
          )}
        </div>

        <div className="hidden overflow-x-auto rounded-2xl border border-cream-200 sm:block">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-cream-100 uppercase tracking-wider text-ink-500">
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
                <tr key={tx.id || tx.refNo} className="transition hover:bg-cream-50">
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
