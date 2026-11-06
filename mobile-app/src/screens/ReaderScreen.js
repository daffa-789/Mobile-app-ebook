import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { theme } from '../theme';
import { useBooks } from '../context/BookContext';

export const ReaderScreen = ({ book, onBack }) => {
  const { isDownloaded, downloadBook } = useBooks();
  const [fontSize, setFontSize] = useState(16);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = book.pages_count || 12;
  const downloaded = isDownloaded(book.id);

  const increaseFont = () => setFontSize((f) => Math.min(f + 2, 26));
  const decreaseFont = () => setFontSize((f) => Math.max(f - 2, 12));

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar Reader */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Kembali</Text>
        </TouchableOpacity>

        <View style={styles.titleContainer}>
          <Text style={styles.bookTitle} numberOfLines={1}>
            {book.title}
          </Text>
          <Text style={styles.bookAuthor} numberOfLines={1}>
            {book.author}
          </Text>
        </View>

        <View style={styles.fontControls}>
          <TouchableOpacity onPress={decreaseFont} style={styles.fontBtn}>
            <Text style={styles.fontBtnText}>A-</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={increaseFont} style={styles.fontBtn}>
            <Text style={styles.fontBtnText}>A+</Text>
          </TouchableOpacity>
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
          <Text style={styles.chapterHeader}>Bagian {currentPage}</Text>

          <Text style={[styles.bodyText, { fontSize, lineHeight: fontSize * 1.8 }]}>
            {book.sample_text ||
              `Buku "${book.title}" karya ${book.author}.\n\nNaskah digital ini dilindungi hak cipta dan disajikan khusus untuk pengamal Wahidiyah melalui aplikasi Wahidiyah Book.`}
          </Text>

          <View style={styles.watermark}>
            <Text style={styles.watermarkText}>Perpustakaan Digital Wahidiyah</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Bar: Paging & Offline Download */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.pageBtn, currentPage <= 1 && styles.pageBtnDisabled]}
          disabled={currentPage <= 1}
          onPress={() => setCurrentPage((p) => Math.max(p - 1, 1))}
        >
          <Text style={styles.pageBtnText}>◀ Hal Sebelumnya</Text>
        </TouchableOpacity>

        <Text style={styles.pageIndicator}>
          Hal {currentPage} / {totalPages}
        </Text>

        <TouchableOpacity
          style={[styles.pageBtn, currentPage >= totalPages && styles.pageBtnDisabled]}
          disabled={currentPage >= totalPages}
          onPress={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
        >
          <Text style={styles.pageBtnText}>Berikutnya ▶</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingTop: theme.spacing.xl,
  },
  backButton: {
    paddingVertical: 6,
    paddingRight: 10,
  },
  backButtonText: {
    fontSize: 13,
    color: theme.colors.primary,
    fontWeight: '700',
  },
  titleContainer: {
    flex: 1,
    marginHorizontal: 8,
  },
  bookTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.ink,
  },
  bookAuthor: {
    fontSize: 10,
    color: theme.colors.inkSecondary,
  },
  fontControls: {
    flexDirection: 'row',
    gap: 4,
  },
  fontBtn: {
    backgroundColor: theme.colors.surfaceLight,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  fontBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.ink,
  },
  contentScroll: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentInner: {
    padding: theme.spacing.md,
    paddingBottom: 40,
  },
  pageCard: {
    backgroundColor: theme.colors.surfaceLight,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 450,
  },
  ornamentLine: {
    height: 2,
    backgroundColor: theme.colors.gold,
    width: 60,
    alignSelf: 'center',
    marginBottom: theme.spacing.md,
    borderRadius: 2,
  },
  chapterHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    letterSpacing: 1,
  },
  bodyText: {
    color: theme.colors.ink,
    fontFamily: theme.typography.serif,
  },
  watermark: {
    marginTop: 40,
    alignItems: 'center',
    opacity: 0.3,
  },
  watermarkText: {
    fontSize: 10,
    letterSpacing: 2,
    color: theme.colors.inkMuted,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  pageBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.primary50,
    borderRadius: theme.radius.sm,
  },
  pageBtnDisabled: {
    opacity: 0.3,
  },
  pageBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  pageIndicator: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.inkSecondary,
  },
});
