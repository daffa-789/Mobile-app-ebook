import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '../theme';
import { useAuth } from '../context/AuthContext';
import { useBooks } from '../context/BookContext';
import {
  createPaymentCharge,
  checkPaymentStatus,
  cancelPayment,
  getQrImageUrl,
} from '../api/payments.js';
import { generateQrPng } from '../lib/qr.js';
import { formatRupiah } from '../lib/catalog.js';
import { copyTextWithToast } from '../lib/clipboard.js';

export const ProScreen = ({ onOpenAuth }) => {
  const { user, isPro, refreshSession } = useAuth();
  const { refreshSubscriptions } = useBooks();

  const [activeOrder, setActiveOrder] = useState(null);
  const [localQrUri, setLocalQrUri] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const pollIntervalRef = useRef(null);

  // Bersihkan polling saat unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  // Hitung mundur masa berlaku QRIS (15 menit standar Midtrans)
  useEffect(() => {
    let timer;
    if (secondsLeft > 0) {
      timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    } else if (secondsLeft === 0 && activeOrder) {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    }
    return () => clearTimeout(timer);
  }, [secondsLeft, activeOrder]);

  // Polling status transaksi setiap 5 detik
  const startPollingStatus = (orderId) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await checkPaymentStatus(orderId);
        if (res?.isPaid || res?.status === 'success' || res?.status === 'settlement') {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          setActiveOrder(null);
          setLocalQrUri(null);
          await refreshSession();
          await refreshSubscriptions();
          Alert.alert(
            'Pembayaran Berhasil!',
            'Alhamdulillah, pembayaran langganan Pro Anda telah terverifikasi. Seluruh kitab kini terbuka penuh.',
          );
        }
      } catch (err) {
        console.warn('[ProScreen] Gagal memeriksa status berkala:', err.message);
      }
    }, 5000);
  };

  /* Handler terbaru disimpan di ref: aksi yang dijalankan ulang setelah login
   * harus memakai `user`/`isPro` dari render terkini, bukan closure lama. */
  const chargeRef = useRef(null);
  chargeRef.current = async () => {
    if (isPro) {
      Alert.alert(
        'Paket Aktif',
        'Anda telah memiliki keanggotaan Pro aktif. Nikmati akses tanpa batas ke seluruh kitab.',
      );
      return;
    }

    setErrorMessage('');
    setIsGenerating(true);

    try {
      const res = await createPaymentCharge({
        planId: 'monthly',
        phone: user?.phone,
      });

      if (res?.orderId) {
        setActiveOrder(res);

        // Hasilkan gambar QR murni JS dari payload EMVCo jika tersedia
        if (res.qrString) {
          try {
            const { dataUri } = generateQrPng(res.qrString, { cellSize: 5, margin: 4 });
            setLocalQrUri(dataUri);
          } catch (qrErr) {
            console.warn('[ProScreen] Gagal generate QR lokal:', qrErr);
          }
        }

        // Hitung selisih detik masa berlaku
        if (res.expiredAt) {
          const diffMs = new Date(res.expiredAt).getTime() - Date.now();
          setSecondsLeft(Math.max(0, Math.floor(diffMs / 1000)));
        } else {
          setSecondsLeft(15 * 60); // 15 menit fallback
        }

        startPollingStatus(res.orderId);
      } else {
        setErrorMessage(res.message || 'Gagal membuat tagihan QRIS.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Tidak dapat terhubung ke gateway pembayaran Midtrans.');
    } finally {
      setIsGenerating(false);
    }
  };

  /* Tamu boleh melihat halaman Pro, tapi tidak boleh membuat tagihan QRIS.
   * Aksi diteruskan ke sheet login lalu dijalankan ulang setelah masuk. */
  const handleSubscribePress = () => {
    if (!user) {
      onOpenAuth?.(() => chargeRef.current?.());
      return;
    }
    return chargeRef.current?.();
  };

  /* Tombol X = satu ketukan langsung membatalkan tagihan, tanpa dialog
   * konfirmasi. Tampilan sengaja dibuat paling minimal. */
  const handleCancelOrder = async () => {
    if (!activeOrder?.orderId) return;
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    cancelPayment(activeOrder.orderId).catch(() => null);
    setActiveOrder(null);
    setLocalQrUri(null);
    setSecondsLeft(0);
  };

  const formatCountdown = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  /* Galat konfigurasi (kunci kosong / kunci produksi + flag sandbox) tidak
   * akan sembuh dengan mencoba ulang berkali-kali. Beri petunjuk yang tepat
   * supaya pengguna tidak mengira ini gangguan jaringan. */
  const isConfigError = /konfigurasi|belum dikonfigurasi|MIDTRANS_|kunci sandbox/i.test(
    errorMessage,
  );

  /* Tautan yang disalin HARUS URL gambar PNG, bukan payload EMVCo `qrString`.
   * Server mengirim `qrMidtransUrl` (URL publik Midtrans) khusus sandbox;
   * URL proxy `/qris/:id/qr.png` hanya cadangan. */
  const simulatorQrLink =
    activeOrder?.qrMidtransUrl ||
    (activeOrder?.qrImageUrl && activeOrder?.orderId ? getQrImageUrl(activeOrder.orderId) : null) ||
    '';
  /* Satu-satunya aksi di kartu QRIS: salin tautan gambar, lalu popup
   * "berhasil di salin". Detailnya ada di lib/clipboard.js supaya layar
   * ini tetap fokus pada tampilan. */
  const handleCopyQrLink = async () => {
    const result = await copyTextWithToast(simulatorQrLink);
    if (!result.success) {
      Alert.alert('Gagal Menyalin', result.error || 'Coba lagi beberapa saat.');
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.cardWrapper}>
        <View style={styles.proCard}>
          {/* Header Paket */}
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

          {/* Error Message */}
          {errorMessage ? (
            <View style={styles.errorBox}>
              <Feather name="alert-circle" size={16} color="#DC2626" style={styles.errorBoxIcon} />
              <View style={styles.errorBoxContent}>
                <Text style={styles.errorBoxText}>{errorMessage}</Text>
                <Text style={styles.errorBoxHint}>
                  {isConfigError
                    ? 'Pembayaran belum bisa diproses sampai konfigurasi Midtrans diperbaiki. Hubungi admin/aplikasi perlu diperbarui.'
                    : 'Periksa koneksi internet, lalu coba lagi.'}
                </Text>
                {!isConfigError ? (
                  <TouchableOpacity
                    style={styles.retryButton}
                    onPress={handleSubscribePress}
                    disabled={isGenerating}
                    activeOpacity={0.7}
                  >
                    <Feather name="refresh-cw" size={12} color="#B91C1C" />
                    <Text style={styles.retryButtonText}>Coba Lagi</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          ) : null}

          {/* Tampilan QRIS Saat Transaksi Aktif */}
          {activeOrder ? (
            <View style={styles.qrisSection}>
              <View style={styles.qrisHeader}>
                <View style={styles.qrisHeaderText}>
                  <Text style={styles.qrisTitle}>Pindai QRIS untuk Membayar</Text>
                  <Text style={styles.qrisSubtitle}>
                    Buka GoPay, OVO, Dana, BCA, atau aplikasi m-banking pilihan Anda.
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.qrisCloseBtn}
                  onPress={handleCancelOrder}
                  activeOpacity={0.7}
                  accessibilityLabel="Batalkan tagihan"
                  accessibilityRole="button"
                >
                  <Feather name="x" size={18} color="#5A544C" />
                </TouchableOpacity>
              </View>

              {/* Box Gambar QR */}
              <View style={styles.qrImageContainer}>
                {localQrUri ? (
                  <Image source={{ uri: localQrUri }} style={styles.qrImage} resizeMode="contain" />
                ) : activeOrder.qrMidtransUrl ? (
                  <Image
                    source={{ uri: activeOrder.qrMidtransUrl }}
                    style={styles.qrImage}
                    resizeMode="contain"
                  />
                ) : (
                  <ActivityIndicator size="large" color="#14523A" />
                )}
              </View>

              {/* Timer Masa Berlaku */}
              <View style={styles.timerWrap}>
                <Feather name="clock" size={14} color="#B8860B" />
                <Text style={styles.timerText}>
                  {secondsLeft > 0
                    ? `Berlaku hingga: ${formatCountdown(secondsLeft)}`
                    : 'Kode QRIS telah kedaluwarsa'}
                </Text>
              </View>

              {/* Nominal Pembayaran */}
              <View style={styles.amountWrap}>
                <Text style={styles.amountLabel}>Total Tagihan:</Text>
                <Text style={styles.amountValue}>
                  {formatRupiah(activeOrder.grossAmount || 25000)}
                </Text>
              </View>

              {/* Satu-satunya aksi: salin tautan gambar QR. Tidak ada judul
                  simulator, petunjuk tempel, alamat, maupun tombol lain. */}
              {simulatorQrLink ? (
                <TouchableOpacity
                  style={styles.copyLinkBtn}
                  onPress={handleCopyQrLink}
                  activeOpacity={0.85}
                  accessibilityLabel="Salin tautan"
                  accessibilityRole="button"
                >
                  <Feather name="copy" size={14} color="#FBF8F3" />
                  <Text style={styles.copyLinkBtnText}>Salin Tautan</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : isPro ? (
            <TouchableOpacity
              style={styles.activePlanButton}
              onPress={handleSubscribePress}
              activeOpacity={0.8}
            >
              <Feather name="check" size={16} color="#14523A" />
              <Text style={styles.activePlanText}>Paket Sedang Aktif</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.subscribeButton, isGenerating && styles.subscribeButtonDisabled]}
              onPress={handleSubscribePress}
              disabled={isGenerating}
              activeOpacity={0.85}
            >
              {isGenerating ? (
                <ActivityIndicator color="#FBF8F3" />
              ) : (
                <>
                  <Text style={styles.subscribeButtonText}>Berlangganan Sekarang</Text>
                  <Feather name="arrow-right" size={16} color="#FBF8F3" />
                </>
              )}
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
    color: '#1D1B17',
    fontWeight: '500',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorBoxIcon: {
    marginTop: 1,
  },
  errorBoxContent: {
    flex: 1,
  },
  errorBoxText: {
    fontSize: 12,
    color: '#B91C1C',
    fontWeight: '600',
    lineHeight: 17,
  },
  errorBoxHint: {
    fontSize: 11,
    color: '#B91C1C',
    opacity: 0.8,
    marginTop: 6,
    lineHeight: 15,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FFF1F1',
  },
  retryButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B91C1C',
  },
  subscribeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#14523A',
    borderRadius: 14,
    height: 48,
    shadowColor: '#14523A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  subscribeButtonDisabled: {
    opacity: 0.6,
  },
  subscribeButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FBF8F3',
  },
  activePlanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#DCEDE4',
    borderRadius: 14,
    height: 48,
  },
  activePlanText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#14523A',
  },
  // QRIS Payment Section
  qrisSection: {
    marginTop: 8,
    alignItems: 'center',
    backgroundColor: '#FAF5EE',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E4D9C6',
  },
  qrisHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 14,
  },
  qrisHeaderText: {
    flex: 1,
    alignItems: 'center',
    paddingRight: 8,
  },
  qrisCloseBtn: {
    padding: 4,
    marginTop: -2,
  },
  qrisTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1D1B17',
    textAlign: 'center',
    marginBottom: 4,
  },
  qrisSubtitle: {
    fontSize: 11,
    color: '#7C756C',
    textAlign: 'center',
    lineHeight: 16,
  },
  qrImageContainer: {
    width: 220,
    height: 220,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E4D9C6',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 12,
  },
  qrImage: {
    width: 200,
    height: 200,
  },
  timerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  timerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#854D0E',
  },
  amountWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  amountLabel: {
    fontSize: 12,
    color: '#5A544C',
  },
  amountValue: {
    fontSize: 15,
    fontWeight: '900',
    color: '#14523A',
  },
  copyLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    height: 44,
    borderRadius: 12,
    backgroundColor: '#14523A',
  },
  copyLinkBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FBF8F3',
  },
});
