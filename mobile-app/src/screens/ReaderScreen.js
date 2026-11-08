import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../theme';
import { useBooks } from '../context/BookContext';
import { apiRequest } from '../api/client.js';
import { htmlToPlainText, paginateText, buildReaderFallback } from '../lib/catalog.js';

export const ReaderScreen = ({ book, onBack }) => {
  const { isDownloaded, downloadBook, deleteDownloadedBook } = useBooks();

  const [fontSize, setFontSize] = useState(16);
  const [currentPage, setCurrentPage] = useState(1);
  const [pages, setPages] = useState([]);
  const [isLoadingContent, setIsLoadingContent] = useState(true);
  const [contentError, setContentError] = useState(null);
  const [fullContentText, setFullContentText] = useState('');

  const isPdf =
    String(book?.file_type || '').toLowerCase() === 'pdf' ||
    String(book?.content_name || '')
      .toLowerCase()
      .endsWith('.pdf');
  const downloaded = isDownloaded(book.id);

  // Ambil konten naskah dari cache lokal atau server /api/books/:id/html
  useEffect(() => {
    let isMounted = true;

    const loadBookContent = async () => {
      setIsLoadingContent(true);
      setContentError(null);

      // Cek apakah ada konten offline yang tersimpan di storage
      try {
        const offlineText = await AsyncStorage.getItem(`@book_content_${book.id}`);
        if (offlineText && isMounted) {
          setFullContentText(offlineText);
          const paginated = paginateText(offlineText);
          setPages(paginated);
          setIsLoadingContent(false);
          return;
        }
      } catch (_) {}

      // Jika buku format PDF, siapkan pratinjau teks pembaca
      if (isPdf) {
        if (isMounted) {
          const fallback = book.sample_text || buildReaderFallback(book);
          setFullContentText(fallback);
          setPages(paginateText(fallback));
          setIsLoadingContent(false);
        }
        return;
      }

      // Ambil naskah dari server Express: /api/books/:id/html
      try {
        const res = await apiRequest(`/api/books/${book.id}/html`);
        if (res?.html && isMounted) {
          const plain = htmlToPlainText(res.html);
          setFullContentText(plain);
          const paginated = paginateText(plain);
          setPages(paginated.length > 0 ? paginated : [plain]);
        } else if (isMounted) {
          const fallback = book.sample_text || buildReaderFallback(book);
          setFullContentText(fallback);
          setPages(paginateText(fallback));
        }
      } catch (err) {
        console.warn('[ReaderScreen] Gagal memuat naskah HTML:', err.message);
        if (isMounted) {
          const fallback = book.sample_text || buildReaderFallback(book);
          setFullContentText(fallback);
          setPages(paginateText(fallback));
          setContentError('Memuat pratinjau lokal: tidak dapat terhubung ke server.');
        }
      } finally {
        if (isMounted) setIsLoadingContent(false);
      }
    };

    loadBookContent();

    return () => {
      isMounted = false;
    };
  }, [book, isPdf]);

  const totalPages = pages.length > 0 ? pages.length : 1;
  const currentContent = pages[currentPage - 1] || fullContentText || 'Naskah belum tersedia.';

  const increaseFont = () => setFontSize((f) => Math.min(f + 2, 26));
  const decreaseFont = () => setFontSize((f) => Math.max(f - 2, 12));

  const handleToggleDownload = async () => {
    if (downloaded) {
      Alert.alert(
        'Hapus Unduhan',
        `Hapus naskah "${book.title}" dari penyimpanan offline perangkat?`,
        [
          { text: 'Batal', style: 'cancel' },
          {
            text: 'Hapus',
            style: 'destructive',
            onPress: async () => {
              await deleteDownloadedBook(book.id);
            },
          },
        ],
      );
    } else {
      const res = await downloadBook(book, fullContentText);
      if (res.success) {
        Alert.alert(
          'Tersimpan Offline',
          `Naskah "${book.title}" berhasil disimpan di perangkat dan siap dibaca tanpa koneksi internet.`,
        );
      } else {
        Alert.alert('Gagal Mengunduh', res.error || 'Tidak dapat menyimpan naskah offline.');
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar Reader */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
          <Feather name="arrow-left" size={18} color="#1D1B17" />
          <Text style={styles.backButtonText}>Kembali</Text>
        </TouchableOpacity>

        <View style={styles.titleContainer}>
          <Text style={styles.bookTitle} numberOfLines={1}>
            {book.title}
          </Text>
          <Text style={styles.bookAuthor} numberOfLines={1}>
            {book.author}
          </Text>
        </View>

        <View style={styles.rightActions}>
          <TouchableOpacity
            onPress={handleToggleDownload}
            style={[styles.downloadBtn, downloaded && styles.downloadBtnActive]}
            activeOpacity={0.7}
          >
            <Feather
              name={downloaded ? 'check-circle' : 'download'}
              size={16}
              color={downloaded ? '#14523A' : '#5A544C'}
            />
          </TouchableOpacity>

          <View style={styles.fontControls}>
            <TouchableOpacity onPress={decreaseFont} style={styles.fontBtn} activeOpacity={0.7}>
              <Text style={styles.fontBtnText}>A-</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={increaseFont} style={styles.fontBtn} activeOpacity={0.7}>
              <Text style={styles.fontBtnText}>A+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Reader Body Content */}
      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={styles.contentInner}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageCard}>
          <View style={styles.ornamentLine} />

          {/* Banner Informasi Format PDF jika berlaku */}
          {isPdf ? (
            <View style={styles.pdfNoticeCard}>
              <Feather name="file-text" size={20} color="#14523A" />
              <View style={styles.pdfNoticeTextWrap}>
                <Text style={styles.pdfNoticeTitle}>
                  Naskah Format PDF ({book.pages_count} Hal)
                </Text>
                <Text style={styles.pdfNoticeDesc}>
                  Naskah digital lengkap dapat dibuka melalui viewer web atau diunduh untuk dibaca
                  secara offline. Pratinjau teks tersedia di bawah.
                </Text>
              </View>
            </View>
          ) : null}

          {/* Notifikasi Status Galat Koneksi */}
          {contentError ? (
            <View style={styles.errorNotice}>
              <Feather name="wifi-off" size={14} color="#854D0E" />
              <Text style={styles.errorNoticeText}>{contentError}</Text>
            </View>
          ) : null}

          <View style={styles.pageHeaderRow}>
            <Text style={styles.chapterHeader}>Bagian {currentPage}</Text>
            {downloaded && (
              <View style={styles.offlineBadge}>
                <Feather name="check" size={11} color="#14523A" />
                <Text style={styles.offlineBadgeText}>Offline</Text>
              </View>
            )}
          </View>

          {isLoadingContent ? (
            <View style={styles.loadingWrapper}>
              <ActivityIndicator size="large" color="#14523A" />
              <Text style={styles.loadingText}>Menyiapkan lembaran naskah...</Text>
            </View>
          ) : (
            <Text style={[styles.bodyText, { fontSize, lineHeight: fontSize * 1.85 }]}>
              {currentContent}
            </Text>
          )}

          <View style={styles.watermark}>
            <Text style={styles.watermarkText}>Perpustakaan Digital Sholawat Wahidiyah</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Bar: Paging & Navigasi Halaman */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.pageBtn, currentPage <= 1 && styles.pageBtnDisabled]}
          disabled={currentPage <= 1}
          onPress={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          activeOpacity={0.7}
        >
          <Feather name="chevron-left" size={16} color={currentPage <= 1 ? '#A8A199' : '#1D1B17'} />
          <Text style={[styles.pageBtnText, currentPage <= 1 && styles.pageBtnTextDisabled]}>
            Sebelumnya
          </Text>
        </TouchableOpacity>

        <Text style={styles.pageIndicator}>
          Hal {currentPage} / {totalPages}
        </Text>

        <TouchableOpacity
          style={[styles.pageBtn, currentPage >= totalPages && styles.pageBtnDisabled]}
          disabled={currentPage >= totalPages}
          onPress={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
          activeOpacity={0.7}
        >
          <Text
            style={[styles.pageBtnText, currentPage >= totalPages && styles.pageBtnTextDisabled]}
          >
            Berikutnya
          </Text>
          <Feather
            name="chevron-right"
            size={16}
            color={currentPage >= totalPages ? '#A8A199' : '#1D1B17'}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBF8F3',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E4D9C6',
    backgroundColor: '#FFFDF9',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  backButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1D1B17',
  },
  titleContainer: {
    flex: 1,
    marginHorizontal: 10,
    alignItems: 'center',
  },
  bookTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1D1B17',
  },
  bookAuthor: {
    fontSize: 11,
    color: '#7C756C',
    marginTop: 1,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  downloadBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F5EFE6',
  },
  downloadBtnActive: {
    backgroundColor: '#DCEDE4',
  },
  fontControls: {
    flexDirection: 'row',
    backgroundColor: '#F5EFE6',
    borderRadius: 8,
    padding: 2,
  },
  fontBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  fontBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1D1B17',
  },
  contentScroll: {
    flex: 1,
  },
  contentInner: {
    padding: 16,
    paddingBottom: 40,
    alignItems: 'center',
  },
  pageCard: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: '#FFFDF9',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E4D9C6',
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  ornamentLine: {
    height: 3,
    width: 48,
    backgroundColor: '#14523A',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  pdfNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#DCEDE4',
    borderColor: '#A7D4BF',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  pdfNoticeTextWrap: {
    flex: 1,
  },
  pdfNoticeTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#14523A',
  },
  pdfNoticeDesc: {
    fontSize: 11,
    color: '#284E3F',
    marginTop: 2,
    lineHeight: 15,
  },
  errorNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF9C3',
    borderColor: '#FDE047',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  errorNoticeText: {
    fontSize: 11,
    color: '#854D0E',
    flex: 1,
  },
  pageHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  chapterHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: '#7C756C',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCEDE4',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  offlineBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#14523A',
  },
  loadingWrapper: {
    paddingVertical: 48,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: '#7C756C',
  },
  bodyText: {
    color: '#1D1B17',
    letterSpacing: 0.2,
  },
  watermark: {
    marginTop: 32,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0E8DA',
    alignItems: 'center',
  },
  watermarkText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#A8A199',
    letterSpacing: 0.5,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFDF9',
    borderTopWidth: 1,
    borderTopColor: '#E4D9C6',
  },
  pageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F5EFE6',
  },
  pageBtnDisabled: {
    opacity: 0.5,
  },
  pageBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1D1B17',
  },
  pageBtnTextDisabled: {
    color: '#A8A199',
  },
  pageIndicator: {
    fontSize: 12,
    fontWeight: '800',
    color: '#5A544C',
  },
});
