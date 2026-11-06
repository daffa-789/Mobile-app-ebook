import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
import { theme } from '../theme';
import { useAuth } from '../context/AuthContext';

export const ProfileScreen = ({ onOpenAuth }) => {
  const { user, isPro, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Konfirmasi Keluar', 'Apakah Anda yakin ingin keluar dari akun?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Keluar', style: 'destructive', onPress: logout },
    ]);
  };

  const handleOpenProWebsite = () => {
    // Jalur resmi sesuai spesifikasi: Pembayaran QRIS tetap diarahkan ke browser/web
    Linking.openURL('https://wahidiyahbook.com/pro').catch(() => {
      Alert.alert(
        'Buka Web',
        'Silakan buka halaman pembayaran Pro melalui browser di https://wahidiyahbook.com/pro',
      );
    });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.subtitle}>PENGATURAN AKUN</Text>
        <Text style={styles.title}>Profil Pengguna</Text>
      </View>

      {/* Card Info Pengguna */}
      {user ? (
        <View style={styles.profileCard}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>
              {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
            </Text>
          </View>

          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user.fullName || 'Pengamal Wahidiyah'}</Text>
            <Text style={styles.userEmail}>{user.email || 'user@wahidiyah.org'}</Text>
            {user.phone ? <Text style={styles.userPhone}>📱 {user.phone}</Text> : null}

            <View style={styles.badgeWrap}>
              <View style={[styles.roleBadge, isPro && styles.roleBadgePro]}>
                <Text style={[styles.roleBadgeText, isPro && styles.roleBadgeTextPro]}>
                  {isPro ? '★ MEMBER PRO' : 'ANGGOTA REGULER'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.loginBanner}>
          <Text style={styles.loginBannerTitle}>Belum Masuk Akun</Text>
          <Text style={styles.loginBannerDesc}>
            Masuk dengan akun Wahidiyah Book Anda untuk menyinkronkan data bacaan dan mengakses
            seluruh koleksi.
          </Text>
          <TouchableOpacity style={styles.loginBannerBtn} onPress={onOpenAuth}>
            <Text style={styles.loginBannerBtnText}>Masuk / Daftar Akun</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Promo Membership Pro */}
      <View style={styles.proCard}>
        <View style={styles.proHeader}>
          <Text style={styles.proTag}>MEMBERSHIP PRO</Text>
          <Text style={styles.proTitle}>Akses Seluruh Khazanah Naskah</Text>
        </View>
        <Text style={styles.proDesc}>
          Dapatkan akses tanpa batas ke naskah langka, kuliah tasawuf, dan fadhilah wirid khusus
          melalui keanggotaan Pro.
        </Text>
        <TouchableOpacity style={styles.proBtn} onPress={handleOpenProWebsite}>
          <Text style={styles.proBtnText}>
            {isPro ? 'Perpanjang Masa Aktif di Web' : 'Berlangganan Pro via QRIS Web'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Menu Pengaturan */}
      <View style={styles.menuSection}>
        <Text style={styles.menuSectionTitle}>Aplikasi</Text>

        <View style={styles.menuItem}>
          <Text style={styles.menuItemLabel}>Versi Aplikasi</Text>
          <Text style={styles.menuItemValue}>v1.0.0 (Expo SDK 58)</Text>
        </View>

        <View style={styles.menuItem}>
          <Text style={styles.menuItemLabel}>Katalog Naskah</Text>
          <Text style={styles.menuItemValue}>Tersinkronisasi</Text>
        </View>

        {user && (
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutBtnText}>Keluar dari Akun</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.md,
  },
  header: {
    paddingTop: theme.spacing.xl + 10,
    paddingBottom: theme.spacing.md,
  },
  subtitle: {
    fontSize: 10,
    letterSpacing: 2,
    color: theme.colors.primary,
    fontWeight: '700',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.ink,
    fontFamily: theme.typography.serif,
  },
  profileCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceLight,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    gap: 14,
    marginBottom: theme.spacing.md,
  },
  avatarLarge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLargeText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '800',
  },
  userInfo: {
    flex: 1,
    gap: 2,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.ink,
  },
  userEmail: {
    fontSize: 12,
    color: theme.colors.inkSecondary,
  },
  userPhone: {
    fontSize: 11,
    color: theme.colors.inkMuted,
    marginTop: 2,
  },
  badgeWrap: {
    marginTop: 6,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.primary50,
    borderWidth: 1,
    borderColor: theme.colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleBadgePro: {
    backgroundColor: theme.colors.goldBg,
    borderColor: theme.colors.gold,
  },
  roleBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: theme.colors.primary,
  },
  roleBadgeTextPro: {
    color: theme.colors.goldDark,
  },
  loginBanner: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  loginBannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.ink,
  },
  loginBannerDesc: {
    fontSize: 12,
    color: theme.colors.inkMuted,
    textAlign: 'center',
    marginVertical: 8,
    lineHeight: 18,
  },
  loginBannerBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: theme.radius.sm,
  },
  loginBannerBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  proCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.gold,
    marginBottom: theme.spacing.md,
  },
  proHeader: {
    gap: 2,
  },
  proTag: {
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: '800',
    color: theme.colors.gold,
  },
  proTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.ink,
    fontFamily: theme.typography.serif,
  },
  proDesc: {
    fontSize: 12,
    color: theme.colors.inkSecondary,
    marginVertical: 8,
    lineHeight: 18,
  },
  proBtn: {
    backgroundColor: theme.colors.gold,
    paddingVertical: 8,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
  },
  proBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  menuSection: {
    backgroundColor: theme.colors.surfaceLight,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 12,
  },
  menuSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    color: theme.colors.inkMuted,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceSubtle,
  },
  menuItemLabel: {
    fontSize: 13,
    color: theme.colors.ink,
  },
  menuItemValue: {
    fontSize: 12,
    color: theme.colors.inkMuted,
  },
  logoutBtn: {
    marginTop: 8,
    paddingVertical: 10,
    backgroundColor: '#FFF0F0',
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFD0D0',
  },
  logoutBtnText: {
    color: theme.colors.error,
    fontSize: 13,
    fontWeight: '700',
  },
});
