import { useSyncExternalStore } from 'react';
import { prefersReducedMotion } from './motion';

/** React subscription to both the OS preference and Nemo's accessibility setting. */
function subscribe(onChange: () => void) {
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  const observer = new MutationObserver(onChange);
  media.addEventListener('change', onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-reduce-motion'] });
  return () => {
    media.removeEventListener('change', onChange);
    observer.disconnect();
  };
}

export function useReducedMotion() {
  return useSyncExternalStore(subscribe, prefersReducedMotion, () => false);
}
