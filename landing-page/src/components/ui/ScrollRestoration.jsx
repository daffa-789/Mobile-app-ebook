import { useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router';
import { SAVE_SCROLL_POSITION_EVENT } from '@lib/scrollPositionEvents';

const STORAGE_KEY = 'wahidiyah-scroll-positions';
const MAX_SAVED_ENTRIES = 100;
const SAVE_INTERVAL_MS = 120;
const RESTORE_TIMEOUT_MS = 10000;

const readSavedPositions = () => {
  if (typeof window === 'undefined') return {};
  try {
    const saved = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) || '{}');
    return saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {};
  } catch {
    return {};
  }
};

const getSavedY = (savedPosition) => {
  if (typeof savedPosition === 'number' && Number.isFinite(savedPosition)) {
    return Math.max(0, savedPosition);
  }
  return Number.isFinite(savedPosition?.y) ? Math.max(0, savedPosition.y) : 0;
};

const persistPosition = (positionsRef, key, y) => {
  if (typeof window === 'undefined' || !key) return;

  positionsRef.current[key] = {
    y: Number.isFinite(y) ? Math.max(0, y) : 0,
    updatedAt: Date.now(),
  };

  const keysByAge = Object.keys(positionsRef.current)
    .filter((entryKey) => entryKey !== key)
    .sort(
      (left, right) =>
        (positionsRef.current[left]?.updatedAt || 0) -
        (positionsRef.current[right]?.updatedAt || 0),
    );

  let savedEntryCount = Object.keys(positionsRef.current).length;
  while (savedEntryCount > MAX_SAVED_ENTRIES && keysByAge.length > 0) {
    delete positionsRef.current[keysByAge.shift()];
    savedEntryCount -= 1;
  }

  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(positionsRef.current));
  } catch {}
};

const getMaxScrollY = () => Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

export const ScrollRestoration = () => {
  const location = useLocation();
  const navigationType = useNavigationType();
  const positionsRef = useRef(null);
  const activeKeyRef = useRef(location.key);
  const saveTimerRef = useRef(null);
  const cancelPendingRestoreRef = useRef(null);

  if (positionsRef.current === null) {
    positionsRef.current = readSavedPositions();
  }

  useLayoutEffect(() => {
    if (!('scrollRestoration' in window.history)) return undefined;
    const previousSetting = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    return () => {
      window.history.scrollRestoration = previousSetting;
    };
  }, []);

  useEffect(() => {
    const saveCurrentPosition = () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      persistPosition(positionsRef, activeKeyRef.current, window.scrollY);
    };

    const handleScroll = () => {
      if (saveTimerRef.current !== null) return;
      const key = activeKeyRef.current;
      saveTimerRef.current = window.setTimeout(() => {
        saveTimerRef.current = null;
        persistPosition(positionsRef, key, window.scrollY);
      }, SAVE_INTERVAL_MS);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('pagehide', saveCurrentPosition);
    window.addEventListener('popstate', saveCurrentPosition, true);
    window.addEventListener(SAVE_SCROLL_POSITION_EVENT, saveCurrentPosition);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('pagehide', saveCurrentPosition);
      window.removeEventListener('popstate', saveCurrentPosition, true);
      window.removeEventListener(SAVE_SCROLL_POSITION_EVENT, saveCurrentPosition);
      saveCurrentPosition();
    };
  }, []);

  useLayoutEffect(() => {
    const previousKey = activeKeyRef.current;
    if (previousKey !== location.key) {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      cancelPendingRestoreRef.current?.();
      activeKeyRef.current = location.key;
    }

    const targetY = navigationType === 'POP' ? getSavedY(positionsRef.current[location.key]) : 0;
    cancelPendingRestoreRef.current?.();

    if (targetY === 0) {
      window.scrollTo(0, 0);
      return;
    }

    const tryRestore = () => {
      if (getMaxScrollY() < targetY) return false;
      window.scrollTo(0, targetY);
      return true;
    };

    if (tryRestore()) return;

    let completed = false;
    let observer;
    let timeoutId;
    let intervalId;

    const cleanup = () => {
      if (completed) return;
      completed = true;
      observer?.disconnect();
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
      if (cancelPendingRestoreRef.current === cleanup) {
        cancelPendingRestoreRef.current = null;
      }
    };

    const finishAtAvailablePosition = () => {
      const availableY = getMaxScrollY();
      cleanup();
      window.scrollTo(0, Math.min(targetY, availableY));
    };

    const checkForLayout = () => {
      if (tryRestore()) cleanup();
    };

    if ('ResizeObserver' in window) {
      observer = new window.ResizeObserver(checkForLayout);
      observer.observe(document.documentElement);
      observer.observe(document.body);
    } else {
      intervalId = window.setInterval(checkForLayout, 80);
    }

    timeoutId = window.setTimeout(finishAtAvailablePosition, RESTORE_TIMEOUT_MS);
    cancelPendingRestoreRef.current = cleanup;
    window.requestAnimationFrame(checkForLayout);
  }, [location.key, navigationType]);

  return null;
};
