import React, { useEffect, useLayoutEffect, useRef, useState, useId } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { prefersReducedMotion } from '@/design/motion';
export interface ModalProps {
  isOpen: boolean; onClose: () => void; title?: string; description?: string;
  children: React.ReactNode; maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}
let openModals = 0;
let savedOverflow = '';
export function Modal({ isOpen, onClose, title, description, children, maxWidth = 'md' }: ModalProps) {
  const [present, setPresent] = useState(isOpen);
  const panel = useRef<HTMLDivElement>(null);
  const overlay = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose); closeRef.current = onClose;
  const headingId = useId();
  useLayoutEffect(() => { if (isOpen) setPresent(true); }, [isOpen]);
  useLayoutEffect(() => {
    if (!present || !panel.current || !overlay.current) return;
    const context = gsap.context(() => {
      const duration = prefersReducedMotion() ? 0 : isOpen ? .32 : .16;
      if (isOpen) {
        gsap.fromTo(overlay.current, { opacity: 0 }, { opacity: 1, duration });
        gsap.fromTo(panel.current, { y: prefersReducedMotion() ? 0 : 14, scale: prefersReducedMotion() ? 1 : .985 }, { y: 0, scale: 1, duration, ease: 'power3.out' });
      } else gsap.to(overlay.current, { opacity: 0, duration, onComplete: () => setPresent(false) });
    });
    return () => context.revert();
  }, [isOpen, present]);
  useEffect(() => {
    if (!present) return;
    const previous = document.activeElement as HTMLElement | null;
    if (openModals++ === 0) { savedOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden'; }
    const focusable = () => Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href],[tabindex="0"]') ?? []).filter(el => el.getClientRects().length);
    (focusable().find(el => el.tagName === 'INPUT') || focusable()[0] || panel.current)?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (document.querySelectorAll('[data-modal-overlay]').item(openModals - 1) !== overlay.current) return;
      if (event.key === 'Escape') { event.preventDefault(); closeRef.current(); }
      if (event.key === 'Tab') {
        const nodes = focusable(), first = nodes[0], last = nodes[nodes.length - 1];
        if (!first) { event.preventDefault(); panel.current?.focus(); }
        else if (event.shiftKey && (document.activeElement === first || !panel.current?.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      if (--openModals === 0) document.body.style.overflow = savedOverflow;
      if (previous?.isConnected) previous.focus();
    };
  }, [present]);
  if (!present) return null;
  const widths = { sm:'max-w-sm',md:'max-w-md',lg:'max-w-lg',xl:'max-w-xl','2xl':'max-w-2xl' };
  return createPortal(<div ref={overlay} data-modal-overlay className="modal-overlay" onClick={event => { if(event.target === event.currentTarget) closeRef.current(); }}>
    <div ref={panel} role="dialog" aria-modal="true" aria-labelledby={title ? headingId : undefined} aria-label={title ? undefined : 'Dialog'} tabIndex={-1} className={cn('modal-panel', widths[maxWidth])}>
      <div className="modal-heading"><div>{title && <h2 id={headingId}>{title}</h2>}{description && <p>{description}</p>}</div><button type="button" className="icon-button" onClick={() => closeRef.current()} aria-label="Close dialog"><X size={20}/></button></div>
      <div className="p-6 overflow-y-auto space-y-4">{children}</div>
    </div>
  </div>,document.body);
}
