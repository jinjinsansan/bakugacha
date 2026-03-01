'use client';

const LINE_UA_RE = /Line\//i;
const MOBILE_UA_RE = /iPhone|iPad|iPod|Android/i;

export function isLineInAppBrowser(): boolean {
  return typeof navigator !== 'undefined' && LINE_UA_RE.test(navigator.userAgent);
}

export function isMobileBrowser(): boolean {
  return typeof navigator !== 'undefined' && MOBILE_UA_RE.test(navigator.userAgent);
}

export function openLineAppWithFallback(
  liffId: string,
  onFallback: () => void,
  delayMs = 2000,
): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    onFallback();
    return;
  }

  let appOpened = false;
  let timer: number | undefined;

  const markOpened = () => {
    appOpened = true;
  };

  const onVisibility = () => {
    if (document.hidden) markOpened();
  };

  const cleanup = () => {
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('pagehide', markOpened);
    window.removeEventListener('blur', markOpened);
    if (timer) window.clearTimeout(timer);
  };

  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pagehide', markOpened);
  window.addEventListener('blur', markOpened);

  window.location.href = `line://app/${liffId}`;

  timer = window.setTimeout(() => {
    cleanup();
    if (!appOpened) onFallback();
  }, delayMs);
}
