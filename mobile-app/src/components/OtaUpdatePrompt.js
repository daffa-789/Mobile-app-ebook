/**
 * Dialog pilihan pembaruan OTA saat aplikasi dibuka.
 *
 * Dua pilihan eksplisit: "Perbarui Sekarang" atau "Nanti Saja". Komponen ini
 * murni presentasional — tidak mengimpor `expo-updates` dan tidak tahu cara
 * memeriksa pembaruan; semua status/aksi datang dari `useOtaUpdate`.
 */
import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

export const OtaUpdatePrompt = ({ visible, isApplying = false, onUpdate, onDismiss }) => {
  const handleUpdate = async () => {
    const result = await onUpdate?.();
    if (result && !result.success && !result.cancelled) {
      Alert.alert('Gagal Memuat Pembaruan', result.error || 'Periksa koneksi internet Anda.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Feather name="download" size={22} color="#14523A" />
          </View>
          <Text style={styles.title}>Pembaruan tersedia</Text>
          <Text style={styles.description}>
            Ada perbaikan kecil untuk aplikasi. Mau perbarui sekarang atau lanjut seperti biasa?
          </Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleUpdate}
            disabled={isApplying}
            activeOpacity={0.85}
            accessibilityLabel="Perbarui sekarang"
            accessibilityRole="button"
          >
            {isApplying ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Perbarui Sekarang</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={onDismiss}
            disabled={isApplying}
            activeOpacity={0.7}
            accessibilityLabel="Nanti saja"
            accessibilityRole="button"
          >
            <Text style={styles.secondaryButtonText}>Nanti Saja</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 18, 16, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFDF9',
    borderWidth: 1,
    borderColor: '#E4D9C6',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DCEDE4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1D1B17',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 13,
    lineHeight: 20,
    color: '#5A544C',
    textAlign: 'center',
    marginBottom: 20,
  },
  primaryButton: {
    width: '100%',
    height: 46,
    borderRadius: 14,
    backgroundColor: '#14523A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  secondaryButton: {
    width: '100%',
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  secondaryButtonText: {
    color: '#5A544C',
    fontSize: 13,
    fontWeight: '600',
  },
});
