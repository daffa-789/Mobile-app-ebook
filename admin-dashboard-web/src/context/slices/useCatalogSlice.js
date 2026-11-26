import { useState, useCallback, useEffect } from 'react';
import { apiJson, readableError } from '@lib/api';
import { takeWarmCatalogResponse } from '@lib/catalogWarmup';
import { normalizeBook, normalizeEvent } from '@lib/normalizers';

export const useCatalogSlice = () => {
  const [books, setBooks] = useState([]);
  const [events, setEvents] = useState([]);
  const [catalogError, setCatalogError] = useState(null);
  const [agendaError, setAgendaError] = useState(null);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [loadingAgenda, setLoadingAgenda] = useState(true);

  const refreshBooks = useCallback(async () => {
    try {
      setLoadingCatalog(true);
      const warm = takeWarmCatalogResponse('/api/books');
      const payload = await (warm ?? apiJson('/api/books', { cache: 'no-store' }));
      const nextBooks = (payload.books || []).map(normalizeBook);
      setBooks(nextBooks);
      setCatalogError(null);
      return nextBooks;
    } catch (loadError) {
      setCatalogError(readableError(loadError));
      throw loadError;
    } finally {
      setLoadingCatalog(false);
    }
  }, []);

  const refreshEvents = useCallback(async () => {
    try {
      setLoadingAgenda(true);
      const warm = takeWarmCatalogResponse('/api/events');
      const payload = await (warm ?? apiJson('/api/events', { cache: 'no-store' }));
      const nextEvents = (payload.events || []).map(normalizeEvent);
      setEvents(nextEvents);
      setAgendaError(null);
      return nextEvents;
    } catch (loadError) {
      setAgendaError(readableError(loadError));
      throw loadError;
    } finally {
      setLoadingAgenda(false);
    }
  }, []);

  useEffect(() => {
    refreshBooks().catch(() => {});
    refreshEvents().catch(() => {});
  }, [refreshBooks, refreshEvents]);

  return {
    books,
    loadingCatalog,
    catalogError,
    refreshBooks,
    events,
    loadingAgenda,
    agendaError,
    refreshEvents,
  };
};
