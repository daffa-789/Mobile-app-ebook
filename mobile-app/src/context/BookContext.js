import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { apiRequest } from '../api/client';

const BookContext = createContext(null);

const DEFAULT_BOOKS = [
  {
    id: 'buku-1',
    title: 'Kitab Sholawat Wahidiyah Lengkap',
    author: 'Penyusun Wahidiyah',
    category: 'Sholawat',
    cover_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80',
    description:
      'Panduan lengkap bacaan Sholawat Wahidiyah, doa-doa, dan adab pengamalan lahir dan batin.',
    is_pro: false,
    pages_count: 120,
    sample_text: `BISMILLAAHIR RAHMAANIR RAHIIM\n\nYAA SYAFII'AL KHOLQIS-SHOLAATU WASSALAAM\n'ALAIKA NUUROL KHOLQI HAADIL ANAAM\nWA ASHLUHU WA RUUHUHU ADRIKNI\nFAQOD GHORIQTU FII BAHRIDZ-DZUNUUB\n\nYAA AYYUHAL GHOUTSU SALAAMULLOOHI\n'ALAIKA ROBBINII BI-IDZNILLAAHI\nWANDZUR ILAYYA NADZROTAN JALIYYAH\nTUHDZILU BII KULLA 'ANAAN DANIYYAH\n\nFadhilah Sholawat Wahidiyah:\nMembersihkan hati, mendekatkan diri kepada Allah SWT wa Rosuulihi SAW, dan memperoleh ketenangan jiwa.`,
  },
  {
    id: 'buku-2',
    title: 'Kuliah Wahidiyah & Pokok Ajaran',
    author: 'Dewan Pakar Wahidiyah',
    category: 'Tasawuf',
    cover_url: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?w=400&q=80',
    description:
      'Ulasan mendalam tentang Lillah-Billah, Lirrosul-Birrosul, dan Lilghouts-Bilghouts dalam laku kehidupan.',
    is_pro: true,
    pages_count: 240,
    sample_text: `AJARAN WAHIDIYAH (LILLAH BILLAH):\n\n1. Lillah: Segala amal perbuatan apa saja, baik yang berhubungan dengan ibadah mahdhoh maupun ghairu mahdhoh, ditujukan semata-mata mencari ridho Allah SWT.\n\n2. Billah: Menyadari sedalam-dalamnya bahwa segala gerak-gerik dan kemampuan semata-mata adalah pertolongan dan qudrot-irodat Allah SWT (Laa haula walaa quwwata illaa billaah).`,
  },
  {
    id: 'buku-3',
    title: 'Tuntunan Mujahadah & Doa-doa',
    author: 'Sekretariat DPP PSW',
    category: 'Mujahadah',
    cover_url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80',
    description:
      'Panduan tata cara Mujahadah Yaumiyah, Usbuiyyah, Syahriyyah, dan Mujahadah Kubro.',
    is_pro: false,
    pages_count: 85,
    sample_text: `TATA CARA MUJAHADAH:\n\n1. Menghadap kiblat dalam keadaan suci dari hadats.\n2. Duduk khusyuk dan tawadhuk.\n3. Hati tertuju kepada Allah SWT dan berwashilah kepada Rosulullah SAW.\n4. Membaca fatihah dan wirid sholawat dengan tartil.`,
  },
];

const DEFAULT_EVENTS = [
  {
    id: 'ev-1',
    title: 'Mujahadah Kubro Wahidiyah',
    date: '15 Syawal 1448 H',
    location: 'Pesantren Kedunglo, Kediri',
    description: 'Peringatan haul akbar dan doa bersama untuk keselamatan umat dan bangsa.',
  },
  {
    id: 'ev-2',
    title: 'Mujahadah Usbuiyyah Serentak',
    date: 'Malam Jumat Legi',
    location: 'Seluruh Cabang Kabupaten/Kota',
    description: 'Mujahadah rutin mingguan pengamal Wahidiyah.',
  },
];

export const BookProvider = ({ children }) => {
  const [books, setBooks] = useState(DEFAULT_BOOKS);
  const [events, setEvents] = useState(DEFAULT_EVENTS);
  const [downloadedBooks, setDownloadedBooks] = useState([]);
  const [loading, setLoading] = useState(false);

  // Muat daftar buku offline dari local storage
  useEffect(() => {
    const loadOfflineBooks = async () => {
      try {
        const stored = await AsyncStorage.getItem('@offline_books_manifest');
        if (stored) {
          setDownloadedBooks(JSON.parse(stored));
        }
      } catch (err) {
        console.warn('Gagal membaca manifest unduhan:', err);
      }
    };
    loadOfflineBooks();
  }, []);

  const refreshBooks = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/api/books');
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        setBooks(res.data);
      }
    } catch {
      // Gunakan default catalog bila server offline
    } finally {
      setLoading(false);
    }
  };

  const isDownloaded = (bookId) => {
    return downloadedBooks.some((b) => b.id === bookId);
  };

  const downloadBook = async (book) => {
    try {
      const bookData = {
        ...book,
        downloadedAt: new Date().toISOString(),
        fileSizeMb: (book.pages_count * 0.05).toFixed(1),
        localContent: book.sample_text || 'Teks buku lengkap tersimpan aman di perangkat lokal.',
      };

      const updated = [...downloadedBooks.filter((b) => b.id !== book.id), bookData];
      await AsyncStorage.setItem('@offline_books_manifest', JSON.stringify(updated));
      setDownloadedBooks(updated);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const deleteDownloadedBook = async (bookId) => {
    try {
      const updated = downloadedBooks.filter((b) => b.id !== bookId);
      await AsyncStorage.setItem('@offline_books_manifest', JSON.stringify(updated));
      setDownloadedBooks(updated);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  return (
    <BookContext.Provider
      value={{
        books,
        events,
        downloadedBooks,
        loading,
        refreshBooks,
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
