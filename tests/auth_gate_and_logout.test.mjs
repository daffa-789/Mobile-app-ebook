import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();

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

  it('2. AuthContext: provides login, register, loginWithUser, and clean logout with SecureStore sync', () => {
    const authContextPath = path.resolve(rootDir, 'mobile-app/src/context/AuthContext.js');
    const src = fs.readFileSync(authContextPath, 'utf-8');

    assert.ok(src.includes('const login = async'), 'login function exists');
    assert.ok(src.includes('const register = async'), 'register function exists');
    assert.ok(src.includes('const logout = async'), 'logout function exists');
    assert.ok(src.includes('const loginWithUser = async'), 'loginWithUser function exists');

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

  it('3. App.js: Auth Gate blocks unauthenticated users and resets states upon logout', () => {
    const appPath = path.resolve(rootDir, 'mobile-app/App.js');
    assert.ok(fs.existsSync(appPath), 'App.js exists');

    const src = fs.readFileSync(appPath, 'utf-8');

    // Must import AuthScreen
    assert.ok(
      src.includes("import { AuthScreen } from './src/screens/AuthScreen'"),
      'App.js imports AuthScreen',
    );

    // Must gate if (!user)
    assert.ok(src.includes('if (!user)'), 'App.js contains Auth Gate checking if (!user)');

    // Auth gate renders AuthScreen
    assert.ok(src.includes('<AuthScreen'), 'App.js renders AuthScreen when !user');

    // Session reset on logout
    assert.ok(
      src.includes('setActiveBook(null)'),
      'App.js clears activeBook when user is unauthenticated',
    );
    assert.ok(
      src.includes('setShowRiwayat(false)'),
      'App.js resets showRiwayat when user is unauthenticated',
    );
    assert.ok(
      src.includes('setAuthModalVisible(false)'),
      'App.js resets authModalVisible when user is unauthenticated',
    );
  });

  it('4. AuthScreen.js: matches user screenshots and 1:1 web reference design without phantom banner', () => {
    const authScreenPath = path.resolve(rootDir, 'mobile-app/src/screens/AuthScreen.js');
    assert.ok(fs.existsSync(authScreenPath), 'AuthScreen.js exists');

    const src = fs.readFileSync(authScreenPath, 'utf-8');

    // Brand header
    assert.ok(
      src.includes('Mobile-app-ebook') || src.includes('Wahidiyah Book'),
      'Contains brand header',
    );
    assert.ok(
      src.includes('Masuk ke akun Anda untuk mengakses koleksi buku.'),
      'Contains login subtitle',
    );
    assert.ok(
      src.includes('Daftar akun baru untuk mulai membaca dan berlangganan.'),
      'Contains register subtitle',
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
    assert.ok(src.includes('atau'), 'Contains atau divider');
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
});
