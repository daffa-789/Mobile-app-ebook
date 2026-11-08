import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import {
  AUTH_ONLY_SCREENS,
  PATH_TO_SCREEN,
  SCREEN_TO_PATH,
  getScreenFromPath,
  normalizePath,
} from '@lib/navigation';
import { clearIntendedLocation, peekIntendedLocation, saveIntendedLocation } from '@lib/api';
import { saveScrollPositionBeforeNavigation } from '@lib/scrollPositionEvents';

export const useNavigationSlice = ({ initialScreen }) => {
  const [currentScreen, setCurrentScreen] = useState(() => initialScreen || getScreenFromPath());
  const [currentPath, setCurrentPath] = useState(() => {
    if (typeof window === 'undefined') return SCREEN_TO_PATH[initialScreen] || '/';
    return normalizePath(window.location.pathname);
  });

  const routerNavigatorRef = useRef(null);
  const screenRef = useRef(currentScreen);

  const setRouterNavigator = useCallback((nav) => {
    routerNavigatorRef.current = nav;
  }, []);

  const syncScreenFromPath = useCallback((pathname) => {
    const normalized = normalizePath(pathname);
    const nextScreen = PATH_TO_SCREEN[normalized] || (normalized === '/' ? 'home' : 'login');
    screenRef.current = nextScreen;
    setCurrentPath(normalized);
    setCurrentScreen(nextScreen);
  }, []);

  const rememberIntendedLocation = useCallback((pathname) => {
    const normalized = normalizePath(pathname);
    const screen = PATH_TO_SCREEN[normalized];
    if (!screen || AUTH_ONLY_SCREENS.has(screen)) return;
    if (!SCREEN_TO_PATH[screen]) return;
    saveIntendedLocation(screen);
  }, []);

  const consumeIntendedScreen = useCallback(() => {
    const fallbackScreen = 'home';
    const intended = peekIntendedLocation();
    clearIntendedLocation();
    if (!intended) return fallbackScreen;

    const screen = Object.prototype.hasOwnProperty.call(SCREEN_TO_PATH, intended)
      ? intended
      : PATH_TO_SCREEN[normalizePath(intended)];

    if (!screen || AUTH_ONLY_SCREENS.has(screen)) return fallbackScreen;
    return screen;
  }, []);

  const applyRoleChange = useCallback((nextRole, { notify = false } = {}) => {
    const path = SCREEN_TO_PATH.home;
    screenRef.current = 'home';
    setCurrentScreen('home');
    setCurrentPath(path);
    routerNavigatorRef.current?.(path, { replace: true });
    if (notify) {
      toast.info(
        nextRole === 'admin'
          ? 'Role akun Anda telah diubah menjadi Administrator.'
          : 'Role akun Anda telah diubah menjadi User.',
      );
    }
  }, []);

  const navigateTo = useCallback((screen, { replace = false } = {}) => {
    let destScreen = screen;

    if (!SCREEN_TO_PATH[destScreen]) {
      destScreen = 'home';
    }

    const targetPath = SCREEN_TO_PATH[destScreen];

    saveScrollPositionBeforeNavigation();

    screenRef.current = destScreen;
    setCurrentScreen(destScreen);
    setCurrentPath(targetPath);

    if (routerNavigatorRef.current) {
      routerNavigatorRef.current(targetPath, { replace });
    } else if (typeof window !== 'undefined') {
      const historyMethod = replace ? 'replaceState' : 'pushState';
      if (window.location.pathname !== targetPath && window.history?.[historyMethod]) {
        window.history[historyMethod]({ screen: destScreen, path: targetPath }, '', targetPath);
      }
    }
  }, []);

  return {
    currentScreen,
    setCurrentScreen,
    currentPath,
    setCurrentPath,
    screenRef,
    routerNavigatorRef,
    setRouterNavigator,
    syncScreenFromPath,
    rememberIntendedLocation,
    consumeIntendedScreen,
    applyRoleChange,
    navigateTo,
  };
};
