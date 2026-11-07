import { ArrowUpRight } from 'lucide-react';

/**
 * StatCard — Kartu metrik KPI dengan ikon gradien, angka dominan, dan keterangan.
 */
export function StatCard({ label, value, hint, icon: Icon, tone = 'emerald', trend }) {
  const tones = {
    emerald: 'from-brand-600 to-brand-800 text-cream-50',
    gold: 'from-gold-400 to-gold-600 text-brand-950',
    sand: 'from-cream-300 to-cream-400 text-ink-800',
    deep: 'from-brand-800 to-brand-950 text-gold-300',
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-cream-200 bg-ui-card p-4 shadow-[0_1px_2px_rgba(20,18,16,0.04)] transition duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md sm:p-5">
      <div
        className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full bg-brand-50/70 blur-2xl transition group-hover:bg-gold-300/20"
        aria-hidden="true"
      />
      <div className="relative flex items-start justify-between gap-3">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br shadow-sm ${tones[tone] || tones.emerald}`}
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
      <p className="relative mt-4 truncate text-2xl font-black tracking-tight text-ink-900 sm:text-[28px]">
        {value}
      </p>
      <p className="relative mt-0.5 text-xs font-bold text-ink-700">{label}</p>
      {hint && <p className="relative mt-1 text-[11px] leading-snug text-ink-400">{hint}</p>}
    </div>
  );
}
