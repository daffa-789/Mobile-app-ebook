import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { theme } from '../theme';
import { useBooks } from '../context/BookContext';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

const CATEGORIES = ['Semua', 'Sholawat', 'Tasawuf', 'Mujahadah', 'Sejarah'];

export const HomeScreen = ({ onOpenBook, onOpenAuth }) => {
  const { books, isDownloaded, downloadBook } = useBooks();
  const { user, isPro } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBooks = books.filter((b) => {
    const matchesCategory = selectedCategory === 'Semua' || b.category === selectedCategory;
    const matchesSearch =
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Elegan */}
      <View style={styles.header}>
        <View>
          <Text style={styles.appSubtitle}>PERPUSTAKAAN DIGITAL</Text>
          <Text style={styles.appTitle}>Wahidiyah Book</Text>
        </View>

        <TouchableOpacity style={styles.authBadge} onPress={onOpenAuth} activeOpacity={0.8}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {user?.fullName ? user.fullName[0].toUpperCase() : 'W'}
            </Text>
          </View>
          <Text style={styles.authBadgeText} numberOfLines={1}>
            {user ? user.fullName || user.email : 'Masuk'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Banner Utama / Khidmah */}
      <View style={styles.heroBanner}>
        <View style={styles.heroOverlay}>
          <Text style={styles.heroTag}>PANDUAN LAKU BATIN</Text>
          <Text style={styles.heroTitle}>Fii Qulubihim Nuurun</Text>
          <Text style={styles.heroDesc}>
            Mendekatkan diri kepada Allah SWT wa Rosuulihi SAW melalui Sholawat Wahidiyah.
          </Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Cari judul naskah, wirid, atau pengarang..."
          placeholderTextColor={theme.colors.inkMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filter Kategori */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScroll}
      >
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryPill, isActive && styles.categoryPillActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Daftar Buku (Katalog 1:1) */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Koleksi Naskah</Text>
        <Text style={styles.sectionCount}>{filteredBooks.length} Buku</Text>
      </View>

      <View style={styles.bookList}>
        {filteredBooks.map((book) => {
          const downloaded = isDownloaded(book.id);

          return (
            <View key={book.id} style={styles.bookCard}>
              <Image source={{ uri: book.cover_url }} style={styles.bookCover} resizeMode="cover" />
              <View style={styles.bookInfo}>
                <View style={styles.badgeRow}>
                  <View
                    style={[
                      styles.proBadge,
                      book.is_pro ? styles.proBadgeActive : styles.freeBadge,
                    ]}
                  >
                    <Text
                      style={[
                        styles.proBadgeText,
                        book.is_pro ? styles.proBadgeTextActive : styles.freeBadgeText,
                      ]}
                    >
                      {book.is_pro ? 'PRO' : 'GRATIS'}
                    </Text>
                  </View>
                  <Text style={styles.categoryLabel}>{book.category}</Text>
                </View>

                <Text style={styles.bookTitle} numberOfLines={2}>
                  {book.title}
                </Text>
                <Text style={styles.bookAuthor}>{book.author}</Text>
                <Text style={styles.bookDesc} numberOfLines={2}>
                  {book.description}
                </Text>

                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.readButton}
                    onPress={() => onOpenBook(book)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.readButtonText}>Membaca</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.downloadButton, downloaded && styles.downloadButtonDone]}
                    onPress={() => downloadBook(book)}
                    disabled={downloaded}
                  >
                    <Text
                      style={[
                        styles.downloadButtonText,
                        downloaded && styles.downloadButtonTextDone,
                      ]}
                    >
                      {downloaded ? '✓ Offline' : 'Unduh'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })}
      </View>

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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: theme.spacing.xl + 10,
    paddingBottom: theme.spacing.md,
  },
  appSubtitle: {
    fontSize: 10,
    letterSpacing: 2,
    color: theme.colors.primary,
    fontWeight: '700',
  },
  appTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.ink,
    fontFamily: theme.typography.serif,
  },
  authBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  avatarCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  avatarText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  authBadgeText: {
    fontSize: 12,
    color: theme.colors.ink,
    fontWeight: '600',
    maxWidth: 90,
  },
  heroBanner: {
    backgroundColor: theme.colors.primary800,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.gold,
  },
  heroOverlay: {
    gap: 4,
  },
  heroTag: {
    color: theme.colors.goldLight,
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: '700',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    fontFamily: theme.typography.serif,
  },
  heroDesc: {
    color: '#DCEDE4',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  searchContainer: {
    marginTop: theme.spacing.md,
  },
  searchInput: {
    backgroundColor: theme.colors.surfaceLight,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    fontSize: 13,
    color: theme.colors.ink,
  },
  categoryScroll: {
    paddingVertical: theme.spacing.md,
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  categoryPillActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  categoryText: {
    fontSize: 12,
    color: theme.colors.inkSecondary,
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.ink,
    fontFamily: theme.typography.serif,
  },
  sectionCount: {
    fontSize: 12,
    color: theme.colors.inkMuted,
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
    overflow: 'hidden',
    padding: theme.spacing.sm,
    gap: 12,
  },
  bookCover: {
    width: 80,
    height: 110,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.border,
  },
  bookInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  proBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  proBadgeActive: {
    backgroundColor: theme.colors.goldBg,
    borderColor: theme.colors.gold,
    borderWidth: 1,
  },
  freeBadge: {
    backgroundColor: theme.colors.primary50,
  },
  proBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  proBadgeTextActive: {
    color: theme.colors.goldDark,
  },
  freeBadgeText: {
    color: theme.colors.primary,
  },
  categoryLabel: {
    fontSize: 11,
    color: theme.colors.inkMuted,
  },
  bookTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.ink,
    marginTop: 2,
  },
  bookAuthor: {
    fontSize: 11,
    color: theme.colors.inkSecondary,
  },
  bookDesc: {
    fontSize: 11,
    color: theme.colors.inkMuted,
    lineHeight: 15,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
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
    fontSize: 12,
    fontWeight: '700',
  },
  downloadButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  downloadButtonDone: {
    backgroundColor: theme.colors.primary50,
    borderColor: theme.colors.primary,
  },
  downloadButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.inkSecondary,
  },
  downloadButtonTextDone: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
});
