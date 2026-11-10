import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  useWindowDimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '../theme';
import { useBooks } from '../context/BookContext';
import { useAuth } from '../context/AuthContext';

const CARD_GAP = 16;

export const HomeScreen = ({ onOpenBook, onOpenPro }) => {
  const { books } = useBooks();
  const { isPro, user } = useAuth();

  const { width: windowWidth } = useWindowDimensions();
  // Kunci lebar maksimal pada 440px (rasio mobile phone) dan hitung 2 kolom presisi
  const effectiveWidth = Math.min(windowWidth, 424);
  const cardWidth = Math.floor((effectiveWidth - 32 - CARD_GAP) / 2);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Katalog langsung tampil: tanpa carousel hero hijau maupun strip tamu. */}

      {/* 2-Column Grid Buku (1:1 dengan Web Mobile) */}
      <View style={styles.bookGrid}>
        {books.map((book) => {
          const isLocked = book.is_locked && !isPro;

          return (
            <TouchableOpacity
              key={book.id}
              style={[styles.bookCard, { width: cardWidth }]}
              activeOpacity={0.88}
              onPress={() => {
                /* Tamu: semua kitab mengarah ke sheet "Masuk untuk membaca".
                 * Pengguna login & bukan Pro: kitab terkunci → tawaran Pro. */
                if (!user) {
                  onOpenBook?.(book);
                  return;
                }
                if (isLocked) {
                  onOpenPro?.();
                } else {
                  onOpenBook?.(book);
                }
              }}
            >
              {/* Wadah Sampul Buku Realistis dengan Rasio 1:1.42 */}
              <View style={styles.coverContainer}>
                {/* Efek Garis Tulang Belakang Buku (Spine Effect) */}
                <View style={styles.spineShadow} />

                {book.cover_local ? (
                  <Image source={book.cover_local} style={styles.coverImage} resizeMode="cover" />
                ) : book.cover_url ? (
                  <Image
                    source={{ uri: book.cover_url }}
                    style={styles.coverImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.coverPlaceholder}>
                    <Feather name="book-open" size={32} color={theme.colors.goldLight} />
                    <Text style={styles.placeholderTitle} numberOfLines={2}>
                      {book.title}
                    </Text>
                  </View>
                )}

                {/* Badge PRO jika Terkunci */}
                {isLocked && (
                  <View style={styles.proBadge}>
                    <Feather name="lock" size={10} color={theme.colors.goldLight} />
                    <Text style={styles.proBadgeText}>PRO</Text>
                  </View>
                )}
              </View>

              {/* Teks Judul Buku di Bawah Sampul */}
              <View style={styles.bookMeta}>
                <Text style={styles.bookTitle} numberOfLines={2}>
                  {book.title}
                </Text>
                {/* Tamu tetap punya "isi" sebelum gerbang login: sinopsis publik. */}
                {!user && book.description ? (
                  <Text style={styles.bookGuestDesc} numberOfLines={2}>
                    {book.description}
                  </Text>
                ) : null}
              </View>
            </TouchableOpacity>
          );
        })}
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
  // Grid Buku
  bookGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
  },
  bookCard: {
    marginBottom: 10,
  },
  coverContainer: {
    width: '100%',
    aspectRatio: 1 / 1.42,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F0E8DA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 3,
    position: 'relative',
  },
  spineShadow: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 10,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0E3D2C',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  placeholderTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FBF8F3',
    textAlign: 'center',
    marginTop: 8,
  },
  proBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(20, 18, 16, 0.92)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(184, 134, 11, 0.4)',
  },
  proBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#E5C877',
    letterSpacing: 0.5,
  },
  bookMeta: {
    marginTop: 8,
  },
  bookTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1D1B17',
    lineHeight: 18,
  },
  bookGuestDesc: {
    fontSize: 10,
    color: '#7C756C',
    lineHeight: 14,
    marginTop: 4,
  },
});
