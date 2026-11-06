import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
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
import { AuthModal } from './src/screens/AuthModal';

const TABS = [
  { id: 'home', label: 'Beranda', iconName: 'home' },
  { id: 'calendar', label: 'Kalender', iconName: 'calendar' },
  { id: 'pro', label: 'Pro', iconName: 'sparkles' },
  { id: 'profile', label: 'Profil', iconName: 'user' },
];

function MainNavigator() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [activeBook, setActiveBook] = useState(null);
  const [showRiwayat, setShowRiwayat] = useState(false);
  const [authModalVisible, setAuthModalVisible] = useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__openAuthModal = () => setAuthModalVisible(true);
      if (window.location.search.includes('auth=1')) {
        setAuthModalVisible(true);
      }
    }
  }, []);

  // Jika sedang membaca buku
  if (activeBook) {
    return <ReaderScreen book={activeBook} onBack={() => setActiveBook(null)} />;
  }

  // Jika sedang membuka layar riwayat langganan
  if (showRiwayat) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FBF8F3" />
        <SubscriptionHistoryScreen onBack={() => setShowRiwayat(false)} />
        {/* Tetap sertakan bottom nav */}
        <BottomNavBar
          activeTab={activeTab}
          onTabPress={(tabId) => {
            setShowRiwayat(false);
            setActiveTab(tabId);
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FBF8F3" />

      {/* Screen Body */}
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

      {/* 1:1 Mobile Bottom Navigation Bar */}
      <BottomNavBar
        activeTab={activeTab}
        onTabPress={(tabId) => {
          setShowRiwayat(false);
          setActiveTab(tabId);
        }}
      />

      {/* Auth Modal (Login / Register) */}
      <AuthModal visible={authModalVisible} onClose={() => setAuthModalVisible(false)} />
    </SafeAreaView>
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
  container: {
    flex: 1,
    backgroundColor: '#FBF8F3', // 1:1 Canvas Cream Hangat
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
