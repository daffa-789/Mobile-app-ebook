import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(rootDir, '.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const anonKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !anonKey || !serviceKey) {
  throw new Error('Missing Supabase credentials in .env');
}

const anonClient = createClient(supabaseUrl, anonKey, {
  auth: { persistSession: false },
});

const serviceClient = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});

test('Adversarial Challenge: Supabase RLS & API Security Boundaries', async (t) => {
  // =========================================================================
  // Section 1: Unauthorized Access to Sensitive Tables (Fail-Closed RLS)
  // =========================================================================

  await t.test('1.1. Anon SELECT on public.users must leak ZERO records', async () => {
    const { data, error } = await anonClient.from('users').select('*');
    assert.equal(error, null, 'PostgREST returns empty data under RLS rather than 500 error');
    assert.ok(Array.isArray(data), 'Response should be an array');
    assert.equal(data.length, 0, 'Anon client MUST NOT read any user records (expected 0)');
  });

  await t.test('1.2. Anon INSERT on public.users must fail or be rejected', async () => {
    const fakeId = 'exploit-user-' + Date.now();
    const { data, error } = await anonClient
      .from('users')
      .insert({
        id: fakeId,
        name: 'Hacker User',
        email: `hacker_${Date.now()}@exploit.com`,
        role: 'admin',
      })
      .select();

    // With RLS enabled and no INSERT policy, insert either errors (42501) or returns empty data without inserting
    if (!error) {
      assert.deepEqual(data, [], 'If no error, data returned must be empty (blocked by RLS)');
      // Double check via serviceClient that record was not created
      const { data: check } = await serviceClient.from('users').select('id').eq('id', fakeId);
      assert.equal(check?.length || 0, 0, 'Record must not exist in database');
    } else {
      assert.ok(error, 'Anon INSERT must be blocked');
    }
  });

  await t.test('1.3. Anon UPDATE on public.users must affect 0 rows', async () => {
    const { data, error } = await anonClient
      .from('users')
      .update({
        role: 'user',
      })
      .eq('email', 'admin@wahidiyah.com')
      .select();

    if (!error) {
      assert.deepEqual(data, [], 'Anon cannot update admin user, must return empty array');
    } else {
      assert.ok(error, 'Anon UPDATE must fail');
    }

    // Verify admin role remains 'admin'
    const { data: adminUser } = await serviceClient
      .from('users')
      .select('role')
      .eq('email', 'admin@wahidiyah.com')
      .single();
    assert.equal(adminUser?.role, 'admin', 'Admin role must remain intact');
  });

  await t.test('1.4. Anon DELETE on public.users must affect 0 rows', async () => {
    const { data, error } = await anonClient
      .from('users')
      .delete()
      .eq('email', 'admin@wahidiyah.com')
      .select();

    if (!error) {
      assert.deepEqual(data, [], 'Anon cannot delete admin user, must return empty array');
    } else {
      assert.ok(error, 'Anon DELETE must fail');
    }

    const { data: adminUser } = await serviceClient
      .from('users')
      .select('id')
      .eq('email', 'admin@wahidiyah.com');
    assert.equal(adminUser?.length, 1, 'Admin user must still exist');
  });

  await t.test('1.5. Anon SELECT on public.subscriptions must leak ZERO records', async () => {
    const { data, error } = await anonClient.from('subscriptions').select('*');
    assert.equal(error, null);
    assert.deepEqual(data, [], 'Anon must receive empty array for subscriptions');
  });

  await t.test('1.6. Anon INSERT on public.subscriptions must be blocked', async () => {
    const fakeSubId = 'exploit-sub-' + Date.now();
    const { data, error } = await anonClient
      .from('subscriptions')
      .insert({
        id: fakeSubId,
        user_id: 'admin-00000000000000000000000000000001',
        plan_name: 'Lifetime Free',
        price: 0,
        status: 'Aktif',
      })
      .select();

    if (!error) {
      assert.deepEqual(data, [], 'Blocked insert returns empty');
      const { data: check } = await serviceClient
        .from('subscriptions')
        .select('id')
        .eq('id', fakeSubId);
      assert.equal(check?.length || 0, 0);
    } else {
      assert.ok(error);
    }
  });

  await t.test('1.7. Anon SELECT on public.transactions must leak ZERO records', async () => {
    const { data, error } = await anonClient.from('transactions').select('*');
    assert.equal(error, null);
    assert.deepEqual(data, [], 'Anon must receive empty array for transactions');
  });

  await t.test('1.8. Anon INSERT on public.transactions must be blocked', async () => {
    const fakeTxId = 'exploit-tx-' + Date.now();
    const { data, error } = await anonClient
      .from('transactions')
      .insert({
        id: fakeTxId,
        ref_no: 'REF-EXPLOIT-' + Date.now(),
        user_id: 'admin-00000000000000000000000000000001',
        plan_name: 'Pro',
        amount: 1000,
        total_paid: 1000,
        payment_method: 'fake_method',
        status: 'success',
      })
      .select();

    if (!error) {
      assert.deepEqual(data, [], 'Blocked insert returns empty');
      const { data: check } = await serviceClient
        .from('transactions')
        .select('id')
        .eq('id', fakeTxId);
      assert.equal(check?.length || 0, 0);
    } else {
      assert.ok(error);
    }
  });

  await t.test(
    '1.9. Anon SELECT on public.email_verifications must leak ZERO records',
    async () => {
      const { data, error } = await anonClient.from('email_verifications').select('*');
      assert.equal(error, null);
      assert.deepEqual(data, [], 'Anon must receive empty array for email_verifications');
    },
  );

  await t.test(
    '1.10. Anon SELECT on public.push_subscriptions must leak ZERO records',
    async () => {
      const { data, error } = await anonClient.from('push_subscriptions').select('*');
      assert.equal(error, null);
      assert.deepEqual(data, [], 'Anon must receive empty array for push_subscriptions');
    },
  );

  await t.test(
    '1.11. Anon SELECT on public.api_rate_limit_buckets must be denied or leak ZERO records',
    async () => {
      const { data, error } = await anonClient.from('api_rate_limit_buckets').select('*');
      // api_rate_limit_buckets had REVOKE ALL FROM PUBLIC, anon, authenticated
      if (error) {
        assert.ok(
          error.message.includes('permission denied') || error.code === '42501',
          `Expected permission denied: ${error.message}`,
        );
      } else {
        assert.deepEqual(data, [], 'Anon must receive empty array');
      }
    },
  );

  // =========================================================================
  // Section 2: Public Read Policies vs Mutation Protection
  // =========================================================================

  await t.test('2.1. Public SELECT on public.books succeeds for anon', async () => {
    const { data, error } = await anonClient.from('books').select('id, title, is_locked');
    assert.equal(error, null, `Anon reading books should succeed: ${error?.message}`);
    assert.ok(Array.isArray(data), 'Books should return an array');
  });

  await t.test('2.2. Anon INSERT on public.books must be blocked', async () => {
    const fakeBookId = 'exploit-book-' + Date.now();
    const { data, error } = await anonClient
      .from('books')
      .insert({
        id: fakeBookId,
        title: 'Hacked Book Title',
      })
      .select();

    if (!error) {
      assert.deepEqual(data, [], 'Anon cannot insert book');
      const { data: check } = await serviceClient.from('books').select('id').eq('id', fakeBookId);
      assert.equal(check?.length || 0, 0);
    } else {
      assert.ok(error, 'Anon INSERT on books must fail');
    }
  });

  await t.test('2.3. Public SELECT on public.events succeeds for anon', async () => {
    const { data, error } = await anonClient.from('events').select('id, title, event_date');
    assert.equal(error, null, `Anon reading events should succeed: ${error?.message}`);
    assert.ok(Array.isArray(data), 'Events should return an array');
  });

  await t.test('2.4. Anon INSERT on public.events must be blocked', async () => {
    const fakeEventId = 'exploit-event-' + Date.now();
    const { data, error } = await anonClient
      .from('events')
      .insert({
        id: fakeEventId,
        title: 'Fake Event',
        event_date: '2026-12-31',
      })
      .select();

    if (!error) {
      assert.deepEqual(data, [], 'Anon cannot insert event');
      const { data: check } = await serviceClient.from('events').select('id').eq('id', fakeEventId);
      assert.equal(check?.length || 0, 0);
    } else {
      assert.ok(error, 'Anon INSERT on events must fail');
    }
  });

  await t.test(
    '2.5. Public SELECT on public.carousel_slides succeeds for active slides',
    async () => {
      const { data, error } = await anonClient
        .from('carousel_slides')
        .select('id, title, is_active');
      assert.equal(error, null, `Anon reading carousel_slides should succeed: ${error?.message}`);
      assert.ok(Array.isArray(data), 'Carousel slides should return an array');
    },
  );

  await t.test('2.6. Anon INSERT on public.carousel_slides must be blocked', async () => {
    const fakeSlideId = 'exploit-slide-' + Date.now();
    const { data, error } = await anonClient
      .from('carousel_slides')
      .insert({
        id: fakeSlideId,
        title: 'Defaced Slide',
        is_active: true,
      })
      .select();

    if (!error) {
      assert.deepEqual(data, [], 'Anon cannot insert carousel slide');
      const { data: check } = await serviceClient
        .from('carousel_slides')
        .select('id')
        .eq('id', fakeSlideId);
      assert.equal(check?.length || 0, 0);
    } else {
      assert.ok(error, 'Anon INSERT on carousel_slides must fail');
    }
  });

  // =========================================================================
  // Section 3: Stored RPC Function Rate-Limit Access & Revocation
  // =========================================================================

  const dummyKey = 'a'.repeat(64);

  await t.test('3.1. Anon calling RPC increment_api_rate_limit MUST fail', async () => {
    const { data, error } = await anonClient.rpc('increment_api_rate_limit', {
      p_bucket_key: dummyKey,
      p_window_ms: 60000,
    });

    assert.ok(error, 'Anon MUST NOT be able to call increment_api_rate_limit');
    assert.ok(
      error.message.includes('permission denied') ||
        error.code === '42501' ||
        error.code === 'PGRST202' ||
        error.code === '401' ||
        error.code === '403',
      `Error must reflect permission denied: ${error.message} (code: ${error.code})`,
    );
  });

  await t.test('3.2. Anon calling RPC decrement_api_rate_limit MUST fail', async () => {
    const { data, error } = await anonClient.rpc('decrement_api_rate_limit', {
      p_bucket_key: dummyKey,
      p_window_ms: 60000,
    });

    assert.ok(error, 'Anon MUST NOT be able to call decrement_api_rate_limit');
  });

  await t.test('3.3. Anon calling RPC reset_api_rate_limit MUST fail', async () => {
    const { data, error } = await anonClient.rpc('reset_api_rate_limit', {
      p_bucket_key: dummyKey,
      p_window_ms: 60000,
    });

    assert.ok(error, 'Anon MUST NOT be able to call reset_api_rate_limit');
  });

  await t.test('3.4. service_role CAN execute RPC increment_api_rate_limit', async () => {
    const testKey = 'b'.repeat(64);
    const { data, error } = await serviceClient.rpc('increment_api_rate_limit', {
      p_bucket_key: testKey,
      p_window_ms: 60000,
    });

    assert.equal(error, null, `service_role should be able to call RPC: ${error?.message}`);
    assert.ok(data, 'RPC should return rate limit result');
    assert.ok(Array.isArray(data) ? data[0]?.total_hits >= 1 : data?.total_hits >= 1);

    // Clean up test bucket
    await serviceClient.rpc('reset_api_rate_limit', {
      p_bucket_key: testKey,
      p_window_ms: 60000,
    });
  });

  // =========================================================================
  // Section 4: Storage Bucket 'buku' Access Boundaries
  // =========================================================================

  await t.test('4.1. Anon client cannot list files in private bucket buku', async () => {
    const { data, error } = await anonClient.storage.from('buku').list();
    // In Supabase Storage, listing a private bucket without policy returns error or empty array
    if (error) {
      assert.ok(true, 'Storage list errored as expected');
    } else {
      assert.deepEqual(data, [], 'Private bucket listing without policy must return empty');
    }
  });

  await t.test('4.2. Anon client cannot upload files to bucket buku', async () => {
    const dummyBlob = new Blob(['malicious-content'], { type: 'application/pdf' });
    const { data, error } = await anonClient.storage.from('buku').upload('exploit.pdf', dummyBlob, {
      upsert: true,
    });

    assert.ok(error, 'Anon client MUST NOT be able to upload to buku bucket');
    assert.ok(
      error.message.includes('row-level security') ||
        error.message.includes('not found') ||
        error.message.includes('Unauthorized') ||
        error.statusCode === '403' ||
        error.statusCode === 403 ||
        error.statusCode === '401' ||
        error.statusCode === 401,
      `Upload error message: ${error.message} (status: ${error.statusCode})`,
    );
  });

  await t.test(
    '4.3. Direct unauthenticated HTTP download of object in bucket buku fails',
    async () => {
      const publicUrl = `${supabaseUrl}/storage/v1/object/public/buku/secret.pdf`;
      const res = await fetch(publicUrl);
      // Bucket is private (public = false), so direct public endpoint returns 400 or 404
      assert.ok(
        res.status === 400 || res.status === 404 || res.status === 403,
        `Public URL download on private bucket should return 400, 403, or 404, got: ${res.status}`,
      );
    },
  );

  await t.test('4.4. service_role confirms bucket buku is private with 50MB limit', async () => {
    const { data: buckets, error } = await serviceClient.storage.listBuckets();
    assert.equal(error, null, `service_role should list buckets: ${error?.message}`);
    const bukuBucket = buckets.find((b) => b.id === 'buku');
    assert.ok(bukuBucket, 'Bucket buku must exist');
    assert.equal(bukuBucket.public, false, 'Bucket buku must have public = false');
    assert.equal(
      bukuBucket.file_size_limit,
      52428800,
      'Bucket buku must have 50MB limit (52428800 bytes)',
    );
  });
});
