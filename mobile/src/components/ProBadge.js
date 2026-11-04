import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, type, fonts } from '../theme';

export default function ProBadge() {
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>PRO</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute', top: 6, right: 6,
    backgroundColor: colors.gold[500], borderRadius: radius.badge,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  text: { fontFamily: fonts.sans, fontWeight: '800', fontSize: type.micro, color: '#FFF' },
});
