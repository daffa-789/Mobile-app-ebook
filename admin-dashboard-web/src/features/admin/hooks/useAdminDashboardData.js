/**
 * Hook kustom untuk memuat dan mengelola data analitik dan tabel dashboard admin.
 * Memuat ringkasan statistik, daftar pengguna, transaksi, dan agenda secara paralel.
 *
 * @module admin-dashboard-web/src/features/admin/hooks/useAdminDashboardData
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiJson, authHeaders } from '@lib/api';
import { normalizeEvent, normalizeTransaction, normalizeUser } from '@lib/normalizers';

/**
 * Hook pengelola data dashboard admin.
 *
 * @param {object} params - Parameter inisialisasi
 * @param {string|null} params.sessionToken - Token sesi otentikasi admin
 * @param {() => Promise<void>} params.refreshBooks - Callback penyegaran data buku
 * @param {() => Promise<void>} params.refreshEvents - Callback penyegaran data agenda
 * @returns {{
 *   stats: object|null,
 *   loadingDashboard: boolean,
 *   users: Array<object>,
 *   transactions: Array<object>,
 *   events: Array<object>,
 *   error: string,
 *   headers: object,
 *   loadDashboard: () => Promise<void>
 * }} Objek state dan fungsi reload dashboard
 */
export const useAdminDashboardData = ({ sessionToken, refreshBooks, refreshEvents }) => {
  const [stats, setStats] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState('');

  const headers = useMemo(() => authHeaders(sessionToken), [sessionToken]);

  const loadDashboard = useCallback(async () => {
    if (!sessionToken) return;
    setError('');
    setLoadingDashboard(true);
    try {
      const [statsPayload, userPayload, transactionPayload, eventPayload] = await Promise.all([
        apiJson('/api/stats', { headers }),
        apiJson('/api/users', { headers }),
        apiJson('/api/transactions', { headers }),
        apiJson('/api/events'),
      ]);
      setStats(statsPayload.stats);
      setUsers((userPayload.users || []).map(normalizeUser));
      setTransactions((transactionPayload.transactions || []).map(normalizeTransaction));
      setEvents((eventPayload.events || []).map(normalizeEvent));
      await Promise.all([refreshBooks(), refreshEvents()]);
    } catch (loadError) {
      setError(loadError.message || 'Dashboard tidak dapat dimuat.');
    } finally {
      setLoadingDashboard(false);
    }
  }, [headers, refreshBooks, refreshEvents, sessionToken]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  return {
    stats,
    loadingDashboard,
    users,
    transactions,
    events,
    error,
    headers,
    loadDashboard,
  };
};
