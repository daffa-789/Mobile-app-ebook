import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const read = (rel) => fs.readFileSync(path.join(rootDir, rel), 'utf8');

test('Audit fixes: admin AppContext, mobile AuthScreen styles, and Profile server sync', async (t) => {
  await t.test('Admin AppContext provides updateUserRole and drops legacy PWA slices', () => {
    const appSrc = read('admin-dashboard-web/src/App.jsx');
    const ctxSrc = read('admin-dashboard-web/src/context/AppContext.jsx');

    assert.ok(appSrc.includes('updateUserRole('), 'Admin App.jsx calls updateUserRole');
    assert.ok(
      ctxSrc.includes('const updateUserRole = useCallback('),
      'Admin AppContext defines updateUserRole',
    );
    assert.ok(/\bupdateUserRole,/.test(ctxSrc), 'Admin AppContext exposes updateUserRole in value');

    for (const removed of [
      'admin-dashboard-web/src/context/slices/usePaymentSlice.js',
      'admin-dashboard-web/src/context/slices/useNavigationSlice.js',
      'admin-dashboard-web/src/lib/navigation.js',
      'admin-dashboard-web/src/data/mockData.js',
      'shared/mockData.js',
    ]) {
      assert.equal(fs.existsSync(path.join(rootDir, removed)), false, `${removed} must be deleted`);
    }
  });

  await t.test('AuthScreen & ForgotPasswordView define primaryButtonDisabled in StyleSheet', () => {
    const authSrc = read('mobile-app/src/screens/AuthScreen.js');
    const forgotSrc = read('mobile-app/src/components/ForgotPasswordView.js');

    assert.match(authSrc, /primaryButtonDisabled:\s*\{/);
    assert.match(forgotSrc, /primaryButtonDisabled:\s*\{/);
  });

  await t.test('ProfileAccountCard syncs name updates to PUT /api/users/profile', () => {
    const profileSrc = read('mobile-app/src/screens/ProfileScreen.js');
    const cardSrc = read('mobile-app/src/components/ProfileAccountCard.js');

    assert.ok(profileSrc.includes('<ProfileAccountCard'));
    assert.match(cardSrc, /apiRequest\(['"]\/api\/users\/profile['"]/);
    assert.match(cardSrc, /method:\s*['"]PUT['"]/);
    assert.match(cardSrc, /await onUpdateUser\(/);
  });

  await t.test('ReaderScreen & BookContext have dead PDF notice and carousel fetch removed', () => {
    const readerSrc = read('mobile-app/src/screens/ReaderScreen.js');
    const bookCtxSrc = read('mobile-app/src/context/BookContext.js');

    assert.ok(!readerSrc.includes('pdfNoticeCard'), 'Unreachable pdfNoticeCard removed');
    assert.ok(!readerSrc.includes("from '../theme'"), 'Unused theme import removed');
    assert.ok(!bookCtxSrc.includes('/api/carousel'), 'Dead /api/carousel fetch removed');
    assert.ok(!bookCtxSrc.includes('carouselSlides'), 'Unused carouselSlides state removed');
  });

  await t.test('VerificationScreen & otp_resend_service align reset OTP purpose', () => {
    const verificationSrc = read('mobile-app/src/screens/VerificationScreen.js');
    const resendSrc = read('server/services/auth/otp_resend_service.js');

    assert.match(verificationSrc, /mode === 'reset-password' \? 'reset' : 'register'/);
    assert.match(
      resendSrc,
      /rawPurpose === 'reset' \|\| rawPurpose === 'password_reset' \? 'reset' : 'register'/,
    );
  });
});
