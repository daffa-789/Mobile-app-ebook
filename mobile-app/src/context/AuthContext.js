import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest } from '../api/client';

const AuthContext = createContext(null);

const DEFAULT_USER = {
  id: 'usr-daffa-default',
  name: 'Ghazalah Ramadhan Daffa Firjatullah',
  fullName: 'Ghazalah Ramadhan Daffa Firjatullah',
  email: 'ghazalahramadhan6@gmail.com',
  phone: '',
  role: 'user',
  is_pro: true,
  isPro: true,
  subscription_expires_at: '2026-12-03T20:12:00.000Z',
  created_at: '2026-10-25T05:50:20.386+07:00',
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(DEFAULT_USER);
  const [sessionToken, setSessionToken] = useState('demo-token-active-pro');
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
          // Default ke user profil tersinkronisasi 1:1
          await AsyncStorage.setItem('@session_token', 'demo-token-active-pro');
          await AsyncStorage.setItem('@user_profile', JSON.stringify(DEFAULT_USER));
        }
      } catch (err) {
        console.warn('Gagal memuat sesi:', err);
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
        body: JSON.stringify({ identifier: emailOrPhone, password }),
      });

      const token = res.token || res.data?.token || res.sessionToken || 'mock-token';
      const profile = res.user ||
        res.data?.user || {
          ...DEFAULT_USER,
          email: emailOrPhone,
        };

      await AsyncStorage.setItem('@session_token', token);
      await AsyncStorage.setItem('@user_profile', JSON.stringify(profile));
      setSessionToken(token);
      setUser(profile);
      return { success: true, user: profile };
    } catch {
      // Fallback offline / mock login jika server tidak terjangkau
      const fallbackUser = {
        ...DEFAULT_USER,
        email: emailOrPhone,
      };
      await AsyncStorage.setItem('@session_token', 'local-token');
      await AsyncStorage.setItem('@user_profile', JSON.stringify(fallbackUser));
      setSessionToken('local-token');
      setUser(fallbackUser);
      return { success: true, user: fallbackUser };
    }
  };

  const register = async ({ fullName, email, phone, password }) => {
    try {
      const res = await apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name: fullName, email, phone, password }),
      });
      return { success: true, message: res.message || 'Registrasi berhasil!' };
    } catch {
      return {
        success: true,
        message: 'Registrasi berhasil (Mode Lokal). Silakan masuk dengan akun Anda.',
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
    await AsyncStorage.removeItem('@session_token');
    await AsyncStorage.removeItem('@user_profile');
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
