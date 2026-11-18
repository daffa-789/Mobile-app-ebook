// Test: environment config validation
import { describe, it, expect } from 'vitest';

function validateEnv(env) {
  const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
  const missing = required.filter(k => !env[k]);
  if (missing.length > 0) throw new Error(`Missing env: ${missing.join(', ')}`);
  return true;
}

describe('validateEnv', () => {
  it('passes with all keys', () => {
    expect(validateEnv({ SUPABASE_URL: 'https://x.supabase.co', SUPABASE_ANON_KEY: 'key123' })).toBe(true);
  });
  it('throws when SUPABASE_URL missing', () => {
    expect(() => validateEnv({ SUPABASE_ANON_KEY: 'key' })).toThrow('SUPABASE_URL');
  });
  it('throws when both missing', () => {
    expect(() => validateEnv({})).toThrow('Missing env');
  });
});
