import React, { useEffect, useLayoutEffect, useRef, useState, useId } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/design/useReducedMotion';
gsap.registerPlugin(useGSAP);
export interface ModalProps {
  isOpen: boolean; onClose: () => void; title?: string; description?: string;
  presentation?: 'dialog' | 'sheet';
  children: React.ReactNode; maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}
let openModals = 0;
let savedOverflow = '';
export function Modal({ isOpen, onClose, title, description, children, maxWidth = 'md', presentation = 'dialog' }: ModalProps) {
  const [present, setPresent] = useState(isOpen);
  const panel = useRef<HTMLDivElement>(null);
  const overlay = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose); closeRef.current = onClose;
  const headingId = useId();
  const descriptionId = useId();
  const reduced = useReducedMotion();
  useLayoutEffect(() => { if (isOpen) setPresent(true); }, [isOpen]);
  useGSAP(() => {
    if (!present || !panel.current || !overlay.current) return;
    if (reduced) { if (!isOpen) setPresent(false); return; }
    if (isOpen) {
      gsap.fromTo(overlay.current, { opacity: 0 }, { opacity: 1, duration: .22, ease: 'power2.out', clearProps: 'opacity' });
      gsap.fromTo(panel.current, { y: 8, scale: .96 }, { y: 0, scale: 1, duration: .3, ease: 'back.out(1.15)', clearProps: 'transform' });
    } else {
      const timeline = gsap.timeline({ onComplete: () => setPresent(false) });
      timeline.to(panel.current, { y: 11, scale: .985, duration: .18, ease: 'power2.in' }, 0)
        .to(overlay.current, { opacity: 0, duration: .18, ease: 'power2.in' }, 0);
    }
  }, { scope: overlay, dependencies: [isOpen, present, reduced], revertOnUpdate: true });
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
  return createPortal(<div ref={overlay} data-modal-overlay className={cn("modal-overlay", presentation === "sheet" && "modal-overlay--sheet")} onClick={event => { if(event.target === event.currentTarget) closeRef.current(); }}>
    <div ref={panel} role="dialog" aria-modal="true" aria-labelledby={title ? headingId : undefined} aria-describedby={description ? descriptionId : undefined} aria-label={title ? undefined : 'Dialog'} tabIndex={-1} className={cn('modal-panel', widths[maxWidth])}>
      <div className="modal-heading"><div>{title && <h2 id={headingId}>{title}</h2>}{description && <p id={descriptionId}>{description}</p>}</div><button type="button" className="icon-button" onClick={() => closeRef.current()} aria-label="Close dialog"><X size={20}/></button></div>
      <div className="p-6 overflow-y-auto space-y-4">{children}</div>
    </div>
  </div>,document.body);
}
