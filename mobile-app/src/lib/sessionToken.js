import AsyncStorage from '@react-native-async-storage/async-storage';

const SECURE_TOKEN_KEY = 'auth_token';
const LEGACY_TOKEN_KEYS = ['@session_token', 'auth_token'];

let memoryToken = null;

async function getSecureStore() {
  try {
    const secureStore = await import('expo-secure-store');
    if (typeof secureStore.isAvailableAsync !== 'function') return null;
    return (await secureStore.isAvailableAsync()) ? secureStore : null;
  } catch (_) {
    return null;
  }
}

async function removeLegacyTokens() {
  await Promise.all(LEGACY_TOKEN_KEYS.map((key) => AsyncStorage.removeItem(key)));
}

/** Persist tokens securely on native platforms and in memory on web. */
export async function storeSessionToken(token) {
  const value = String(token || '');
  if (!value) return clearSessionToken();

  memoryToken = value;
  const secureStore = await getSecureStore();
  if (!secureStore) {
    await removeLegacyTokens();
    return;
  }

  await secureStore.setItemAsync(SECURE_TOKEN_KEY, value);
  await removeLegacyTokens();
}

/** Read SecureStore first and migrate an existing plaintext token once. */
export async function getSessionToken() {
  if (memoryToken) return memoryToken;

  const secureStore = await getSecureStore();
  if (secureStore) {
    try {
      const secureToken = await secureStore.getItemAsync(SECURE_TOKEN_KEY);
      if (secureToken) {
        memoryToken = secureToken;
        await removeLegacyTokens();
        return secureToken;
      }
    } catch (_) {
      // Continue to the one-time migration below; failures never enable a
      // plaintext fallback for future requests.
    }
  }

  let legacyToken = null;
  try {
    for (const key of LEGACY_TOKEN_KEYS) {
      legacyToken = legacyToken || (await AsyncStorage.getItem(key));
    }
  } catch (_) {
    await removeLegacyTokens().catch(() => {});
    return null;
  }

  if (!legacyToken || !secureStore) {
    await removeLegacyTokens().catch(() => {});
    return null;
  }

  try {
    await secureStore.setItemAsync(SECURE_TOKEN_KEY, legacyToken);
    await removeLegacyTokens();
    memoryToken = legacyToken;
    return legacyToken;
  } catch (_) {
    await removeLegacyTokens().catch(() => {});
    return null;
  }
}

export async function clearSessionToken() {
  memoryToken = null;
  const secureStore = await getSecureStore();
  const removals = [removeLegacyTokens()];
  if (secureStore) removals.push(secureStore.deleteItemAsync(SECURE_TOKEN_KEY));
  await Promise.allSettled(removals);
}
