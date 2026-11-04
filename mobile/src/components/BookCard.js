import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, type, fonts } from '../theme';
import { formatBytes } from '../lib/format';
import ProBadge from './ProBadge';

// Pola web BookCard + HomeScreen PRO badge (§7.2): rasio sampul 1:1.42
export default function BookCard({ book, isPro, onPress, downloadState }) {
  const showProBadge = book.isLocked && !isPro;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Buku ${book.title}`}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.coverWrap}>
        {book.coverUrl ? (
          <Image source={{ uri: book.coverUrl }} style={styles.cover} resizeMode="cover" />
        ) : (
          <View style={[styles.cover, styles.coverPlaceholder]}>
            <Text style={styles.coverText}>?</Text>
          </View>
        )}
        {showProBadge && <ProBadge />}
      </View>
      <Text style={styles.title} numberOfLines={2}>{book.title}</Text>
      <Text style={styles.meta}>{book.pages} halaman</Text>
      <Text style={styles.action}>{downloadState || 'Baca'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48%',
    backgroundColor: colors.ui.card,
    borderColor: colors.ui.border,
    borderWidth: 1,
    borderRadius: radius.card,
    padding: 10,
    marginBottom: 12,
  },
  pressed: { opacity: 0.85 },
  coverWrap: { position: 'relative' },
  cover: { width: '100%', aspectRatio: 1 / 1.42, borderRadius: radius.md, backgroundColor: colors.cream['200'] },
  coverPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  coverText: { fontFamily: fonts.display, fontSize: 28, color: colors.ink['400'] },
  title: {
    marginTop: 8, fontFamily: fonts.sans, fontWeight: '700', fontSize: type.small,
    color: colors.ui.textPrimary,
  },
  meta: { fontFamily: fonts.sans, fontSize: type.caption, color: colors.ui.textMuted },
  action: { fontFamily: fonts.sans, fontWeight: '700', fontSize: type.caption, color: colors.brand[700], marginTop: 4 },
});
