import { useSyncExternalStore } from 'react';
import { prefersReducedMotion } from './motion';

/** React subscription to both the OS preference and Nemo's accessibility setting. */
function subscribe(onChange: () => void) {
  const media = typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null;
  const observer = typeof MutationObserver !== 'undefined' ? new MutationObserver(onChange) : null;
  media?.addEventListener?.('change', onChange);
  observer?.observe(document.documentElement, { attributes: true, attributeFilter: ['data-reduce-motion'] });
  return () => {
    media?.removeEventListener?.('change', onChange);
    observer?.disconnect();
  };
}

export function useReducedMotion() {
  return useSyncExternalStore(subscribe, prefersReducedMotion, () => false);
}
