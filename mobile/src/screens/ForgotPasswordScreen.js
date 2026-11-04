import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { colors, fonts, spacing, type } from '../theme';
import { Field, FormError, PrimaryButton } from '../components/Field';
import * as authApi from '../api/auth';
import { readableError } from '../api/client';
import { toast } from '../components/Toast';

// Lupa + reset sandi — server anti-enumerasi (selalu berhasil) (§5.3).
export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [stage, setStage] = useState('request');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const request = async () => {
    setError('');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Masukkan alamat email yang valid.');
    setBusy(true);
    try {
      await authApi.requestPasswordReset({ method: 'email', email: email.trim().toLowerCase() });
      toast('Jika email terdaftar, kode reset telah dikirim.');
      setStage('reset');
    } catch (e) {
      setError(readableError(e));
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    setError('');
    if (!/^\d{6}$/.test(code.trim())) return setError('Masukkan kode 6 digit.');
    if (password.length < 8) return setError('Password minimal 8 karakter.');
    setBusy(true);
    try {
      await authApi.resetPassword({ method: 'email', email: email.trim().toLowerCase(), code: code.trim(), password });
      toast('Password berhasil diganti. Silakan masuk.');
      navigation.goBack();
    } catch (e) {
      setError(readableError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'android' ? 'padding' : 'height'} style={styles.flex}>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.title}>Lupa password</Text>
        <Text style={styles.sub}>
          {stage === 'request'
            ? 'Kami kirim kode reset ke email Anda.'
            : 'Masukkan kode yang dikirim, lalu password baru.'}
        </Text>
        <FormError message={error} />
        <Field label="Alamat email" value={email} onChangeText={setEmail} placeholder="nama@email.com" keyboardType="email-address" editable={stage === 'request'} />
        {stage === 'reset' ? (
          <>
            <Field label="Kode reset" value={code} onChangeText={setCode} placeholder="6 digit" keyboardType="number-pad" />
            <Field label="Password baru" value={password} onChangeText={setPassword} placeholder="Minimal 8 karakter" secureTextEntry />
            <PrimaryButton title="Ganti password" onPress={reset} loading={busy} />
          </>
        ) : (
          <PrimaryButton title="Kirim kode reset" onPress={request} loading={busy} />
        )}
        <Text onPress={() => navigation.goBack()} accessibilityRole="link" style={styles.link}>Kembali masuk</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.ui.bg },
  body: { padding: spacing.lg, paddingTop: 48 },
  title: { fontFamily: fonts.display, fontSize: 26, fontWeight: '700', color: colors.brand[800] },
  sub: { fontFamily: fonts.sans, fontSize: type.small, color: colors.ui.textSecondary, marginVertical: 12 },
  link: { fontFamily: fonts.sans, fontWeight: '700', fontSize: type.small, color: colors.brand[700], marginTop: 16 },
});
