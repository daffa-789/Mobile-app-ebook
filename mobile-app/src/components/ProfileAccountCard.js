import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { apiRequest } from '../api/client';

/**
 * Kartu formulir Data Akun pada layar Profil.
 * Menyinkronkan perubahan nama lengkap ke endpoint server `PUT /api/users/profile`
 * lalu memperbarui cache lokal AuthContext. Email dan nomor WhatsApp bersifat read-only.
 */
export const ProfileAccountCard = ({ user, onUpdateUser }) => {
  const [fullName, setFullName] = useState(user?.name || user?.fullName || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.name || user.fullName || '');
    }
  }, [user]);

  const email = user?.email || '-';
  const phone = user?.phone || '-';

  const handleSave = async () => {
    const trimmedName = fullName.trim();
    if (!trimmedName) {
      Alert.alert('Validasi', 'Nama lengkap wajib diisi.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await apiRequest('/api/users/profile', {
        method: 'PUT',
        body: JSON.stringify({ name: trimmedName }),
      });
      await onUpdateUser(res?.user || { name: trimmedName });
      Alert.alert('Sukses', res?.message || 'Data profil Anda berhasil diperbarui!');
    } catch (err) {
      Alert.alert('Gagal Menyimpan', err?.message || 'Gagal menyimpan perubahan profil ke server.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.sectionWrap}>
      <Text style={styles.sectionCaption}>DATA AKUN</Text>

      <View style={styles.card}>
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
              editable={!isSaving}
            />
          </View>
        </View>

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

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>NOMOR WHATSAPP</Text>
          <View style={styles.inputWrapDisabled}>
            <Feather name="phone" size={16} color="#7C756C" style={styles.inputIcon} />
            <TextInput
              style={[styles.textInput, styles.textInputDisabled]}
              value={phone}
              editable={false}
              placeholder="-"
            />
            <View style={styles.linkedBadge}>
              <Text style={styles.linkedBadgeText}>Terkait</Text>
            </View>
          </View>
          <Text style={styles.helperText}>
            Nomor WhatsApp hanya dipakai untuk pemulihan akun (lupa kata sandi).
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
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
  );
};

const styles = StyleSheet.create({
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
    backgroundColor: '#1E6B4A',
    borderRadius: 14,
    paddingVertical: 13,
    marginTop: 4,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
