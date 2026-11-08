import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import { apiRequest, setUnauthorizedHandler } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [sessionToken, setSessionToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Simpan sesi ke penyimpanan lokal & SecureStore
  const persistSession = useCallback(async (token, profile) => {
    try {
      if (token) {
        await AsyncStorage.setItem('@session_token', token);
      }
      if (profile) {
        await AsyncStorage.setItem('@user_profile', JSON.stringify(profile));
      }

      try {
        const SecureStore = await import('expo-secure-store');
        if (SecureStore && typeof SecureStore.setItemAsync === 'function' && token) {
          await SecureStore.setItemAsync('auth_token', token);
        }
      } catch (_) {}
    } catch (err) {
      console.warn('Gagal menyimpan sesi lokal:', err);
    }
  }, []);

  // Bersihkan sesi saat logout atau token kedaluwarsa
  const clearSession = useCallback(async () => {
    try {
      await AsyncStorage.removeItem('@session_token');
      await AsyncStorage.removeItem('@user_profile');
      await AsyncStorage.removeItem('auth_token');
      try {
        const SecureStore = await import('expo-secure-store');
        if (SecureStore && typeof SecureStore.deleteItemAsync === 'function') {
          await SecureStore.deleteItemAsync('auth_token');
        }
      } catch (_) {}
    } catch (err) {
      console.warn('Gagal membersihkan sesi lokal:', err);
    }
    setSessionToken(null);
    setUser(null);
  }, []);

  // Daftarkan handler 401 terpusat
  useEffect(() => {
    setUnauthorizedHandler(() => {
      console.info('[AuthContext] Sesi kedaluwarsa (401), membersihkan sesi...');
      clearSession();
    });
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  // Validasi sesi saat aplikasi dimuat: cek token di storage lalu verifikasi via /api/auth/me
  useEffect(() => {
    let isMounted = true;

    const loadAndVerifySession = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('@session_token');
        const storedUser = await AsyncStorage.getItem('@user_profile');

        if (!storedToken) {
          if (isMounted) {
            setSessionToken(null);
            setUser(null);
          }
          return;
        }

        let parsedUser = null;
        if (storedUser) {
          try {
            parsedUser = JSON.parse(storedUser);
          } catch (_) {}
        }

        // Optimistic: tampilkan cache dulu agar tidak ada blank screen
        if (isMounted && parsedUser) {
          setSessionToken(storedToken);
          setUser(parsedUser);
        }

        // Verifikasi ke server lewat GET /api/auth/me
        try {
          const res = await apiRequest('/api/auth/me', { method: 'GET' });
          if (res?.user && isMounted) {
            setSessionToken(storedToken);
            setUser(res.user);
            await AsyncStorage.setItem('@user_profile', JSON.stringify(res.user));
          }
        } catch (verifyErr) {
          // Jika 401 atau 403, sesi sudah tidak sah di server
          if (verifyErr.status === 401 || verifyErr.status === 403) {
            console.warn('[AuthContext] Token sudah kedaluwarsa saat validasi boot.');
            if (isMounted) await clearSession();
          } else {
            // Galat koneksi / offline: pertahankan sesi lokal agar pengguna tetap bisa membaca offline
            console.warn(
              '[AuthContext] Verifikasi online gagal, menggunakan sesi offline:',
              verifyErr.message,
            );
          }
        }
      } catch (err) {
        console.warn('Gagal memuat sesi awal:', err);
        if (isMounted) await clearSession();
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadAndVerifySession();

    return () => {
      isMounted = false;
    };
  }, [clearSession]);

  const login = async (emailOrPhone, password) => {
    try {
      const res = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier: emailOrPhone.trim(), password }),
      });

      const token = res.token;
      const profile = res.user;
      if (!token || !profile) {
        return { success: false, error: 'Respons server tidak lengkap. Coba lagi sebentar.' };
      }

      await persistSession(token, profile);
      setSessionToken(token);
      setUser(profile);
      return { success: true, user: profile };
    } catch (err) {
      if (err.status && err.status >= 400 && err.status < 500) {
        return {
          success: false,
          error: err.message || 'Email atau password belum sesuai.',
        };
      }
      return {
        success: false,
        error: 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.',
      };
    }
  };

  const register = async ({ fullName, email, phone, password }) => {
    try {
      const res = await apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          password,
        }),
      });

      // Server mengembalikan status 202 dengan requiresVerification: true
      return {
        success: true,
        requiresVerification: Boolean(res.requiresVerification || res.status === 202),
        method: res.method || 'email',
        identifier: res.identifier || email.trim(),
        devOtp: res.devOtp,
        message: res.message || 'Kode verifikasi telah dikirimkan ke email Anda.',
      };
    } catch (err) {
      if (err.status && err.status >= 400 && err.status < 500) {
        return {
          success: false,
          error: err.message || 'Pendaftaran belum dapat diproses.',
        };
      }
      return {
        success: false,
        error: 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.',
      };
    }
  };

  const verifyRegistration = async ({ identifier, email, phone, code }) => {
    try {
      const res = await apiRequest('/api/auth/verify-registration', {
        method: 'POST',
        body: JSON.stringify({
          identifier: identifier || email || phone,
          email,
          phone,
          code,
        }),
      });

      if (res.token && res.user) {
        await persistSession(res.token, res.user);
        setSessionToken(res.token);
        setUser(res.user);
      }

      return {
        success: true,
        token: res.token,
        user: res.user,
        message: res.message || 'Akun berhasil diverifikasi!',
      };
    } catch (err) {
      return {
        success: false,
        error: err.message || 'Kode verifikasi tidak valid atau telah kedaluwarsa.',
      };
    }
  };

  const resendVerification = async ({ identifier, method = 'email', purpose = 'registration' }) => {
    try {
      const res = await apiRequest('/api/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({
          identifier,
          method,
          purpose,
        }),
      });
      return {
        success: true,
        message: res.message || 'Kode baru telah dikirimkan.',
        devOtp: res.devOtp,
      };
    } catch (err) {
      return {
        success: false,
        error: err.message || 'Gagal mengirim ulang kode verifikasi.',
      };
    }
  };

  const requestPasswordReset = async ({ identifier, method = 'email' }) => {
    try {
      const res = await apiRequest('/api/auth/request-password-reset', {
        method: 'POST',
        body: JSON.stringify({
          identifier,
          method,
          email: method === 'email' ? identifier : undefined,
          phone: method === 'whatsapp' ? identifier : undefined,
        }),
      });
      return {
        success: true,
        identifier: res.identifier || identifier,
        method: res.method || method,
        devOtp: res.devOtp,
        message: res.message || 'Instruksi pemulihan kata sandi telah dikirim.',
      };
    } catch (err) {
      return {
        success: false,
        error: err.message || 'Gagal mengajukan pemulihan kata sandi.',
      };
    }
  };

  const resetPassword = async ({ identifier, email, phone, code, password, method = 'email' }) => {
    try {
      const res = await apiRequest('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          identifier: identifier || email || phone,
          email,
          phone,
          code,
          password,
          method,
        }),
      });
      return {
        success: true,
        message: res.message || 'Password berhasil diperbarui.',
      };
    } catch (err) {
      return {
        success: false,
        error: err.message || 'Gagal memperbarui kata sandi.',
      };
    }
  };

  const startGoogleMobile = async () => {
    try {
      const res = await apiRequest('/api/auth/google/mobile-start', {
        method: 'POST',
      });
      if (res?.url) {
        await Linking.openURL(res.url);
        return { success: true, url: res.url };
      }
      return { success: false, error: 'URL Google OAuth tidak valid dari server.' };
    } catch (err) {
      return { success: false, error: err.message || 'Gagal memulai otorisasi Google.' };
    }
  };

  const exchangeGoogleCode = async (code) => {
    try {
      const res = await apiRequest('/api/auth/exchange', {
        method: 'POST',
        body: JSON.stringify({ code }),
      });

      if (res?.token && res?.user) {
        await persistSession(res.token, res.user);
        setSessionToken(res.token);
        setUser(res.user);
        return { success: true, user: res.user };
      }
      return { success: false, error: 'Kode otentikasi Google tidak valid.' };
    } catch (err) {
      return { success: false, error: err.message || 'Gagal menukar kode otorisasi Google.' };
    }
  };

  const refreshSession = async () => {
    if (!sessionToken) return { success: false, error: 'Tidak ada sesi aktif.' };
    try {
      const res = await apiRequest('/api/auth/me', { method: 'GET' });
      if (res?.user) {
        setUser(res.user);
        await AsyncStorage.setItem('@user_profile', JSON.stringify(res.user));
        return { success: true, user: res.user };
      }
      return { success: false };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const updateUser = async (updatedData) => {
    const nextUser = { ...user, ...updatedData };
    setUser(nextUser);
    await AsyncStorage.setItem('@user_profile', JSON.stringify(nextUser));
    return { success: true, user: nextUser };
  };

  const logout = async () => {
    await clearSession();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        sessionToken,
        loading,
        isAuthenticated: !!user,
        isPro: Boolean(user?.is_pro || user?.isPro || user?.role === 'pro'),
        login,
        register,
        verifyRegistration,
        resendVerification,
        requestPasswordReset,
        resetPassword,
        startGoogleMobile,
        exchangeGoogleCode,
        refreshSession,
        updateUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
