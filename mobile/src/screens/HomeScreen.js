import { useState } from 'react';
import { ActivityIndicator, FlatList, Image, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, spacing, type } from '../theme';
import { useAuth } from '../state/AuthContext';
import { useBooks } from '../state/BookContext';
import BookCard from '../components/BookCard';
import OfflineBanner from '../components/OfflineBanner';
import { getDownload } from '../storage/downloads';

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const { books, slides, loading, error, reload } = useBooks();
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [downloadMap, setDownloadMap] = useState({});

  const refreshDownloads = async () => {
    if (!user?.id) return;
    const map = {};
    await Promise.all(books.map(async (b) => {
      const row = await getDownload(user.id, b.id).catch(() => null);
      if (row) map[b.id] = row;
    }));
    setDownloadMap(map);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await reload({ search });
    await refreshDownloads();
    setRefreshing(false);
  };

  const openBook = (book) => navigation.navigate('Reader', { book });

  const renderItem = ({ item }) => {
    const dl = downloadMap[item.id];
    const stateLabel = dl ? `Tersimpan · ${dl.pages || item.pages} hal` : undefined;
    return (
      <BookCard book={item} isPro={user?.isPro} onPress={() => openBook(item)} downloadState={stateLabel} />
    );
  };

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.body}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.greeting}>
        {user?.name ? `Assalamu'alaikum, ${user.name}` : 'Assalamu\'alaikum'}
      </Text>
      <Text style={styles.sub}>Pilih buku untuk dibaca. Unduh untuk offline.</Text>
      <OfflineBanner />

      {slides?.length > 0 ? (
        <View style={styles.hero}>
          <Image source={{ uri: slides[0].image_url || slides[0].imageUrl }} style={styles.heroImg} resizeMode="cover" />
          {slides[0].title ? <Text style={styles.heroTitle}>{slides[0].title}</Text> : null}
        </View>
      ) : null}

      {error ? <Text style={styles.err}>{error}</Text> : null}

      {loading && books.length === 0 ? (
        <ActivityIndicator size="large" color={colors.brand[700]} style={{ marginTop: 32 }} />
      ) : books.length === 0 ? (
        <Text style={styles.empty}>Belum ada buku tersedia.</Text>
      ) : (
        <FlatList
          data={books}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          columnWrapperStyle={styles.row}
          renderItem={renderItem}
          scrollEnabled={false}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.ui.bg },
  body: { padding: spacing.md, paddingBottom: 32 },
  greeting: { fontFamily: fonts.display, fontSize: 24, fontWeight: '700', color: colors.brand[800], marginTop: 8 },
  sub: { fontFamily: fonts.sans, fontSize: type.small, color: colors.ui.textSecondary, marginTop: 4, marginBottom: 4 },
  err: { fontFamily: fonts.sans, fontSize: type.small, color: colors.semantic.danger, marginVertical: 12 },
  empty: { fontFamily: fonts.sans, fontSize: type.body, color: colors.ui.textSecondary, marginTop: 32, textAlign: 'center' },
  row: { justifyContent: 'space-between', gap: 12 },
  hero: { marginVertical: 12, borderRadius: 10, overflow: 'hidden', backgroundColor: colors.cream[100] },
  heroImg: { width: '100%', height: 150 },
  heroTitle: { fontFamily: fonts.sans, fontWeight: '700', fontSize: type.small, padding: 10, color: colors.ui.textPrimary },
});
