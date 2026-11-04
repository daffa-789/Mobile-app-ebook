import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, type, fonts } from '../theme';
import { useBooks } from '../state/BookContext';

export default function OfflineBanner() {
  const { isOffline, fromCache } = useBooks();
  if (!isOffline && !fromCache) return null;
  return (
    <View style={styles.banner} accessibilityRole="status">
      <Text style={styles.text}>
        {isOffline
          ? 'Sedang offline — menampilkan buku tersimpan di perangkat.'
          : 'Data mungkin sudah tidak terbaru.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.semantic.warningLight, borderColor: colors.gold[300],
    borderWidth: 1, borderRadius: radius.md, padding: 10, marginVertical: 8,
  },
  text: { fontFamily: fonts.sans, fontSize: type.caption, color: colors.semantic.warning },
});
