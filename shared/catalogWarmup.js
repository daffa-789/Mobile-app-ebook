/**
 * Membuat penyimpanan warm-up katalog sekali konsumsi untuk sebuah aplikasi.
 * Daftar endpoint dapat berbeda, sementara perilaku promise-nya tetap sama.
 */
export const createCatalogWarmup = (apiJson, paths) => {
  const warmup = new Map();

  for (const path of paths) {
    try {
      const promise = apiJson(path);
      // Hindari rejection tak tertangani bila komponen belum mengonsumsi promise.
      promise.catch(() => {});
      warmup.set(path, promise);
    } catch {
      // Tanpa fetch, slice katalog tetap bisa memakai jalur normal.
    }
  }

  return {
    takeWarmCatalogResponse(path) {
      const promise = warmup.get(path) ?? null;
      warmup.delete(path);
      return promise;
    },
  };
};
