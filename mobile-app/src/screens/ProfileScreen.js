import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import * as Updates from 'expo-updates';
import { Feather } from '@expo/vector-icons';
import { theme } from '../theme';
import { useAuth } from '../context/AuthContext';
import { APP_CONFIG, APP_VERSION } from '../config/constants';

export const ProfileScreen = ({ onOpenRiwayat, onOpenPro, onOpenAuth }) => {
  const { user, isPro, updateUser, logout } = useAuth();
  const [fullName, setFullName] = useState(user?.name || user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);

  const handleCheckUpdate = async () => {
    if (isCheckingUpdate) return;
    setIsCheckingUpdate(true);
    try {
      if (__DEV__) {
        Alert.alert(
          'Mode Development',
          'Pemeriksaan pembaruan OTA (EAS Update) hanya aktif pada aplikasi yang terinstal (.apk), bukan di Expo Go / Development server.',
        );
        return;
      }
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        Alert.alert(
          'Pembaruan Tersedia',
          'Versi terbaru aplikasi telah dirilis dengan perbaikan dan peningkatan fitur. Unduh dan pasang pembaruan sekarang?',
          [
            { text: 'Nanti', style: 'cancel' },
            {
              text: 'Unduh Sekarang',
              onPress: async () => {
                try {
                  setIsCheckingUpdate(true);
                  await Updates.fetchUpdateAsync();
                  Alert.alert(
                    'Pembaruan Siap!',
                    'Pembaruan telah berhasil diunduh. Muat ulang aplikasi sekarang untuk menerapkan perubahan?',
                    [
                      {
                        text: 'Muat Ulang Sekarang',
                        onPress: async () => {
                          await Updates.reloadAsync();
                        },
                      },
                    ],
                  );
                } catch (e) {
                  Alert.alert(
                    'Gagal Mengunduh',
                    'Gagal mengunduh pembaruan. Silakan periksa koneksi internet Anda dan coba lagi.',
                  );
                } finally {
                  setIsCheckingUpdate(false);
                }
              },
            },
          ],
        );
      } else {
        Alert.alert(
          'Aplikasi Sudah Versi Terbaru',
          `Anda sudah menggunakan versi terbaru (v${APP_VERSION} Alpha). Tidak ada pembaruan baru saat ini.`,
        );
      }
    } catch (error) {
      Alert.alert(
        'Pemeriksaan Pembaruan',
        'Tidak dapat memeriksa pembaruan saat ini. Pastikan perangkat Anda terhubung ke internet.',
      );
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  useEffect(() => {
    if (user) {
      setFullName(user.name || user.fullName || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const email = user?.email || '-';

  const handleSave = async () => {
    setIsSaving(true);
    await updateUser({ name: fullName, fullName, phone });
    setIsSaving(false);
    Alert.alert('Sukses', 'Data profil Anda berhasil diperbarui!');
  };

  const handleLogoutPress = () => {
    setLogoutModalVisible(true);
  };

  const handleConfirmLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      setLogoutModalVisible(false);
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Profil dengan Badge Member Pro */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Profil</Text>
            {isPro && (
              <View style={styles.proBadge}>
                <Feather name="award" size={13} color="#B8860B" />
                <Text style={styles.proBadgeText}>Member Pro</Text>
              </View>
            )}
          </View>
        </View>

        {/* 1:1 SECTION: DATA AKUN */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionCaption}>DATA AKUN</Text>

          <View style={styles.card}>
            {/* Field: Nama Lengkap */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>NAMA LENGKAP</Text>
              <View style={styles.inputWrap}>
                <Feather name="user" size={16} color="#7C756C" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Nama Lengkap"
                  placeholderTextColor="#A8A199"
                />
              </View>
            </View>

            {/* Field: Email Akun (Terproteksi + Badge Terverifikasi) */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>EMAIL AKUN</Text>
              <View style={styles.inputWrapDisabled}>
                <Feather name="mail" size={16} color="#7C756C" style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, styles.textInputDisabled]}
                  value={email}
                  editable={false}
                  placeholder="nama@email.com"
                />
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedBadgeText}>Terverifikasi</Text>
                </View>
              </View>
            </View>

            {/* Field: Nomor WhatsApp */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>NOMOR WHATSAPP</Text>
              <View style={styles.inputWrap}>
                <Feather name="phone" size={16} color="#7C756C" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="-"
                  placeholderTextColor="#A8A199"
                  keyboardType="phone-pad"
                />
                <View style={styles.linkedBadge}>
                  <Text style={styles.linkedBadgeText}>Terkait</Text>
                </View>
              </View>
              <Text style={styles.helperText}>
                Nomor WhatsApp digunakan untuk pemulihan akun dan notifikasi resmi.
              </Text>
            </View>

            {/* Tombol Simpan Perubahan */}
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              disabled={isSaving}
              activeOpacity={0.85}
            >
              <Feather name="save" size={15} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>
                {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 1:1 SECTION: LAYANAN & LANGGANAN */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionCaption}>LAYANAN & LANGGANAN</Text>

          <View style={styles.menuCard}>
            {!isPro && onOpenPro && (
              <TouchableOpacity
                style={[styles.menuRow, styles.menuRowBorder]}
                onPress={onOpenPro}
                activeOpacity={0.7}
              >
                <View style={styles.menuRowLeft}>
                  <View style={styles.menuIconBoxBrand}>
                    <Feather name="award" size={18} color="#B8860B" />
                  </View>
                  <View>
                    <Text style={styles.menuLabel}>Berlangganan Member Pro</Text>
                    <Text style={styles.menuSubLabel}>Buka seluruh kitab & amalan eksklusif</Text>
                  </View>
                </View>
                <Feather name="chevron-right" size={18} color="#CFCAC2" />
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.menuRow} onPress={onOpenRiwayat} activeOpacity={0.7}>
              <View style={styles.menuRowLeft}>
                <View style={styles.menuIconBoxBrand}>
                  <Feather name="file-text" size={18} color="#14523A" />
                </View>
                <Text style={styles.menuLabel}>Riwayat Langganan</Text>
              </View>
              <Feather name="chevron-right" size={18} color="#CFCAC2" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 1:1 SECTION: BANTUAN & INFO */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionCaption}>BANTUAN & INFO</Text>

          <View style={styles.menuCard}>
            <TouchableOpacity
              style={[styles.menuRow, styles.menuRowBorder]}
              onPress={() =>
                Alert.alert(
                  'Pusat Bantuan',
                  `Untuk bantuan, pertanyaan seputar Sholawat Wahidiyah, atau transaksi, silakan hubungi tim sekretariat kami di ${APP_CONFIG.supportEmail}.`,
                )
              }
              activeOpacity={0.7}
            >
              <View style={styles.menuRowLeft}>
                <View style={styles.menuIconBoxMuted}>
                  <Feather name="help-circle" size={18} color="#5A544C" />
                </View>
                <Text style={styles.menuLabel}>Pusat Bantuan</Text>
              </View>
              <Feather name="chevron-right" size={18} color="#CFCAC2" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuRow, styles.menuRowBorder]}
              onPress={handleCheckUpdate}
              disabled={isCheckingUpdate}
              activeOpacity={0.7}
            >
              <View style={styles.menuRowLeft}>
                <View style={styles.menuIconBoxBrand}>
                  {isCheckingUpdate ? (
                    <ActivityIndicator size="small" color="#14523A" />
                  ) : (
                    <Feather name="refresh-cw" size={18} color="#14523A" />
                  )}
                </View>
                <View>
                  <Text style={styles.menuLabel}>Pembaruan Aplikasi</Text>
                  <Text style={styles.menuSubLabel}>
                    {isCheckingUpdate
                      ? 'Memeriksa pembaruan...'
                      : `v${APP_VERSION} (Alpha) • Ketuk untuk cek versi baru`}
                  </Text>
                </View>
              </View>
              <Feather name="chevron-right" size={18} color="#CFCAC2" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuRow}
              onPress={() =>
                Alert.alert(
                  'Tentang Aplikasi',
                  `E-Book Wahidiyah v${APP_VERSION} (Alpha) — Perpustakaan Digital Sholawat Wahidiyah resmi untuk membaca lembaran Sholawat dan khazanah literatur Islam.`,
                )
              }
              activeOpacity={0.7}
            >
              <View style={styles.menuRowLeft}>
                <View style={styles.menuIconBoxMuted}>
                  <Feather name="info" size={18} color="#5A544C" />
                </View>
                <Text style={styles.menuLabel}>Tentang</Text>
              </View>
              <Feather name="chevron-right" size={18} color="#CFCAC2" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 1:1 SECTION: PENGATURAN & SESI (Fungsi Keluar / Logout) */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionCaption}>PENGATURAN & SESI</Text>

          <View style={styles.menuCard}>
            <TouchableOpacity
              style={styles.menuRow}
              onPress={handleLogoutPress}
              activeOpacity={0.7}
            >
              <View style={styles.menuRowLeft}>
                <View style={styles.menuIconBoxDanger}>
                  <Feather name="log-out" size={18} color="#C00511" />
                </View>
                <Text style={[styles.menuLabel, { color: '#C00511' }]}>Keluar dari Sesi</Text>
              </View>
              <Feather name="chevron-right" size={18} color="#CFCAC2" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* 1:1 Dialog Konfirmasi Logout (Replikasi LogoutConfirmDialog.jsx) */}
      <Modal
        visible={logoutModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.logoutCard}>
            <View style={styles.logoutIconBox}>
              <Feather name="log-out" size={24} color="#C00511" />
            </View>
            <Text style={styles.logoutTitle}>Log Out dari akun?</Text>
            <Text style={styles.logoutSubtitle}>
              Apakah Anda yakin ingin keluar dari sesi akun ini? Anda harus masuk kembali untuk
              mengakses koleksi buku.
            </Text>
            <View style={styles.logoutActions}>
              <TouchableOpacity
                style={styles.logoutCancelBtn}
                onPress={() => setLogoutModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.logoutCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.logoutConfirmBtn}
                onPress={handleConfirmLogout}
                activeOpacity={0.7}
              >
                <Text style={styles.logoutConfirmText}>Ya, Log Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBF8F3', // 1:1 Canvas Cream Hangat
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 96,
  },
  header: {
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1D1B17',
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FBF4DC',
    borderColor: '#E5C877',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  proBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#7A5608',
  },
  sectionWrap: {
    marginBottom: 20,
  },
  sectionCaption: {
    fontSize: 10,
    fontWeight: '800',
    color: '#7C756C',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
    paddingLeft: 4,
  },
  card: {
    backgroundColor: '#FFFDF9',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E4D9C6',
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    gap: 14,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#5A544C',
    letterSpacing: 0.6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FBF8F3',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E4D9C6',
    paddingHorizontal: 12,
    height: 46,
  },
  inputWrapDisabled: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0E8DA',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E4D9C6',
    paddingHorizontal: 12,
    height: 46,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#1D1B17',
  },
  textInputDisabled: {
    color: '#5A544C',
  },
  verifiedBadge: {
    backgroundColor: '#DCEDE4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#14523A',
  },
  linkedBadge: {
    backgroundColor: '#F0E8DA',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  linkedBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#5A544C',
  },
  helperText: {
    fontSize: 11,
    color: '#8C857B',
    lineHeight: 15,
    marginTop: 2,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1E6B4A', // Brand Green
    borderRadius: 14,
    paddingVertical: 13,
    marginTop: 4,
  },
  saveButtonText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  // Menu List Cards
  menuCard: {
    backgroundColor: '#FFFDF9',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E4D9C6',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0E8DA',
  },
  menuRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIconBoxBrand: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#DCEDE4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIconBoxMuted: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F0E8DA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIconBoxDanger: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FDE8E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1D1B17',
  },
  menuSubLabel: {
    fontSize: 11,
    color: '#7C756C',
    marginTop: 2,
  },

  // Logout Modal Styles (1:1 with LogoutConfirmDialog)
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(29, 27, 23, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoutCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFDF9',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E4D9C6',
    padding: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  logoutIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FDE8E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoutTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1D1B17',
    textAlign: 'center',
    marginBottom: 6,
  },
  logoutSubtitle: {
    fontSize: 12,
    color: '#5A544C',
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: 20,
  },
  logoutActions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  logoutCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E4D9C6',
    backgroundColor: '#FBF8F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutCancelText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#5A544C',
  },
  logoutConfirmBtn: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#C00511',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#C00511',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutConfirmText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
