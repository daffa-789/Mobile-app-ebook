import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [sessionToken, setSessionToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Muat sesi pengguna saat aplikasi dibuka
  useEffect(() => {
    const loadStoredSession = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('@session_token');
        const storedUser = await AsyncStorage.getItem('@user_profile');

        if (storedToken && storedUser) {
          setSessionToken(storedToken);
          setUser(JSON.parse(storedUser));
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
        body: JSON.stringify({ email: emailOrPhone, password }),
      });

      const token = res.token || res.data?.token || res.sessionToken;
      const profile = res.user || res.data?.user || { email: emailOrPhone, role: 'user' };

      if (token) {
        await AsyncStorage.setItem('@session_token', token);
        await AsyncStorage.setItem('@user_profile', JSON.stringify(profile));
        setSessionToken(token);
        setUser(profile);
      }
      return { success: true, user: profile };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const register = async ({ fullName, email, phone, password }) => {
    try {
      const res = await apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ fullName, email, phone, password }),
      });
      return { success: true, message: res.message || 'Registrasi berhasil!' };
    } catch (err) {
      return { success: false, error: err.message };
    }
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
        isPro: user?.role === 'pro' || user?.is_pro === true,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
