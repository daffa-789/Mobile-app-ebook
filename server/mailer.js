import { OAuth2Client } from 'google-auth-library';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config();

const CLIENT_ID = process.env.GMAIL_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '';
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || '';
const REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN || '';
const SENDER = process.env.GMAIL_SENDER || '';
const SENDER_NAME = process.env.GMAIL_SENDER_NAME || 'Buku Wahidiyah';

const GMAIL_SEND_URL = 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send';

/* Logo ditanam sebagai lampiran CID, bukan URL: penerima sering membuka email
 * sebelum server publik menyala, dan gambar eksternal justru menambah sinyal
 * spam pada pengirim baru.
 */
const LOGO_CID = 'logo@wahidiyah';
const LOGO_PATH = path.resolve(__dirname, '..', 'public', 'icon-192.png');
const LOGO_BASE64 = (() => {
  try {
    return fs.readFileSync(LOGO_PATH).toString('base64');
  } catch {
    return '';
  }
})();

export const isMailerConfigured = () =>
  Boolean(CLIENT_ID && CLIENT_SECRET && REFRESH_TOKEN && SENDER);

const oauthClient = isMailerConfigured()
  ? new OAuth2Client({ clientId: CLIENT_ID, clientSecret: CLIENT_SECRET })
  : null;
if (oauthClient) oauthClient.setCredentials({ refresh_token: REFRESH_TOKEN });

const encodeHeader = (value) =>
  `=?UTF-8?B?${Buffer.from(String(value), 'utf8').toString('base64')}?=`;
const encodeBody = (value) => Buffer.from(String(value), 'utf8').toString('base64');

const wrap76 = (base64) => (base64.match(/.{1,76}/g) || []).join('\r\n');

const rfc2822Date = (d = new Date()) => {
  const pad = (n) => String(n).padStart(2, '0');
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MONTHS = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const offsetMinutes = -d.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMinutes);
  return (
    `${DAYS[d.getDay()]}, ${pad(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ` +
    `${sign}${pad(Math.floor(abs / 60))}${pad(abs % 60)}`
  );
};

/**
 * Susun pesan MIME. Bila `inlineImages` diisi, struktur menjadi
 * multipart/related agar logo bisa dirujuk lewat `cid:` di HTML.
 */
