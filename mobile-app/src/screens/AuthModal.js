import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { AuthScreen } from './AuthScreen';

/**
 * Bottom sheet Masuk / Daftar untuk mode tamu.
 * - `message` menyebut aksi yang memicu sheet ("Masuk untuk membaca ...").
 * - Ikon X dan tombol "Nanti" menutup sheet lewat `onClose` (membatalkan aksi).
 * - `onAuthSuccess` dipanggil setelah login/daftar sukses agar pemanggil bisa
 *   melanjutkan aksi yang tertunda. Tanpa prop ini, perilaku lama dipertahankan
 *   (cukup menutup sheet).
 */
export const AuthModal = ({
  visible,
  onClose,
  onAuthSuccess,
  message = '',
  initialTab = 'login',
}) => {
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

          {message ? (
            <View style={styles.messageRow}>
              <Text style={styles.messageText}>{message}</Text>
              <TouchableOpacity onPress={onClose} activeOpacity={0.7} accessibilityRole="button">
                <Text style={styles.laterText}>Nanti</Text>
              </TouchableOpacity>
            </View>
          ) : null}

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
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#EAF4EE',
    borderWidth: 1,
    borderColor: '#C9DED2',
  },
  messageText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#14523A',
    lineHeight: 17,
  },
  laterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5A544C',
  },
  contentWrap: {
    flex: 1,
  },
});
