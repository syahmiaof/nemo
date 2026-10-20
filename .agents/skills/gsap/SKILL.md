---
name: gsap
description: GSAP (GreenSock Animation Platform) motion engineering and animation architecture guide. Use when designing, building, debugging, or optimizing high-performance animations, fluid UI transitions, directional pills, spline curves, SVG morphing, ScrollTrigger, Flip animations, and React @gsap/react useGSAP integration.
metadata:
  version: "3.12.5"
  source: "https://github.com/greensock/GSAP"
  ecosystem: "react, typescript, gsap, @gsap/react"
---

# GreenSock Animation Platform (GSAP) Engineering Guide

GSAP is the industry-standard JavaScript animation library for high-performance, frame-accurate motion on the modern web. This skill provides architectural patterns, production recipes, performance rules, and React 18/19 integration standards for building premium user interfaces.

---

## 1. Core Architecture & Mental Model

GSAP operates on a 60/120fps internal ticker synchronized with `requestAnimationFrame`. It directly interpolates numeric JavaScript properties and DOM style transforms via optimized matrix operations without triggering layout recalculations.

### Core Methods
- `gsap.to(target, vars)`: Animates from current state to destination values.
- `gsap.from(target, vars)`: Animates from specified values to current state.
- `gsap.fromTo(target, fromVars, toVars)`: Defines explicit start and end states (avoids SSR/hydration glitches).
- `gsap.set(target, vars)`: Applies zero-duration property mutations immediately through the GSAP cache.
- `gsap.timeline(vars)`: Creates a sequenced or overlapping chain of tweens with unified playback control.

### Position Parameter Syntax (Timelines)
Timelines support precise relative positioning:
- `"+=0.2"`: 0.2s after the previous animation ends.
- `"-=0.2"`: 0.2s before the previous animation ends.
- `"<"`: Starts at the same time as the previous animation.
- `"<0.1"`: Starts 0.1s after the previous animation starts.
- `">"`: Starts immediately when previous animation ends.
- `"label"`: Anchors to an exact timeline label.

```ts
import gsap from 'gsap';

const tl = gsap.timeline({ defaults: { duration: 0.4, ease: 'power2.out' } });

tl.to('.hero-title', { opacity: 1, y: 0 })
  .to('.hero-subtitle', { opacity: 1, y: 0 }, '<0.1') // starts 100ms after title starts
  .to('.hero-cta', { scale: 1, opacity: 1, ease: 'back.out(1.7)' }, '-=0.15');
```

---

## 2. React 18/19 Integration (`@gsap/react` & `useGSAP`)

In modern React (especially with StrictMode, concurrent rendering, and dynamic route changes), creating unmanaged `gsap.to()` calls inside `useEffect` causes memory leaks and zombie tweens.

### Standard Setup with `useGSAP`
Always use `@gsap/react`:

```bash
npm install gsap @gsap/react
```

Register plugins and hook:

```tsx
import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

export function MotionCard() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // Scoped automatically to containerRef: no need for global selector queries
      gsap.from('.badge', { opacity: 0, scale: 0.8, duration: 0.3 });
      gsap.from('.title', { opacity: 0, y: 12, duration: 0.4, delay: 0.1 });
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef} className="card">
      <span className="badge">Active</span>
      <h2 className="title">Project Overview</h2>
    </div>
  );
}
```

### Context-Safe Re-triggering on State Changes
When animating based on state (e.g. switching tabs, metrics, filters), pass `dependencies` and optionally `revertOnUpdate: true`:

```tsx
useGSAP(
  () => {
    gsap.fromTo(
      '.metric-value',
      { opacity: 0, y: -8 },
      { opacity: 1, y: 0, duration: 0.28, ease: 'power2.out' }
    );
  },
  { scope: containerRef, dependencies: [currentMetric], revertOnUpdate: true }
);
```

---

## 3. Signature Luxury UI Patterns

