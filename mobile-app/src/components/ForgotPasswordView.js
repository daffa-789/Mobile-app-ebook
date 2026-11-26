import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '../theme';
import { AuthField } from './AuthField';

/**
 * Tampilan pengajuan pemulihan kata sandi (email atau nomor WhatsApp).
 */
export const ForgotPasswordView = ({
  identifier,
  onChangeIdentifier,
  errorMessage,
  isSubmitting,
  onSubmit,
  onBack,
}) => (
  <KeyboardAvoidingView
    style={styles.keyboardAvoid}
    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
  >
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.authCard}>
        <TouchableOpacity style={styles.backButtonInline} onPress={onBack} activeOpacity={0.7}>
          <Feather name="arrow-left" size={18} color="#1D1B17" />
          <Text style={styles.backButtonInlineText}>Kembali ke Masuk</Text>
        </TouchableOpacity>

        <View style={styles.brandHeader}>
          <Text style={styles.brandTitle}>Lupa Kata Sandi</Text>
          <Text style={styles.brandSubtitle}>
            Masukkan alamat email atau nomor WhatsApp akun Anda untuk menerima kode pemulihan.
          </Text>
        </View>

        {errorMessage ? (
          <View style={styles.errorAlert}>
            <Feather name="alert-circle" size={16} color="#C00511" />
            <Text style={styles.errorAlertText}>{errorMessage}</Text>
          </View>
        ) : null}

        <AuthField
          label="EMAIL ATAU NOMOR WHATSAPP"
          icon="mail"
          iconSize={18}
          value={identifier}
          onChangeText={onChangeIdentifier}
          placeholder="nama@email.com atau 081234..."
          autoCapitalize="none"
          editable={!isSubmitting}
        />

        <TouchableOpacity
          style={[styles.primaryButton, isSubmitting && styles.primaryButtonDisabled]}
          onPress={onSubmit}
          disabled={isSubmitting}
          activeOpacity={0.85}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FBF8F3" />
          ) : (
            <>
              <Text style={styles.primaryButtonText}>Kirim Kode Verifikasi</Text>
              <Feather name="arrow-right" size={18} color="#FBF8F3" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  </KeyboardAvoidingView>
);

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
    backgroundColor: '#FBF8F3',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#FBF8F3',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  authCard: {
    backgroundColor: '#FFFDF9',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E4D9C6',
    padding: 22,
    shadowColor: '#14523A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  backButtonInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  backButtonInlineText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1D1B17',
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1D1B17',
    fontFamily: theme.typography.serif,
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 12,
    color: '#5A544C',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 17,
    maxWidth: 290,
  },
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FDE8E8',
    borderColor: '#F8B4B4',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
  },
  errorAlertText: {
    flex: 1,
    fontSize: 12,
    color: '#C00511',
    fontWeight: '600',
    lineHeight: 16,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#14523A',
    borderRadius: 14,
    height: 48,
    marginTop: 14,
    shadowColor: '#14523A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
