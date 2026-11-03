/**
 * Skeleton Loader Components (D-09)
 *
 * Mengikuti 3 Color Key (DESIGN.md seksi 1.5):
 * Menggunakan token bg-cream-200/80 dan dark:bg-cream-300/40.
 * Menghormati prefers-reduced-motion (animasi berhenti berkedip).
 */

export const Skeleton = ({ className = '', ...props }) => (
  <div
    className={`animate-pulse rounded-md bg-cream-200/80 dark:bg-cream-300/40 ${className}`}
    aria-hidden="true"
    {...props}
  />
);

const BookCardSkeleton = () => (
  <div className="bg-cream-50 rounded-3xl border border-cream-300/80 p-3.5 sm:p-4 flex flex-col justify-between shadow-sm overflow-hidden ring-1 ring-ink-800/5">
    <div className="w-full aspect-[3/4.2] rounded-2xl bg-cream-200/80 dark:bg-cream-300/40 mb-3 animate-pulse" />
    <div className="space-y-2 flex-1 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <Skeleton className="h-4 w-16 rounded-md" />
          <Skeleton className="h-3.5 w-12 rounded-md" />
        </div>
        <Skeleton className="h-5 w-4/5 rounded-md mb-1.5" />
        <Skeleton className="h-4 w-1/2 rounded-md mb-2" />
        <Skeleton className="h-3 w-full rounded-md mb-1" />
        <Skeleton className="h-3 w-3/4 rounded-md" />
      </div>
      <Skeleton className="w-full h-11 rounded-xl mt-4" />
    </div>
  </div>
);

export const BookGridSkeleton = ({ count = 8 }) => (
  <div
    data-testid="book-grid-skeleton"
    className="w-full grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5 lg:gap-6 justify-center items-stretch"
    aria-label="Memuat daftar buku..."
  >
    {Array.from({ length: count }).map((_, i) => (
      <BookCardSkeleton key={i} />
    ))}
  </div>
);

export const CalendarSkeleton = () => (
  <div
    data-testid="calendar-skeleton"
    className="space-y-6 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6"
    aria-label="Memuat kalender..."
  >
    {/* Banner atas */}
    <div className="rounded-3xl bg-cream-200/70 dark:bg-cream-300/30 p-6 animate-pulse">
      <Skeleton className="h-7 w-64 rounded-md mb-2 bg-cream-300/80 dark:bg-cream-300/60" />
      <Skeleton className="h-4 w-96 max-w-full rounded-md bg-cream-300/80 dark:bg-cream-300/60" />
    </div>

    {/* Grid dua kolom */}
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      <div className="lg:col-span-5 space-y-4 bg-cream-50 rounded-3xl p-4 border border-cream-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-36 rounded-md" />
          <div className="flex gap-1">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      </div>

      <div className="lg:col-span-7 space-y-3 bg-cream-50 rounded-3xl p-5 border border-cream-200 shadow-sm">
        <Skeleton className="h-6 w-48 rounded-md mb-4" />
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  </div>
);

export const AdminSkeleton = () => (
  <div
    data-testid="admin-skeleton"
    className="space-y-6 p-4 sm:p-6 w-full"
    aria-label="Memuat data admin..."
  >
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <Skeleton className="h-7 w-48 rounded-md mb-2" />
        <Skeleton className="h-4 w-72 rounded-md" />
      </div>
      <Skeleton className="h-10 w-36 rounded-xl" />
    </div>

    {/* Baris Statistik */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="bg-cream-50 rounded-2xl p-4 border border-cream-200 shadow-sm space-y-2"
        >
          <Skeleton className="h-4 w-20 rounded-md" />
          <Skeleton className="h-7 w-28 rounded-md" />
          <Skeleton className="h-3 w-16 rounded-md" />
        </div>
      ))}
    </div>

    {/* Tabel placeholder */}
    <div className="bg-cream-50 rounded-3xl p-5 border border-cream-200 shadow-sm space-y-3">
      <Skeleton className="h-6 w-44 rounded-md mb-4" />
      <div className="space-y-2.5">
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    </div>
  </div>
);
