/**
 * @file tests/helpers/async_storage_mock.mjs
 * @description In-memory mock of @react-native-async-storage/async-storage.
 */

const store = new Map();

export const AsyncStorage = {
  getItem: async (key) => store.get(key) ?? null,
  setItem: async (key, val) => store.set(key, String(val)),
  removeItem: async (key) => store.delete(key),
  clear: async () => store.clear(),
};

export default AsyncStorage;
