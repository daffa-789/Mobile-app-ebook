import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

export const VerificationScreen = ({
  mode = 'register', // 'register' | 'reset-password'
  identifier = '',
  method = 'email', // 'email' | 'whatsapp'
  initialDevOtp = '',
  onSuccess,
  onBack,
}) => {
  const { verifyRegistration, resendVerification, resetPassword } = useAuth();

  const [code, setCode] = useState(initialDevOtp || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [currentDevOtp, setCurrentDevOtp] = useState(initialDevOtp);

  // Timer hitung mundur untuk kirim ulang kode OTP
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    } else {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleResend = async () => {
    if (!canResend || isSubmitting) return;
    setErrorMessage('');
    setInfoMessage('');
    setIsSubmitting(true);
    try {
      const res = await resendVerification({
        identifier: identifier.trim(),
        method,
        purpose: mode === 'reset-password' ? 'password_reset' : 'registration',
      });
      if (res.success) {
        setCountdown(60);
        setCanResend(false);
        setInfoMessage(res.message || 'Kode verifikasi baru telah dikirimkan.');
        if (res.devOtp) {
          setCurrentDevOtp(res.devOtp);
        }
      } else {
        setErrorMessage(res.error || 'Gagal mengirim ulang kode.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Terjadi gangguan koneksi saat mengirim kode.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    setErrorMessage('');
    setInfoMessage('');
    const cleanCode = code.trim().replace(/[^0-9]/g, '');

    if (!cleanCode || cleanCode.length < 6) {
      setErrorMessage('Masukkan 6 digit kode verifikasi dengan benar.');
      return;
    }

    if (mode === 'reset-password') {
      if (!newPassword || newPassword.length < 8) {
        setErrorMessage('Password baru minimal 8 karakter.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMessage('Konfirmasi password belum cocok.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (mode === 'register') {
        const res = await verifyRegistration({
          email: identifier.trim(),
          identifier: identifier.trim(),
          code: cleanCode,
        });

        if (res.success) {
          Alert.alert('Verifikasi Berhasil', 'Akun Anda berhasil diverifikasi dan siap digunakan!');
          onSuccess?.(res);
        } else {
          setErrorMessage(res.error || 'Kode verifikasi tidak valid atau telah kedaluwarsa.');
        }
      } else {
        // Reset Password
        const res = await resetPassword({
          identifier: identifier.trim(),
          email: method === 'email' ? identifier.trim() : undefined,
          phone: method === 'whatsapp' ? identifier.trim() : undefined,
          code: cleanCode,
          password: newPassword,
          method,
        });

        if (res.success) {
          Alert.alert(
            'Kata Sandi Berhasil Diperbarui',
            'Kata sandi Anda telah berhasil direset. Silakan masuk dengan kata sandi baru.',
          );
          onSuccess?.(res);
        } else {
          setErrorMessage(res.error || 'Gagal mengatur ulang kata sandi.');
        }
      }
    } catch (err) {
      setErrorMessage(err.message || 'Terjadi kesalahan pada proses verifikasi.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <View style={styles.card}>
          {/* Header Tombol Kembali */}
          <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
            <Feather name="arrow-left" size={20} color="#1D1B17" />
            <Text style={styles.backButtonText}>Kembali</Text>
          </TouchableOpacity>

          {/* Judul & Penjelasan */}
          <View style={styles.titleWrap}>
            <View style={styles.iconCircle}>
              <Feather
                name={mode === 'reset-password' ? 'key' : 'shield'}
                size={28}
                color="#14523A"
              />
            </View>
            <Text style={styles.title}>
              {mode === 'reset-password' ? 'Atur Ulang Kata Sandi' : 'Verifikasi Akun Anda'}
            </Text>
            <Text style={styles.subtitle}>
              {mode === 'reset-password'
                ? `Masukkan kode 6 digit yang dikirimkan ke ${identifier} dan buat kata sandi baru Anda.`
                : `Kami telah mengirimkan 6 digit kode konfirmasi ke ${identifier}. Silakan masukkan kode untuk mengaktifkan akun.`}
            </Text>
          </View>

          {/* Dev OTP Helper Banner */}
          {currentDevOtp ? (
            <TouchableOpacity
              style={styles.devOtpBanner}
              activeOpacity={0.8}
              onPress={() => setCode(currentDevOtp)}
            >
              <Feather name="info" size={16} color="#B8860B" />
              <View style={styles.devOtpTextWrap}>
                <Text style={styles.devOtpLabel}>Kode Uji Coba Cepat (Pengembangan):</Text>
                <Text style={styles.devOtpCode}>{currentDevOtp} (Ketuk untuk isi)</Text>
              </View>
            </TouchableOpacity>
          ) : null}

          {/* Pesan Kesalahan & Info */}
          {errorMessage ? (
            <View style={styles.alertError}>
              <Feather name="alert-circle" size={16} color="#DC2626" />
              <Text style={styles.alertErrorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {infoMessage ? (
            <View style={styles.alertInfo}>
              <Feather name="check-circle" size={16} color="#14523A" />
              <Text style={styles.alertInfoText}>{infoMessage}</Text>
            </View>
          ) : null}

          {/* Input Kode OTP 6 Digit */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>KODE VERIFIKASI (6 DIGIT)</Text>
            <View style={styles.inputWrap}>
              <Feather name="lock" size={18} color="#7C756C" style={styles.inputIcon} />
              <TextInput
                style={[styles.textInput, styles.codeInput]}
                value={code}
                onChangeText={(val) => setCode(val.replace(/[^0-9]/g, '').slice(0, 6))}
                placeholder="000000"
                placeholderTextColor="#A8A199"
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
              />
            </View>
          </View>

          {/* Field Tambahan Khusus Reset Password */}
          {mode === 'reset-password' ? (
            <>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>KATA SANDI BARU</Text>
                <View style={styles.inputWrap}>
                  <Feather name="lock" size={18} color="#7C756C" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Minimal 8 karakter"
                    placeholderTextColor="#A8A199"
                    secureTextEntry={!showNewPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowNewPassword(!showNewPassword)}
                    style={styles.eyeBtn}
                    activeOpacity={0.7}
                  >
                    <Feather name={showNewPassword ? 'eye-off' : 'eye'} size={18} color="#7C756C" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>KONFIRMASI KATA SANDI BARU</Text>
                <View style={styles.inputWrap}>
                  <Feather name="lock" size={18} color="#7C756C" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Ulangi kata sandi baru"
                    placeholderTextColor="#A8A199"
                    secureTextEntry={!showConfirmPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeBtn}
                    activeOpacity={0.7}
                  >
                    <Feather
                      name={showConfirmPassword ? 'eye-off' : 'eye'}
                      size={18}
                      color="#7C756C"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </>
          ) : null}

          {/* Tombol Aksi Verifikasi */}
          <TouchableOpacity
            style={[styles.primaryButton, isSubmitting && styles.primaryButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FBF8F3" />
            ) : (
              <>
                <Text style={styles.primaryButtonText}>
                  {mode === 'reset-password' ? 'Simpan Kata Sandi Baru' : 'Verifikasi & Lanjutkan'}
                </Text>
                <Feather name="arrow-right" size={18} color="#FBF8F3" />
              </>
            )}
          </TouchableOpacity>

          {/* Kirim Ulang Kode Section */}
          <View style={styles.resendWrap}>
            <Text style={styles.resendText}>Tidak menerima kode?</Text>
            {canResend ? (
              <TouchableOpacity onPress={handleResend} disabled={isSubmitting} activeOpacity={0.7}>
                <Text style={styles.resendAction}>Kirim Ulang Kode</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.resendTimer}>Kirim ulang dalam {countdown} detik</Text>
            )}
          </View>
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
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFDF9',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E4D9C6',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1D1B17',
  },
  titleWrap: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#DCEDE4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1D1B17',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: '#5A544C',
    textAlign: 'center',
    lineHeight: 19,
  },
  devOtpBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FEF9C3',
    borderColor: '#FDE047',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  devOtpTextWrap: {
    flex: 1,
  },
  devOtpLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#854D0E',
  },
  devOtpCode: {
    fontSize: 14,
    fontWeight: '800',
    color: '#854D0E',
    marginTop: 2,
  },
  alertError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  alertErrorText: {
    flex: 1,
    fontSize: 12,
    color: '#B91C1C',
    fontWeight: '500',
  },
  alertInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#DCEDE4',
    borderColor: '#A7D4BF',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  alertInfoText: {
    flex: 1,
    fontSize: 12,
    color: '#14523A',
    fontWeight: '600',
  },
  fieldGroup: {
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7C756C',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4D9C6',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#1D1B17',
    height: '100%',
  },
  codeInput: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 8,
    textAlign: 'center',
  },
  eyeBtn: {
    padding: 6,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#14523A',
    borderRadius: 14,
    height: 50,
    marginTop: 8,
    marginBottom: 20,
    shadowColor: '#14523A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FBF8F3',
  },
  resendWrap: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  resendText: {
    fontSize: 13,
    color: '#5A544C',
  },
  resendAction: {
    fontSize: 13,
    fontWeight: '800',
    color: '#14523A',
    textDecorationLine: 'underline',
  },
  resendTimer: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7C756C',
  },
});
