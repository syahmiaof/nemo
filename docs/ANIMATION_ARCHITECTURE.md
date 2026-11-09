# Nemo Motion & Card Animation Architecture Guide

> **Target Audience:** Principal Frontend Engineers and AI Coding Agents implementing luxury, frame-accurate motion systems.  
> **Philosophy:** Restrained luxury, physical tactile feedback, zero layout-recalculation lag (60/120 FPS GPU compositing), and strict accessibility compliance.

---

## 1. Core Mental Model & Animation Stack

Nemo's signature smoothness is not achieved through heavy CSS keyframes or haphazard `transition: all 0.3s ease`. Instead, it is built on a unified mathematical physics system:

```
┌────────────────────────────────────────────────────────┐
│                   Animation Layers                     │
├────────────────────────────────────────────────────────┤
│ 1. GPU Compositing Layer   │ Transforms & Opacity Only │
│ 2. Optical Glass Surfaces  │ Dual Specular Masks & Rim │
│ 3. Spatial Iris Entrances  │ Inset Clip-Path + Exp/Out │
│ 4. Directional Fluid Tabs  │ Dual-Edge Elastic Physics │
│ 5. Viewport Scoping Hook   │ Only Animate In-View DOM  │
│ 6. Strict React Scoping    │ useGSAP() Context Cleanup │
└────────────────────────────────────────────────────────┘
```

### Essential Stack Dependencies
```json
{
  "dependencies": {
    "gsap": "^3.12.5",
    "@gsap/react": "^2.1.1"
  }
}
```

---

## 2. Optical Glass Surface Architecture (CSS Tokens)

Every card in Nemo utilizes the `.glass-panel` or `.liquid-glass-card` specification. It combines high-saturation backdrop blur, layered translucent linear gradients, and a **specular rim-light mask** that mimics genuine light refraction along the card's 1px border.

### A. Design System Tokens (`:root`)
```css
:root, :root[data-theme="dark"], :root[data-theme="midnight"] {
  /* Surfaces */
  --bg-canvas: #0A1222;
  --bg-elevated: #111B31;
  --surface: rgba(20, 33, 56, 0.65);
  --surface-hover: rgba(27, 44, 68, 0.85);

  /* Glass Optics */
  --glass: linear-gradient(
    140deg,
    rgba(255, 255, 255, 0.12),
    rgba(255, 255, 255, 0.02) 55%,
    rgba(255, 255, 255, 0.06)
  ), rgba(12, 20, 40, 0.62);
  --blur: blur(26px) saturate(165%);

  /* Specular Rim Highlights */
  --rim: rgba(255, 255, 255, 0.12);
  --rim-light: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.55),
    rgba(255, 255, 255, 0.10) 28%,
    rgba(255, 255, 255, 0.05) 65%,
    rgba(255, 255, 255, 0.38)
  );

  /* Elevation Shadows */
  --shadow: 0 1px 0 rgba(255, 255, 255, 0.08) inset, 0 30px 60px -32px rgba(0, 0, 0, 0.75);
  --shadow-pop: 0 28px 70px -20px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.12);

  /* Physics Constants */
  --r-card: 26px;
  --ease: cubic-bezier(0.2, 0.8, 0.2, 1);
}
```

### B. The Specular Rim-Light CSS Mask (The Secret to Luxury Cards)
Traditional CSS `border: 1px solid rgba(255,255,255,0.1)` looks flat. Nemo uses a pseudo-element mask that renders a directional light gradient *only on the 1px edge*, without adding pixel dimensions to the element:

```css
/* Glassmorphism Luxury Cards with Rim-Light Mask */
.glass-panel {
  position: relative;
  border-radius: var(--r-card);
  background: var(--glass);
  box-shadow: var(--shadow);
  -webkit-backdrop-filter: var(--blur);
  backdrop-filter: var(--blur);
  border: 1px solid var(--rim);
  transition: transform 0.25s var(--ease), box-shadow 0.25s var(--ease), border-color 0.2s ease;
  transform: translateZ(0);
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
}

/* 1px Specular Top/Left Rim Highlight */
.glass-panel:before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  padding: 1px;
  background: var(--rim-light);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask: linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0);
  transform: translateZ(0);
}

/* Micro-lift on Hover */
.glass-panel-hover:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-pop);
  border-color: rgba(255, 255, 255, 0.22);
}
```

