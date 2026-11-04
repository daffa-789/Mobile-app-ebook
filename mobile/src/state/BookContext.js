import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { listBooks as apiListBooks, listCarousel as apiListCarousel } from '../api/books';
import { normalizeBook } from '../lib/normalizeBook';
import { kvGet, kvSet, catalogCacheKey } from '../storage/kv';
import { readableError } from '../api/client';

const BookContext = createContext(null);
const CACHE_TTL = 24 * 60 * 60 * 1000;

export function BookProvider({ children }) {
  const [books, setBooks] = useState([]);
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isOffline, setIsOffline] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const requestRef = useRef(0);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      setIsOffline(!state.isConnected);
    });
    return unsub;
  }, []);

  const load = useCallback(async ({ search = '', sort = '' } = {}) => {
    const myRequest = ++requestRef.current;
    setLoading(true);
    setError('');
    try {
      const [booksRes, carouselRes] = await Promise.allSettled([
        apiListBooks({ search, sort }),
        apiListCarousel(),
      ]);
      if (myRequest !== requestRef.current) return;
      if (booksRes.status === 'fulfilled') {
        const normalized = (booksRes.value.books || []).map(normalizeBook);
        setBooks(normalized);
        setFromCache(false);
        await kvSet(catalogCacheKey, { at: Date.now(), books: normalized });
      } else {
        // Offline-first dari cache metadata (§7.2)
        const cached = await kvGet(catalogCacheKey);
        if (cached?.books?.length && Date.now() - cached.at < CACHE_TTL) {
          setBooks(cached.books);
          setFromCache(true);
        } else if (cached?.books?.length) {
          setBooks(cached.books);
          setFromCache(true);
        } else {
          setError(readableError(booksRes.reason));
        }
      }
      if (carouselRes.status === 'fulfilled') {
        setSlides(carouselRes.value.slides || []);
      }
    } finally {
      if (myRequest === requestRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <BookContext.Provider value={{ books, slides, loading, error, isOffline, fromCache, reload: load }}>
      {children}
    </BookContext.Provider>
  );
}

export const useBooks = () => {
  const ctx = useContext(BookContext);
  if (!ctx) throw new Error('useBooks harus dipakai di dalam BookProvider');
  return ctx;
};