const buildMimeMessage = ({ to, subject, text, html, inlineImages = [] }) => {
  const altBoundary = `bw_alt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  const relBoundary = `bw_rel_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  const from = SENDER_NAME ? `${SENDER_NAME} <${SENDER}>` : SENDER;
  const domain = SENDER.includes('@') ? SENDER.split('@').pop() : 'localhost';
  const messageId = `<${Date.now().toString(36)}.${Math.random().toString(36).slice(2, 12)}@${domain}>`;

  const alternative = [
    `Content-Type: multipart/alternative; boundary="${altBoundary}"`,
    '',
    `--${altBoundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    wrap76(encodeBody(text)),
    `--${altBoundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    wrap76(encodeBody(html)),
    `--${altBoundary}--`,
  ].join('\r\n');

  const headers = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${encodeHeader(subject)}`,
    `Date: ${rfc2822Date()}`,
    `Message-ID: ${messageId}`,
    'MIME-Version: 1.0',
    /* Menandai pesan sebagai transaksional otomatis: mencegah balasan otomatis
     * dan memberi sinyal yang benar ke penyaring spam.
     */
    'Auto-Submitted: auto-generated',
    'X-Auto-Response-Suppress: All',
  ];

  if (!inlineImages.length) {
    return [...headers, alternative, ''].join('\r\n');
  }

  const related = [
    `Content-Type: multipart/related; boundary="${relBoundary}"; type="multipart/alternative"`,
    '',
    `--${relBoundary}`,
    alternative,
    '',
  ];

  for (const image of inlineImages) {
    related.push(
      `--${relBoundary}`,
      `Content-Type: ${image.contentType}; name="${image.filename}"`,
      'Content-Transfer-Encoding: base64',
      `Content-ID: <${image.cid}>`,
      `Content-Disposition: inline; filename="${image.filename}"`,
      '',
      wrap76(image.base64),
    );
  }

  related.push(`--${relBoundary}--`, '');

  return [...headers, related.join('\r\n')].join('\r\n');
};

const sendViaGmailApi = async ({ to, subject, text, html }) => {
  if (!oauthClient) return false;

  const { token } = await oauthClient.getAccessToken();
  if (!token)
    throw new Error('Gagal memperoleh access token Gmail (refresh token mungkin sudah dicabut).');

  const inlineImages = LOGO_BASE64
    ? [
        {
          cid: LOGO_CID,
          contentType: 'image/png',
          filename: 'logo-buku-wahidiyah.png',
          base64: LOGO_BASE64,
        },
      ]
    : [];

  const raw = Buffer.from(
    buildMimeMessage({ to, subject, text, html, inlineImages }),
    'utf8',
  ).toString('base64url');

  const response = await fetch(GMAIL_SEND_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw }),
  });

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 300);
    throw new Error(`Gmail API membalas HTTP ${response.status}: ${detail}`);
  }
  return true;
};

const COPY = {
  register: {
    subject: 'Kode verifikasi Buku Wahidiyah',
    heading: 'Kode verifikasi Anda',
    eyebrow: 'Kode verifikasi',
    action: 'Masukkan kode ini untuk menyelesaikan pendaftaran akun',
    note: 'Kode berlaku <strong>10 menit</strong> dan hanya dapat dipakai sekali.',
    closing:
      'Jika Anda tidak meminta kode ini, abaikan saja email ini — tidak ada perubahan pada akun Anda.',
  },
  reset: {
    subject: 'Kode pemulihan password Buku Wahidiyah',
    heading: 'Kode pemulihan password',
    eyebrow: 'Kode pemulihan',
    action: 'Kami menerima permintaan untuk mengatur ulang password akun',
    note: 'Kode berlaku <strong>10 menit</strong> dan hanya dapat dipakai sekali.',
    closing:
      'Jika Anda tidak meminta pengaturan ulang password, abaikan email ini — password Anda tidak berubah.',
  },
};

const EMAIL_FONT = "'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

/* Tabel, bukan flex/grid: klien email (Gmail, Outlook) membuang CSS modern.
 * Semua gaya ditulis inline karena <style> sering dilucuti.
 */
const renderEmail = ({ heading, eyebrow, action, target, note, closing, code }) => {
  const preheader = code
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">Kode ${code} — berlaku 10 menit.</div>`
    : '<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">Informasi cara masuk akun Buku Wahidiyah.</div>';

  const logo = LOGO_BASE64
    ? `<img src="cid:${LOGO_CID}" width="44" height="44" alt="Buku Wahidiyah" style="display:block;width:44px;height:44px;border:0;outline:none;text-decoration:none;border-radius:12px;">`
    : '';

  const codeBlock = code
    ? `<tr><td style="padding:20px 32px 0 32px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F0F7F3;border:1px solid #DCEDE4;border-radius:12px;">
            <tr><td align="center" style="padding:20px 16px;">
              <p style="margin:0 0 6px 0;font-family:${EMAIL_FONT};font-size:11px;line-height:16px;letter-spacing:1.5px;text-transform:uppercase;color:#216B4C;font-weight:700;">${eyebrow}</p>
              <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:36px;line-height:44px;letter-spacing:9px;font-weight:700;color:#14523A;">${code}</p>
            </td></tr>
          </table>
        </td></tr>`
    : '';

  return `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only">
<title>${heading}</title>
</head>
<body style="margin:0;padding:0;background-color:#F7F2E9;">
${preheader}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F7F2E9;">
  <tr><td align="center" style="padding:32px 12px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background-color:#FFFDFA;border:1px solid #E4D9C6;border-radius:16px;overflow:hidden;font-family:${EMAIL_FONT};">
      <tr><td style="padding:28px 32px 0 32px;">
        ${logo}
        <p style="margin:14px 0 0 0;font-family:${EMAIL_FONT};font-size:11px;line-height:16px;letter-spacing:2px;text-transform:uppercase;color:#7C756C;font-weight:700;">Buku Wahidiyah</p>
      </td></tr>
      <tr><td style="padding:10px 32px 0 32px;">
        <h1 style="margin:0;font-family:${EMAIL_FONT};font-size:26px;line-height:34px;color:#141210;font-weight:700;">${heading}</h1>
      </td></tr>
      ${codeBlock}
      <tr><td style="padding:20px 32px 0 32px;">
        <p style="margin:0;font-family:${EMAIL_FONT};font-size:15px;line-height:24px;color:#3F3B35;">${action} <strong style="color:#1D1B17;">${target}</strong>.</p>
        <p style="margin:10px 0 0 0;font-family:${EMAIL_FONT};font-size:14px;line-height:22px;color:#5A544C;">${note}</p>
      </td></tr>
      <tr><td style="padding:22px 32px 26px 32px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-top:1px solid #E4D9C6;font-size:0;line-height:0;">&nbsp;</td></tr></table>
        <p style="margin:14px 0 0 0;font-family:${EMAIL_FONT};font-size:12px;line-height:19px;color:#7C756C;">${closing}</p>
      </td></tr>
      <tr><td style="background-color:#14523A;padding:16px 32px;">
        <p style="margin:0;font-family:${EMAIL_FONT};font-size:12px;line-height:18px;color:#DCEDE4;">Buku Wahidiyah — Perpustakaan Digital</p>
      </td></tr>
    </table>
    <p style="margin:14px 0 0 0;font-family:${EMAIL_FONT};font-size:11px;line-height:16px;color:#7C756C;">Email otomatis, mohon tidak dibalas.</p>
  </td></tr>
</table>
</body>
</html>`;
};

export const sendOtpEmail = async (email, code, purpose = 'register') => {
  if (!oauthClient) return false;
  const copy = COPY[purpose] || COPY.register;

  const text = [
    'Buku Wahidiyah — Perpustakaan Digital',
    '',
    `${copy.eyebrow}: ${code}`,
    '',
    `${copy.action} ${email}.`,
    'Kode berlaku 10 menit dan hanya dapat dipakai sekali.',
    '',
    copy.closing,
    '',
    'Email otomatis, mohon tidak dibalas.',
  ].join('\n');

  return sendViaGmailApi({
    to: email,
    subject: copy.subject,
    text,
    html: renderEmail({ ...copy, target: email, code }),
  });
};

export const sendGoogleAccountEmail = async (email) => {
  if (!oauthClient) return false;

  const action =
    'Akun ini terdaftar melalui Google, sehingga tidak memiliki password yang bisa diatur ulang. Silakan masuk memakai tombol Masuk dengan Google di halaman masuk.';

  return sendViaGmailApi({
    to: email,
    subject: 'Cara masuk ke akun Buku Wahidiyah Anda',
    text: [
      'Buku Wahidiyah — Perpustakaan Digital',
      '',
      `Akun ${email} terdaftar melalui Google.`,
      '',
      'Akun ini tidak memiliki password, jadi tidak ada yang bisa diatur ulang di sini.',
      'Silakan masuk memakai tombol "Masuk dengan Google" di halaman masuk.',
      '',
      'Email otomatis, mohon tidak dibalas.',
    ].join('\n'),
    html: renderEmail({
      heading: 'Cara masuk ke akun Anda',
      eyebrow: 'Akun Google',
      action: 'Akun',
      target: email,
      note: action,
      closing: 'Jika Anda tidak merasa meminta ini, abaikan saja email ini.',
      code: '',
    }),
  });
};
