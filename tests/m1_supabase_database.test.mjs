import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load environment variables
dotenv.config({ path: path.join(rootDir, '.env') });

const EXPECTED_PROJECT_REF = 'pfiowztxlbcclazpdsxe';
const EXPECTED_PROJECT_URL = `https://${EXPECTED_PROJECT_REF}.supabase.co`;

test('Milestone 1 — Supabase Database & Configuration Verification', async (t) => {
  await t.test(
    '1. Environment variables in .env point to active project pfiowztxlbcclazpdsxe',
    () => {
      assert.equal(process.env.VITE_SUPABASE_URL, EXPECTED_PROJECT_URL);
      assert.equal(process.env.SUPABASE_URL, EXPECTED_PROJECT_URL);
      assert.ok(process.env.SUPABASE_JWKS_URL?.includes(EXPECTED_PROJECT_REF));
      assert.ok(process.env.VITE_SUPABASE_ANON_KEY?.startsWith('sb_publishable_'));
      assert.ok(process.env.SUPABASE_SECRET_KEY?.startsWith('sb_secret_'));
    },
  );

  await t.test('2. Hardcoded fallback configurations point to pfiowztxlbcclazpdsxe', () => {
    const filesToCheck = [
      'server/db.js',
      'src/lib/supabaseConfig.js',
      'landing-page/src/lib/supabaseConfig.js',
      'admin-dashboard-web/src/lib/supabaseConfig.js',
      'supabase/.temp/project-ref',
      'supabase/.temp/linked-project.json',
    ];

    for (const relPath of filesToCheck) {
      const fullPath = path.join(rootDir, relPath);
      assert.ok(fs.existsSync(fullPath), `File ${relPath} should exist`);
      const content = fs.readFileSync(fullPath, 'utf8');
      assert.ok(
        content.includes(EXPECTED_PROJECT_REF),
        `File ${relPath} must include ${EXPECTED_PROJECT_REF}`,
      );
      assert.ok(
        !content.includes('pdimjmbjutlzjdfjaqgt'),
        `File ${relPath} must NOT contain stale ref pdimjmbjutlzjdfjaqgt`,
      );
    }
  });

  await t.test(
    '3. PostgREST API with service_role key can read public.users and sees seeded admin',
    async () => {
      const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
      const { data, error } = await client
        .from('users')
        .select('id, name, email, role, is_pro')
        .eq('email', 'admin@wahidiyah.com');

      assert.equal(error, null, `Query should not fail: ${error?.message}`);
      assert.ok(Array.isArray(data), 'Response data should be an array');
      assert.equal(data.length, 1, 'Should find exactly 1 admin user');
      assert.equal(data[0].email, 'admin@wahidiyah.com');
      assert.equal(data[0].role, 'admin');
      assert.equal(data[0].is_pro, true);
    },
  );

  await t.test(
    '4. PostgREST API with publishable key can read books (public SELECT policy)',
    async () => {
      const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_PUBLISHABLE_KEY);
      const { data, error } = await client.from('books').select('id, title');

      assert.equal(error, null, `Public query should not error: ${error?.message}`);
      assert.ok(Array.isArray(data), 'Books should return an array');
    },
  );

  await t.test(
    '5. PostgREST API with publishable key on users table returns empty (RLS fail-closed)',
    async () => {
      const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_PUBLISHABLE_KEY);
      const { data, error } = await client.from('users').select('id, email');

      assert.equal(error, null, `RLS should block rows silently or return empty array`);
      assert.deepEqual(
        data,
        [],
        'Anon query on users must return empty array due to RLS fail-closed',
      );
    },
  );

  await t.test(
    '6. server/db.js testConnection() connects successfully to Supabase Cloud',
    async () => {
      const { testConnection } = await import('../server/db.js');
      const isConnected = await testConnection();
      assert.equal(isConnected, true, 'server/db.js testConnection() should return true');
    },
  );
});
