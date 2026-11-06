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
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { theme } from './src/theme';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { BookProvider } from './src/context/BookContext';
import { HomeScreen } from './src/screens/HomeScreen';
import { CalendarScreen } from './src/screens/CalendarScreen';
import { ProScreen } from './src/screens/ProScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { SubscriptionHistoryScreen } from './src/screens/SubscriptionHistoryScreen';
import { ReaderScreen } from './src/screens/ReaderScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { AuthModal } from './src/screens/AuthModal';

const TABS = [
  { id: 'home', label: 'Beranda', iconName: 'home' },
  { id: 'calendar', label: 'Kalender', iconName: 'calendar' },
  { id: 'pro', label: 'Pro', iconName: 'sparkles' },
  { id: 'profile', label: 'Profil', iconName: 'user' },
];

function MainNavigator() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [activeBook, setActiveBook] = useState(null);
  const [showRiwayat, setShowRiwayat] = useState(false);
  const [authModalVisible, setAuthModalVisible] = useState(false);

  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && windowWidth > 500;

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
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
    }
  }, [user]);

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

  // 2. AUTH GATE (Wajib Login sebelum masuk aplikasi):
  // Saat user belum login (user === null), tampilkan antarmuka AuthScreen secara langsung.
  // Jangan render layar utama maupun bottom navigation bar.
  if (!user) {
    return renderFramed(
      <AuthScreen
        onAuthSuccess={() => {
          setActiveTab('home');
          setActiveBook(null);
          setShowRiwayat(false);
          setAuthModalVisible(false);
        }}
      />,
    );
  }

  // 3. Layar Utama Aplikasi (hanya dapat diakses setelah login terverifikasi)
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
            onOpenBook={(book) => setActiveBook(book)}
            onOpenPro={() => setActiveTab('pro')}
          />
        )}
        {activeTab === 'calendar' && <CalendarScreen />}
        {activeTab === 'pro' && <ProScreen onOpenAuth={() => setAuthModalVisible(true)} />}
        {activeTab === 'profile' && (
          <ProfileScreen
            onOpenRiwayat={() => setShowRiwayat(true)}
            onOpenAuth={() => setAuthModalVisible(true)}
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
          }}
        />
      )}

      {/* Modal Masuk / Daftar Akun untuk switch akun atau tindakan pro */}
      <AuthModal visible={authModalVisible} onClose={() => setAuthModalVisible(false)} />
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
});
