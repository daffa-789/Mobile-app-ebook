import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { theme } from './src/theme';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { BookProvider } from './src/context/BookContext';
import { HomeScreen } from './src/screens/HomeScreen';
import { ReaderScreen } from './src/screens/ReaderScreen';
import { CalendarScreen } from './src/screens/CalendarScreen';
import { DownloadsScreen } from './src/screens/DownloadsScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';

const TABS = [
  { id: 'home', label: 'Beranda', icon: '📖' },
  { id: 'calendar', label: 'Kalender', icon: '📅' },
  { id: 'downloads', label: 'Unduhan', icon: '📥' },
  { id: 'profile', label: 'Profil', icon: '👤' },
];

function AuthModal({ visible, onClose }) {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!emailOrPhone || !password) {
      Alert.alert('Form Belum Lengkap', 'Silakan isi email/telepon dan kata sandi.');
      return;
    }

    setLoading(true);
    if (isRegister) {
      const res = await register({ fullName, email: emailOrPhone, phone: emailOrPhone, password });
      setLoading(false);
      if (res.success) {
        Alert.alert('Registrasi Berhasil', 'Akun berhasil dibuat. Silakan masuk.');
        setIsRegister(false);
      } else {
        Alert.alert('Registrasi Gagal', res.error || 'Terjadi kesalahan.');
      }
    } else {
      const res = await login(emailOrPhone, password);
      setLoading(false);
      if (res.success) {
        onClose();
      } else {
        Alert.alert('Gagal Masuk', res.error || 'Email atau kata sandi tidak valid.');
      }
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={modalStyles.backdrop}>
        <View style={modalStyles.sheet}>
          <View style={modalStyles.handle} />
          <Text style={modalStyles.title}>
            {isRegister ? 'Daftar Akun Baru' : 'Masuk ke Wahidiyah Book'}
          </Text>
          <Text style={modalStyles.subtitle}>
            Akses khazanah literatur dan naskah Sholawat Wahidiyah secara lengkap.
          </Text>

          {isRegister && (
            <TextInput
              style={modalStyles.input}
              placeholder="Nama Lengkap"
              placeholderTextColor={theme.colors.inkMuted}
              value={fullName}
              onChangeText={setFullName}
            />
          )}

          <TextInput
            style={modalStyles.input}
            placeholder="Email atau Nomor WhatsApp"
            placeholderTextColor={theme.colors.inkMuted}
            value={emailOrPhone}
            onChangeText={setEmailOrPhone}
            autoCapitalize="none"
          />

          <TextInput
            style={modalStyles.input}
            placeholder="Kata Sandi"
            placeholderTextColor={theme.colors.inkMuted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity style={modalStyles.submitBtn} onPress={handleSubmit} disabled={loading}>
            <Text style={modalStyles.submitBtnText}>
              {loading ? 'Memproses...' : isRegister ? 'Daftar Sekarang' : 'Masuk'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={modalStyles.toggleBtn}
            onPress={() => setIsRegister(!isRegister)}
          >
            <Text style={modalStyles.toggleBtnText}>
              {isRegister ? 'Sudah punya akun? Masuk di sini' : 'Belum punya akun? Daftar sekarang'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={modalStyles.cancelBtn} onPress={onClose}>
            <Text style={modalStyles.cancelBtnText}>Tutup</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function MainAppShell() {
  const [activeTab, setActiveTab] = useState('home');
  const [readingBook, setReadingBook] = useState(null);
  const [authModalVisible, setAuthModalVisible] = useState(false);

  // Jika sedang membuka buku, tampilkan layar reader secara eksklusif
  if (readingBook) {
    return <ReaderScreen book={readingBook} onBack={() => setReadingBook(null)} />;
  }

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar style="dark" />

      {/* Konten Tab Aktif */}
      <View style={styles.contentArea}>
        {activeTab === 'home' && (
          <HomeScreen
            onOpenBook={(book) => setReadingBook(book)}
            onOpenAuth={() => setAuthModalVisible(true)}
          />
        )}
        {activeTab === 'calendar' && <CalendarScreen />}
        {activeTab === 'downloads' && (
          <DownloadsScreen onOpenBook={(book) => setReadingBook(book)} />
        )}
        {activeTab === 'profile' && <ProfileScreen onOpenAuth={() => setAuthModalVisible(true)} />}
      </View>

      {/* Bottom Tab Bar (1:1 Mobile Web Navigation) */}
      <View style={styles.bottomNav}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tabButton}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabIcon, isActive && styles.tabIconActive]}>{tab.icon}</Text>
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Modal Autentikasi */}
      <AuthModal visible={authModalVisible} onClose={() => setAuthModalVisible(false)} />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BookProvider>
        <MainAppShell />
      </BookProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentArea: {
    flex: 1,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingVertical: 8,
    paddingHorizontal: 16,
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 8,
  },
  tabButton: {
    alignItems: 'center',
    paddingVertical: 4,
    minWidth: 60,
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 2,
    opacity: 0.6,
  },
  tabIconActive: {
    opacity: 1,
    transform: [{ scale: 1.1 }],
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.inkSecondary,
  },
  tabLabelActive: {
    color: theme.colors.primary,
    fontWeight: '800',
  },
});

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: theme.colors.surfaceLight,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    paddingBottom: 40,
    gap: 12,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.ink,
    fontFamily: theme.typography.serif,
  },
  subtitle: {
    fontSize: 12,
    color: theme.colors.inkMuted,
    lineHeight: 16,
    marginBottom: 6,
  },
  input: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: theme.colors.ink,
  },
  submitBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    marginTop: 6,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  toggleBtn: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  toggleBtnText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '700',
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  cancelBtnText: {
    fontSize: 12,
    color: theme.colors.inkMuted,
  },
});
