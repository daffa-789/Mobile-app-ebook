import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';

const ID_PREFIX = '62';

const digitsOnly = (raw) => String(raw ?? '').replace(/[^0-9]/g, '');

const toNationalNumber = (digits) => {
  const d = String(digits || '');
  if (d.startsWith(ID_PREFIX)) return `0${d.slice(ID_PREFIX.length)}`;
  if (d.startsWith('0')) return d;
  if (d.startsWith('8')) return `0${d}`;
  return d;
};

const toE164 = (raw) => {
  const digits = digitsOnly(raw);
  const national = toNationalNumber(digits);
  if (!national) return null;
  if (!isValidPhoneNumber(national, 'ID')) return null;
  try {
    const parsed = parsePhoneNumber(national, 'ID');
    return parsed?.number ? parsed.number.replace(/^\+/, '') : null;
  } catch {
    return null;
  }
};

/**
 * Ubah 08xx, +62xx, atau 62xx menjadi format baku 628xx.
 */
export const normalizePhone = (raw) => {
  const e164 = toE164(raw);
  return e164 || '';
};

/**
 * Ubah format 62xx menjadi 08xx yang ramah pengguna untuk tampilan UI.
 */
export const displayPhone = (raw) => {
  const normalized = normalizePhone(raw);
  if (normalized.length > ID_PREFIX.length && normalized.startsWith(ID_PREFIX)) {
    return '0' + normalized.slice(ID_PREFIX.length);
  }
  return normalized;
};
