import AsyncStorage from '@react-native-async-storage/async-storage';

export const kvGet = async (key) => {
  const v = await AsyncStorage.getItem(key);
  return v ? JSON.parse(v) : null;
};
export const kvSet = async (key, value) => AsyncStorage.setItem(key, JSON.stringify(value));
export const kvRemove = (key) => AsyncStorage.removeItem(key);

export const pendingVerificationKey = 'buku-wahidiyah:pending-verification';
export const readingProgressKey = (bookId) => `last_read_page_${bookId}`;
export const catalogCacheKey = 'buku-wahidiyah:catalog-cache-v1';
