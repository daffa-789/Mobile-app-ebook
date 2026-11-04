import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, type, fonts } from '../theme';

// Toast sederhana padanan sonner yang paling minimal (§4) — tanpa dependensi baru.
let showFn = null;

export function ToastHost() {
  const [msg, setMsg] = useState('');
  useEffect(() => {
    showFn = (text) => setMsg(String(text || ''));
    return () => { showFn = null; };
  }, []);
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(''), 2600);
    return () => clearTimeout(t);
  }, [msg]);
  if (!msg) return null;
  return (
    <View style={styles.toast} accessibilityRole="alert">
      <Text style={styles.text}>{msg}</Text>
    </View>
  );
}

export const toast = (text) => showFn?.(text);

const styles = StyleSheet.create({
  toast: {
    position: 'absolute', left: 16, right: 16, bottom: 28,
    backgroundColor: colors.ink[900], borderRadius: radius.button,
    paddingVertical: 10, paddingHorizontal: 14, alignItems: 'center',
  },
  text: { fontFamily: fonts.sans, fontSize: type.small, color: '#FFF', fontWeight: '600' },
});