---

## 3. Signature Card Entrance: Horizontal Clip-Path Iris Stagger

Most applications fade cards up (`y: 20 -> 0, opacity: 0 -> 1`), which can look cheap or cause visual jumping.  
Nemo uses a **horizontal clip-path iris reveal** combined with subtle 3D scale and exponential easing (`expo.out`).

Cards expand outward horizontally from their vertical center line while rising gently into place:

```tsx
import gsap from 'gsap';

export function animateCardsEntrance(cards: HTMLElement[]) {
  if (!cards.length) return;

  gsap.fromTo(
    cards,
    {
      opacity: 0,
      y: 22,
      scale: 0.96,
      clipPath: 'inset(0 50% 0 50% round 24px)', // Collapsed to 0px width in center
    },
    {
      opacity: 1,
      y: 0,
      scale: 1,
      clipPath: 'inset(0 0% 0 0% round 24px)',   // Fully expanded to natural card bounds
      duration: 0.85,
      stagger: 0.055,                            // 55ms cascading ripple
      ease: 'expo.out',                          // Hyper-smooth deceleration
      clearProps: 'transform,opacity,clipPath',  // CRITICAL: prevents blurry text rendering
    }
  );
}
```

### Why `clearProps` is Non-Negotiable
When GSAP completes an animation, it leaves inline `style="transform: matrix(...)"` on the element. In Chromium/WebKit, inline transforms lock the element into a separate bitmap rendering surface, causing subpixel font blurring and breaking `position: fixed` modals inside the card.  
**Always specify `clearProps: 'transform,opacity,clipPath'`** so the element returns to native CSS rendering.

---

## 4. Viewport Optimization: Animate Visible Cards Only

A common pitfall that makes animations stutter is animating 50 cards at once when 40 of them are off-screen.  
Nemo inspects the viewport bounds and slices to the top 16 visible cards:

```ts
const CARD_SELECTOR = '.glass-panel, .project-card, .task-card';

export function getVisibleCards(container: HTMLElement, maxCards = 16): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(CARD_SELECTOR))
    .filter((card) => !card.parentElement?.closest(CARD_SELECTOR)) // Prevent nested double-animation
    .filter((card) => {
      const bounds = card.getBoundingClientRect();
      // Include items currently in view plus a small buffer (+100px)
      return (
        bounds.height > 0 &&
        bounds.top < window.innerHeight + 100 &&
        bounds.bottom > -100
      );
    })
    .slice(0, maxCards);
}
```

---

## 5. View-Filtering Animation Hook (`useCollectionMotion`)

When users switch tabs (e.g., from *All Tasks* to *Today* or *Projects*), items re-render. Instead of an abrupt jump or an overly long animation, Nemo uses `useCollectionMotion`.

### Implementation:
```tsx
import { useRef, type RefObject } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useReducedMotion } from './useReducedMotion';

gsap.registerPlugin(useGSAP);

export function useCollectionMotion<T extends HTMLElement>(dependencyKey: string): RefObject<T> {
  const containerRef = useRef<T>(null);
  const previousKey = useRef<string | undefined>(undefined);
  const isReduced = useReducedMotion();

  useGSAP(
    () => {
      const node = containerRef.current;
      const isFirstMount = previousKey.current === undefined;
      previousKey.current = dependencyKey;

      if (!node || isFirstMount || isReduced) return;

      const items = Array.from(node.children)
        .filter((child): child is HTMLElement => child instanceof HTMLElement)
        .filter((child) => {
          const bounds = child.getBoundingClientRect();
          return (
            bounds.height > 0 &&
            bounds.top < window.innerHeight + 100 &&
            bounds.bottom > -100
          );
        })
        .slice(0, 18);

      if (!items.length) return;

      gsap.fromTo(
        items,
        { opacity: 0, y: 14, scale: 0.985 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.55,
          stagger: 0.035,
          ease: 'power3.out',
          clearProps: 'opacity,transform',
        }
      );
    },
    { scope: containerRef, dependencies: [dependencyKey, isReduced], revertOnUpdate: true }
  );

  return containerRef;
}
```

---

## 6. Route-Level Page Transitions (`RouteTransition.tsx`)

