import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { normalizeOtpPurpose, resolveOtpChannel } from '../server/lib/otpChannel.js';

/* Keputusan pemilik (26 Nov 2026): provider WhatsApp (Fonnte) HANYA dipakai
 * untuk lupa kata sandi — dan hanya kalau pengguna memakai nomor telepon.
 * Email tetap tersedia untuk OTP pendaftaran maupun pemulihan; pengingat
 * agenda lewat Web Push. Tes ini mengunci aturan itu di server dan mobile. */

const ROOT_DIR = process.cwd();
const read = (rel) => fs.readFileSync(path.join(ROOT_DIR, rel), 'utf8');

test('Cakupan saluran OTP: WhatsApp hanya untuk lupa kata sandi', async (t) => {
  await t.test('resolveOtpChannel: kode pendaftaran selalu lewat email', () => {
    assert.equal(resolveOtpChannel({ method: 'email', purpose: 'register' }), 'email');
    assert.equal(resolveOtpChannel({ method: 'whatsapp', purpose: 'register' }), 'email');
    assert.equal(resolveOtpChannel({ method: 'whatsapp', purpose: 'registration' }), 'email');
    assert.equal(resolveOtpChannel({ method: 'whatsapp', purpose: undefined }), 'email');
    assert.equal(resolveOtpChannel({}), 'email');
  });

  await t.test('resolveOtpChannel: reset lewat nomor → WhatsApp, lewat email → email', () => {
    assert.equal(resolveOtpChannel({ method: 'whatsapp', purpose: 'reset' }), 'whatsapp');
    assert.equal(resolveOtpChannel({ method: 'whatsapp', purpose: 'password_reset' }), 'whatsapp');
    assert.equal(resolveOtpChannel({ method: 'email', purpose: 'reset' }), 'email');
    assert.equal(resolveOtpChannel({ method: undefined, purpose: 'reset' }), 'email');
  });

  await t.test("normalizeOtpPurpose: 'reset' dan 'password_reset' berarti pemulihan", () => {
    assert.equal(normalizeOtpPurpose('reset'), 'reset');
    assert.equal(normalizeOtpPurpose('password_reset'), 'reset');
    assert.equal(normalizeOtpPurpose('registration'), 'register');
    assert.equal(normalizeOtpPurpose(undefined), 'register');
  });

  await t.test('server: pendaftaran selalu menerbitkan OTP lewat email', () => {
    const src = read('server/services/auth/registration_service.js');
    assert.match(src, /const chosenMethod = 'email';/);
    assert.doesNotMatch(src, /deliveryMethod:\s*'whatsapp'/);
  });

  await t.test('server: WhatsApp hanya muncul di cabang reset ber-nomor', () => {
    const src = read('server/services/auth/password_reset_service.js');
    assert.match(src, /deliveryMethod:\s*'whatsapp'/);
    assert.match(src, /deliveryMethod:\s*'email'/);
    const beforeWhatsappBranch = src.split(/deliveryMethod:\s*'whatsapp'/)[0];
    assert.ok(
      beforeWhatsappBranch.includes("purpose: 'reset'"),
      'cabang WhatsApp adalah bagian dari tujuan reset',
    );
    assert.ok(
      !src.includes("purpose: 'register'"),
      'layanan reset tidak pernah menulis OTP register',
    );
  });

  await t.test('server: kirim ulang memakai resolveOtpChannel, bukan method klien mentah', () => {
    const src = read('server/services/auth/otp_resend_service.js');
    assert.match(src, /const deliveryMethod = resolveOtpChannel\(\{ method, purpose \}\);/);
    assert.doesNotMatch(src, /deliveryMethod:\s*method\b/);
    assert.doesNotMatch(src, /deliveryMethod:\s*'whatsapp'/);
    assert.match(src, /deliveryMethod,\s+purpose,/);
  });

  await t.test('server: WhatsApp benar-benar dikirim hanya bila saluran whatsapp', () => {
    const src = read('server/lib/otp.js');
    assert.match(src, /if \(deliveryMethod === 'whatsapp' && \(phone \|\| target\)\)/);
  });

  await t.test('server: pengingat agenda lewat Web Push, bukan WhatsApp/email OTP', () => {
    const reminder = read('server/lib/eventReminder.js');
    assert.match(reminder, /from '\.\/webpush\.js'/);
    assert.doesNotMatch(reminder, /whatsapp\.js|mailer\.js/);
    const events = read('server/services/events_service.js');
    assert.doesNotMatch(events, /sendOtpWhatsApp|sendOtpEmail/);
  });

  await t.test(
    'mobile: lupa kata sandi memilih WhatsApp untuk nomor dan email untuk alamat email',
    () => {
      const src = read('mobile-app/src/screens/AuthScreen.js');
      assert.match(src, /const isEmail = cleanId\.includes\('@'\);/);
      assert.match(src, /const method = isEmail \? 'email' : 'whatsapp';/);
    },
  );

  await t.test('mobile: layar Profil tidak menjanjikan notifikasi WhatsApp', () => {
    const src = read('mobile-app/src/components/ProfileAccountCard.js');
    assert.doesNotMatch(src, /notifikasi resmi/);
    assert.match(src, /hanya dipakai untuk pemulihan akun/);
  });
});
