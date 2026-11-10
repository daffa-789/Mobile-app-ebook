import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Linking,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { useAuth } from '../context/AuthContext';
import { OAUTH_CONFIG, APP_CONFIG } from '../config/constants';
import { VerificationScreen } from './VerificationScreen';

export const AuthScreen = ({ initialTab = 'login', onAuthSuccess }) => {
  const { login, register, requestPasswordReset, startGoogleMobile } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab); // 'login' | 'register'
  const [viewMode, setViewMode] = useState('auth'); // 'auth' | 'verification' | 'request-reset'
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [verificationState, setVerificationState] = useState({
    mode: 'register',
    identifier: '',
    method: 'email',
    initialDevOtp: '',
  });
  const [sharedEmail, setSharedEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [noticeMessage, setNoticeMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setErrorMessage('');
    setNoticeMessage('');
  };

  const handleLoginSubmit = async () => {
    setErrorMessage('');
    setNoticeMessage('');

    const trimmedEmail = sharedEmail.trim();
    if (!trimmedEmail || !password) {
      setErrorMessage('Masukkan alamat email dan password Anda.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password minimal 8 karakter.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await login(trimmedEmail, password);
      if (res.success) {
        onAuthSuccess?.(res.user);
      } else {
        setErrorMessage(res.error || 'Email atau password belum sesuai.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Terjadi kesalahan saat masuk.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async () => {
    setErrorMessage('');
    setNoticeMessage('');

    const trimmedName = fullName.trim();
    const trimmedEmail = sharedEmail.trim();
    const cleanPhone = String(phone || '')
      .trim()
      .replace(/[^0-9]/g, '');

    if (!trimmedName) {
      setErrorMessage('Nama lengkap wajib diisi.');
      return;
    }

    if (!trimmedEmail || !/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      setErrorMessage('Masukkan alamat email yang valid.');
      return;
    }

    if (!cleanPhone || cleanPhone.length < 8 || cleanPhone.length > 15) {
      setErrorMessage('Masukkan nomor WhatsApp yang valid (8-15 digit).');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password minimal 8 karakter.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Konfirmasi password belum sesuai.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await register({
        fullName: trimmedName,
        email: trimmedEmail,
        phone: cleanPhone,
        password,
      });

      if (res.success) {
        if (res.requiresVerification) {
          setVerificationState({
            mode: 'register',
            identifier: res.identifier || trimmedEmail,
            method: res.method || 'email',
            initialDevOtp: res.devOtp || '',
          });
          setViewMode('verification');
        } else {
          Alert.alert(
            'Pendaftaran Berhasil',
            res.message || 'Akun Anda berhasil didaftarkan! Silakan masuk.',
          );
          setActiveTab('login');
          setNoticeMessage('Akun berhasil dibuat. Silakan masukkan password Anda untuk masuk.');
        }
      } else {
        setErrorMessage(res.error || 'Pendaftaran belum dapat diproses.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Gagal melakukan pendaftaran.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleAuth = async () => {
    setErrorMessage('');
    setIsSubmitting(true);
    try {
      if (Platform.OS !== 'web') {
        const res = await startGoogleMobile();
        if (!res.success) {
          setErrorMessage(res.error || 'Gagal memulai otorisasi Google.');
        }
        return;
      }

      const clientId = OAUTH_CONFIG.googleClientId;

      const isWeb = Platform.OS === 'web';
      let redirectUri = OAUTH_CONFIG.redirectUri;
      if (isWeb && typeof window !== 'undefined') {
        const origin = window.location.origin;
        if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
          redirectUri = OAUTH_CONFIG.localWebRedirectUri;
        } else {
          redirectUri = `${origin}${OAUTH_CONFIG.callbackPath}`;
        }
      }

      const state = 'oauth_' + Math.random().toString(36).substring(2);
      if (isWeb && typeof document !== 'undefined') {
        document.cookie = `google_oauth_state=${encodeURIComponent(state)}; Path=/; Max-Age=600; SameSite=Lax`;
      }

      // URL OAuth Google dengan prompt=select_account agar pengguna dapat memilih akun Google
      const authUrl =
        `${OAUTH_CONFIG.authUrl}` +
        `?client_id=${encodeURIComponent(clientId)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=code` +
        `&scope=${encodeURIComponent('openid email profile')}` +
        `&state=${encodeURIComponent(state)}` +
        `&access_type=online` +
        `&prompt=select_account`;

      if (isWeb && typeof window !== 'undefined') {
        window.location.href = authUrl;
      } else {
        await Linking.openURL(authUrl);
      }
    } catch (err) {
      setErrorMessage('Gagal membuka login Google: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = () => {
    setResetIdentifier(sharedEmail || '');
    setErrorMessage('');
    setViewMode('request-reset');
  };

  const handleRequestResetSubmit = async () => {
    setErrorMessage('');
    const cleanId = resetIdentifier.trim();
    if (!cleanId) {
      setErrorMessage('Masukkan alamat email atau nomor WhatsApp akun Anda.');
      return;
    }
    setIsSubmitting(true);
    try {
      const isEmail = cleanId.includes('@');
      const method = isEmail ? 'email' : 'whatsapp';
      const res = await requestPasswordReset({
        identifier: cleanId,
        method,
      });

      if (res.success) {
        setVerificationState({
          mode: 'reset-password',
          identifier: res.identifier || cleanId,
          method: res.method || method,
          initialDevOtp: res.devOtp || '',
        });
        setViewMode('verification');
      } else {
        setErrorMessage(res.error || 'Gagal mengajukan pemulihan kata sandi.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Terjadi gangguan koneksi saat mengajukan reset.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (viewMode === 'verification') {
    return (
      <VerificationScreen
        mode={verificationState.mode}
        identifier={verificationState.identifier}
        method={verificationState.method}
        initialDevOtp={verificationState.initialDevOtp}
        onBack={() => setViewMode('auth')}
        onSuccess={(result) => {
          if (result?.user) {
            onAuthSuccess?.(result.user);
          } else {
            setViewMode('auth');
            setActiveTab('login');
            setNoticeMessage(
              verificationState.mode === 'reset-password'
                ? 'Kata sandi berhasil diperbarui. Silakan masuk dengan kata sandi baru.'
                : 'Akun Anda berhasil diverifikasi. Silakan masuk.',
            );
          }
        }}
      />
    );
  }

  if (viewMode === 'request-reset') {
    return (
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.authCard}>
            <TouchableOpacity
              style={styles.backButtonInline}
              onPress={() => setViewMode('auth')}
              activeOpacity={0.7}
            >
              <Feather name="arrow-left" size={18} color="#1D1B17" />
              <Text style={styles.backButtonInlineText}>Kembali ke Masuk</Text>
            </TouchableOpacity>

            <View style={styles.brandHeader}>
              <Text style={styles.brandTitle}>Lupa Kata Sandi</Text>
              <Text style={styles.brandSubtitle}>
                Masukkan alamat email atau nomor WhatsApp akun Anda untuk menerima kode pemulihan.
              </Text>
            </View>

            {errorMessage ? (
              <View style={styles.errorAlert}>
                <Feather name="alert-circle" size={16} color="#C00511" />
                <Text style={styles.errorAlertText}>{errorMessage}</Text>
              </View>
            ) : null}

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>EMAIL ATAU NOMOR WHATSAPP</Text>
              <View style={styles.inputWrap}>
                <Feather name="mail" size={18} color="#7C756C" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={resetIdentifier}
                  onChangeText={setResetIdentifier}
                  placeholder="nama@email.com atau 081234..."
                  placeholderTextColor="#A8A199"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, isSubmitting && styles.primaryButtonDisabled]}
              onPress={handleRequestResetSubmit}
              disabled={isSubmitting}
              activeOpacity={0.85}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FBF8F3" />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>Kirim Kode Verifikasi</Text>
                  <Feather name="arrow-right" size={18} color="#FBF8F3" />
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoid}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.authCard}>
          {/* 1:1 Header: Mobile-app-ebook */}
          <View style={styles.brandHeader}>
            <Text style={styles.brandTitle}>Mobile-app-ebook</Text>
          </View>

          {/* 1:1 Segmented Tab Switcher */}
          <View style={styles.tabSwitcher}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'login' && styles.tabButtonActive]}
              onPress={() => handleTabChange('login')}
              activeOpacity={0.8}
            >
              <Text
                style={[styles.tabButtonText, activeTab === 'login' && styles.tabButtonTextActive]}
              >
                Masuk
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'register' && styles.tabButtonActive]}
              onPress={() => handleTabChange('register')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  activeTab === 'register' && styles.tabButtonTextActive,
                ]}
              >
                Daftar Akun
              </Text>
            </TouchableOpacity>
          </View>

          {/* Alert Error Box */}
          {errorMessage ? (
            <View style={styles.errorAlert}>
              <Feather name="alert-circle" size={16} color="#C00511" />
              <Text style={styles.errorAlertText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Notice Status Box */}
          {noticeMessage ? (
            <View style={styles.noticeAlert}>
              <Feather name="info" size={16} color="#14523A" />
              <Text style={styles.noticeAlertText}>{noticeMessage}</Text>
            </View>
          ) : null}

          {/* Form Content */}
          {activeTab === 'login' ? (
            <View style={styles.formContainer}>
              {/* Field: Alamat Email */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Alamat email</Text>
                <View style={styles.inputWrap}>
                  <Feather name="mail" size={16} color="#7C756C" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    value={sharedEmail}
                    onChangeText={(val) => {
                      setSharedEmail(val);
                      setErrorMessage('');
                    }}
                    placeholder="nama@email.com"
                    placeholderTextColor="#A8A199"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    editable={!isSubmitting}
                  />
                </View>
              </View>

              {/* Field: Password */}
              <View style={styles.fieldGroup}>
                <View style={styles.passwordLabelRow}>
                  <Text style={styles.fieldLabel}>Password</Text>
                  <TouchableOpacity onPress={handleForgotPassword} disabled={isSubmitting}>
                    <Text style={styles.forgotLink}>Lupa password?</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.inputWrap}>
                  <Feather name="lock" size={16} color="#7C756C" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    value={password}
                    onChangeText={(val) => {
                      setPassword(val);
                      setErrorMessage('');
                    }}
                    placeholder="Minimal 8 karakter"
                    placeholderTextColor="#A8A199"
                    secureTextEntry={!showPassword}
                    editable={!isSubmitting}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeBtn}
                    disabled={isSubmitting}
                  >
                    <Feather name={showPassword ? 'eye-off' : 'eye'} size={16} color="#7C756C" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Submit Masuk */}
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleLoginSubmit}
                disabled={isSubmitting}
                activeOpacity={0.85}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Feather name="log-in" size={16} color="#FFFFFF" />
                    <Text style={styles.primaryButtonText}>Masuk</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.formContainer}>
              {/* Field: Nama Lengkap */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Nama lengkap</Text>
                <View style={styles.inputWrap}>
                  <Feather name="user" size={16} color="#7C756C" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    value={fullName}
                    onChangeText={(val) => {
                      setFullName(val);
                      setErrorMessage('');
                    }}
                    placeholder="Nama Anda"
                    placeholderTextColor="#A8A199"
                    editable={!isSubmitting}
                  />
                </View>
              </View>

              {/* Field: Alamat Email */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Alamat email</Text>
                <View style={styles.inputWrap}>
                  <Feather name="mail" size={16} color="#7C756C" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    value={sharedEmail}
                    onChangeText={(val) => {
                      setSharedEmail(val);
                      setErrorMessage('');
                    }}
                    placeholder="nama@email.com"
                    placeholderTextColor="#A8A199"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    editable={!isSubmitting}
                  />
                </View>
              </View>

              {/* Field: Nomor WhatsApp */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Nomor WhatsApp</Text>
                <View style={styles.inputWrap}>
                  <Feather name="phone" size={16} color="#7C756C" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    value={phone}
                    onChangeText={(val) => {
                      setPhone(val);
                      setErrorMessage('');
                    }}
                    placeholder="081212345678"
                    placeholderTextColor="#A8A199"
                    keyboardType="phone-pad"
                    editable={!isSubmitting}
                  />
                </View>
              </View>

              {/* Field: Password */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Password</Text>
                <View style={styles.inputWrap}>
                  <Feather name="lock" size={16} color="#7C756C" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    value={password}
                    onChangeText={(val) => {
                      setPassword(val);
                      setErrorMessage('');
                    }}
                    placeholder="Minimal 8 karakter"
                    placeholderTextColor="#A8A199"
                    secureTextEntry={!showPassword}
                    editable={!isSubmitting}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeBtn}
                    disabled={isSubmitting}
                  >
                    <Feather name={showPassword ? 'eye-off' : 'eye'} size={16} color="#7C756C" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Field: Konfirmasi Password */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Konfirmasi password</Text>
                <View style={styles.inputWrap}>
                  <Feather name="lock" size={16} color="#7C756C" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    value={confirmPassword}
                    onChangeText={(val) => {
                      setConfirmPassword(val);
                      setErrorMessage('');
                    }}
                    placeholder="Tulis ulang password"
                    placeholderTextColor="#A8A199"
                    secureTextEntry={!showConfirmPassword}
                    editable={!isSubmitting}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeBtn}
                    disabled={isSubmitting}
                  >
                    <Feather
                      name={showConfirmPassword ? 'eye-off' : 'eye'}
                      size={16}
                      color="#7C756C"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Submit Daftar */}
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleRegisterSubmit}
                disabled={isSubmitting}
                activeOpacity={0.85}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Feather name="user-plus" size={16} color="#FFFFFF" />
                    <Text style={styles.primaryButtonText}>Daftar Sekarang</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* 1:1 Google Button — tanpa pemisah "atau" dan tanpa tautan footer. */}
          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleAuth}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            <Image
              source={require('../../assets/google-icon.png')}
              style={styles.googleIconImage}
              resizeMode="contain"
            />
            <Text style={styles.googleButtonText}>
              {activeTab === 'register' ? 'Daftar dengan Google' : 'Masuk dengan Google'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
    backgroundColor: '#FBF8F3',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#FBF8F3',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  authCard: {
    backgroundColor: '#FFFDF9',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E4D9C6',
    padding: 22,
    shadowColor: '#14523A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1D1B17',
    fontFamily: theme.typography.serif,
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 12,
    color: '#5A544C',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 17,
    maxWidth: 290,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#DCEDE4',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#B9DBC9',
    marginBottom: 16,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#216B4C',
  },
  statusBannerText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#14523A',
  },
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#F0E8DA',
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E4D9C6',
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  tabButtonActive: {
    backgroundColor: '#14523A',
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5A544C',
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FDE8E8',
    borderColor: '#F8B4B4',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
  },
  errorAlertText: {
    flex: 1,
    fontSize: 12,
    color: '#C00511',
    fontWeight: '600',
    lineHeight: 16,
  },
  noticeAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#DCEDE4',
    borderColor: '#B9DBC9',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
  },
  noticeAlertText: {
    flex: 1,
    fontSize: 12,
    color: '#14523A',
    fontWeight: '600',
    lineHeight: 16,
  },
  formContainer: {
    gap: 12,
  },
  fieldGroup: {
    gap: 5,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2B2823',
  },
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forgotLink: {
    fontSize: 11,
    fontWeight: '700',
    color: '#14523A',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFDF9',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E4D9C6',
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    color: '#1D1B17',
    fontWeight: '500',
  },
  eyeBtn: {
    padding: 6,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#14523A',
    borderRadius: 14,
    height: 48,
    marginTop: 4,
    shadowColor: '#14523A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 16,
    backgroundColor: '#FFFDF9',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E4D9C6',
    height: 48,
  },
  googleIconImage: {
    width: 20,
    height: 20,
  },
  googleButtonText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1D1B17',
  },
  backButtonInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  backButtonInlineText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1D1B17',
  },
});
