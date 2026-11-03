/**
 * Header judul bersama untuk layar autentikasi (masuk / daftar / reset).
 *
 * @module src/features/auth/AuthBrandHeader
 */

/**
 * @param {object} props
 * @param {string} props.title - Judul utama layar autentikasi
 * @param {string} [props.subtitle] - Subjudul / deskripsi petunjuk aksi
 * @returns {import('react').JSX.Element}
 */
export const AuthBrandHeader = ({ title, subtitle }) => (
  <div className="mb-5 text-center">
    <h1 className="font-display text-displaySm font-bold tracking-tight text-ink-900">{title}</h1>
    {subtitle && <p className="mt-1 text-xs text-ink-500">{subtitle}</p>}
  </div>
);
