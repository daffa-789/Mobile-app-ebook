export const SAVE_SCROLL_POSITION_EVENT = 'app:save-scroll-position';

export const saveScrollPositionBeforeNavigation = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(SAVE_SCROLL_POSITION_EVENT));
  }
};
