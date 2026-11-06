export const PAYMENT_METHODS = [
  {
    category: 'QRIS',
    options: [
      {
        id: 'qris',
        name: 'QRIS Midtrans',
        icon: 'wallet',
        logoUrl: '/payments/qris.svg',
        color: '#EA2127',
      },
    ],
  },
];

export const FAQ_ITEMS = [
  {
    id: 1,
    question: 'Bagaimana cara membaca buku di Wahidiyah Book?',
    answer:
      'Anda dapat langsung memilih buku yang bertanda Gratis dari katalog publik. Untuk buku bertanda Pro, Anda dapat mengaktifkan keanggotaan Pro untuk membaca tanpa batas.',
  },
  {
    id: 2,
    question: 'Apa perbedaan akun Gratis dan Member Pro?',
    answer:
      'Akun Gratis dapat mengakses karya dan naskah terbuka. Member Pro mendapatkan akses tanpa batas ke seluruh naskah eksklusif, kitab terjemah lengkap, dan pembaruan berkala.',
  },
  {
    id: 3,
    question: 'Bagaimana metode pembayaran langganan Pro?',
    answer:
      'Pembayaran menggunakan QRIS dinamis yang terhubung langsung dengan Midtrans. Anda dapat membayar menggunakan seluruh aplikasi e-wallet (GoPay, OVO, DANA, ShopeePay) serta m-banking (BCA, Mandiri, BRI, BNI).',
  },
  {
    id: 4,
    question: 'Bagaimana jika saya memerlukan bantuan lebih lanjut?',
    answer:
      'Tim kami siap membantu Anda melalui email support@bukuku.id atau saluran WhatsApp resmi layanan bantuan.',
  },
];
