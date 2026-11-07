/**
 * StatCard — Kartu metrik KPI minimalis dengan ikon, angka dominan, dan label judul.
 */
export function StatCard({ label, value, icon: Icon, tone = 'emerald' }) {
  const tones = {
    emerald: 'bg-brand-50 text-brand-800 border-brand-200',
    gold: 'bg-gold-50 text-gold-800 border-gold-200',
    sand: 'bg-cream-100 text-ink-800 border-cream-200',
    deep: 'bg-brand-100 text-brand-900 border-brand-200',
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-cream-200 bg-ui-card p-4 shadow-[0_1px_2px_rgba(20,18,16,0.04)] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl border ${tones[tone] || tones.emerald}`}
        >
          <Icon className="h-5 w-5" strokeWidth={2.1} />
        </div>
      </div>
      <p className="mt-4 truncate text-2xl font-black tracking-tight text-ink-900 sm:text-[28px]">
        {value}
      </p>
      <p className="mt-0.5 text-xs font-bold text-ink-700">{label}</p>
    </div>
  );
}
