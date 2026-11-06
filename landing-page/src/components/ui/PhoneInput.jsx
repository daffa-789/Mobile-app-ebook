import { useEffect, useState } from 'react';
import { Phone } from 'lucide-react';
import { cn } from '@lib/utils';
import { displayPhone, normalizePhone } from '@lib/phone';

const MAX_DIGITS = 14;

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