Nemo preserves the outgoing route until its exit animation completes, then mounts the new page with an orchestral stagger (Title letters -> Stat pills -> Filter bars -> Glass cards):

```tsx
import { useRef, useState } from 'react';
import { useLocation, useOutlet } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useReducedMotion } from '@/design/useReducedMotion';

gsap.registerPlugin(useGSAP);

export function RouteTransition() {
  const location = useLocation();
  const outlet = useOutlet();
  const [display, setDisplay] = useState({ key: location.key, outlet });
  const root = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const latest = useRef({ key: location.key, outlet });
  latest.current = { key: location.key, outlet };

  useGSAP(
    () => {
      const node = root.current;
      if (!node) return;

      // Exit transition when location key changes
      if (display.key !== location.key) {
        if (reduced) {
          window.scrollTo(0, 0);
          setDisplay(latest.current);
          return;
        }

        const cards = getVisibleCards(node);
        const exit = gsap.timeline({
          onComplete: () => {
            window.scrollTo(0, 0);
            setDisplay(latest.current);
          },
        });

        if (cards.length) {
          exit.to(
            cards,
            { opacity: 0, y: -6, scale: 0.98, duration: 0.16, ease: 'power2.in', stagger: 0.01 },
            0
          );
        }
        exit.to(node, { opacity: 0, duration: 0.18, ease: 'power2.in' }, 0);
        return;
      }

      if (reduced) return;

      // Entrance transition for newly mounted view
      const cards = getVisibleCards(node);
      const timeline = gsap.timeline();

      timeline.fromTo(
        node,
        { opacity: 0, y: 6 },
        { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out', clearProps: 'transform,opacity' },
        0
      );

      if (cards.length) {
        timeline.fromTo(
          cards,
          { opacity: 0, y: 22, scale: 0.96, clipPath: 'inset(0 50% 0 50% round 24px)' },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            clipPath: 'inset(0 0% 0 0% round 24px)',
            duration: 0.85,
            stagger: 0.055,
            ease: 'expo.out',
            clearProps: 'transform,opacity,clipPath',
          },
          0.1
        );
      }
    },
    { scope: root, dependencies: [location.key, display.key, reduced] }
  );

  return <div ref={root}>{display.outlet}</div>;
}
```

---

## 7. Fluid Segmented Switchers: Elastic Directional Pill

When switching tabs (e.g. Daily / Weekly / Monthly), the active indicator shouldn't simply jump or cross-fade. It should **stretch in the direction of movement** and snap into position using dual-edge elastic mechanics:

```tsx
import React, { useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

interface TabItem {
  id: string;
  label: string;
}

export const DirectionalTabs: React.FC<{ tabs: TabItem[] }> = ({ tabs }) => {
  const [activeTab, setActiveTab] = useState(tabs[0].id);
  const containerRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const prevIdx = useRef(0);

  const { contextSafe } = useGSAP({ scope: containerRef });

  const handleTabClick = contextSafe((id: string, index: number) => {
    if (id === activeTab || !containerRef.current || !pillRef.current) return;

    const navButtons = containerRef.current.querySelectorAll<HTMLButtonElement>('.nav-btn');
    const targetBtn = navButtons[index];
    const targetRect = targetBtn.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();

    const targetLeft = targetRect.left - containerRect.left;
    const targetWidth = targetRect.width;
    const isMovingRight = index > prevIdx.current;

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    if (isMovingRight) {
      // Stretch leading edge forward first, then snap trailing edge
      tl.to(pillRef.current, {
        width: targetLeft + targetWidth - pillRef.current.offsetLeft,
        duration: 0.22,
      }).to(
        pillRef.current,
        {
          left: targetLeft,
          width: targetWidth,
          duration: 0.26,
          ease: 'elastic.out(1, 0.75)',
        },
        '-=0.08'
      );
    } else {
      // Stretch left edge backward first, then snap width
      tl.to(pillRef.current, {
        left: targetLeft,
        width: pillRef.current.offsetLeft + pillRef.current.offsetWidth - targetLeft,
        duration: 0.22,
      }).to(
        pillRef.current,
        {
          width: targetWidth,
          duration: 0.26,
          ease: 'elastic.out(1, 0.75)',
        },
        '-=0.08'
      );
    }

    prevIdx.current = index;
    setActiveTab(id);
  });

  return (
    <nav ref={containerRef} className="relative flex p-1 bg-white/[0.04] rounded-full border border-white/10">
      <div
        ref={pillRef}
        className="absolute top-1 bottom-1 bg-emerald-400 text-zinc-950 rounded-full pointer-events-none"
        style={{ left: 4, width: 80 }}
      />
      {tabs.map((tab, idx) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => handleTabClick(tab.id, idx)}
          className={`nav-btn relative z-10 px-4 py-1.5 text-xs font-semibold rounded-full transition-colors ${
            activeTab === tab.id ? 'text-zinc-950' : 'text-zinc-400 hover:text-white'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
};
```

---

## 8. Micro-Interactions: Tactile Pops & Animated Metrics

### A. The 3D Button Pop (`triggerButtonPop`)
When checking a task or clicking an action button, animate the icon with overshoot spring:

```ts
export const triggerButtonPop = (target: HTMLElement | null) => {
  if (!target || prefersReducedMotion()) return;
  const icon = target.querySelector('svg') || target;
  gsap.fromTo(
    icon,
    { scale: 0.74 },
    { scale: 1, duration: 0.45, ease: 'back.out(2.5)', overwrite: true }
  );
};
```

### B. Animated Donut Gauge & Numeric Counter (`WeeklyMomentumCard`)
```tsx
const circumference = 389.5;
const targetDash = (percentage / 100) * circumference;

