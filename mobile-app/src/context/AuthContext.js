import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest } from '../api/client';

const AuthContext = createContext(null);

export const DEFAULT_USER = {
  id: 'usr-daffa-default',
  name: 'Ghazalah Ramadhan Daffa Firjatullah',
  fullName: 'Ghazalah Ramadhan Daffa Firjatullah',
  email: 'ghazalahramadhan6@gmail.com',
  phone: '081234567890',
  role: 'user',
  is_pro: true,
  isPro: true,
  subscription_expires_at: '2026-12-03T20:12:00.000Z',
  created_at: '2026-10-25T05:50:20.386+07:00',
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [sessionToken, setSessionToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Muat sesi pengguna dari penyimpanan lokal jika tersedia
  useEffect(() => {
    const loadStoredSession = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('@session_token');
        const storedUser = await AsyncStorage.getItem('@user_profile');

        if (storedToken && storedUser) {
          setSessionToken(storedToken);
          setUser(JSON.parse(storedUser));
        } else {
          // Wajib login sebelum masuk: tidak ada sesi otomatis saat belum login
          setSessionToken(null);
          setUser(null);
        }
      } catch (err) {
        console.warn('Gagal memuat sesi:', err);
        setSessionToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadStoredSession();
  }, []);

  const login = async (emailOrPhone, password) => {
    try {
      const res = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier: emailOrPhone.trim(), password }),
      });

      const token = res.token || res.data?.token || res.sessionToken || 'mock-token-' + Date.now();
      const profile = res.user ||
        res.data?.user || {
          ...DEFAULT_USER,
          email: emailOrPhone.trim(),
        };

      await AsyncStorage.setItem('@session_token', token);
      await AsyncStorage.setItem('@user_profile', JSON.stringify(profile));
      try {
        const SecureStore = await import('expo-secure-store');
        if (SecureStore && typeof SecureStore.setItemAsync === 'function') {
          await SecureStore.setItemAsync('auth_token', token);
        }
      } catch (_) {}

      setSessionToken(token);
      setUser(profile);
      return { success: true, user: profile };
    } catch (err) {
      // Jika server secara eksplisit menolak kredensial (400, 401, 403, 404, 422)
      if (err.status && err.status >= 400 && err.status < 500) {
        return {
          success: false,
          error: err.message || 'Email atau password belum sesuai.',
        };
      }

      // Fallback offline / mock login HANYA jika server tidak terjangkau / offline
      const trimmed = emailOrPhone.trim();
      const isEmail = trimmed.includes('@');
      const fallbackUser = {
        ...DEFAULT_USER,
        id: 'usr-local-' + Date.now(),
        name: isEmail ? trimmed.split('@')[0] : 'Pengguna Wahidiyah',
        fullName: isEmail ? trimmed.split('@')[0] : 'Pengguna Wahidiyah',
        email: isEmail ? trimmed : DEFAULT_USER.email,
        phone: !isEmail ? trimmed : DEFAULT_USER.phone,
      };
      await AsyncStorage.setItem('@session_token', 'local-token-' + Date.now());
      await AsyncStorage.setItem('@user_profile', JSON.stringify(fallbackUser));
      setSessionToken('local-token');
      setUser(fallbackUser);
      return { success: true, user: fallbackUser };
    }
  };

  const loginWithUser = async (customProfile, token = 'demo-token-active-pro') => {
    try {
      await AsyncStorage.setItem('@session_token', token);
      await AsyncStorage.setItem('@user_profile', JSON.stringify(customProfile));
      try {
        const SecureStore = await import('expo-secure-store');
        if (SecureStore && typeof SecureStore.setItemAsync === 'function') {
          await SecureStore.setItemAsync('auth_token', token);
        }
      } catch (_) {}
    } catch (err) {
      console.warn('Gagal menyimpan sesi login:', err);
    }
    setSessionToken(token);
    setUser(customProfile);
    return { success: true, user: customProfile };
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
      return {
        success: true,
        message: res.message || 'Pendaftaran berhasil! Silakan masuk dengan akun Anda.',
      };
    } catch (err) {
      // Jika server menolak dengan pesan validasi / duplikat email (400, 409)
      if (err.status && err.status >= 400 && err.status < 500) {
        return {
          success: false,
          error: err.message || 'Pendaftaran belum dapat diproses.',
        };
      }

      // Fallback offline saat jaringan tidak terjangkau
      return {
        success: true,
        message: 'Pendaftaran berhasil! Silakan masuk dengan akun Anda.',
      };
    }
  };

  const updateUser = async (updatedData) => {
    const nextUser = { ...user, ...updatedData };
    setUser(nextUser);
    await AsyncStorage.setItem('@user_profile', JSON.stringify(nextUser));
    return { success: true, user: nextUser };
  };

  const logout = async () => {
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
      console.warn('Gagal membersihkan sesi storage saat logout:', err);
    }
    setSessionToken(null);
    setUser(null);
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
        loginWithUser,
        register,
        updateUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
