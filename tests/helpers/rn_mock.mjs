/**
 * @file tests/helpers/rn_mock.mjs
 * @description In-memory mock of react-native for Node.js test execution.
 */

export const Platform = {
  OS: 'android',
  select: (obj) => (obj && (obj.android !== undefined ? obj.android : obj.default)) || null,
};

export default {
  Platform,
};
