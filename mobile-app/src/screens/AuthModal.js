import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { useAuth } from '../context/AuthContext';

export const AuthModal = ({ visible, onClose }) => {
  const { login, register } = useAuth();
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Perhatian', 'Silakan isi alamat email dan password Anda.');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Perhatian', 'Password minimal 8 karakter.');
      return;
    }

    setLoading(true);

    if (activeTab === 'register') {
      const res = await register({ fullName, email, phone, password });
      setLoading(false);
      if (res.success) {
        Alert.alert(
          'Registrasi Berhasil',
          res.message || 'Akun Anda berhasil dibuat. Silakan masuk.',
        );
        setActiveTab('login');
      } else {
        Alert.alert('Registrasi Gagal', res.error || 'Terjadi kesalahan.');
      }
    } else {
      const res = await login(email, password);
      setLoading(false);
      if (res.success) {
        onClose();
      } else {
        Alert.alert('Gagal Masuk', res.error || 'Email atau password tidak sesuai.');
      }
    }
  };

  const handleGoogleLogin = () => {
    Alert.alert(
      'Google Login',
      'Masuk dengan Google tersedia melalui browser resmi di https://wahidiyah-book.vercel.app/login.',
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          {/* Close Handle / Button */}
          <View style={styles.sheetTopRow}>
            <View style={styles.handle} />
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Feather name="x" size={20} color="#5A544C" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.sheetContent}
          >
            {/* 1:1 Brand Header */}
            <View style={styles.brandHeader}>
              <Text style={styles.brandTitle}>Wahidiyah Book</Text>
              <Text style={styles.brandSubtitle}>
                {activeTab === 'login'
                  ? 'Masuk ke akun Anda untuk mengakses koleksi buku'
                  : 'Daftar akun baru untuk mulai membaca dan berlangganan'}
              </Text>
            </View>

            {/* 1:1 Server Status Banner */}
            <View style={styles.statusBanner}>
              <View style={styles.statusDot} />
              <Text style={styles.statusBannerText}>Seluruh Layanan Beroperasi Normal</Text>
            </View>

            {/* 1:1 Segmented Tabs Switcher */}
            <View style={styles.tabSwitcher}>
              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'login' && styles.tabButtonActive]}
                onPress={() => setActiveTab('login')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    activeTab === 'login' && styles.tabButtonTextActive,
                  ]}
                >
                  Masuk
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'register' && styles.tabButtonActive]}
                onPress={() => setActiveTab('register')}
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

            {/* Form Fields */}
            {activeTab === 'register' && (
              <>
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Nama Lengkap</Text>
                  <View style={styles.inputWrap}>
                    <Feather name="user" size={16} color="#7C756C" style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      value={fullName}
                      onChangeText={setFullName}
                      placeholder="Nama Lengkap Anda"
                      placeholderTextColor="#A8A199"
                    />
                  </View>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Nomor WhatsApp</Text>
                  <View style={styles.inputWrap}>
                    <Feather name="phone" size={16} color="#7C756C" style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      value={phone}
                      onChangeText={setPhone}
                      placeholder="Contoh: 08123456789"
                      placeholderTextColor="#A8A199"
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>
              </>
            )}

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Alamat email</Text>
              <View style={styles.inputWrap}>
                <Feather name="mail" size={16} color="#7C756C" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="nama@email.com"
                  placeholderTextColor="#A8A199"
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <View style={styles.passwordLabelRow}>
                <Text style={styles.fieldLabel}>Password</Text>
                {activeTab === 'login' && (
                  <TouchableOpacity
                    onPress={() =>
                      Alert.alert(
                        'Lupa Password',
                        'Silakan kunjungi https://wahidiyah-book.vercel.app/login untuk mereset kata sandi melalui email.',
                      )
                    }
                  >
                    <Text style={styles.forgotLink}>Lupa password?</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.inputWrap}>
                <Feather name="lock" size={16} color="#7C756C" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Minimal 8 karakter"
                  placeholderTextColor="#A8A199"
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                >
                  <Feather name={showPassword ? 'eye-off' : 'eye'} size={16} color="#7C756C" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Feather name="log-in" size={16} color="#FFFFFF" />
              <Text style={styles.submitBtnText}>
                {loading ? 'Memproses...' : activeTab === 'login' ? 'Masuk' : 'Daftar Akun'}
              </Text>
            </TouchableOpacity>

            {/* 1:1 Separator Atau */}
            <View style={styles.separatorRow}>
              <View style={styles.separatorLine} />
              <Text style={styles.separatorText}>atau</Text>
              <View style={styles.separatorLine} />
            </View>

            {/* 1:1 Google Button */}
            <TouchableOpacity
              style={styles.googleBtn}
              onPress={handleGoogleLogin}
              activeOpacity={0.8}
            >
              <Ionicons name="logo-google" size={16} color="#EA4335" />
              <Text style={styles.googleBtnText}>Lanjutkan dengan Google</Text>
            </TouchableOpacity>

            {/* Bottom Switch Link */}
            <View style={styles.bottomLinkWrap}>
              {activeTab === 'login' ? (
                <Text style={styles.bottomPrompt}>
                  Belum memiliki akun?{' '}
                  <Text style={styles.bottomAction} onPress={() => setActiveTab('register')}>
                    Daftar sekarang
                  </Text>
                </Text>
              ) : (
                <Text style={styles.bottomPrompt}>
                  Sudah memiliki akun?{' '}
                  <Text style={styles.bottomAction} onPress={() => setActiveTab('login')}>
                    Masuk
                  </Text>
                </Text>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 18, 16, 0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FBF8F3', // 1:1 App Surface
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '90%',
    paddingBottom: 36,
  },
  sheetTopRow: {
    alignItems: 'center',
    paddingTop: 12,
    paddingHorizontal: 20,
    position: 'relative',
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#E4D9C6',
    marginBottom: 8,
  },
  closeBtn: {
    position: 'absolute',
    right: 20,
    top: 10,
    padding: 6,
  },
  sheetContent: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 24,
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1D1B17',
    fontFamily: theme.typography.serif,
  },
  brandSubtitle: {
    fontSize: 12,
    color: '#5A544C',
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 280,
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
    marginBottom: 18,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
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
    color: '#FBF8F3',
    fontWeight: 'bold',
  },
  fieldGroup: {
    marginBottom: 14,
  },
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2B2823',
    marginBottom: 4,
  },
  forgotLink: {
    fontSize: 11,
    fontWeight: '600',
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
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#14523A', // Brand 700
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 6,
    shadowColor: '#14523A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FBF8F3',
  },
  separatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
    gap: 12,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E4D9C6',
  },
  separatorText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#8C857B',
    textTransform: 'uppercase',
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FFFDF9',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E4D9C6',
    paddingVertical: 12,
  },
  googleBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1D1B17',
  },
  bottomLinkWrap: {
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0E8DA',
  },
  bottomPrompt: {
    fontSize: 12,
    color: '#5A544C',
  },
  bottomAction: {
    fontWeight: 'bold',
    color: '#14523A',
  },
});
