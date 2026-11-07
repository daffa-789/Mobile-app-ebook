import { ArrowUpRight } from 'lucide-react';

/**
 * StatCard — Kartu metrik KPI dengan ikon gradien, angka dominan, dan keterangan.
 */
export function StatCard({ label, value, hint, icon: Icon, tone = 'emerald', trend }) {
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
        {trend && (
          <span className="inline-flex items-center gap-0.5 rounded-full bg-brand-50 px-2 py-1 text-[10px] font-bold text-brand-700">
            <ArrowUpRight className="h-3 w-3" />
            {trend}
          </span>
        )}
      </div>
      <p className="mt-4 truncate text-2xl font-black tracking-tight text-ink-900 sm:text-[28px]">
        {value}
      </p>
      <p className="mt-0.5 text-xs font-bold text-ink-700">{label}</p>
      {hint && <p className="mt-1 text-[11px] leading-snug text-ink-400">{hint}</p>}
    </div>
  );
}
