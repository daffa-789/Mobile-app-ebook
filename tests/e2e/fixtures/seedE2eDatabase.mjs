const PDF_CONTENT_DATA_URL = 'data:application/pdf;base64,JVBERi0xLjQK';
const FIXED_CREATED_AT = '2024-01-01T00:00:00.000Z';

const assertNoError = (label, error) => {
  if (error) {
    throw new Error(`[E2E] Gagal menyiapkan fixture ${label}: ${error.message}`);
  }
};

export async function seedE2eDatabase(supabase, knownUsers) {
  if (!supabase) {
    throw new Error('[E2E] Supabase test belum terhubung. Periksa konfigurasi .env.e2e.');
  }

  const userRows = Object.values(knownUsers).map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    login_method: 'email',
    is_pro: user.isPro,
    subscription_expires_at: null,
    phone: null,
    created_at: FIXED_CREATED_AT,
  }));
  const { error: usersError } = await supabase.from('users').upsert(userRows, { onConflict: 'id' });
  assertNoError('users', usersError);

  const bookRows = [
    {
      id: 'e2e-book-free',
      title: 'Sholawat Wahidiyah Free E2E',
      pages: 1,
      is_locked: false,
      content_url: PDF_CONTENT_DATA_URL,
      content_name: 'e2e-free.pdf',
      content_extension: 'pdf',
      content_mime: 'application/pdf',
      content_type: 'pdf',
      content_size: 10,
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: FIXED_CREATED_AT,
    },
    {
      id: 'e2e-book-pro',
      title: 'Sholawat Wahidiyah Pro E2E',
      pages: 1,
      is_locked: true,
      content_url: PDF_CONTENT_DATA_URL,
      content_name: 'e2e-pro.pdf',
      content_extension: 'pdf',
      content_mime: 'application/pdf',
      content_type: 'pdf',
      content_size: 10,
      created_at: '2024-01-02T00:00:00.000Z',
      updated_at: FIXED_CREATED_AT,
    },
  ];
  const { error: booksError } = await supabase.from('books').upsert(bookRows, { onConflict: 'id' });
  assertNoError('books', booksError);

  const { error: eventsError } = await supabase.from('events').upsert(
    [
      {
        id: 'ev-test-123',
        title: 'Agenda Uji E2E',
        event_date: '2099-01-01',
        time_start: '19:30',
        time_end: '21:00',
        location: 'Lingkungan pengujian',
        category: 'Pengujian',
        description: 'Fixture agenda khusus E2E.',
        organizer: 'E2E Test Suite',
        show_in_carousel: true,
      },
    ],
    { onConflict: 'id' },
  );
  assertNoError('events', eventsError);

  const { error: slidesError } = await supabase.from('carousel_slides').upsert(
    [
      {
        id: 'e2e-carousel-slide',
        title: 'Agenda Uji E2E',
        description: 'Fixture carousel khusus E2E.',
        event_id: 'ev-test-123',
        event_date: '2099-01-01',
        sort_order: 0,
        is_active: true,
      },
    ],
    { onConflict: 'id' },
  );
  assertNoError('carousel', slidesError);

  // Registration scenarios create only short-lived OTP fixtures with this prefix.
  const { error: otpError } = await supabase
    .from('email_verifications')
    .delete()
    .like('email', 'reader_%@wahidiyah.org');
  assertNoError('OTP cleanup', otpError);
}
