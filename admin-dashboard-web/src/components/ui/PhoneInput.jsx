import { useEffect, useState } from 'react';
import { Phone } from 'lucide-react';
import { cn } from '@lib/utils';
import { displayPhone, normalizePhone } from '@lib/phone';

const MAX_DIGITS = 14;

/**
 * Input nomor WhatsApp Indonesia.
 *
 * Yang diketik dan dilihat pengguna adalah format dalam negeri (082012345678); nilai
 * yang dikirim ke parent sudah dinormalisasi menjadi 6282012345678 — format yang
 * disimpan di basis data dan dipakai Fonnte.
 *
 * @param {Object} props
 * @param {string} [props.value] - Nomor tersimpan, boleh 62xx atau 08xx
 * @param {function} [props.onChange] - Callback (phone: string) => void, selalu 62xx
 * @param {string} [props.placeholder] - Contoh nomor di dalam kolom
 * @param {boolean} [props.disabled] - Status nonaktif
 * @param {boolean} [props.required] - Status wajib diisi
 * @param {string} [props.id] - ID elemen input
 * @param {string} [props.name] - Nama field formulir
 * @param {string} [props.className] - Kelas CSS wrapper
 */
export const PhoneInput = ({
  value = '',
  onChange,
  placeholder = '082012345678',
  disabled = false,
  required = false,
  id = 'phone',
  name = 'phone',
  className = '',
}) => {
  const [typed, setTyped] = useState(() => (value ? displayPhone(value) : ''));

  // Ambil alih hanya ketika nilai dari parent bukan hasil ketikan ini,
  // misalnya saat data profil selesai dimuat.
  useEffect(() => {
    if (normalizePhone(typed) !== normalizePhone(value)) {
      setTyped(value ? displayPhone(value) : '');
    }
  }, [value]);

  const handleChange = (event) => {
    const next = event.target.value.replace(/[^0-9]/g, '').slice(0, MAX_DIGITS);
    setTyped(next);
    const normalized = normalizePhone(next);
    onChange?.(normalized.length > 2 ? normalized : '');
  };

  return (
    <div className={cn('auth-input-wrap', className)}>
      <Phone className="auth-input-icon" />
      <input
        id={id}
        name={name}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        value={typed}
        onChange={handleChange}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        aria-describedby={`${id}-hint`}
      />
      <span id={`${id}-hint`} className="sr-only">
        Isi nomor WhatsApp aktif, contoh {placeholder}
      </span>
    </div>
  );
};
