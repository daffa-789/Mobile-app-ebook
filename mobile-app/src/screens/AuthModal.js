import React from 'react';
import { View, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { AuthScreen } from './AuthScreen';

/**
 * Bottom sheet Masuk / Daftar untuk mode tamu.
 * - Sengaja tanpa kotak pesan kontekstual dan tanpa tombol "Nanti":
 *   ikon X adalah satu-satunya cara membatalkan (juga lewat BACK Android).
 * - `onAuthSuccess` dipanggil setelah login/daftar sukses agar pemanggil bisa
 *   melanjutkan aksi yang tertunda. Tanpa prop ini, perilaku lama dipertahankan
 *   (cukup menutup sheet).
 */
export const AuthModal = ({ visible, onClose, onAuthSuccess, initialTab = 'login' }) => {
  const handleAuthSuccess = (...args) => {
    if (typeof onAuthSuccess === 'function') onAuthSuccess(...args);
    else onClose?.();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.sheetTopRow}>
            <View style={styles.handle} />
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              activeOpacity={0.7}
              accessibilityLabel="Tutup"
              accessibilityRole="button"
            >
              <Feather name="x" size={20} color="#5A544C" />
            </TouchableOpacity>
          </View>

          <View style={styles.contentWrap}>
            <AuthScreen initialTab={initialTab} onAuthSuccess={handleAuthSuccess} />
          </View>
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
    backgroundColor: '#FBF8F3',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: '92%',
    paddingBottom: 20,
    overflow: 'hidden',
  },
  sheetTopRow: {
    alignItems: 'center',
    paddingTop: 12,
    paddingHorizontal: 20,
    position: 'relative',
    height: 40,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#E4D9C6',
  },
  closeBtn: {
    position: 'absolute',
    right: 20,
    top: 8,
    padding: 6,
  },
  contentWrap: {
    flex: 1,
  },
});
