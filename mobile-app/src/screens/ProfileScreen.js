import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { useAuth } from '../context/AuthContext';

export const ProfileScreen = ({ onOpenRiwayat, onOpenAuth }) => {
  const { user, updateUser, logout } = useAuth();
  const [fullName, setFullName] = useState(
    user?.name || user?.fullName || 'Ghazalah Ramadhan Daffa Firjatullah',
  );
  const [phone, setPhone] = useState(user?.phone || '');
  const [isSaving, setIsSaving] = useState(false);

  const email = user?.email || 'ghazalahramadhan6@gmail.com';

  const handleSave = async () => {
    setIsSaving(true);
    await updateUser({ name: fullName, fullName, phone });
    setIsSaving(false);
    Alert.alert('Sukses', 'Data profil Anda berhasil diperbarui!');
  };

  const handleLogout = () => {
    Alert.alert('Konfirmasi Keluar', 'Apakah Anda yakin ingin keluar dari sesi akun ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Keluar',
        style: 'destructive',
        onPress: async () => {
          await logout();
          onOpenAuth?.();
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Profil */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profil</Text>
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
                'Untuk bantuan, pertanyaan seputar Sholawat Wahidiyah, atau transaksi, silakan hubungi tim sekretariat kami di info@wahidiyah.org.',
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
            style={styles.menuRow}
            onPress={() =>
              Alert.alert(
                'Tentang Aplikasi',
                'E-Book Wahidiyah v1.0.0 — Perpustakaan Digital Sholawat Wahidiyah resmi untuk membaca lembaran Sholawat dan khazanah literatur Islam.',
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

      {/* 1:1 SECTION: PENGATURAN & SESI */}
      <View style={styles.sectionWrap}>
        <Text style={styles.sectionCaption}>PENGATURAN & SESI</Text>

        <View style={styles.menuCard}>
          <TouchableOpacity style={styles.menuRow} onPress={handleLogout} activeOpacity={0.7}>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1D1B17',
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
});
