/* Penyimpanan langganan Web Push — seluruh akses tabel `push_subscriptions`.

   Sengaja terpisah dari pengirim pesan (`eventReminder.js`): rute publik
   `/api/notifications/*` hanya butuh CRUD ini, sedangkan penyapu jadwal dan
   siaran pengumuman butuh keduanya. Skema yang belum lengkap ditangani lewat
   penjaga bersama di `pushGuards.js` agar tidak ada dua versi toleransi galat. */

import { supabaseServer } from '../db.js';
import { generateId } from '../auth.js';
import { isMissingSchema, warnSchemaOnce } from './pushGuards.js';

/** Simpan atau segarkan satu perangkat berlangganan, kunci sebagai `is_active`. */
export const saveSubscription = async ({ endpoint, keys, userAgent }) => {
  const existing = await supabaseServer
    .from('push_subscriptions')
    .select('id')
    .eq('endpoint', endpoint)
    .maybeSingle();

  if (existing.error) {
    if (isMissingSchema(existing.error)) {
      warnSchemaOnce(existing.error, 'PUSH');
      const error = new Error('Tabel push_subscriptions belum dibuat di basis data.');
      error.schemaMissing = true;
      throw error;
    }
    throw existing.error;
  }

  const payload = {
    p256dh: keys.p256dh,
    auth: keys.auth,
    user_agent: String(userAgent || '').slice(0, 255),
    is_active: true,
    updated_at: new Date().toISOString(),
  };

  if (existing.data) {
    // Perangkat yang sama berlangganan ulang: cukup segarkan kuncinya.
    const { error } = await supabaseServer
      .from('push_subscriptions')
      .update(payload)
      .eq('id', existing.data.id);
    if (error) throw error;
    return { id: existing.data.id, created: false };
  }

  const id = generateId('sub');
  const { error } = await supabaseServer
    .from('push_subscriptions')
    .insert({ id, endpoint, ...payload });
  if (error) throw error;
  return { id, created: true };
};

/** Hapus permanen satu langganan berdasarkan endpoint. */
export const removeSubscription = async (endpoint) => {
  const { error } = await supabaseServer
    .from('push_subscriptions')
    .delete()
    .eq('endpoint', endpoint);
  if (error) throw error;
};

/** Matikan langganan tanpa menghapus barisnya — dipakai saat push service membalas 410. */
export const deactivateSubscription = async (id) => {
  await supabaseServer
    .from('push_subscriptions')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id);
};

/** Jumlah perangkat aktif; 0 (bukan galat) bila tabelnya belum ada. */
export const countActiveSubscriptions = async () => {
  const { count, error } = await supabaseServer
    .from('push_subscriptions')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true);

  if (error) {
    if (isMissingSchema(error)) {
      warnSchemaOnce(error, 'PUSH');
      return 0;
    }
    throw error;
  }
  return count || 0;
};
