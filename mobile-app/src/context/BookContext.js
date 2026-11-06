import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest } from '../api/client';

const BookContext = createContext(null);

export const DEFAULT_BOOKS = [
  {
    id: 'buku-arbain',
    title: "Hadits Arba'in An-Nawawiyah",
    author: 'Imam An-Nawawi',
    category: 'Hadits',
    cover_local: require('../../assets/covers/hadits-arbain.jpg'),
    cover_url: null,
    is_locked: false,
    pages_count: 42,
    description:
      'Kumpulan empat puluh dua hadits pokok karya Imam An-Nawawi yang merangkum sendi-sendi utama syariat dan akhlak Islam.',
    content_name: 'terjemah-hadits-arbain-nawawi.pdf',
    sample_text: `HADITS KE-1 (NIAT):\n\nDari Amirul Mu'minin Abu Hafsh Umar bin Khaththab radhiyallahu 'anhu, ia berkata: Aku mendengar Rasulullah shallallahu 'alaihi wa sallam bersabda:\n\n"Sesungguhnya setiap amalan tergantung pada niatnya, dan sesungguhnya setiap orang akan mendapatkan sesuai dengan apa yang ia niatkan..." (HR. Bukhari & Muslim)\n\nFaidah Hadits:\n1. Niat adalah syarat sah dan pembeda setiap amal perbuatan.\n2. Keikhlasan semata-mata karena Allah SWT (Lillah) adalah pondasi keselamatan jiwa.`,
  },
  {
    id: 'buku-mujahadah',
    title: 'Panduan Mujahadah Usbuiyah & Syahriyah',
    author: 'Penyiar Sholawat Wahidiyah',
    category: 'Mujahadah',
    cover_local: require('../../assets/covers/panduan-mujahadah.jpg'),
    cover_url: null,
    is_locked: false,
    pages_count: 28,
    description:
      'Tuntunan tata tertib dan adab mujahadah mingguan serta bulanan bagi segenap pengamal Sholawat Wahidiyah.',
    content_name: 'panduan-mujahadah-usbuiyah-syahriyah.pdf',
    sample_text: `TUNTUNAN MUJAHADAH:\n\n1. Dilaksanakan dengan adab lahir batin yang khusyuk, tawadhuk, dan menghadap kiblat.\n2. Menyadari diri dipenuhi dosa di hadapan Allah SWT serta berwashilah kepada Baginda Rosulullah SAW dan Ghoutsu Hadzaz-Zaman RA.\n3. Membaca fatihah dan untaian bait Sholawat Wahidiyah dengan penuh permohonan syafaat dan hidayah.`,
  },
  {
    id: 'buku-lembaran',
    title: 'Lembaran Sholawat Wahidiyah',
    author: 'Muallif Sholawat Wahidiyah RA',
    category: 'Sholawat',
    cover_local: require('../../assets/covers/lembaran-sholawat.jpg'),
    cover_url: null,
    is_locked: false,
    pages_count: 3,
    description:
      'Teks resmi Sholawat Wahidiyah lengkap dengan naskah Arab, transliterasi Latin, dan terjemahan maknawiyah.',
    content_name: 'sholawat-wahidiyah-arab-latin.pdf',
    sample_text: `BISMILLAAHIR RAHMAANIR RAHIIM\n\n(1) YAA SYAFII'AL KHOLQIS-SHOLAATU WASSALAAM\n'ALAIKA NUUROL KHOLQI HAADIL ANAAM\nWA ASHLUHU WA RUUHUHU ADRIKNI\nFAQOD GHORIQTU FII BAHRIDZ-DZUNUUB\n\n(2) YAA AYYUHAL GHOUTSU SALAAMULLOOHI\n'ALAIKA ROBBINII BI-IDZNILLAAHI\nWANDZUR ILAYYA NADZROTAN JALIYYAH\nTUHDZILU BII KULLA 'ANAAN DANIYYAH\n\n(3) YAA AYYUHAL AMANU SIKNAL WAATHI'I\nMIN KULLI KHOOFIN WA LI-A'DOO DAFI'I\n\nFadhilah Sholawat Wahidiyah:\nMembersihkan hati, menggapai ketenangan batin, serta membimbing jiwa menuju ma'rifat Billah wa Rosuulihi SAW.`,
  },
];

export const CAROUSEL_SLIDES = [
  {
    id: 'crs-1',
    eventDate: '2026-10-29',
    dateLabel: '29 OKT 2026',
    title: 'Perpustakaan Digital Sholawat Wahidiyah',
    description:
      'Satu wadah terpadu membaca lembaran Sholawat Wahidiyah resmi, tuntunan amalan mujahadah, dan kitab klasik Islam di mana saja dan kapan saja.',
  },
  {
    id: 'crs-2',
    eventDate: '2026-10-29',
    dateLabel: '29 OKT 2026',
    title: 'Mujahadah Usbuiyah Berjamaah',
    description:
      'Pelaksanaan mujahadah mingguan bersama para pengamal Wahidiyah untuk mempererat silaturahmi dan menjernihkan hati.',
  },
  {
    id: 'crs-3',
    eventDate: '2026-11-01',
    dateLabel: '01 NOV 2026',
    title: 'Kajian Tasawuf & Bedah Kitab Al-Hikam',
    description:
      'Bedah mendalam hikmah Syaikh Ibnu Athaillah as-Sakandari tentang maqam ikhlas, fana, dan marifatullah.',
  },
  {
    id: 'crs-4',
    eventDate: '2026-11-22',
    dateLabel: '22 NOV 2026',
    title: 'Mujahadah Nisfus Sanah (Semesteran)',
    description:
      'Doa bersama permohonan ketentraman, keamanan bangsa, dan kedamaian dunia yang dihadiri ribuan jamaah.',
  },
];

