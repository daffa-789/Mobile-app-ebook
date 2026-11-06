/**
 * Komponen panel formulir penambahan dan pengubahan slide banner carousel.
 *
 * @module src/features/admin/carousel/CarouselFormPanel
 */

import { Loader2, Pencil, Plus, Upload, X } from 'lucide-react';
import { controls, typography } from '@lib/styles';

/**
 * Komponen formulir banner carousel.
 *
 * @param {object} props - Properti komponen
 * @param {object} props.form - State data formulir
 * @param {import('react').Dispatch<import('react').SetStateAction<object>>} props.setForm - Setter form
 * @param {string|null} props.editingId - ID slide yang sedang diedit (null jika tambah baru)
 * @param {boolean} props.isSaving - Indikator status simpan
 * @param {import('react').RefObject<HTMLInputElement>} props.imageInputRef - Ref input file gambar
 * @param {(e: import('react').FormEvent) => Promise<void>} props.onSubmit - Handler submit form
 * @param {() => void} props.onReset - Handler batal / reset form
 * @returns {import('react').JSX.Element}
 */
export const CarouselFormPanel = ({
  form,
  setForm,
  editingId,
  isSaving,
  imageInputRef,
  onSubmit,
  onReset,
}) => {
  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-3xl border border-cream-300 bg-cream-50 p-5 shadow-sm"
    >
      <div className="flex items-center justify-between border-b border-cream-200 pb-3">
        <h3 className="flex items-center gap-2 text-h3 font-bold text-ink-900">
          {editingId ? (
            <Pencil className={controls.iconBrand} />
          ) : (
            <Plus className={controls.iconBrand} />
          )}
          {editingId ? 'Ubah banner' : 'Tambah banner'}
        </h3>
        {editingId && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1 text-caption font-bold text-ink-400 transition hover:text-ink-700 cursor-pointer"
          >
            <X className="h-3.5 w-3.5" /> Batal
          </button>
        )}
      </div>

      <div>
        <label htmlFor="slide-title" className={typography.fieldLabel}>
          Judul banner
        </label>
        <input
          id="slide-title"
          required
          maxLength={200}
          value={form.title}
          onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
          placeholder="Contoh: Mujahadah Kubro Rojabiyah"
          className="w-full rounded-xl border border-cream-300 px-3 py-2.5 text-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200"
        />
      </div>

      <div>
        <label htmlFor="slide-description" className={typography.fieldLabel}>
          Deskripsi
        </label>
        <textarea
          id="slide-description"
          rows="3"
          maxLength={500}
          value={form.description}
          onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Keterangan singkat yang tampil di bawah judul..."
          className="w-full rounded-xl border border-cream-300 px-3 py-2.5 text-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200"
        />
      </div>

      <div className="grid grid-cols-2 items-end gap-2">
        <div>
          <label htmlFor="slide-order" className={typography.fieldLabel}>
            Urutan slide
          </label>
          <input
            id="slide-order"
            type="number"
            min="0"
            max="9999"
            value={form.sort_order}
            onChange={(e) => setForm((prev) => ({ ...prev, sort_order: e.target.value }))}
            className="w-full rounded-xl border border-cream-300 px-3 py-2 text-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200"
          />
        </div>
        <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-cream-300 px-3 text-small font-bold text-ink-700">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
            className="h-4 w-4 rounded border-cream-300 text-brand-700 focus:ring-brand-300"
          />
          Aktifkan banner
        </label>
      </div>

      {!editingId && (
        <div>
          <label htmlFor="slide-image-new" className={typography.fieldLabel}>
            <Upload className="mr-1 inline h-3.5 w-3.5" /> Gambar banner (opsional)
          </label>
          <input
            id="slide-image-new"
            ref={imageInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/avif"
            className="w-full rounded-xl border border-cream-300 bg-cream-50 px-3 py-2 text-caption file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-2.5 file:py-1 file:text-caption file:font-bold file:text-brand-700"
          />
        </div>
      )}

      <button
        type="submit"
        disabled={isSaving}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-700 px-4 py-3 text-small font-bold text-cream-50 shadow-sm transition hover:bg-brand-800 disabled:opacity-60 cursor-pointer"
      >
        {isSaving ? (
          <Loader2 className={controls.spinner} />
        ) : editingId ? (
          <Pencil className="h-4 w-4" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
        {editingId ? 'Simpan perubahan' : 'Tambah banner'}
      </button>
    </form>
  );
};
