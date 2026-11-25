import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { APP_CONFIG, APP_VERSION } from '../config/constants';

/**
 * Bagian "Bantuan & Info" yang dipakai bersama oleh tampilan tamu dan tampilan
 * pengguna. Sebelumnya blok ini ditulis dua kali di ProfileScreen sehingga
 * teks bantuan, versi, dan tombol OTA mudah melenceng.
 *
 * @param {{ onCheckUpdate: () => void, isCheckingUpdate: boolean, guest?: boolean }} props
 */
export const HelpInfoSection = ({ onCheckUpdate, isCheckingUpdate, guest = false }) => {
  const showHelp = () =>
    Alert.alert(
      'Pusat Bantuan',
      `Untuk bantuan, pertanyaan seputar Sholawat Wahidiyah, atau transaksi, silakan hubungi tim sekretariat kami di ${APP_CONFIG.supportEmail}.`,
    );

  const showAbout = () =>
    Alert.alert(
      'Tentang Aplikasi',
      `E-Book Wahidiyah v${APP_VERSION} (Alpha) — Perpustakaan Digital Sholawat Wahidiyah resmi untuk membaca lembaran Sholawat dan khazanah literatur Islam.`,
    );

  const updateRow = (
    <TouchableOpacity
      key="update"
      style={[styles.menuRow, styles.menuRowBorder]}
      onPress={onCheckUpdate}
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
  );

  const helpRow = (
    <TouchableOpacity key="help" style={styles.menuRow} onPress={showHelp} activeOpacity={0.7}>
      <View style={styles.menuRowLeft}>
        <View style={styles.menuIconBoxMuted}>
          <Feather name="help-circle" size={18} color="#5A544C" />
        </View>
        <Text style={styles.menuLabel}>Pusat Bantuan</Text>
      </View>
      <Feather name="chevron-right" size={18} color="#CFCAC2" />
    </TouchableOpacity>
  );

  const aboutRow = (
    <TouchableOpacity key="about" style={styles.menuRow} onPress={showAbout} activeOpacity={0.7}>
      <View style={styles.menuRowLeft}>
        <View style={styles.menuIconBoxMuted}>
          <Feather name="info" size={18} color="#5A544C" />
        </View>
        <Text style={styles.menuLabel}>Tentang</Text>
      </View>
      <Feather name="chevron-right" size={18} color="#CFCAC2" />
    </TouchableOpacity>
  );

  const rows = guest ? [updateRow, helpRow, aboutRow] : [helpRow, updateRow, aboutRow];

  return (
    <View style={styles.sectionWrap}>
      <Text style={styles.sectionCaption}>BANTUAN & INFO</Text>
      <View style={styles.menuCard}>
        {rows.map((row, index) =>
          React.cloneElement(row, {
            key: row.key,
            style: [styles.menuRow, index < rows.length - 1 && styles.menuRowBorder],
          }),
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionWrap: { marginBottom: 20 },
  sectionCaption: {
    fontSize: 10,
    fontWeight: '800',
    color: '#7C756C',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
    paddingLeft: 4,
  },
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
  menuRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F0E8DA' },
  menuRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
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
  menuLabel: { fontSize: 14, fontWeight: 'bold', color: '#1D1B17' },
  menuSubLabel: { fontSize: 11, color: '#7C756C', marginTop: 2 },
});
