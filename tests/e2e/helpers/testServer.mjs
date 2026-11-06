/**
 * @file tests/e2e/helpers/testServer.mjs
 * @description Ephemeral in-memory test server manager for E2E tests.
 * Launches the unified Express API app on OS-assigned port 0, provides
 * typed request abstractions and authentic tokens for Admin, Pro, and Regular roles.
 */

import http from 'http';
import { createApiApp } from '../../../server/app.js';
import { createSessionToken } from '../../../server/auth.js';

export const KNOWN_USERS = {
  admin: {
    id: 'usr-fe45357faf4948ffaa5fe73a6ab98465',
    email: 'jualepic1610@gmail.com',
    role: 'admin',
    isPro: false,
  },
  pro: {
    id: 'usr-9747dba536d24e5abbd4ce8778077a19',
    email: 'ghazalahramadhan6@gmail.com',
    role: 'user',
    isPro: true,
  },
  regular: {
    id: 'usr-cab2053f807948afbb5888deb258158a',
    email: 'jualendfield1610@gmail.com',
    role: 'user',
    isPro: false,
  },
};

/**
 * Boots the Express API application on an ephemeral port (port 0).
 * @returns {Promise<{ server: http.Server, baseUrl: string, port: number, close: Function, request: Function }>}
 */
export async function startTestServer() {
  const app = createApiApp();
  const server = http.createServer(app);

  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });

  const address = server.address();
  const port = typeof address === 'object' ? address.port : 0;
  const baseUrl = `http://127.0.0.1:${port}`;

  /**
   * Helper to execute HTTP requests against the test server.
   * @param {string} endpoint - API path, e.g. '/api/books'
   * @param {RequestInit & { token?: string }} [options]
   */
  async function request(endpoint, options = {}) {
    const { token, headers = {}, body, ...rest } = options;
    const reqHeaders = { ...headers };

    if (token) {
      reqHeaders['Authorization'] = `Bearer ${token}`;
    }

    let reqBody = body;
    if (
      body &&
      typeof body === 'object' &&
      !(body instanceof FormData) &&
      !(body instanceof Uint8Array)
    ) {
      reqHeaders['Content-Type'] = reqHeaders['Content-Type'] || 'application/json';
      reqBody = JSON.stringify(body);
    }

    const res = await fetch(`${baseUrl}${endpoint}`, {
      ...rest,
      headers: reqHeaders,
      body: reqBody,
    });

    let data = null;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        data = await res.json();
      } catch {
        data = null;
      }
    } else {
      data = await res.text();
    }

    return {
      status: res.status,
      headers: res.headers,
      data,
      ok: res.ok,
    };
  }

  const close = () =>
    new Promise((resolve) => {
      server.close(resolve);
    });

  return { server, baseUrl, port, close, request };
}

/**
 * Returns signed JWT tokens for testing different access levels.
 */
export function getTestTokens() {
  return {
    adminToken: createSessionToken(KNOWN_USERS.admin),
    proToken: createSessionToken(KNOWN_USERS.pro),
    regularToken: createSessionToken(KNOWN_USERS.regular),
    invalidToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalidPayload.invalidSignature',
  };
}
