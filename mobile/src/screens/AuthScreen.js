import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, spacing, type } from '../theme';
import { Field, FormError, PrimaryButton, LinkButton } from '../components/Field';
import { useAuth } from '../state/AuthContext';
import * as authApi from '../api/auth';
import { readableError } from '../api/client';
import { normalizePhone } from '../lib/phone';
import { toast } from '../components/Toast';

const TAB_LOGIN = 'masuk';
const TAB_REGISTER = 'daftar';

export default function AuthScreen({ navigation }) {
  const { loginSession } = useAuth();
  const [tab, setTab] = useState(TAB_LOGIN);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submitLogin = async () => {
    setError('');
    if (!email.trim() || !password) return setError('Masukkan alamat email dan password Anda.');
    if (password.length < 8) return setError('Password minimal 8 karakter.');
    setBusy(true);
    try {
      const res = await authApi.login(email.trim(), password);
      await loginSession(res.token, res.user);
    } catch (e) {
      setError(readableError(e));
    } finally {
      setBusy(false);
    }
  };

  const submitRegister = async () => {
    setError('');
    if (!name.trim()) return setError('Nama lengkap wajib diisi.');
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Masukkan alamat email yang valid.');
    const standardPhone = String(phone || '').trim().replace(/[^0-9]/g, '');
    if (!standardPhone || standardPhone.length < 8 || standardPhone.length > 15)
      return setError('Masukkan nomor WhatsApp yang valid.');
    if (password.length < 8) return setError('Password minimal 8 karakter.');
    if (password !== confirmation) return setError('Konfirmasi password belum sesuai.');
    setBusy(true);
    try {
      const targetEmail = email.trim().toLowerCase();
      const result = await authApi.register({
        name: name.trim(),
        email: targetEmail,
        phone: normalizePhone(standardPhone),
        password,
        deliveryMethod: 'email',
      });
      toast(result.message || 'Kode verifikasi dikirim.');
      navigation.navigate('VerifyEmail', {
        identifier: result.identifier || targetEmail,
        devOtp: result.devOtp || null,
      });
    } catch (e) {
      setError(readableError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'android' ? 'padding' : 'height'} style={styles.flex}>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Text style={styles.brand}>Wahidiyah Book</Text>
        <Text style={styles.sub}>Perpustakaan digital — satu akun, web & aplikasi.</Text>

        <View style={styles.tabs}>
          <Text
            onPress={() => setTab(TAB_LOGIN)}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === TAB_LOGIN }}
            style={[styles.tab, tab === TAB_LOGIN && styles.tabActive]}
          >Masuk</Text>
          <Text
            onPress={() => setTab(TAB_REGISTER)}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === TAB_REGISTER }}
            style={[styles.tab, tab === TAB_REGISTER && styles.tabActive]}
          >Daftar</Text>
        </View>

        <FormError message={error} />

        {tab === TAB_LOGIN ? (
          <View>
            <Field label="Alamat email" value={email} onChangeText={setEmail} placeholder="nama@email.com" autoCapitalize="none" keyboardType="email-address" />
            <Field label="Password" value={password} onChangeText={setPassword} placeholder="Minimal 8 karakter" secureTextEntry />
            <PrimaryButton title="Masuk" onPress={submitLogin} loading={busy} />
            <View style={styles.row}>
              <LinkButton title="Lupa password?" onPress={() => navigation.navigate('ForgotPassword')} />
            </View>
          </View>
        ) : (
          <View>
            <Field label="Nama lengkap" value={name} onChangeText={setName} placeholder="Nama Anda" autoCapitalize="words" />
            <Field label="Alamat email" value={email} onChangeText={setEmail} placeholder="nama@email.com" keyboardType="email-address" />
            <Field label="Nomor WhatsApp" value={phone} onChangeText={setPhone} placeholder="0812…" keyboardType="phone-pad" />
            <Field label="Password" value={password} onChangeText={setPassword} placeholder="Minimal 8 karakter" secureTextEntry />
            <Field label="Konfirmasi password" value={confirmation} onChangeText={setConfirmation} placeholder="Tulis ulang password" secureTextEntry />
            <PrimaryButton title="Daftar Sekarang" onPress={submitRegister} loading={busy} />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.ui.bg },
  body: { padding: spacing.lg, paddingTop: 48 },
  brand: { fontFamily: fonts.display, fontSize: 30, fontWeight: '700', color: colors.brand[800] },
  sub: { fontFamily: fonts.sans, fontSize: type.small, color: colors.ui.textSecondary, marginTop: 6, marginBottom: 20 },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tab: {
    flex: 1, textAlign: 'center', fontFamily: fonts.sans, fontWeight: '700', fontSize: type.small,
    paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: colors.ui.border, color: colors.ui.textSecondary,
  },
  tabActive: { backgroundColor: colors.brand[700], borderColor: colors.brand[700], color: '#FFF' },
  row: { marginTop: 8, alignItems: 'flex-end' },
});
