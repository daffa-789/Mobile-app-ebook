import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { useBooks } from '../context/BookContext';
import { formatRupiah, formatPurchaseDate } from '../lib/catalog';

export const SubscriptionHistoryScreen = ({ onBack }) => {
  const { subscriptions } = useBooks();

  const handleDownloadPdf = (sub) => {
    const ref = sub.id || sub.ref || 'TRX-PRO';
    const plan = sub.plan_name || sub.planName || 'Paket Bulanan';
    const amount =
      sub.formattedAmount || sub.price || (sub.amount ? formatRupiah(sub.amount) : 'Rp 25.000');

    Alert.alert(
      'Unduh Kwitansi PDF',
      `Kwitansi transaksi ${ref} untuk ${plan} (${amount}) berhasil disiapkan.`,
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
        {subscriptions.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <Feather name="clock" size={24} color="#7C756C" />
            </View>
            <Text style={styles.emptyTitle}>Belum Ada Riwayat Langganan</Text>
            <Text style={styles.emptyDesc}>
              Seluruh transaksi paket keanggotaan Pro dan riwayat pembayaran Anda akan dicatat di
              sini.
            </Text>
          </View>
        ) : (
          subscriptions.map((sub) => {
            const plan = sub.plan_name || sub.planName || 'Paket Bulanan';
            const price =
              sub.formattedAmount ||
              sub.price ||
              (sub.amount ? formatRupiah(sub.amount) : 'Rp 25.000');
            const refNo = sub.id || sub.ref || 'TRX-PRO';
            const dateStr =
              sub.formattedDate ||
              (sub.created_at ? formatPurchaseDate(sub.created_at) : 'Tanggal pembelian');
            const isSettled =
              sub.status === 'success' || sub.status === 'settlement' || sub.status === 'Aktif';

            return (
              <View key={sub.id} style={styles.subCard}>
                <View style={styles.subTopRow}>
                  <View style={styles.planNameWrap}>
                    <Text style={styles.planNameText}>{plan}</Text>
                    <Feather name="sparkles" size={14} color="#B8860B" />
                  </View>

                  <View style={[styles.statusBadge, isSettled && styles.statusBadgeSuccess]}>
                    <Text
                      style={[styles.statusBadgeText, isSettled && styles.statusBadgeTextSuccess]}
                    >
                      {isSettled ? 'Aktif' : sub.status || 'Pending'}
                    </Text>
                  </View>
                </View>

                <View style={styles.subMiddleRow}>
                  <View style={styles.subInfoWrap}>
                    <Text style={styles.priceText}>{price}</Text>
                    <Text style={styles.refText}>{refNo}</Text>
                    <Text style={styles.dateText}>Dibeli: {dateStr}</Text>
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
            );
          })
        )}
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
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E4D9C6',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  subTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
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
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
  },
  statusBadgeSuccess: {
    backgroundColor: '#DCEDE4',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  statusBadgeTextSuccess: {
    color: '#14523A',
  },
  subMiddleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0E8DA',
  },
  subInfoWrap: {
    flex: 1,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#14523A',
    marginBottom: 2,
  },
  refText: {
    fontSize: 11,
    color: '#7C756C',
    fontWeight: '500',
  },
  dateText: {
    fontSize: 11,
    color: '#8C857B',
    marginTop: 2,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#DCEDE4',
  },
  downloadButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#14523A',
  },
  emptyCard: {
    backgroundColor: '#FFFDF9',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E4D9C6',
    padding: 32,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F5EFE6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1D1B17',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 12,
    color: '#7C756C',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
});
