import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { runInNewContext } from 'node:vm';
import { parse } from '@babel/parser';

const rootDir = process.cwd();

function runBrowserAuthEffect(platform, browserWindow) {
  const source = fs.readFileSync(path.resolve(rootDir, 'mobile-app/App.js'), 'utf8');
  const ast = parse(source, { sourceType: 'module', plugins: ['jsx'] });
  const navigator = ast.program.body.find(
    (node) => node.type === 'FunctionDeclaration' && node.id.name === 'MainNavigator',
  );
  const effect = navigator.body.body
    .filter((node) => node.type === 'ExpressionStatement')
    .map((node) => node.expression)
    .find(
      (node) =>
        node.type === 'CallExpression' &&
        node.callee.object?.name === 'React' &&
        node.callee.property?.name === 'useEffect' &&
        source.slice(node.start, node.end).includes('__openAuthModal'),
    );
  assert.ok(effect, 'Efek autentikasi browser harus ditemukan di MainNavigator');
  const callback = effect.arguments[0];
  const opened = [];
  const context = {
    Platform: { OS: platform },
    window: browserWindow,
    setAuthModalVisible: (visible) => opened.push(visible),
  };
  runInNewContext(`(${source.slice(callback.start, callback.end)})()`, context);
  return opened;
}

describe('Kompatibilitas startup autentikasi native dan web', () => {
  for (const platform of ['android', 'ios']) {
    it(`${platform}: window tanpa location tidak menyebabkan crash`, () => {
      const nativeWindow = {};
      nativeWindow.window = nativeWindow;
      assert.deepEqual(runBrowserAuthEffect(platform, nativeWindow), []);
      assert.equal(nativeWindow.__openAuthModal, undefined);
    });
  }

  it('web: query auth=1 tetap membuka autentikasi', () => {
    const browserWindow = { location: { search: '?auth=1' } };
    assert.deepEqual(runBrowserAuthEffect('web', browserWindow), [true]);
    assert.equal(typeof browserWindow.__openAuthModal, 'function');
  });

  it('web: tanpa query, autentikasi hanya dibuka lewat callback', () => {
    const browserWindow = { location: { search: '' } };
    const opened = runBrowserAuthEffect('web', browserWindow);
    assert.deepEqual(opened, []);
    browserWindow.__openAuthModal();
    assert.deepEqual(opened, [true]);
  });
});

