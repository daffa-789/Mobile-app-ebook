import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, type, spacing, radius } from '../theme';
import { useAuth } from '../state/AuthContext';
import { listDownloads, removeDownload, totalBytes } from '../storage/downloads';
import { formatBytes } from '../lib/format';
import { dateLabel } from '../lib/tanggalWib';

export default function DownloadsScreen() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [list, bytes] = await Promise.all([listDownloads(user.id), totalBytes(user.id)]);
      setRows(list);
      setTotal(bytes);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const askRemove = (row) => {
    Alert.alert(
      'Hapus unduhan',
      `Hapus "${row.title}" dari perangkat? Buku tidak hilang dari server, bisa diunduh ulang.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            await removeDownload(user.id, row.book_id);
            await load();
          },
        },
      ],
    );
  };

  return (
    <View style={styles.flex}>
      <Text style={styles.title}>Unduhan</Text>
      <Text style={styles.sub}>Total perangkat terpakai: {formatBytes(total)} · Unduhan terikat akun Anda dan tidak terhapus saat keluar (§20).</Text>
      {loading ? (
        <Text style={styles.empty}>Memuat…</Text>
      ) : rows.length === 0 ? (
        <Text style={styles.empty}>Belum ada buku terunduh.</Text>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(r) => r.book_id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.title || item.book_id}</Text>
                <Text style={styles.cardMeta}>
                  {item.pages ? `${item.pages} hal · ` : ''}{formatBytes(item.bytes)}
                  {item.downloaded_at ? ` · ${dateLabel(item.downloaded_at)}` : ''}
                </Text>
                {item.book_updated_at ? (
                  <Text style={styles.stale}>Ada versi baru di server.</Text>
                ) : null}
              </View>
              <Text onPress={() => askRemove(item)} accessibilityRole="button" accessibilityLabel={`Hapus ${item.title}`} style={styles.del}>
                Hapus
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.ui.bg, padding: spacing.md },
  title: { fontFamily: fonts.display, fontSize: 24, fontWeight: '700', color: colors.brand[800] },
  sub: { fontFamily: fonts.sans, fontSize: type.small, color: colors.ui.textSecondary, marginVertical: 8 },
  empty: { fontFamily: fonts.sans, fontSize: type.body, color: colors.ui.textSecondary, marginTop: 32, textAlign: 'center' },
  list: { gap: 10 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.ui.card, borderColor: colors.ui.border, borderWidth: 1,
    borderRadius: radius.card, padding: 12,
  },
  cardTitle: { fontFamily: fonts.sans, fontWeight: '700', fontSize: type.small, color: colors.ui.textPrimary },
  cardMeta: { fontFamily: fonts.sans, fontSize: type.caption, color: colors.ui.textSecondary, marginTop: 2 },
  stale: { fontFamily: fonts.sans, fontSize: type.caption, color: colors.semantic.warning, marginTop: 2 },
  del: { fontFamily: fonts.sans, fontWeight: '700', fontSize: type.small, color: colors.semantic.danger, padding: 8 },
});
