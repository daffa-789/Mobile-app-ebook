// DISALIN dari src/lib/phone.js

const ID_PREFIX = '62';
const digitsOnly = (raw) => String(raw ?? '').replace(/[^0-9]/g, '');

export const normalizePhone = (raw) => {
  const digits = digitsOnly(raw);
  if (!digits) return '';
  if (digits.startsWith('0')) return ID_PREFIX + digits.slice(1);
  if (digits.startsWith(ID_PREFIX)) return digits;
  if (digits.startsWith('8')) return ID_PREFIX + digits;
  return digits;
};

export const displayPhone = (raw) => {
  const normalized = normalizePhone(raw);
  if (normalized.length > ID_PREFIX.length && normalized.startsWith(ID_PREFIX)) {
    return '0' + normalized.slice(ID_PREFIX.length);
  }
  return normalized;
};

export const isValidPhone = (raw) => {
  const d = digitsOnly(raw);
  return d.length >= 8 && d.length <= 15;
};
