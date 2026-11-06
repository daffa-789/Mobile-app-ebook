import { controls, typography } from '@lib/styles';

/**
 * Satu isian formulir: label + kontrol dengan gaya seragam.
 *
 * Sebelumnya tiap isian menulis ulang string kelas Tailwind yang panjang
 * (radius, border, padding, cincin fokus) secara manual — mudah menyimpang
 * satu sama lain dan sulit dirawat. Komponen ini memakai kelas kanonik
 * `controls.input` / `controls.select` sehingga penampilan setiap isian
 * berubah dari SATU tempat saja.
 *
 * @param {string} id            penghubung label ↔ kontrol (`htmlFor`)
 * @param {string} label         teks label
 * @param {string} [as]          elemen kontrol: `input` (bawaan), `select`, `textarea`
 * @param {string} [className]   kelas tambahan untuk pembungkus
 * @param {...object} props      diteruskan ke elemen kontrol (value, onChange, required, dll.)
 */
export const Field = ({ id, label, as: Control = 'input', className = '', children, ...props }) => {
  const controlClass = Control === 'select' ? controls.select : controls.input;

  return (
    <div className={className}>
      <label htmlFor={id} className={typography.fieldLabel}>
        {label}
      </label>
      <Control id={id} className={controlClass} {...props}>
        {children}
      </Control>
    </div>
  );
};
