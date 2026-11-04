import { apiJson, apiJsonSend } from './client';

export const login = (identifier, password) =>
  apiJsonSend('/auth/login', { identifier: String(identifier || '').trim(), password });

export const register = (payload) => apiJsonSend('/auth/register', payload);

export const verifyRegistration = (identifier, code) =>
  apiJsonSend('/auth/verify-registration', { identifier, code });

export const resendVerification = (identifier, purpose = 'register') =>
  apiJsonSend('/auth/resend-verification', { identifier, purpose });

export const me = () => apiJson('/auth/me', { method: 'GET' });

export const requestPasswordReset = (payload) =>
  apiJsonSend('/auth/request-password-reset', payload);

export const resetPassword = (payload) => apiJsonSend('/auth/reset-password', payload);