describe('Auth Gate & Logout Behavior Verification', () => {
  it('1. AuthContext: initial state must not force auto-login if storage is empty', () => {
    const authContextPath = path.resolve(rootDir, 'mobile-app/src/context/AuthContext.js');
    assert.ok(fs.existsSync(authContextPath), 'AuthContext.js exists');

    const src = fs.readFileSync(authContextPath, 'utf-8');

    // Initial state must be null, not DEFAULT_USER
    assert.ok(
      src.includes('const [user, setUser] = useState(null)'),
      'user initial state must be null',
    );
    assert.ok(
      src.includes('const [sessionToken, setSessionToken] = useState(null)'),
      'sessionToken initial state must be null',
    );

    // loadStoredSession must NOT auto-write DEFAULT_USER in else block
    assert.ok(
      !src.includes("await AsyncStorage.setItem('@session_token', 'demo-token-active-pro')"),
      'Must not automatically populate demo-token in AsyncStorage on empty storage',
    );
  });

  it('2. AuthContext: provides login, register, and clean logout with SecureStore sync', () => {
    const authContextPath = path.resolve(rootDir, 'mobile-app/src/context/AuthContext.js');
    const src = fs.readFileSync(authContextPath, 'utf-8');

    assert.ok(src.includes('const login = async'), 'login function exists');
    assert.ok(src.includes('const register = async'), 'register function exists');
    assert.ok(src.includes('const logout = async'), 'logout function exists');

    // Tidak boleh ada jalur login mock/demo yang memberi sesi palsu saat offline
    assert.ok(!src.includes('loginWithUser'), 'mock loginWithUser must be removed');
    assert.ok(!src.includes('demo-token'), 'demo token must be removed');
    assert.ok(!src.includes('mock-token'), 'mock token fallback must be removed');
    assert.ok(!src.includes('DEFAULT_USER'), 'hardcoded default user profile must be removed');

    // SecureStore synchronization
    assert.ok(
      src.includes('expo-secure-store'),
      'AuthContext integrates expo-secure-store for native token security',
    );
    assert.ok(
      src.includes("deleteItemAsync('auth_token')"),
      'logout wipes secure store auth_token',
    );

    // logout must clear AsyncStorage keys and reset user to null
    assert.ok(
      src.includes("await AsyncStorage.removeItem('@session_token')"),
      'logout clears @session_token',
    );
    assert.ok(
      src.includes("await AsyncStorage.removeItem('@user_profile')"),
      'logout clears @user_profile',
    );
    assert.ok(src.includes('setUser(null)'), 'logout resets user state to null');
    assert.ok(src.includes('setSessionToken(null)'), 'logout resets sessionToken state to null');

    // Explicit error handling: must NOT swallow 401/409 errors
    assert.ok(
      src.includes('err.status >= 400 && err.status < 500'),
      'login and register handle HTTP 4xx validation and auth rejection errors',
    );
  });

  it('3. App.js: guest mode with one soft gate, plain sheet and pending action replay', () => {
    const appPath = path.resolve(rootDir, 'mobile-app/App.js');
    assert.ok(fs.existsSync(appPath), 'App.js exists');

    const src = fs.readFileSync(appPath, 'utf-8');

    // Auth gate layar penuh SUDAH dihapus: tamu langsung masuk ke katalog.
    assert.ok(
      !src.includes("import { AuthScreen } from './src/screens/AuthScreen'"),
      'App.js tidak boleh mengimpor AuthScreen untuk gate layar penuh',
    );
    assert.ok(
      !src.includes('<AuthScreen'),
      'App.js tidak boleh merender AuthScreen sebagai pengganti layar utama',
    );

    // Satu gerbang terpusat, bukan if (!user) tersebar di tiap layar.
    assert.ok(src.includes('const requireAuth'), 'App.js menyediakan requireAuth terpusat');
    assert.ok(src.includes('const openAuth'), 'App.js menyediakan openAuth untuk sheet login');
    assert.ok(src.includes('pendingActionRef'), 'App.js menyimpan aksi yang tertunda');
    assert.ok(
      src.includes('setTimeout(() => action(), 0)'),
      'aksi dijalankan ulang setelah user terisi',
    );
    // Kotak pesan kontekstual dihapus total: sheet polos, X tetap jadi jalan
    // batal, dan aksi tertunda tetap dijalankan ulang setelah login.
    assert.ok(!src.includes('Masuk untuk membaca'), 'tidak ada pesan kitab');
    assert.ok(!src.includes('Masuk untuk melihat riwayat langganan'));
    assert.ok(!src.includes('Masuk ke akun Anda'));
    assert.ok(!src.includes('authMessage'), 'state pesan kontekstual dihapus');
    assert.ok(!src.includes('message={'), 'sheet tidak menerima prop pesan');
    assert.ok(
      src.includes('const openAuth = (action = null)'),
      'openAuth kini hanya menerima aksi tertunda',
    );
    assert.ok(src.includes('onClose={handleCloseAuth}'), 'X membatalkan aksi');
    assert.ok(src.includes('onAuthSuccess={handleAuthSuccess}'), 'login sukses melanjutkan aksi');
    assert.ok(
      src.includes('pendingActionRef.current = null'),
      'penutup sheet membatalkan aksi tertunda',
    );

    // Reset sesi saat logout tetap terjaga.
    assert.ok(src.includes('setActiveBook(null)'), 'logout membersihkan activeBook');
    assert.ok(src.includes('setShowRiwayat(false)'), 'logout membersihkan riwayat');
    assert.ok(src.includes('setAuthModalVisible(false)'), 'logout menutup sheet');
  });

  it('4. AuthScreen.js: matches user screenshots and 1:1 web reference design without phantom banner', () => {
    const authScreenPath = path.resolve(rootDir, 'mobile-app/src/screens/AuthScreen.js');
    assert.ok(fs.existsSync(authScreenPath), 'AuthScreen.js exists');

    const src = fs.readFileSync(authScreenPath, 'utf-8');

    // Brand header — subtitle penjelas di bawah judul sengaja dihapus.
    assert.ok(
      src.includes('Mobile-app-ebook') || src.includes('Wahidiyah Book'),
      'Contains brand header',
    );
    assert.ok(
      !src.includes('Masuk ke akun Anda untuk mengakses koleksi buku.'),
      'subtitle login tidak boleh muncul lagi',
    );
    assert.ok(
      !src.includes('Daftar akun baru untuk mulai membaca dan berlangganan.'),
      'subtitle daftar tidak boleh muncul lagi',
    );

    // Must NOT have hardcoded phantom server status banner that clutter user mobile view
    assert.ok(
      !src.includes('Seluruh Layanan Beroperasi Normal'),
      'Does not contain phantom server status banner',
    );

    // Segmented tab switch
    assert.ok(
      src.includes('Masuk') && src.includes('Daftar Akun'),
      'Contains segmented tab switch',
    );

    // Form inputs
    assert.ok(src.includes('Alamat email'), 'Contains Alamat email field');
    assert.ok(src.includes('Password'), 'Contains Password field');
    assert.ok(src.includes('Lupa password?'), 'Contains Lupa password? action');
    assert.ok(src.includes('Nama lengkap'), 'Contains Nama lengkap field');
    assert.ok(src.includes('Nomor WhatsApp'), 'Contains Nomor WhatsApp field');
    assert.ok(src.includes('Konfirmasi password'), 'Contains Konfirmasi password field');

    // Action buttons & dividers
    assert.ok(src.includes('Daftar Sekarang'), 'Contains Daftar Sekarang button');
    assert.ok(src.includes('Masuk dengan Google'), 'Contains Google login action');
    assert.ok(src.includes('Daftar dengan Google'), 'Contains Google register action');
    // Pemisah "atau" beserta dua tautan footer dihapus; tab tetap jadi
    // satu-satunya cara berpindah Masuk <-> Daftar Akun.
    assert.ok(!src.includes('dividerRow'), 'pemisah "atau" tidak boleh ada');
    assert.ok(!src.includes('styles.dividerText}>atau'), 'kata "atau" tidak boleh ada');
    assert.ok(!src.includes('Belum memiliki akun?'), 'tautan daftar di footer dihapus');
    assert.ok(!src.includes('Sudah memiliki akun?'), 'tautan masuk di footer dihapus');
    assert.ok(!src.includes('footerWrap'), 'footer tautan tidak dirender lagi');
    assert.ok(src.includes('handleTabChange'), 'tab switcher tetap berfungsi');
  });

  it('5. ProfileScreen.js: provides working logout with confirmation dialog and race condition guard', () => {
    const profilePath = path.resolve(rootDir, 'mobile-app/src/screens/ProfileScreen.js');
    const src = fs.readFileSync(profilePath, 'utf-8');

    // Must use logout from useAuth
    assert.ok(src.includes('logout'), 'ProfileScreen uses logout');
    assert.ok(
      src.includes('isPro') || src.includes('Member Pro'),
      'ProfileScreen displays Pro status',
    );

    // Modal dialog for logout confirmation
    assert.ok(
      src.includes('logoutModalVisible'),
      'ProfileScreen uses state for logout confirmation modal',
    );
    assert.ok(
      src.includes('Log Out dari akun?'),
      'ProfileScreen modal displays Log Out dari akun? title',
    );
    assert.ok(src.includes('Ya, Log Out'), 'ProfileScreen modal provides Ya, Log Out confirmation');
    assert.ok(src.includes('Batal'), 'ProfileScreen modal provides Batal option');

    // Race condition guard
    assert.ok(
      src.includes('isLoggingOut'),
      'ProfileScreen guards against rapid repeated logout taps',
    );

    // No modal leak on logout
    assert.ok(
      !src.includes('await logout();\n    onOpenAuth?.();'),
      'ProfileScreen does not mistakenly trigger onOpenAuth modal after logout',
    );
  });

  it('6. AuthModal.js: sheet has bounded height preventing child ScrollView collapse', () => {
    const authModalPath = path.resolve(rootDir, 'mobile-app/src/screens/AuthModal.js');
    const src = fs.readFileSync(authModalPath, 'utf-8');

    assert.ok(
      src.includes("height: '92%'") || src.includes("height: '90%'"),
      'AuthModal sheet sets explicit height percentage',
    );
  });

  it('7. AuthModal.js: ikon X tanpa Nanti/kotak pesan, dan callback login sukses', () => {
    const src = fs.readFileSync(
      path.resolve(rootDir, 'mobile-app/src/screens/AuthModal.js'),
      'utf-8',
    );

    assert.ok(src.includes('accessibilityLabel="Tutup"'), 'ikon close diberi label aksesibilitas');
    assert.ok(src.includes('<Feather name="x"'), 'ikon X tersedia untuk menutup sheet');
    assert.ok(src.includes('onPress={onClose}'), 'X memanggil onClose');
    assert.ok(!src.includes('>Nanti</Text>'), 'tombol Nanti dihapus');
    assert.ok(!src.includes('messageRow'), 'kotak pesan hijau dihapus');
    assert.ok(!src.includes('messageText'), 'teks pesan kontekstual dihapus');
    assert.ok(src.includes('onAuthSuccess'), 'sheet meneruskan callback login sukses');
    assert.ok(src.includes('handleAuthSuccess'), 'login sukses tidak sekadar menutup sheet');
  });

  it('8. ProfileScreen.js: halaman tamu menyediakan Masuk dan Cek Pembaruan OTA', () => {
    const src = fs.readFileSync(
      path.resolve(rootDir, 'mobile-app/src/screens/ProfileScreen.js'),
      'utf-8',
    );

    assert.ok(src.includes('if (!user)'), 'ada cabang khusus tamu');
    assert.ok(src.includes('Mode Tamu'), 'tab Profil bukan halaman kosong');
    assert.ok(src.includes('Masuk / Daftar'), 'kartu login tersedia');
    assert.ok(src.includes('onPress={onOpenAuth}'), 'kartu login membuka sheet');
    assert.ok(src.includes('Pembaruan Aplikasi'), 'tombol update OTA tetap bisa dijangkau tamu');
    assert.ok(src.includes('handleCheckUpdate'), 'tombol update memanggil pengecekan OTA');
  });

  it('9. api/client.js: 401 tanpa token tidak memicu auto-logout tamu', () => {
    const src = fs.readFileSync(path.resolve(rootDir, 'mobile-app/src/api/client.js'), 'utf-8');
    assert.ok(
      src.includes('res.status === 401 && token && !isSessionFreeEndpoint(endpoint)'),
      'auto-logout hanya untuk sesi tersimpan yang kedaluwarsa',
    );
  });

  it('10. ProScreen.js: tamu tidak boleh membuat tagihan QRIS', () => {
    const src = fs.readFileSync(
      path.resolve(rootDir, 'mobile-app/src/screens/ProScreen.js'),
      'utf-8',
    );
    assert.ok(src.includes('if (!user)'), 'charge dicegah sebelum request');
    assert.ok(
      !src.includes('Masuk untuk berlangganan Pro'),
      'pesan kontekstual Pro dihapus, sheet dibuka tanpa kotak pesan',
    );
    assert.ok(src.includes('onOpenAuth?.('), 'sheet login tamu tetap dipanggil');
    assert.ok(src.includes('chargeRef.current'), 'aksi dilanjutkan setelah login');
  });

  it('11. HomeScreen.js: tamu menjelajah katalog lewat soft gate', () => {
    const src = fs.readFileSync(
      path.resolve(rootDir, 'mobile-app/src/screens/HomeScreen.js'),
      'utf-8',
    );
    // Strip "Mode tamu" dan carousel hero hijau dihapus: katalog langsung tampil.
    assert.ok(
      !src.includes('Mode tamu — jelajahi katalog bebas'),
      'strip mode tamu tidak boleh muncul lagi',
    );
    assert.ok(!src.includes('carouselWrapper'), 'carousel hero hijau dihapus');
    assert.ok(!src.includes('guestStrip'), 'style strip tamu ikut dibersihkan');
    assert.ok(src.includes('bookGuestDesc'), 'sinopsis publik memberi isi sebelum gerbang');
    assert.ok(src.includes('if (!user)'), 'semua kitab tamu diarahkan ke soft gate');
    assert.ok(src.includes('onOpenBook?.(book)'), 'ketuk kitab tetap memanggil navigasi');
  });
});
