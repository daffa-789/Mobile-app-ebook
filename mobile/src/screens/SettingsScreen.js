import { useCallback, useEffect, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import { colors, fonts, type, spacing, radius } from '../theme';
import { useAuth } from '../state/AuthContext';
import { mySubscriptions } from '../api/subscriptions';
import { readableError } from '../api/client';
import { dateLabel } from '../lib/tanggalWib';
import { formatRupiah } from '../lib/rupiah';
import { API_BASE_URL } from '../config';
import { KV as _kv, kvGet, kvSet } from '../storage/kv';

export default function SettingsScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [subs, setSubs] = useState([]);
  const [subErr, setSubErr] = useState('');
  const [offlineOnly, setOfflineOnly] = useState(false);
  const version = Application.nativeApplicationVersion || Constants.expoConfig?.version || '1.0.0';
  const versionCode = Constants.expoConfig?.android?.versionCode ?? 1;

  useEffect(() => {
    (async () => {
      try {
        const res = await mySubscriptions();
        setSubs(res.subscriptions || []);
      } catch (e) {
        setSubErr(readableError(e));
      }
      const saved = await kvGet('buku-wahidiyah:offline-only').catch(() => null);
      setOfflineOnly(Boolean(saved));
    })();
  }, []);

  const toggleOfflineOnly = async () => {
    const next = !offlineOnly;
    setOfflineOnly(next);
    await kvSet('buku-wahidiyah:offline-only', next);
  };

  const doLogout = () => logout();

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.body}>
      <Text style={styles.title}>Profil</Text>

      <View style={styles.card}>
        <Text style={styles.name}>{user?.name || '-'}</Text>
        <Text style={styles.meta}>{user?.email}</Text>
        <Text style={styles.meta}>Peran: {user?.role === 'admin' ? 'Administrator' : 'Pembaca'}</Text>
        <Text style={[styles.meta, user?.isPro && styles.pro]}>
          Status: {user?.isPro ? 'Pro aktif' : 'Gratis'}
          {user?.isPro && user?.subscriptionExpiresAt ? ` hingga ${dateLabel(user.subscriptionExpiresAt)}` : ''}
        </Text>
        {user?.isPro && !user?.subscriptionExpiresAt ? (
          <Text style={styles.meta}>Pro berakhir di layar Unduhan — buku terunduh tetap bisa dibaca (§5.5).</Text>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Riwayat langganan</Text>
        {subErr ? <Text style={styles.err}>{subErr}</Text> : null}
        {subs.length === 0 && !subErr ? <Text style={styles.meta}>Belum ada riwayat.</Text> : null}
        {subs.map((s) => (
          <View key={s.id || s.ref_code || Math.random()} style={styles.row}>
            <Text style={styles.rowText}>{s.plan_name || 'Paket Bulanan Pro'} · {formatRupiah(s.price ?? 25000)}</Text>
            <Text style={styles.rowMeta}>{s.status} · {s.expires_at ? `berakhir ${dateLabel(s.expires_at)}` : 'tanpa tanggal'}</Text>
          </View>
        ))}
        <Text
          onPress={() => Linking.openURL(API_BASE_URL.replace('/api', '/'))}
          accessibilityRole="link"
          style={styles.link}
        >Beli Pro lewat browser</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Unduhan</Text>
        <Text
          onPress={() => navigation.navigate('Downloads')}
          accessibilityRole="button"
          style={styles.link}
        >Kelola unduhan</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pengaturan</Text>
        <Text
          onPress={toggleOfflineOnly}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: offlineOnly }}
          style={styles.link}
        >{offlineOnly ? '●' : '○'} Mode offline-only</Text>
        <Text style={styles.meta}>Versi aplikasi: {version} (v{codeName()})</Text>
      </View>

      <Text onPress={doLogout} accessibilityRole="button" accessibilityLabel="Keluar" style={styles.logout}>Keluar</Text>
    </ScrollView>
  );

  function codeName() {
    return `${versionCode}`;
  }
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.ui.bg },
  body: { padding: spacing.md, paddingBottom: 40, gap: 16 },
  title: { fontFamily: fonts.display, fontSize: 24, fontWeight: '700', color: colors.brand[800], marginTop: 8 },
  card: {
    backgroundColor: colors.ui.card, borderColor: colors.ui.border, borderWidth: 1,
    borderRadius: radius.card, padding: spacing.md, gap: 4,
  },
  name: { fontFamily: fonts.sans, fontWeight: '800', fontSize: type.title, color: colors.ui.textPrimary },
  meta: { fontFamily: fonts.sans, fontSize: type.small, color: colors.ui.textSecondary },
  pro: { color: colors.brand[700], fontWeight: '700' },
  sectionTitle: { fontFamily: fonts.sans, fontWeight: '800', fontSize: type.body, color: colors.ui.textPrimary, marginBottom: 8 },
  row: {
    backgroundColor: colors.ui.card, borderColor: colors.ui.border, borderWidth: 1,
    borderRadius: radius.md, padding: 10, marginBottom: 8,
  },
  rowText: { fontFamily: fonts.sans, fontWeight: '700', fontSize: type.small, color: colors.ui.textPrimary },
  rowMeta: { fontFamily: fonts.sans, fontSize: type.caption, color: colors.ui.textSecondary },
  err: { fontFamily: fonts.sans, fontSize: type.small, color: colors.semantic.danger },
  link: { fontFamily: fonts.sans, fontWeight: '700', fontSize: type.small, color: colors.brand[700], paddingVertical: 8 },
  logout: {
    fontFamily: fonts.sans, fontWeight: '800', fontSize: type.body, color: '#FFF',
    backgroundColor: colors.semantic.danger, textAlign: 'center',
    borderRadius: radius.button, paddingVertical: 14, marginTop: 8,
  },
});