export const DEFAULT_EVENTS = [
  {
    id: 'evt-1',
    title: 'Mujahadah Usbuiyah Berjamaah',
    event_date: '2026-10-29',
    dateDisplay: '29 Okt 2026',
    time_start: '19:30',
    time_end: '21:00',
    location: 'NEKA KEDIRI',
    mapsUrl: 'https://maps.app.goo.gl/ZJHAfwmXwedLJquQ7',
    category: 'Mujahadah',
    description:
      'Pelaksanaan mujahadah mingguan (usbuiyah) bersama para pengamal Wahidiyah untuk mempererat tali silaturahmi dan menjernihkan hati.',
  },
  {
    id: 'evt-2',
    title: 'Kajian Tasawuf & Bedah Kitab Al-Hikam',
    event_date: '2026-11-01',
    dateDisplay: '01 Nov 2026',
    time_start: '09:00',
    time_end: '11:30',
    location: 'Ponpes Kedunglo Kediri',
    mapsUrl: 'https://maps.google.com',
    category: 'Pengajian',
    description:
      'Bedah mendalam hikmah-hikmah Syaikh Ibnu Athaillah as-Sakandari tentang maqam ikhlas, fana, dan marifatullah.',
  },
  {
    id: 'evt-3',
    title: 'Mujahadah Syahriyah Tingkat Kecamatan',
    event_date: '2026-11-08',
    dateDisplay: '08 Nov 2026',
    time_start: '08:30',
    time_end: '11:30',
    location: 'Masjid Agung Kota Kediri',
    mapsUrl: 'https://maps.google.com',
    category: 'Mujahadah',
    description:
      'Mujahadah bulanan bersama seluruh jamaah pengamal Sholawat Wahidiyah se-Kecamatan.',
  },
  {
    id: 'evt-4',
    title: 'Kuliah Wahidiyah & Bimbingan Pengamal Baru',
    event_date: '2026-11-15',
    dateDisplay: '15 Nov 2026',
    time_start: '08:00',
    time_end: '11:00',
    location: 'Gedung Yayasan Perjuangan Wahidiyah',
    mapsUrl: 'https://maps.google.com',
    category: 'Bimbingan',
    description:
      'Pembekalan ajaran Lillah, Billah, Lirrosul, Birrosul, dan Lilghouts bagi para simpatisan dan pengamal pemula.',
  },
  {
    id: 'evt-5',
    title: 'Mujahadah Nisfus Sanah (Semesteran)',
    event_date: '2026-11-22',
    dateDisplay: '22 Nov 2026',
    time_start: '19:30',
    time_end: '23:00',
    location: 'Stadion Brawijaya Kediri',
    mapsUrl: 'https://maps.google.com',
    category: 'Mujahadah',
    description:
      'Doa bersama permohonan ketentraman, keamanan bangsa, dan kedamaian dunia yang dihadiri ribuan jamaah.',
  },
  {
    id: 'evt-6',
    title: 'Mujahadah Kubro Gelombang I (Puncak Acara)',
    event_date: '2026-12-10',
    dateDisplay: '10 Des 2026',
    time_start: '19:30',
    time_end: '23:30',
    location: 'Pesantren Kedunglo Al-Munadhdharah Kediri',
    mapsUrl: 'https://maps.google.com',
    category: 'Kubro',
    description:
      'Perhelatan akbar Mujahadah Kubro dihadiri jamaah Wahidiyah dari pelosok nusantara dan mancanegara.',
  },
  {
    id: 'evt-7',
    title: 'Mujahadah Kubro Gelombang II (Khusus Kaum Ibu & Remaja)',
    event_date: '2026-12-12',
    dateDisplay: '12 Des 2026',
    time_start: '08:00',
    time_end: '12:00',
    location: 'Pesantren Kedunglo Al-Munadhdharah Kediri',
    mapsUrl: 'https://maps.google.com',
    category: 'Kubro',
    description:
      'Doa bersama dan pembinaan mental spiritual khusus bagi ibu-ibu, wanita, remaja putri, dan santriwati.',
  },
];

export const SUBSCRIPTIONS_DATA = [
  {
    id: 'sub-active',
    planName: 'Paket Bulanan',
    price: 'Rp 25.000',
    rawPrice: 25000,
    ref: 'REF-88764885',
    createdAt: '2026-11-03T20:12:00.000Z',
    status: 'Aktif',
    period: '1 Bulan Langganan Pro',
  },
];

export const BookProvider = ({ children }) => {
  const [books, setBooks] = useState(DEFAULT_BOOKS);
  const [carouselSlides] = useState(CAROUSEL_SLIDES);
  const [events, setEvents] = useState(DEFAULT_EVENTS);
  const [subscriptions] = useState(SUBSCRIPTIONS_DATA);
  const [downloadedBooks, setDownloadedBooks] = useState([]);
  const [loading, setLoading] = useState(false);

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
      // Pertahankan buku default
    } finally {
      setLoading(false);
    }
  };

  const isDownloaded = (bookId) => {
    return downloadedBooks.some((b) => b.id === bookId);
  };

  const downloadBook = async (book) => {
    try {
      const nextDownloads = [...downloadedBooks, book];
      setDownloadedBooks(nextDownloads);
      await AsyncStorage.setItem('@offline_books_manifest', JSON.stringify(nextDownloads));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  return (
    <BookContext.Provider
      value={{
        books,
        carouselSlides,
        events,
        subscriptions,
        downloadedBooks,
        loading,
        refreshBooks,
        isDownloaded,
        downloadBook,
      }}
    >
      {children}
    </BookContext.Provider>
  );
};

export const useBooks = () => useContext(BookContext);
