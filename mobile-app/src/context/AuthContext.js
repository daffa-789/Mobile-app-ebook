import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest } from '../api/client';

const AuthContext = createContext(null);

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

      const token = res.token;
      const profile = res.user;
      if (!token || !profile) {
        return { success: false, error: 'Respons server tidak lengkap. Coba lagi sebentar.' };
      }

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

      return {
        success: false,
        error: 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.',
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
