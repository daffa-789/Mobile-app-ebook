import { useState, useEffect, useCallback } from 'react';
import { ServerCrash, RefreshCw } from 'lucide-react';
import { layout } from '@lib/styles';
import { API_FALLBACK_ORIGIN } from '@lib/api';

export const ServerStatusBanner = () => {
  const [status, setStatus] = useState('checking');
  const [detail, setDetail] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const checkHealth = useCallback(async () => {
    setIsRefreshing(true);
    try {
      let response;
      try {
        response = await fetch('/api/health', { cache: 'no-store' });
      } catch {
        response = await fetch(`${API_FALLBACK_ORIGIN}/api/health`, { cache: 'no-store' });
      }

      if (!response) {
        setStatus('offline');
        setDetail(null);
        return;
      }

      const data = await response.json().catch(() => ({}));
      if (response.ok && data.status === 'ok') {
        setStatus('online');
        setDetail(null);
      } else {
        setStatus('offline');

        setDetail(data.databaseMessage || null);
      }
    } catch {
      setStatus('offline');
      setDetail(null);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  if (status !== 'offline') return null;

  return (
    <div
      role="alert"
      className="mb-5 p-3.5 rounded-2xl border transition-all duration-200 text-xs bg-semantic-dangerLight border-semantic-danger/30 text-semantic-danger shadow-sm"
    >
      <div className="flex items-start justify-between gap-2.5">
        <div className={layout.rowStartGap}>
          <div className="p-1.5 rounded-xl shrink-0 mt-0.5 bg-semantic-danger/15 text-semantic-danger">
            <ServerCrash className="w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold text-ink-900">
              Peringatan: Server Backend Belum Berjalan
            </div>
            <p className="mt-0.5 text-caption leading-relaxed text-ink-700">
              {detail ||
                'Layanan backend (Port 5000) tidak merespons. Jalankan "npm run dev" pada Command Prompt / Terminal.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={checkHealth}
          disabled={isRefreshing}
          title="Periksa Ulang Status Koneksi"
          className="p-1.5 hover:bg-ink-900/5 rounded-lg text-ink-400 hover:text-ink-800 transition shrink-0"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-brand-600' : ''}`}
          />
        </button>
      </div>
    </div>
  );
};
