import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'buku-wahidiyah:auth-token';

export const getToken = async () => SecureStore.getItemAsync(TOKEN_KEY);
export const saveToken = async (token) => {
  if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);
  else await SecureStore.deleteItemAsync(TOKEN_KEY);
};
export const clearToken = () => SecureStore.deleteItemAsync(TOKEN_KEY);
