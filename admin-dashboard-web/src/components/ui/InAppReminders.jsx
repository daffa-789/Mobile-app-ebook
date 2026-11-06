import { useCallback, useEffect, useMemo, useState } from 'react';
import { BellRing, CalendarClock, Crown, X } from 'lucide-react';
import { useApp } from '@context/AppContext';
import { buildReminders, wereRemindersSeen, markRemindersSeen } from '@lib/reminders';

const TONE = {
  urgent: {
    wrap: 'border-semantic-danger/40 bg-semantic-dangerLight',
    icon: 'bg-semantic-danger/15 text-semantic-danger',
    title: 'text-semantic-danger',
    body: 'text-semantic-danger/85',
  },
  warning: {
    wrap: 'border-semantic-warning/40 bg-semantic-warningLight',
    icon: 'bg-semantic-warning/15 text-semantic-warning',
    title: 'text-semantic-warning',
    body: 'text-semantic-warning/85',
  },
  info: {
    wrap: 'border-brand-300 bg-brand-50',
    icon: 'bg-brand-100 text-brand-700',
    title: 'text-brand-900',
    body: 'text-brand-800',
  },
};

const KindIcon = ({ kind }) =>
  kind === 'pro' ? <Crown className="h-4 w-4" /> : <CalendarClock className="h-4 w-4" />;

export const InAppReminders = () => {
  const { user, events, isLoggedIn } = useApp();
  const [dismissed, setDismissed] = useState(false);

  const reminders = useMemo(
    () => (isLoggedIn ? buildReminders({ events, user }) : []),
    [events, user, isLoggedIn],
  );
  const ids = useMemo(() => reminders.map((r) => r.id), [reminders]);
  const idsKey = ids.join('|');

  useEffect(() => {
    setDismissed(wereRemindersSeen(idsKey ? idsKey.split('|') : []));
  }, [idsKey]);

  const handleDismiss = useCallback(() => {
    markRemindersSeen(ids);
    setDismissed(true);
  }, [ids]);

  if (!isLoggedIn || dismissed || reminders.length === 0) return null;

  return (
    <div
      className="fixed bottom-20 left-4 right-4 z-40 flex flex-col gap-2 md:bottom-4 md:left-auto md:w-[380px]"
      role="status"
      aria-live="polite"
      aria-label="Pengingat"
      data-testid="in-app-reminders"
    >
      {reminders.map((reminder) => {
        const tone = TONE[reminder.severity] || TONE.info;
        return (
          <div
            key={reminder.id}
            data-testid={`reminder-${reminder.kind}`}
            className={`flex items-start gap-3 rounded-2xl border px-3.5 py-3 shadow-lg ${tone.wrap}`}
          >
            <span
              className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl ${tone.icon}`}
            >
              <KindIcon kind={reminder.kind} />
            </span>
            <div className="min-w-0 flex-1">
              <p className={`text-xs font-bold break-words ${tone.title}`}>{reminder.title}</p>
              <p className={`mt-0.5 text-caption leading-relaxed break-words ${tone.body}`}>
                {reminder.message}
              </p>
              {reminder.detail && (
                <p className={`mt-1 text-caption font-semibold break-words ${tone.body}`}>
                  {reminder.detail}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Tutup pengingat"
              className={`-mr-1 -mt-1 shrink-0 rounded-lg p-1 transition hover:bg-ink-900/5 ${tone.body}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
      {reminders.length > 1 && (
        <button
          type="button"
          onClick={handleDismiss}
          className="self-start rounded-xl px-2 py-1 text-caption font-semibold text-ink-500 transition hover:text-brand-700"
        >
          <BellRing className="mr-1 inline h-3 w-3" />
          Tandai semua sudah dibaca
        </button>
      )}
    </div>
  );
};
