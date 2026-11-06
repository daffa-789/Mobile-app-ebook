import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { useBooks } from '../context/BookContext';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');
const CARD_GAP = 16;
const CARD_WIDTH = (width - 32 - CARD_GAP) / 2;

export const HomeScreen = ({ onOpenBook, onOpenPro }) => {
  const { books, carouselSlides } = useBooks();
  const { isPro } = useAuth();
  const [slideIndex, setSlideIndex] = useState(0);

  // Auto-play carousel slides
  useEffect(() => {
    if (!carouselSlides || carouselSlides.length <= 1) return;
    const interval = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % carouselSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [carouselSlides]);

  const activeSlide = carouselSlides[slideIndex] || carouselSlides[0];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* 1:1 Hero Carousel Banner */}
      <View style={styles.carouselWrapper}>
        <View style={styles.carouselCard}>
          {/* Subtle Radial Glow Effect */}
          <View style={styles.glowOverlay} />

          <View style={styles.carouselContent}>
            {activeSlide?.dateLabel && (
              <View style={styles.datePill}>
                <Feather name="calendar" size={12} color={theme.colors.goldLight} />
                <Text style={styles.datePillText}>{activeSlide.dateLabel}</Text>
              </View>
            )}

            <Text style={styles.carouselTitle} numberOfLines={2}>
              {activeSlide?.title}
            </Text>

            {activeSlide?.description && (
              <Text style={styles.carouselDesc} numberOfLines={3}>
                {activeSlide.description}
              </Text>
            )}
          </View>
        </View>

        {/* Carousel Indicator Dots */}
        {carouselSlides && carouselSlides.length > 1 && (
          <View style={styles.indicatorsRow}>
            {carouselSlides.map((_, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => setSlideIndex(idx)}
                style={[styles.dot, idx === slideIndex ? styles.dotActive : styles.dotInactive]}
                activeOpacity={0.7}
              />
            ))}
          </View>
        )}
      </View>

      {/* 2-Column Grid Buku (1:1 dengan Web Mobile) */}
      <View style={styles.bookGrid}>
        {books.map((book) => {
          const isLocked = book.is_locked && !isPro;

          return (
            <TouchableOpacity
              key={book.id}
              style={styles.bookCard}
              activeOpacity={0.88}
              onPress={() => {
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
  // Hero Carousel
  carouselWrapper: {
    marginBottom: 20,
  },
  carouselCard: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 24,
    backgroundColor: '#0E3D2C', // Brand 800
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(185, 219, 201, 0.4)',
    shadowColor: '#082D20',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 4,
    justifyContent: 'flex-end',
  },
  glowOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20, 82, 58, 0.4)',
  },
  carouselContent: {
    padding: 16,
    justifyContent: 'flex-end',
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(184, 134, 11, 0.22)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 79, 0.4)',
    marginBottom: 8,
    gap: 6,
  },
  datePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#E5C877',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  carouselTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FBF8F3',
    lineHeight: 24,
    marginBottom: 4,
    fontFamily: theme.typography.serif,
  },
  carouselDesc: {
    fontSize: 12,
    color: 'rgba(247, 242, 233, 0.85)',
    lineHeight: 16,
  },
  indicatorsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 6,
    marginTop: 10,
    paddingLeft: 2,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 28,
    backgroundColor: '#14523A', // Brand 700
  },
  dotInactive: {
    width: 8,
    backgroundColor: '#B9DBC9', // Brand 200
  },

  // Grid Buku
  bookGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
  },
  bookCard: {
    width: CARD_WIDTH,
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
});
