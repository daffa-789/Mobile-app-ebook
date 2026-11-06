export const Skeleton = ({ className = '', ...props }) => (
  <div
    className={`animate-pulse rounded-md bg-cream-200/80 ${className}`}
    aria-hidden="true"
    {...props}
  />
);

export const BookCardSkeleton = () => (
  <div className="bg-cream-50 rounded-2xl border border-cream-300/80 p-3 flex flex-col justify-between shadow-xs overflow-hidden">
    <div className="w-full aspect-[1/1.42] rounded-md bg-cream-200/80 mb-3 animate-pulse" />
    <div className="space-y-2 flex-1 flex flex-col justify-between">
      <div>
        <Skeleton className="h-4 w-4/5 rounded-md mb-1.5" />
        <Skeleton className="h-3 w-1/2 rounded-md mb-2" />
      </div>
      <Skeleton className="w-full h-8 rounded-lg mt-2" />
    </div>
  </div>
);

export const BookGridSkeleton = ({ count = 6 }) => (
  <div
    data-testid="book-grid-skeleton"
    className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5 lg:gap-6 justify-start items-start"
    aria-label="Memuat daftar buku..."
  >
    {Array.from({ length: count }).map((_, i) => (
      <BookCardSkeleton key={i} />
    ))}
  </div>
);
