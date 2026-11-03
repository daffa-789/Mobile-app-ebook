/**
 * Tab manajemen carousel beranda pada panel admin.
 * Mengoordinasikan daftar slide dan formulir banner melalui sub-komponen modular.
 *
 * @module src/features/admin/CarouselTab
 */

import { useMemo } from 'react';
import { Images } from 'lucide-react';
import { controls, typography } from '@lib/styles';
import { useAdminCarouselEditor } from './hooks/useAdminCarouselEditor';
import { CarouselSlideItem } from './carousel/CarouselSlideItem';
import { CarouselFormPanel } from './carousel/CarouselFormPanel';

/**
 * Komponen Tab Carousel Admin.
 *
 * @param {object} props - Properti komponen
 * @param {Array<object>} props.slides - Daftar slide banner
 * @param {boolean} props.carouselReady - Status kesiapan tabel database carousel
 * @param {() => Promise<void>} props.refreshCarousel - Callback muat ulang data banner
 * @param {string|null} props.sessionToken - Token otentikasi admin
 * @returns {import('react').JSX.Element}
 */
export const CarouselTab = ({ slides, carouselReady, refreshCarousel, sessionToken }) => {
  const {
    form,
    setForm,
    editingId,
    isSaving,
    busyId,
    imageInputRef,
    resetForm,
    startEdit,
    uploadImage,
    submitSlide,
    deleteSlide,
  } = useAdminCarouselEditor({ sessionToken, refreshCarousel });

  const orderedSlides = useMemo(
    () => [...slides].sort((a, b) => a.sortOrder - b.sortOrder),
    [slides],
  );

  return (
    <section className="space-y-6">
      {carouselReady === false && (
        <div
          role="alert"
          className="rounded-2xl border border-cream-300 bg-cream-100 px-4 py-3 text-body text-ink-800"
        >
          Tabel <code className="font-mono">carousel_slides</code> belum ada di basis data. Jalankan
          <code className="font-mono"> supabase_database/full_setup.sql </code>
          di SQL Editor Supabase, lalu muat ulang halaman ini.
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.75fr)] items-start">
        <div className="space-y-3">
          {orderedSlides.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-cream-300 bg-cream-50 p-10 text-center">
              <Images className={controls.emptyIcon} />
              <p className="mt-3 font-bold text-ink-700">Belum ada banner</p>
              <p className={typography.helper}>
                Tambahkan dari formulir di samping, atau centang “Tampilkan di Carousel” pada sebuah
                agenda.
              </p>
            </div>
          ) : (
            orderedSlides.map((slide, index) => (
              <CarouselSlideItem
                key={slide.id}
                slide={slide}
                index={index}
                editingId={editingId}
                busyId={busyId}
                onEdit={startEdit}
                onDelete={deleteSlide}
                onUploadImage={uploadImage}
              />
            ))
          )}
        </div>

        <CarouselFormPanel
          form={form}
          setForm={setForm}
          editingId={editingId}
          isSaving={isSaving}
          imageInputRef={imageInputRef}
          onSubmit={submitSlide}
          onReset={resetForm}
        />
      </div>
    </section>
  );
};