// Animate arc stroke and number count up in lockstep:
const tl = gsap.timeline();

tl.fromTo(
  circleRef.current,
  { strokeDasharray: `0 ${circumference}` },
  { strokeDasharray: `${targetDash} ${circumference}`, duration: 1.25, ease: 'power3.out' },
  0
);

const counter = { val: 0 };
tl.to(
  counter,
  {
    val: percentage,
    duration: 1.25,
    ease: 'power3.out',
    onUpdate: () => {
      if (labelRef.current) labelRef.current.innerText = `${Math.round(counter.val)}%`;
    },
  },
  0
);
```

---

## 9. Comprehensive Easing Reference

| Target UI Element | Recommended Ease | Rationale |
|---|---|---|
| **Card Iris Reveal** | `expo.out` | Instant high-speed burst that decelerates organically without harsh stops. |
| **Route / View Entry** | `power2.out` | Editorial and calm; prevents motion sickness across wide screens. |
| **Collection Item Filter**| `power3.out` | Crisp, responsive, snappier than `power2`. |
| **Button / Icon Pop** | `back.out(2.2 - 2.5)` | Tactile physical click sensation via slight overshoot. |
| **Sliding Pill Switcher** | `elastic.out(1, 0.75)` | Rubber-band liquid tension; makes navigation feel alive. |
| **Modal Scale In** | `power3.out` | From `scale: 0.94, y: 14` -> `scale: 1, y: 0`. |

---

## 10. Golden Engineering Rules for Agents

1. **Never Animate Layout Geometry (`top`, `left`, `width`, `height`, `margin`)**:  
   Always use hardware-composited `transform` (`x`, `y`, `scale`, `rotation`), `opacity`, and `clipPath`. The only exception is dynamic pills where pixel offsets must be read once.
2. **Always Use `@gsap/react` `useGSAP()`**:  
   Never write raw `useEffect(() => { gsap.to(...) }, [])`. React 18/19 StrictMode will cause memory leaks, stuck opacities, and duplicate animations. `useGSAP` guarantees automatic context scoping and cleanup.
3. **Always Clean Up with `clearProps`**:  
   At the end of every entrance tween, include `clearProps: 'transform,opacity,clipPath'`. This ensures crisp typography, subpixel antialiasing, and working fixed overlays.
4. **Hardware Acceleration Flags**:  
   Add `transform: translateZ(0)`, `-webkit-backface-visibility: hidden`, and `will-change: transform` to animated cards to ensure the browser puts them on an isolated GPU compositing layer.
5. **Always Respect `prefers-reduced-motion`**:  
   Call `useReducedMotion()`. If true, bypass all durations and apply `gsap.set(el, { opacity: 1, y: 0, scale: 1, clearProps: 'all' })`.
