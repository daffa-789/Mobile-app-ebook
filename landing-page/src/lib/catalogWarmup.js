import { apiJson } from './api.js';

const warmup = {};

const warmCatalogEndpoint = (path) => {
  try {
    const promise = apiJson(path);
    promise.catch(() => {});
    warmup[path] = promise;
  } catch {}
};

warmCatalogEndpoint('/api/books');
warmCatalogEndpoint('/api/events');
warmCatalogEndpoint('/api/carousel');

export const takeWarmCatalogResponse = (path) => {
  const promise = warmup[path] ?? null;
  delete warmup[path];
  return promise;
};
