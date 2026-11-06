import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { theme } from '../theme';
import { useBooks } from '../context/BookContext';

export const DownloadsScreen = ({ onOpenBook }) => {
  const { downloadedBooks, deleteDownloadedBook } = useBooks();

  const totalMb = downloadedBooks
    .reduce((acc, b) => acc + (parseFloat(b.fileSizeMb) || 1.5), 0)
    .toFixed(1);

  const confirmDelete = (book) => {
    Alert.alert('Hapus Unduhan', `Yakin ingin menghapus berkas offline "${book.title}"?`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: () => deleteDownloadedBook(book.id),
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.subtitle}>PENYIMPANAN OFFLINE</Text>
        <Text style={styles.title}>Buku Terunduh</Text>
        <Text style={styles.desc}>
          Naskah yang dapat dibaca kapan saja tanpa menggunakan koneksi internet.
        </Text>
      </View>

      {/* Storage Indicator */}
      <View style={styles.storageCard}>
        <View style={styles.storageHeader}>
          <Text style={styles.storageTitle}>Kapasitas Terpakai</Text>
          <Text style={styles.storageValue}>{totalMb} MB</Text>
        </View>
        <View style={styles.storageBarBg}>
          <View
            style={[
              styles.storageBarFill,
              { width: `${Math.min(downloadedBooks.length * 20, 100)}%` },
            ]}
          />
        </View>
        <Text style={styles.storageSub}>
          {downloadedBooks.length} judul tersimpan secara aman di perangkat ini.
        </Text>
      </View>

      {downloadedBooks.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📥</Text>
          <Text style={styles.emptyTitle}>Belum Ada Buku Terunduh</Text>
          <Text style={styles.emptyDesc}>
            Buka katalog di Beranda dan tekan tombol "Unduh" untuk menyimpan buku agar bisa dibaca
            saat offline.
          </Text>
        </View>
      ) : (
        <View style={styles.bookList}>
          {downloadedBooks.map((book) => (
            <View key={book.id} style={styles.bookCard}>
              <Image source={{ uri: book.cover_url }} style={styles.bookCover} resizeMode="cover" />
              <View style={styles.bookInfo}>
                <Text style={styles.bookTitle} numberOfLines={2}>
                  {book.title}
                </Text>
                <Text style={styles.bookAuthor}>{book.author}</Text>
                <Text style={styles.fileSizeText}>
                  💾 {book.fileSizeMb || '1.5'} MB • Tersimpan
                </Text>

                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.readButton}
                    onPress={() => onOpenBook(book)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.readButtonText}>Baca Offline</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.deleteButton} onPress={() => confirmDelete(book)}>
                    <Text style={styles.deleteButtonText}>Hapus</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.md,
  },
  header: {
    paddingTop: theme.spacing.xl + 10,
    paddingBottom: theme.spacing.md,
  },
  subtitle: {
    fontSize: 10,
    letterSpacing: 2,
    color: theme.colors.primary,
    fontWeight: '700',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.ink,
    fontFamily: theme.typography.serif,
  },
  desc: {
    fontSize: 12,
    color: theme.colors.inkSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  storageCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
  },
  storageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  storageTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.ink,
  },
  storageValue: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.primary,
  },
  storageBarBg: {
    height: 6,
    backgroundColor: theme.colors.border,
    borderRadius: 3,
    marginVertical: 8,
    overflow: 'hidden',
  },
  storageBarFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 3,
  },
  storageSub: {
    fontSize: 11,
    color: theme.colors.inkMuted,
  },
  emptyState: {
    backgroundColor: theme.colors.surfaceLight,
    padding: theme.spacing.xl,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.ink,
    marginBottom: 4,
  },
  emptyDesc: {
    fontSize: 12,
    color: theme.colors.inkMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  bookList: {
    gap: 12,
  },
  bookCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.sm,
    gap: 12,
  },
  bookCover: {
    width: 75,
    height: 100,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.border,
  },
  bookInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  bookTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.ink,
  },
  bookAuthor: {
    fontSize: 11,
    color: theme.colors.inkSecondary,
  },
  fileSizeText: {
    fontSize: 10,
    color: theme.colors.inkMuted,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  readButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    paddingVertical: 6,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
  },
  readButtonText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.sm,
    backgroundColor: '#FFF0F0',
    borderWidth: 1,
    borderColor: '#FFD0D0',
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.error,
  },
});
