import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { useBooks } from '../context/BookContext';

export const SubscriptionHistoryScreen = ({ onBack }) => {
  const { subscriptions } = useBooks();

  const handleDownloadPdf = (sub) => {
    Alert.alert(
      'Unduh Kwitansi PDF',
      `Kwitansi transaksi ${sub.ref} untuk ${sub.planName} (${sub.price}) berhasil disiapkan.`,
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* 1:1 Header Riwayat Langganan */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <Feather name="arrow-left" size={18} color="#1D1B17" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Riwayat Langganan</Text>
      </View>

      {/* 1:1 Daftar Kartu Transaksi */}
      <View style={styles.listContainer}>
        {subscriptions.map((sub) => (
          <View key={sub.id} style={styles.subCard}>
            <View style={styles.subTopRow}>
              <View style={styles.planNameWrap}>
                <Text style={styles.planNameText}>{sub.planName}</Text>
                <Feather name="sparkles" size={14} color="#B8860B" />
              </View>

              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>{sub.status}</Text>
              </View>
            </View>

            <View style={styles.subMiddleRow}>
              <View>
                <Text style={styles.priceText}>{sub.price}</Text>
                <Text style={styles.refText}>{sub.ref}</Text>
                <Text style={styles.dateText}>Dibeli: 03 Nov 2026, 20:12</Text>
              </View>

              <TouchableOpacity
                style={styles.downloadButton}
                onPress={() => handleDownloadPdf(sub)}
                activeOpacity={0.75}
              >
                <Feather name="download" size={14} color="#14523A" />
                <Text style={styles.downloadButtonText}>Unduh PDF</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0E8DA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1D1B17',
  },
  listContainer: {
    gap: 14,
  },
  subCard: {
    backgroundColor: '#FFFDF9',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E4D9C6',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  subTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  planNameWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  planNameText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1D1B17',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: '#DCEDE4',
    borderWidth: 1,
    borderColor: 'rgba(20, 82, 58, 0.25)',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#14523A',
  },
  subMiddleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#14523A',
    marginBottom: 2,
  },
  refText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#8C857B',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 11,
    color: '#8C857B',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  downloadButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#14523A',
  },
});
