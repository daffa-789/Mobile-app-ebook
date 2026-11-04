// URL absolut karena RN tidak punya origin (§5.1).
// Development: http://<IP-LAN-mesin-kamu>:5000/api — localhost di HP bukan laptop.
// Production: URL Vercel. Jangan hardcode IP di luar file ini.
import Constants from 'expo-constants';

const CHANNEL = Constants.expoConfig?.extra?.channel || process.env.EXPO_PUBLIC_CHANNEL || 'preview';

const DEV_IP = process.env.EXPO_PUBLIC_API_DEV_IP || '192.168.1.10';
const PROD_BASE = process.env.EXPO_PUBLIC_API_PROD_URL || 'https://aplikasi-buku-wahidiyah.vercel.app/api';

export const API_BASE_URL = CHANNEL === 'production' ? PROD_BASE : `http://${DEV_IP}:5000/api`;
export const CHANNEL_NAME = CHANNEL;
