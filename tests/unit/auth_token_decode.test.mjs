// Test: JWT-like token decoding (base64 payload)
import { describe, it, expect } from 'vitest';

function decodePayload(token) {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid token');
  return JSON.parse(atob(parts[1]));
}

describe('decodePayload', () => {
  it('decodes a valid token payload', () => {
    const payload = { sub: '123', role: 'user' };
    const fakeToken = 'header.' + btoa(JSON.stringify(payload)) + '.sig';
    expect(decodePayload(fakeToken)).toEqual(payload);
  });
  it('throws on malformed token', () => {
    expect(() => decodePayload('not-a-token')).toThrow('Invalid token');
  });
});
