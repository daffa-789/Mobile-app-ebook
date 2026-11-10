import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(rootDir, '.env'), override: true });

const EXPECTED_PROJECT_REF = 'pfiowztxlbcclazpdsxe';
const EXPECTED_PROJECT_URL = `https://${EXPECTED_PROJECT_REF}.supabase.co`;

test('Challenger 2 Suite: Backend Supabase Queries & Admin Auth Stress Verification', async (t) => {
  // 1. Connection & Health Checks
  await t.test(
    '1. server/db.js testConnection() and isDatabaseHealthy() against live DB',
    async () => {
      const { testConnection, isDatabaseHealthy, supabaseServer } = await import('../server/db.js');

      assert.ok(supabaseServer, 'supabaseServer instance must be initialized');
      assert.equal(supabaseServer.supabaseUrl, EXPECTED_PROJECT_URL);

      const isConnected = await testConnection();
      assert.equal(isConnected, true, 'testConnection() must return true');

      const health = await isDatabaseHealthy();
      assert.equal(health.ok, true, 'isDatabaseHealthy() must return ok: true');
      assert.equal(health.provider, 'supabase');
      assert.ok(health.message.includes('terhubung aktif'));
    },
  );

  // 2. Admin User Record Invariants in public.users
  await t.test('2. Seeded Admin user record exists and matches security invariants', async () => {
    const { supabaseServer } = await import('../server/db.js');

    const { data: adminUser, error } = await supabaseServer
      .from('users')
      .select('*')
      .eq('email', 'admin@wahidiyah.com')
      .maybeSingle();

    assert.equal(error, null, `Query must succeed without error: ${error?.message}`);
    assert.ok(adminUser, 'Admin user must exist in public.users');
    assert.equal(adminUser.id, 'admin-00000000000000000000000000000001');
    assert.equal(adminUser.name, 'Administrator Wahidiyah');
    assert.equal(adminUser.email, 'admin@wahidiyah.com');
    assert.equal(adminUser.role, 'admin');
    assert.equal(adminUser.login_method, 'email');
    assert.equal(adminUser.is_pro, true);
    assert.equal(adminUser.subscription_expires_at, null);
    assert.ok(
      adminUser.password?.startsWith('$2b$12$'),
      'Password must be bcrypt hash with cost 12',
    );
  });

  // 3. Bcrypt Password Verification Adversarial Stress Tests
  await t.test('3. verifyPassword adversarial & boundary cases', async (t) => {
    const { verifyPassword } = await import('../server/auth.js');
    const { supabaseServer } = await import('../server/db.js');
    const adminPassword = process.env.ADMIN_TEST_PASSWORD;
    if (!adminPassword) {
      t.skip('ADMIN_TEST_PASSWORD tidak diset di .env');
      return;
    }

    const { data: adminUser } = await supabaseServer
      .from('users')
      .select('password')
      .eq('email', 'admin@wahidiyah.com')
      .single();

    const storedHash = adminUser.password;

    // 3.1 Correct password
    assert.equal(
      await verifyPassword(adminPassword, storedHash),
      true,
      'Valid password must verify to true',
    );

    // 3.2 Wrong password
    assert.equal(
      await verifyPassword('WrongPassword123!', storedHash),
      false,
      'Wrong password must verify to false',
    );

    // 3.3 Case-altered password
    assert.equal(
      await verifyPassword('adminwahidiyah2026!', storedHash),
      false,
      'Password comparison must be case-sensitive',
    );

    // 3.4 Password with appended whitespace
    assert.equal(
      await verifyPassword('AdminWahidiyah2026! ', storedHash),
      false,
      'Password with trailing space must fail',
    );

    // 3.5 Empty or null inputs
    assert.equal(await verifyPassword('', storedHash), false, 'Empty password must fail');
    assert.equal(await verifyPassword(null, storedHash), false, 'Null password must fail');
    assert.equal(
      await verifyPassword(undefined, storedHash),
      false,
      'Undefined password must fail',
    );
    assert.equal(await verifyPassword('AdminWahidiyah2026!', ''), false, 'Empty hash must fail');
    assert.equal(await verifyPassword('AdminWahidiyah2026!', null), false, 'Null hash must fail');

    // 3.6 Non-bcrypt hash inputs
    assert.equal(
      await verifyPassword('AdminWahidiyah2026!', 'plain-text-not-hash'),
      false,
      'Plain text hash format must return false without throwing',
    );
    assert.equal(
      await verifyPassword('AdminWahidiyah2026!', '$2b$12$malformedhashthatisnotlongenough'),
      false,
      'Malformed bcrypt hash must return false without throwing',
    );
  });

  // 4. Auth Service authenticateWithPassword Integration Tests
  await t.test('4. authenticateWithPassword service flow and boundary checks', async (t) => {
    const { authenticateWithPassword } = await import('../server/services/auth/session_service.js');
    const { requireAdmin, hasActivePro } = await import('../server/auth.js');
    const adminPassword = process.env.ADMIN_TEST_PASSWORD;
    if (!adminPassword) {
      t.skip('ADMIN_TEST_PASSWORD tidak diset di .env');
      return;
    }

    // 4.1 Valid login with correct credentials
    const validResult = await authenticateWithPassword({
      email: 'admin@wahidiyah.com',
      password: adminPassword,
    });

    assert.equal(validResult.ok, true, 'Valid admin login must return ok: true');
    assert.ok(validResult.token, 'Must return JWT token');
    assert.equal(validResult.user?.role, 'admin', 'User role must be admin');
    assert.equal(validResult.user?.is_pro, true, 'User is_pro must be true');
    assert.equal(validResult.user?.email, 'admin@wahidiyah.com');
    assert.equal(
      hasActivePro(validResult.user),
      true,
      'hasActivePro must return true for permanent admin',
    );

    // 4.2 Case-insensitivity in email
    const mixedCaseResult = await authenticateWithPassword({
      email: 'Admin@Wahidiyah.COM',
      password: adminPassword,
    });
    assert.equal(mixedCaseResult.ok, true, 'Email lookup must be case-insensitive');

    // 4.3 Whitespace in email
    const spacedEmailResult = await authenticateWithPassword({
      email: '   admin@wahidiyah.com   ',
      password: adminPassword,
    });
    assert.equal(spacedEmailResult.ok, true, 'Email lookup must trim whitespace');

    // 4.4 Using identifier parameter
    const identifierResult = await authenticateWithPassword({
      identifier: 'admin@wahidiyah.com',
      password: adminPassword,
    });
    assert.equal(identifierResult.ok, true, 'Login via identifier parameter must succeed');

    // 4.5 Wrong password
    const wrongPassResult = await authenticateWithPassword({
      email: 'admin@wahidiyah.com',
      password: 'WrongPassword!',
    });
    assert.equal(wrongPassResult.ok, false, 'Wrong password must return ok: false');
    assert.equal(wrongPassResult.status, 401);

    // 4.6 Non-existent user
    const unknownUserResult = await authenticateWithPassword({
      email: 'nonexistent_user_999@wahidiyah.com',
      password: 'SomePassword123!',
    });
    assert.equal(unknownUserResult.ok, false, 'Unknown user must return ok: false');
    assert.equal(unknownUserResult.status, 401);

    // 4.7 SQL Injection payload in email
    const sqliResult = await authenticateWithPassword({
      email: "admin@wahidiyah.com' OR '1'='1",
      password: 'AdminWahidiyah2026!',
    });
    assert.equal(sqliResult.ok, false, 'SQL injection in email must fail');

    // 4.8 requireAdmin middleware check
    let middlewarePassed = false;
    requireAdmin({ user: validResult.user }, {}, () => {
      middlewarePassed = true;
    });
    assert.equal(middlewarePassed, true, 'requireAdmin must allow valid admin user');

    let nonAdminBlocked = false;
    const mockRes = {
      status(code) {
        assert.equal(code, 403);
        return {
          json(body) {
            assert.equal(body.success, false);
            nonAdminBlocked = true;
          },
        };
      },
    };
    requireAdmin({ user: { role: 'user' } }, mockRes, () => {
      assert.fail('Non-admin user should not pass requireAdmin middleware');
    });
    assert.equal(nonAdminBlocked, true, 'Non-admin user must receive 403 Forbidden');
  });

  // 5. Database Query Error Handling & Resiliency
  await t.test('5. Database query error handling, invalid tables, and columns', async () => {
    const { supabaseServer } = await import('../server/db.js');

    // 5.1 Querying non-existent table
    const nonExistentTableResult = await supabaseServer
      .from('completely_fake_table_adversarial_test')
      .select('*');

    assert.equal(nonExistentTableResult.data, null, 'Data must be null for non-existent table');
    assert.ok(nonExistentTableResult.error, 'Error object must be returned');
    assert.ok(
      nonExistentTableResult.error.message.includes('not find') ||
        nonExistentTableResult.error.code === 'PGRST205' ||
        nonExistentTableResult.error.code === '42P01',
      `Error should indicate missing relation, got: ${nonExistentTableResult.error.message} (${nonExistentTableResult.error.code})`,
    );

    // 5.2 Querying non-existent column on existing table
    const nonExistentColResult = await supabaseServer
      .from('users')
      .select('completely_non_existent_column_xyz')
      .limit(1);

    assert.equal(nonExistentColResult.data, null, 'Data must be null for non-existent column');
    assert.ok(nonExistentColResult.error, 'Error object must be returned for invalid column');
    assert.ok(
      nonExistentColResult.error.code === '42703' ||
        nonExistentColResult.error.message.includes('does not exist') ||
        nonExistentColResult.error.message.includes('column'),
      `Error code should indicate column error: ${nonExistentColResult.error.code}`,
    );

    // 5.3 Filter syntax error
    const filterErrorResult = await supabaseServer
      .from('users')
      .select('id')
      .filter('id', 'in', 'malformed_value_without_parentheses');

    assert.ok(
      filterErrorResult.error || Array.isArray(filterErrorResult.data),
      'Filter error handled cleanly by PostgREST without unhandled exception',
    );
  });

  // 6. Rate Limit Stored Functions (RPC) Execution & Input Validation Hardening
  await t.test(
    '6. Stored rate-limiting RPC functions validate inputs and execute under service_role',
    async () => {
      const { supabaseServer } = await import('../server/db.js');

      // 6.1 Adversarial check: invalid bucket key must raise 'Invalid rate-limit key'
      const { error: invalidKeyError } = await supabaseServer.rpc('increment_api_rate_limit', {
        p_bucket_key: 'short_key_not_64_chars',
        p_window_ms: 60000,
      });
      assert.ok(invalidKeyError, 'RPC must reject non-64-hex key');
      assert.equal(invalidKeyError.message, 'Invalid rate-limit key');

      // 6.2 Valid 64-hex SHA-256 key
      const validBucketKey = crypto
        .createHash('sha256')
        .update(`test_adversarial_${Date.now()}`)
        .digest('hex');
      assert.equal(validBucketKey.length, 64);

      // 6.3 increment_api_rate_limit
      const { data: rows1, error: incError1 } = await supabaseServer.rpc(
        'increment_api_rate_limit',
        {
          p_bucket_key: validBucketKey,
          p_window_ms: 60000,
        },
      );
      assert.equal(incError1, null, `RPC increment error: ${incError1?.message}`);
      assert.ok(Array.isArray(rows1) && rows1.length > 0, 'increment must return result rows');
      assert.equal(Number(rows1[0].total_hits), 1, 'First increment should return total_hits = 1');

      // 6.4 increment again
      const { data: rows2, error: incError2 } = await supabaseServer.rpc(
        'increment_api_rate_limit',
        {
          p_bucket_key: validBucketKey,
          p_window_ms: 60000,
        },
      );
      assert.equal(incError2, null, `RPC increment error: ${incError2?.message}`);
      assert.equal(Number(rows2[0].total_hits), 2, 'Second increment should return total_hits = 2');

      // 6.5 decrement_api_rate_limit
      const { error: decError } = await supabaseServer.rpc('decrement_api_rate_limit', {
        p_bucket_key: validBucketKey,
        p_window_ms: 60000,
      });
      assert.equal(decError, null, `RPC decrement error: ${decError?.message}`);

      // 6.6 reset_api_rate_limit
      const { error: resetError } = await supabaseServer.rpc('reset_api_rate_limit', {
        p_bucket_key: validBucketKey,
        p_window_ms: 60000,
      });
      assert.equal(resetError, null, `RPC reset error: ${resetError?.message}`);

      // 6.7 RPC invocation with anon key must be rejected (privileges revoked)
      const anonClient = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY,
      );
      const { error: anonRpcError } = await anonClient.rpc('increment_api_rate_limit', {
        p_bucket_key: validBucketKey,
        p_window_ms: 60000,
      });
      assert.ok(
        anonRpcError,
        'Anon client must NOT be allowed to execute increment_api_rate_limit',
      );
      assert.ok(
        anonRpcError.code === '42501' ||
          anonRpcError.message.includes('permission denied') ||
          anonRpcError.message.includes('not find'),
        `Expected permission denied error for anon RPC, got: ${anonRpcError.message} (${anonRpcError.code})`,
      );
    },
  );

  // 7. Security Enforcement: RLS and Privilege Hardening
  await t.test(
    '7. Fail-closed RLS on sensitive tables, revoked table privileges, and public policies',
    async () => {
      const anonClient = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY,
      );

      // 7.1 Sensitive tables must return empty arrays to anon client under fail-closed RLS
      const rlsSensitiveTables = [
        'users',
        'subscriptions',
        'transactions',
        'email_verifications',
        'push_subscriptions',
      ];

      for (const table of rlsSensitiveTables) {
        const { data, error } = await anonClient.from(table).select('*').limit(5);
        assert.equal(error, null, `Anon read on ${table} should not error`);
        assert.deepEqual(
          data,
          [],
          `Anon read on ${table} must return empty array due to RLS fail-closed`,
        );
      }

      // 7.2 api_rate_limit_buckets has all table privileges revoked from anon -> returns 42501 permission denied
      const { data: bucketData, error: bucketTableError } = await anonClient
        .from('api_rate_limit_buckets')
        .select('*')
        .limit(1);
      assert.equal(bucketData, null, 'Anon cannot read api_rate_limit_buckets');
      assert.ok(bucketTableError, 'Must return permission denied error for api_rate_limit_buckets');
      assert.equal(bucketTableError.code, '42501', 'Error code must be 42501 permission denied');

      // 7.3 Public tables must be readable by anon client
      const publicTables = ['books', 'events', 'carousel_slides'];
      for (const table of publicTables) {
        const { data, error } = await anonClient.from(table).select('id').limit(5);
        assert.equal(
          error,
          null,
          `Anon read on ${table} should succeed under public SELECT policy`,
        );
        assert.ok(Array.isArray(data), `Anon read on ${table} must return an array`);
      }

      // 7.4 Anon write attempt on books must be blocked by RLS
      const { error: insertError } = await anonClient.from('books').insert({
        id: 'hacker-book-999',
        title: 'Malicious Book',
        slug: 'malicious-book',
      });
      assert.ok(insertError, 'Anon insert into books must be rejected by RLS');
      assert.ok(
        insertError.code === '42501' || insertError.code === 'PGRST204',
        `Error code must indicate access rejection (42501 or PGRST204), got ${insertError.code}: ${insertError.message}`,
      );

      // 7.5 Storage bucket 'buku' check
      const { supabaseServer } = await import('../server/db.js');
      const { data: bucket, error: bucketError } = await supabaseServer.storage.getBucket('buku');
      assert.equal(
        bucketError,
        null,
        `Storage bucket query should not error: ${bucketError?.message}`,
      );
      assert.ok(bucket, 'Bucket "buku" must exist');
      assert.equal(bucket.id, 'buku');
      assert.equal(bucket.public, false, 'Bucket "buku" must be private');
    },
  );

  // 8. All 9 Core Tables Schema Invariants under service_role
  await t.test('8. All 9 core tables exist, are queryable, and have active schemas', async () => {
    const { supabaseServer } = await import('../server/db.js');
    const coreTables = [
      'users',
      'books',
      'events',
      'carousel_slides',
      'subscriptions',
      'transactions',
      'email_verifications',
      'push_subscriptions',
      'api_rate_limit_buckets',
    ];

    for (const table of coreTables) {
      const { count, error } = await supabaseServer
        .from(table)
        .select('*', { count: 'exact', head: true });

      assert.equal(error, null, `Table ${table} must exist and be queryable: ${error?.message}`);
      assert.ok(typeof count === 'number', `Table ${table} count must be a number`);
    }
  });
});