### A. Elastic Directional Sliding Pill Tabs
Used in top navigation, segmented switches, and category selectors. The pill stretches forward in the direction of motion, then snaps into the final position using dual-edge or scale-stretch physics.

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
      // Stretch leading edge first, then pull trailing edge
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
      // Stretch left edge first, then snap width
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
    <nav ref={containerRef} className="relative flex p-1 bg-surface-dark rounded-full border border-white/10">
      <div
        ref={pillRef}
        className="absolute top-1 bottom-1 bg-accent-mint text-zinc-950 rounded-full pointer-events-none"
        style={{ left: 4, width: 80 }}
      />
      {tabs.map((tab, idx) => (
        <button
          key={tab.id}
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

### B. Cascading Staggered Route / Page Transitions
Used for smooth transitions between views without layout shifts.

```tsx
useGSAP(
  () => {
    const elements = containerRef.current?.querySelectorAll('[data-enter]');
    if (!elements || elements.length === 0) return;

    gsap.fromTo(
      elements,
      { opacity: 0, y: 16 },
      {
        opacity: 1,
        y: 0,
        duration: 0.38,
        stagger: 0.05,
        ease: 'power2.out',
        clearProps: 'transform', // clears inline transforms after completion for sharp font rendering
      }
    );
  },
  { scope: containerRef, dependencies: [location.pathname] }
);
```

### C. Animated Numeric Counters (Metrics & Stats)
Animates numbers smoothly with integer rounding:

```tsx
export function MetricCounter({ endValue }: { endValue: number }) {
  const numRef = useRef<HTMLSpanElement>(null);
  const countObj = useRef({ value: 0 });

  useGSAP(
    () => {
      gsap.to(countObj.current, {
        value: endValue,
        duration: 0.8,
        ease: 'power2.out',
        onUpdate: () => {
          if (numRef.current) {
            numRef.current.textContent = Math.round(countObj.current.value).toLocaleString();
          }
        },
      });
    },
    { dependencies: [endValue] }
  );

  return <span ref={numRef}>0</span>;
}
```

---

## 4. Easing Cheatsheet for Premium Interfaces

| Mood / Target | Recommended Ease | Description |
|---|---|---|
| **Editorial & Calm** | `power2.out` | Smooth deceleration without bounce. Standard for modals and page entries. |
| **Energetic & Responsive** | `power3.out` | Steeper deceleration. Feels crisp on hover buttons and tab switches. |
| **Tactile Spring** | `back.out(1.4)` to `back.out(1.7)` | Over-shoots slightly and settles back. Best for toggle buttons and badges. |
| **Organic Elastic** | `elastic.out(1, 0.75)` | Gentle rubber-band oscillation. Best for sliding navigation indicators. |
| **Linear Interpolation** | `none` | Continuous progress bars, spinners, or scrubbed audio/video waveforms. |

---

## 5. Performance Guardrails (60/120 FPS Rule)

1. **Only Animate Composited Properties:**
   - ✅ `x`, `y`, `scale`, `rotation`, `opacity`, `transform`
   - ❌ `top`, `left`, `width`, `height`, `margin`, `padding` (except inside isolated canvas/SVG or measured pill wrappers where transforms alone cannot handle dynamic parent containers).
2. **Clear Props After Transition:**
   - Always include `clearProps: 'transform'` or `clearProps: 'all'` at the end of entrance animations so fixed positioning, subpixel antialiasing, and CSS filters remain sharp.
3. **Reduced Motion Accessibility (`prefers-reduced-motion`):**
   - Check user accessibility settings via `window.matchMedia('(prefers-reduced-motion: reduce)')`.
   - In reduced motion mode, instantly apply values with `gsap.set()` or zero duration.

```ts
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (prefersReduced) {
  gsap.set(target, { opacity: 1, y: 0 });
} else {
  gsap.fromTo(target, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.35 });
}
```
