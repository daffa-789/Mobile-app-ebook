/**
 * @file tests/helpers/rn_loader.mjs
 * @description Node.js ESM loader hooks to redirect react-native & async-storage to test mocks,
 * and support extensionless relative imports used by React Native / Metro.
 */

import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const rnMockUrl = new URL('./rn_mock.mjs', import.meta.url).href;
const storageMockUrl = new URL('./async_storage_mock.mjs', import.meta.url).href;

export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'react-native') {
    return {
      format: 'module',
      shortCircuit: true,
      url: rnMockUrl,
    };
  }
  if (specifier === '@react-native-async-storage/async-storage') {
    return {
      format: 'module',
      shortCircuit: true,
      url: storageMockUrl,
    };
  }

  // Handle extensionless relative imports like '../config/constants'
  if (specifier.startsWith('./') || specifier.startsWith('../')) {
    try {
      return await nextResolve(specifier, context);
    } catch (err) {
      if (err.code === 'ERR_MODULE_NOT_FOUND') {
        const parentUrl = context.parentURL;
        if (parentUrl && parentUrl.startsWith('file:')) {
          const parentDir = fileURLToPath(new URL('.', parentUrl));
          const withJs = new URL(`${specifier}.js`, parentUrl).href;
          return await nextResolve(withJs, context);
        }
      }
      throw err;
    }
  }

  return nextResolve(specifier, context);
}
