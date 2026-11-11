import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  useWindowDimensions,
  ActivityIndicator,
  Linking,
  BackHandler,
  Alert,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { theme } from './src/theme';
import { OtaUpdatePrompt } from './src/components/OtaUpdatePrompt';
import { useOtaUpdate } from './src/hooks/useOtaUpdate';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { BookProvider } from './src/context/BookContext';
import { HomeScreen } from './src/screens/HomeScreen';
import { CalendarScreen } from './src/screens/CalendarScreen';
import { ProScreen } from './src/screens/ProScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { SubscriptionHistoryScreen } from './src/screens/SubscriptionHistoryScreen';
import { ReaderScreen } from './src/screens/ReaderScreen';
import { AuthModal } from './src/screens/AuthModal';

const TABS = [
  { id: 'home', label: 'Beranda', iconName: 'home' },
  { id: 'calendar', label: 'Kalender', iconName: 'calendar' },
  { id: 'pro', label: 'Pro', iconName: 'sparkles' },
  { id: 'profile', label: 'Profil', iconName: 'user' },
];

function MainNavigator() {
  const { user, isPro, loading, exchangeGoogleCode } = useAuth();
  const isProRef = React.useRef(isPro);
  isProRef.current = isPro;
  const [activeTab, setActiveTab] = useState('home');
  const [activeBook, setActiveBook] = useState(null);
  const [showRiwayat, setShowRiwayat] = useState(false);
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [exitToastVisible, setExitToastVisible] = useState(false);
  const lastBackPressRef = React.useRef(0);
  const exitToastTimerRef = React.useRef(null);
  /* Aksi yang tertunda saat tamu diminta masuk. Disimpan di ref (bukan state)
   * karena state React akan memperlakukan fungsi sebagai updater. */
  const pendingActionRef = React.useRef(null);
  /* Status & aksi OTA hidup di hook terpisah; App.js hanya memasang dialognya. */
  const ota = useOtaUpdate();

  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && windowWidth > 500;

  // Tangani Deep Link OAuth Google (scheme: mobileappebook://auth/success?code=...)
  React.useEffect(() => {
    let handledCodes = new Set();
    const handleUrl = async (event) => {
      const url = typeof event === 'string' ? event : event?.url;
      if (!url) return;
      try {
        if (url.includes('/auth/failure')) {
          const message = url.match(/[?&]message=([^&#]+)/);
          Alert.alert(
            'Login Google Gagal',
            message
              ? decodeURIComponent(message[1])
              : 'Otorisasi Google tidak selesai. Silakan coba lagi.',
          );
          return;
        }
        const match = url.match(/[?&]code=([^&#]+)/);
        const code = match ? match[1] : null;
        if (code && !handledCodes.has(code)) {
          handledCodes.add(code);
          await exchangeGoogleCode(decodeURIComponent(code));
        }
      } catch (err) {
        console.warn('[DeepLink] Gagal memproses callback auth:', err);
      }
    };

    Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url);
    });

    const subscription = Linking.addEventListener('url', handleUrl);
    return () => {
      if (subscription?.remove) subscription.remove();
    };
  }, [exchangeGoogleCode]);

  React.useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.__openAuthModal = () => setAuthModalVisible(true);
      if (window.location.search.includes('auth=1')) {
        setAuthModalVisible(true);
      }
    }
  }, []);

  // Reset screen states whenever user logs out
  React.useEffect(() => {
    if (!user) {
      setActiveTab('home');
      setActiveBook(null);
      setShowRiwayat(false);
      setAuthModalVisible(false);
      pendingActionRef.current = null;
      return;
    }
    /* Login Google selesai lewat deep link / WebBrowser, bukan lewat tombol
     * AuthScreen, jadi onAuthSuccess tidak selalu terpanggil. Tutup sheet
     * begitu sesi terisi agar pengguna tidak nyangkut di layar Masuk dan
     * tidak mengetuk "Masuk dengan Google" untuk kedua kalinya. Aksi
     * tertunda tetap dijalankan oleh effect [user] di bawah. */
    setAuthModalVisible(false);
  }, [user]);

  /* MODE TAMU — pola Shopee/Tokopedia: katalog, agenda, dan halaman Pro boleh
   * dibuka tanpa akun; hanya aksi yang butuh identitas yang melewati gerbang.
   * Satu gerbang terpusat supaya tidak ada `if (!user)` tersebar di tiap layar. */
  const openAuth = (action = null) => {
    pendingActionRef.current = action;
    setAuthModalVisible(true);
  };

  const requireAuth = (action) => {
    if (user) {
      action?.();
      return;
    }
    openAuth(action);
  };

  /* Ikon X membatalkan aksi yang tertunda. */
  const handleCloseAuth = () => {
    setAuthModalVisible(false);
    pendingActionRef.current = null;
  };

  /* Setelah login berhasil, aksi tadi DILANJUTKAN (bukan kembali ke Beranda).
   * pendingActionRef sengaja tidak dihapus di sini; efek di bawah menunggu
   * sampai `user` benar-benar terisi oleh AuthContext sebelum menjalankannya. */
  const handleAuthSuccess = () => {
    setAuthModalVisible(false);
  };

  React.useEffect(() => {
    if (!user || !pendingActionRef.current) return undefined;
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    const timer = setTimeout(() => action(), 0);
    return () => clearTimeout(timer);
  }, [user]);

  // Back Android: tutup layer teratas / kembali ke Beranda dari tab lain;
  // di Beranda wajib dua kali (dengan snackbar) sebelum keluar app.
  React.useEffect(() => {
    if (Platform.OS !== 'android') return undefined;

    const dismissToast = () => {
      setExitToastVisible(false);
      lastBackPressRef.current = 0;
    };

    const onBackPress = () => {
      if (authModalVisible) {
        handleCloseAuth();
        dismissToast();
        return true;
      }
      if (activeBook) {
        setActiveBook(null);
        dismissToast();
        return true;
      }
      if (showRiwayat) {
        setShowRiwayat(false);
        dismissToast();
        return true;
      }
      if (activeTab !== 'home') {
        setActiveTab('home');
        dismissToast();
        return true;
      }
      const now = Date.now();
      if (now - lastBackPressRef.current < 2000) {
        BackHandler.exitApp();
        return true;
      }
      lastBackPressRef.current = now;
      setExitToastVisible(true);
      if (exitToastTimerRef.current) clearTimeout(exitToastTimerRef.current);
      exitToastTimerRef.current = setTimeout(() => {
        setExitToastVisible(false);
        lastBackPressRef.current = 0;
      }, 2000);
      return true;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => {
      subscription.remove();
      if (exitToastTimerRef.current) clearTimeout(exitToastTimerRef.current);
    };
  }, [activeTab, activeBook, showRiwayat, authModalVisible]);

  // Frame container mock-up perangkat mobile
  const renderFramed = (children) => (
    <View
      style={[styles.outerContainer, { backgroundColor: isDesktopWeb ? '#1E2022' : '#FBF8F3' }]}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FBF8F3" />

      {/* Frame Smartphone Android Otomatis di Layar Laptop / Web Desktop */}
      <View
        style={[
          styles.deviceFrame,
          isDesktopWeb && {
            width: 440,
            height: Math.min(windowHeight - 40, 920),
            borderRadius: 36,
            borderWidth: 8,
            borderColor: '#1D1B17',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 16 },
            shadowOpacity: 0.35,
            shadowRadius: 32,
            elevation: 16,
            overflow: 'hidden',
          },
        ]}
      >
        {/* Notch / Punch-hole Kamera Mockup jika dibuka di desktop */}
        {isDesktopWeb && (
          <View style={styles.notchContainer}>
            <View style={styles.cameraPill} />
          </View>
        )}

        <SafeAreaView style={styles.innerSafeArea}>{children}</SafeAreaView>
      </View>
    </View>
  );

  // 1. Loading state saat inisialisasi sesi tersimpan
  if (loading) {
    return renderFramed(
      <View style={styles.centeredLoading}>
        <ActivityIndicator size="large" color="#14523A" />
      </View>,
    );
  }

  // 2. MODE TAMU: tidak ada auth gate di sini. Layar utama dan bottom bar
  //    langsung tersedia; gerbang login dipasang per-aksi lewat requireAuth().
  // 3. Layar Utama Aplikasi
  const renderCurrentScreen = () => {
    if (activeBook) {
      return <ReaderScreen book={activeBook} onBack={() => setActiveBook(null)} />;
    }

    if (showRiwayat) {
      return <SubscriptionHistoryScreen onBack={() => setShowRiwayat(false)} />;
    }

    return (
      <View style={styles.screenContainer}>
        {activeTab === 'home' && (
          <HomeScreen
            onOpenBook={(book) =>
              requireAuth(() => {
                /* Setelah login, akun gratis yang memilih kitab Pro diarahkan
                 * ke penawaran Pro, bukan ke Reader yang akan ditolak server. */
                if (book.is_locked && !isProRef.current) setActiveTab('pro');
                else setActiveBook(book);
              })
            }
            onOpenPro={() => setActiveTab('pro')}
          />
        )}
        {activeTab === 'calendar' && <CalendarScreen />}
        {activeTab === 'pro' && <ProScreen onOpenAuth={openAuth} />}
        {activeTab === 'profile' && (
          <ProfileScreen
            onOpenRiwayat={() => requireAuth(() => setShowRiwayat(true))}
            onOpenPro={() => setActiveTab('pro')}
            onOpenAuth={() => openAuth()}
          />
        )}
      </View>
    );
  };

  return renderFramed(
    <>
      {renderCurrentScreen()}

      {/* Bottom Bar selalu ada selama tidak sedang membaca buku */}
      {!activeBook && (
        <BottomNavBar
          activeTab={activeTab}
          onTabPress={(tabId) => {
            setShowRiwayat(false);
            setActiveTab(tabId);
            setExitToastVisible(false);
            lastBackPressRef.current = 0;
          }}
        />
      )}

      {/* Snackbar "tekan back lagi untuk keluar" ala Instagram */}
      {exitToastVisible && (
        <View style={styles.exitToast} pointerEvents="none">
          <Text style={styles.exitToastText}>Tekan BACK sekali lagi untuk keluar</Text>
        </View>
      )}

      {/* Saat orang masuk aplikasi dan ada pembaruan, beri dua pilihan jelas:
          perbarui sekarang atau nanti. Tidak muncul di atas sheet auth/reader. */}
      <OtaUpdatePrompt
        visible={ota.isAvailable && !authModalVisible && !activeBook && !showRiwayat}
        isApplying={ota.isApplying}
        onUpdate={ota.apply}
        onDismiss={ota.dismiss}
      />

      {/* Sheet Masuk / Daftar: X menutup dan membatalkan aksi, login berhasil
          menutup lalu melanjutkan aksi yang tertunda. Tanpa kotak pesan hijau. */}
      <AuthModal
        visible={authModalVisible}
        initialTab="login"
        onClose={handleCloseAuth}
        onAuthSuccess={handleAuthSuccess}
      />
    </>,
  );
}

