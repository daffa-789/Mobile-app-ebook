import { useState } from 'react';
import { ChevronDown, Mail } from 'lucide-react';
import { FAQ_ITEMS } from '@data/mockData';
import { layout } from '@lib/styles';

const CONTACT_EMAIL = 'support@bukuku.id';

export const HelpCenterScreen = () => {
  const [expandedId, setExpandedId] = useState(FAQ_ITEMS[0]?.id ?? null);

  const toggleAccordion = (id) => setExpandedId((prev) => (prev === id ? null : id));

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <div className="text-center max-w-xl mx-auto mb-10">
        <h1 className="text-3xl font-serif font-bold text-ink-900 tracking-tight">
          Pusat Bantuan & FAQ
        </h1>
        <p className="mt-2 text-sm text-ink-500">
          Temukan jawaban atas pertanyaan yang paling sering diajukan mengenai akun, katalog, dan
          langganan Pro.
        </p>
      </div>

      <div className="space-y-3">
        {FAQ_ITEMS.map((item, index) => {
          const isExpanded = expandedId === item.id;
          return (
            <div
              key={item.id}
              className={`rounded-2xl border bg-white overflow-hidden transition-all ${
                isExpanded
                  ? 'border-brand-400 shadow-md ring-1 ring-brand-200'
                  : 'border-cream-300 shadow-sm hover:border-brand-200 hover:shadow'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleAccordion(item.id)}
                aria-expanded={isExpanded}
                className="w-full min-h-14 px-5 py-4 flex items-center gap-3.5 text-left cursor-pointer"
              >
                <span
                  className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                    isExpanded ? 'bg-brand-700 text-cream-50' : 'bg-cream-100 text-ink-400'
                  }`}
                >
                  {index + 1}
                </span>

                <span
                  className={`flex-1 text-sm font-bold leading-snug ${
                    isExpanded ? 'text-brand-900' : 'text-ink-800'
                  }`}
                >
                  {item.question}
                </span>

                <ChevronDown
                  className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                    isExpanded ? 'rotate-180 text-brand-800' : 'text-ink-400'
                  }`}
                />
              </button>

              {isExpanded && (
                <div className="px-5 pb-5">
                  <div className="pl-[2.75rem] text-sm text-ink-600 leading-relaxed border-t border-cream-100 pt-3">
                    {item.answer}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <section className="mt-12">
        <div className="rounded-2xl border border-cream-300 bg-cream-100/70 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-700 flex items-center justify-center shrink-0">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-ink-900">Masih membutuhkan bantuan?</h3>
              <p className="text-xs text-ink-500">
                Tim layanan dukungan kami siap membantu pertanyaan dan kendala Anda.
              </p>
            </div>
          </div>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="inline-flex items-center justify-center bg-brand-700 hover:bg-brand-800 text-cream-50 text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm transition"
          >
            Hubungi {CONTACT_EMAIL}
          </a>
        </div>
      </section>
    </div>
  );
};
