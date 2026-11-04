import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { colors, fonts, spacing, type } from '../theme';
import { Field, FormError, PrimaryButton } from '../components/Field';
import { useAuth } from '../state/AuthContext';
import * as authApi from '../api/auth';
import { readableError } from '../api/client';
import { kvSet, kvRemove, pendingVerificationKey } from '../storage/kv';
import { toast } from '../components/Toast';

// Aturan OTP (§5.3): 6 digit, TTL 10 menit, maks 5 percobaan, cooldown 60 detik.
export default function VerifyEmailScreen({ route, navigation }) {
  const { identifier, devOtp } = route.params || {};
  const { loginSession } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (identifier) kvSet(pendingVerificationKey, { identifier, at: Date.now() });
  }, [identifier]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const submit = async () => {
    setError('');
    if (!/^\d{6}$/.test(code.trim())) return setError('Masukkan kode 6 digit yang dikirim ke email.');
    setBusy(true);
    try {
      const res = await authApi.verifyRegistration(identifier, code.trim());
      await kvRemove(pendingVerificationKey);
      await loginSession(res.token, res.user);
    } catch (e) {
      setError(readableError(e));
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    if (cooldown > 0) return;
    setError('');
    try {
      await authApi.resendVerification(identifier, 'register');
      setCooldown(60);
      toast('Kode baru dikirim.');
    } catch (e) {
      setError(readableError(e));
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'android' ? 'padding' : 'height'} style={styles.flex}>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.title}>Verifikasi email</Text>
        <Text style={styles.sub}>
          Kode 6 digit dikirim ke {identifier}. Berlaku 10 menit.
        </Text>
        {devOtp ? <Text style={styles.devOtp}>Kode dev: {devOtp}</Text> : null}
        <FormError message={error} />
        <Field label="Kode verifikasi" value={code} onChangeText={setCode} placeholder="6 digit" keyboardType="number-pad" />
        <PrimaryButton title="Verifikasi" onPress={submit} loading={busy} />
        <Text onPress={resend} accessibilityRole="link" style={[styles.link, cooldown > 0 && styles.disabled]}>
          {cooldown > 0 ? `Kirim ulang dalam ${cooldown} detik` : 'Kirim ulang kode'}
        </Text>
        <Text onPress={() => navigation.goBack()} accessibilityRole="link" style={styles.link}>Kembali</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.ui.bg },
  body: { padding: spacing.lg, paddingTop: 48 },
  title: { fontFamily: fonts.display, fontSize: 26, fontWeight: '700', color: colors.brand[800] },
  sub: { fontFamily: fonts.sans, fontSize: type.small, color: colors.ui.textSecondary, marginVertical: 12 },
  devOtp: { fontFamily: fonts.sans, fontSize: type.small, color: colors.semantic.info, marginBottom: 12 },
  link: { fontFamily: fonts.sans, fontWeight: '700', fontSize: type.small, color: colors.brand[700], marginTop: 16 },
  disabled: { color: colors.ui.textMuted },
});