function BottomNavBar({ activeTab, onTabPress }) {
  return (
    <View style={styles.bottomNav}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <TouchableOpacity
            key={tab.id}
            style={[styles.navItem, isActive && styles.navItemActive]}
            onPress={() => onTabPress(tab.id)}
            activeOpacity={0.8}
          >
            {tab.iconName === 'sparkles' ? (
              <Ionicons
                name={isActive ? 'sparkles' : 'sparkles-outline'}
                size={20}
                color={isActive ? '#14523A' : '#7C756C'}
              />
            ) : (
              <Feather name={tab.iconName} size={20} color={isActive ? '#14523A' : '#7C756C'} />
            )}
            <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BookProvider>
        <MainNavigator />
      </BookProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: Platform.OS === 'web' ? '#1E2022' : '#FBF8F3', // Studio Dark Backdrop saat di laptop
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceFrame: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FBF8F3',
    position: 'relative',
  },
  notchContainer: {
    width: '100%',
    height: 24,
    backgroundColor: '#FBF8F3',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
  cameraPill: {
    width: 70,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#1D1B17',
  },
  innerSafeArea: {
    flex: 1,
    backgroundColor: '#FBF8F3',
    position: 'relative',
  },
  centeredLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FBF8F3',
  },
  screenContainer: {
    flex: 1,
  },
  // 1:1 Bottom Navigation Bar
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'rgba(251, 248, 243, 0.98)',
    borderTopWidth: 1,
    borderTopColor: '#E4D9C6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    paddingBottom: 4,
    shadowColor: '#14523A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    borderRadius: 16,
    marginHorizontal: 4,
  },
  navItemActive: {
    backgroundColor: 'rgba(220, 237, 228, 0.75)', // 1:1 bg-brand-100/70
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#7C756C', // text-ink-400
    marginTop: 2,
  },
  navLabelActive: {
    fontWeight: 'bold',
    color: '#082D20', // text-brand-900
  },
  exitToast: {
    position: 'absolute',
    bottom: 76,
    alignSelf: 'center',
    maxWidth: '80%',
    backgroundColor: 'rgba(29, 27, 23, 0.92)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  exitToastText: {
    color: '#FBF8F3',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});
