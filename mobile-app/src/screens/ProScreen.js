import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { useAuth } from '../context/AuthContext';

export const ProScreen = ({ onOpenAuth }) => {
  const { user, isPro } = useAuth();

  const handleSubscribe = () => {
    if (isPro) {
      Alert.alert(
        'Paket Aktif',
        'Anda telah memiliki langganan aktif Paket Bulanan (Berlaku hingga 03 Des 2026).',
      );
      return;
    }
    Alert.alert(
      'Pembayaran Pro',
      'Pembayaran keanggotaan Pro dilakukan melalui QRIS Midtrans resmi di platform web kami atau hubungi admin.',
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.cardWrapper}>
        <View style={styles.proCard}>
          {/* Judul Paket */}
          <Text style={styles.planTitle}>Paket Bulanan</Text>

          {/* Harga */}
          <View style={styles.priceRow}>
            <Text style={styles.priceNumber}>Rp 25.000</Text>
            <Text style={styles.pricePeriod}>/bulan</Text>
          </View>

          {/* Garis Pembatas */}
          <View style={styles.divider} />

          {/* Daftar Fitur Keunggulan */}
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <View style={styles.checkCircle}>
                <Feather name="check" size={12} color="#14523A" />
              </View>
              <Text style={styles.featureText}>Seluruh kitab bertanda Pro terbuka penuh</Text>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.checkCircle}>
                <Feather name="check" size={12} color="#14523A" />
              </View>
              <Text style={styles.featureText}>Dukungan pelanggan standar</Text>
            </View>
          </View>

          {/* Tombol Status Paket (1:1 dengan Screenshot) */}
          {isPro ? (
            <TouchableOpacity
              style={styles.activePlanButton}
              onPress={handleSubscribe}
              activeOpacity={0.8}
            >
              <Feather name="check" size={16} color="#14523A" />
              <Text style={styles.activePlanText}>Paket Sedang Aktif</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.subscribeButton}
              onPress={handleSubscribe}
              activeOpacity={0.85}
            >
              <Text style={styles.subscribeButtonText}>Berlangganan Sekarang</Text>
              <Feather name="arrow-right" size={16} color="#FBF8F3" />
            </TouchableOpacity>
          )}
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
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 32,
    paddingBottom: 96,
    justifyContent: 'center',
  },
  cardWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  proCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFDF9',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E4D9C6',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  planTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1D1B17',
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  priceNumber: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1D1B17',
    letterSpacing: -0.5,
  },
  pricePeriod: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5A544C',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0E8DA',
    marginVertical: 20,
  },
  featuresList: {
    gap: 14,
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#DCEDE4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontSize: 13,
    color: '#2B2823',
    fontWeight: '500',
    flex: 1,
  },
  activePlanButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F0E8DA',
    borderRadius: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E4D9C6',
  },
  activePlanText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#5A544C',
  },
  subscribeButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#14523A',
    borderRadius: 16,
    paddingVertical: 14,
    shadowColor: '#14523A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  subscribeButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FBF8F3',
  },
});
