import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest } from '../api/client.js';
import { useAuth } from './AuthContext.js';
import {
  normalizeBook,
  normalizeEvent,
  normalizeSlide,
  normalizeSubscription,
} from '../lib/catalog.js';

const BookContext = createContext(null);

const CACHE_KEY = '@catalog_cache_v1';
const OFFLINE_MANIFEST_KEY = '@offline_books_manifest';

export const BookProvider = ({ children }) => {
  const { sessionToken } = useAuth();

  const [books, setBooks] = useState([]);
  const [carouselSlides, setCarouselSlides] = useState([]);
  const [events, setEvents] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [downloadedBooks, setDownloadedBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);

  // 1. Muat cache awal dan manifest unduhan offline
  useEffect(() => {
    let isMounted = true;

    const hydrateFromCache = async () => {
      try {
        const [cachedCatalog, offlineManifest] = await Promise.all([
          AsyncStorage.getItem(CACHE_KEY),
          AsyncStorage.getItem(OFFLINE_MANIFEST_KEY),
        ]);

        if (offlineManifest && isMounted) {
          try {
            setDownloadedBooks(JSON.parse(offlineManifest));
          } catch (_) {}
        }

        if (cachedCatalog && isMounted) {
          try {
            const parsed = JSON.parse(cachedCatalog);
            if (Array.isArray(parsed.books)) setBooks(parsed.books);
            if (Array.isArray(parsed.events)) setEvents(parsed.events);
            if (Array.isArray(parsed.carouselSlides)) setCarouselSlides(parsed.carouselSlides);
            if (Array.isArray(parsed.subscriptions)) setSubscriptions(parsed.subscriptions);
            if (parsed.lastSyncedAt) setLastSyncedAt(parsed.lastSyncedAt);
          } catch (_) {}
        }
      } catch (err) {
        console.warn('Gagal membaca cache katalog:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    hydrateFromCache();

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Sinkronkan seluruh data katalog dari API
  const refreshBooks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const endpoints = [
        apiRequest('/api/books').catch(() => null),
        apiRequest('/api/events').catch(() => null),
        apiRequest('/api/carousel').catch(() => null),
      ];

      // Jika user sudah login, ambil juga riwayat langganan
      if (sessionToken) {
        endpoints.push(apiRequest('/api/subscriptions/my').catch(() => null));
      }

      const results = await Promise.all(endpoints);
      const [booksRes, eventsRes, carouselRes, subsRes] = results;

      let nextBooks = books;
      if (booksRes && Array.isArray(booksRes.books)) {
        nextBooks = booksRes.books.map(normalizeBook).filter(Boolean);
        setBooks(nextBooks);
      }

      let nextEvents = events;
      if (eventsRes && Array.isArray(eventsRes.events)) {
        nextEvents = eventsRes.events.map(normalizeEvent).filter(Boolean);
        setEvents(nextEvents);
      }

      let nextSlides = carouselSlides;
      if (carouselRes && Array.isArray(carouselRes.slides)) {
        nextSlides = carouselRes.slides.map(normalizeSlide).filter(Boolean);
        setCarouselSlides(nextSlides);
      }

      let nextSubs = subscriptions;
      if (subsRes) {
        const rawSubs = Array.isArray(subsRes.subscriptions)
          ? subsRes.subscriptions
          : Array.isArray(subsRes.transactions)
            ? subsRes.transactions
            : [];
        if (rawSubs.length > 0) {
          nextSubs = rawSubs.map(normalizeSubscription).filter(Boolean);
          setSubscriptions(nextSubs);
        }
      }

      const syncTime = new Date().toISOString();
      setLastSyncedAt(syncTime);

      // Simpan ke cache offline
      await AsyncStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          books: nextBooks,
          events: nextEvents,
          carouselSlides: nextSlides,
          subscriptions: nextSubs,
          lastSyncedAt: syncTime,
        }),
      );

      return { success: true };
    } catch (err) {
      console.warn('[BookContext] Gagal sinkronisasi katalog:', err.message);
      setError(err.message || 'Gagal memuat katalog terbaru.');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [books, events, carouselSlides, subscriptions, sessionToken]);

  // 3. Sinkronkan khusus data langganan (misal setelah bayar Pro)
  const refreshSubscriptions = useCallback(async () => {
    if (!sessionToken) return { success: false };
    try {
      const res = await apiRequest('/api/subscriptions/my');
      const rawSubs = Array.isArray(res?.subscriptions)
        ? res.subscriptions
        : Array.isArray(res?.transactions)
          ? res.transactions
          : [];
      const normalized = rawSubs.map(normalizeSubscription).filter(Boolean);
      setSubscriptions(normalized);

      // Perbarui juga di cache
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          parsed.subscriptions = normalized;
          await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(parsed));
        } catch (_) {}
      }

      return { success: true, subscriptions: normalized };
    } catch (err) {
      console.warn('[BookContext] Gagal refresh langganan:', err.message);
      return { success: false, error: err.message };
    }
  }, [sessionToken]);

  // Panggil refresh saat mount atau saat sessionToken berubah
  useEffect(() => {
    refreshBooks();
  }, [sessionToken]);

  // 4. Manajemen Unduhan Buku Offline
  const isDownloaded = useCallback(
    (bookId) => {
      return downloadedBooks.some((b) => b.id === bookId);
    },
    [downloadedBooks],
  );

  const downloadBook = useCallback(
    async (book, contentText = '') => {
      try {
        const itemToSave = {
          ...book,
          savedAt: new Date().toISOString(),
          cachedContent: contentText || book.sample_text || '',
        };

        const nextDownloads = [...downloadedBooks.filter((b) => b.id !== book.id), itemToSave];
        setDownloadedBooks(nextDownloads);
        await AsyncStorage.setItem(OFFLINE_MANIFEST_KEY, JSON.stringify(nextDownloads));

        // Simpan isi naskah teks secara terpisah
        if (contentText) {
          await AsyncStorage.setItem(`@book_content_${book.id}`, contentText);
        }

        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    },
    [downloadedBooks],
  );

  const deleteDownloadedBook = useCallback(
    async (bookId) => {
      try {
        const nextDownloads = downloadedBooks.filter((b) => b.id !== bookId);
        setDownloadedBooks(nextDownloads);
        await AsyncStorage.setItem(OFFLINE_MANIFEST_KEY, JSON.stringify(nextDownloads));
        await AsyncStorage.removeItem(`@book_content_${bookId}`);
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    },
    [downloadedBooks],
  );

  return (
    <BookContext.Provider
      value={{
        books,
        carouselSlides,
        events,
        subscriptions,
        downloadedBooks,
        loading,
        error,
        lastSyncedAt,
        refreshBooks,
        refreshSubscriptions,
        isDownloaded,
        downloadBook,
        deleteDownloadedBook,
      }}
    >
      {children}
    </BookContext.Provider>
  );
};

export const useBooks = () => useContext(BookContext);
