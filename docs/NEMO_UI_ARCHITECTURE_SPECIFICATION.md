# NEMO DESIGN SYSTEM & UI MOTION ARCHITECTURE SPECIFICATION
> **Master Blueprint for Building High-End Web Applications with Aurora Glassmorphism, 60fps GSAP Motion, and HTML5 Canvas Particle Physics**

---

## 1. Prompt Preamble for ChatGPT / AI Coding Assistants

*(Copy and paste this section directly as your initial prompt when asking ChatGPT to generate new components or websites)*

```markdown
You are a Principal Frontend Architect and Motion Designer specialized in high-performance React, Tailwind CSS, GSAP (GreenSock), and HTML5 Canvas physics.

I want to build a new web application UI using the exact architecture, motion choreography, and aesthetic tokens of the Nemo Design System:
- **Atmosphere & Style**: Aurora Glassmorphism (deep cosmic canvas #070B14, emerald/mint #34D399 accents, soft peach #F5C8BC ember, translucent frosted glass panels with 1px rim lighting).
- **Core Stack**: React 18+ (TypeScript), Vite, Tailwind CSS v3/v4, GSAP 3 with @gsap/react (`useGSAP`), Lucide React icons, and clsx / tailwind-merge (`cn`).
- **Motion Philosophy**: Tactile, organic, and ultra-smooth 60fps animations. Elastic spring interactions (`back.out(2.4)`), directional sliding indicator tabs, smooth character morphing, and strict WCAG 2.2 reduced-motion safety.
- **Background Engine**: Interactive HTML5 Canvas Starfield with gravitational cursor attraction, stardust spring-back relaxation, dynamic constellation lines, and frequent multi-meteor showers.
- **Performance Standard**: Pure client-side GPU compositing (`translate3d`, `contain: strict`, `will-change: transform`). Zero heavy 3D engine overhead.

Please adhere strictly to the design tokens, component patterns, and motion standards specified in the architectural blueprint below.
```

---

## 2. Tech Stack & Dependencies (`package.json`)

```json
{
  "name": "aurora-ui-template",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.28.0",
    "gsap": "^3.12.5",
    "@gsap/react": "^2.1.1",
    "lucide-react": "^0.454.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.4"
  },
  "devDependencies": {
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.3",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.14",
    "typescript": "^5.6.3",
    "vite": "^5.4.10"
  }
}
```

---

## 3. Tailwind Configuration (`tailwind.config.js`)

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        canvas: 'var(--bg-canvas)',
        elevated: 'var(--bg-elevated)',
        surface: {
          DEFAULT: 'var(--surface)',
          hover: 'var(--surface-hover)',
          solid: 'var(--surface-solid)',
        },
        border: {
          subtle: 'var(--border-subtle)',
          emphasis: 'var(--border-emphasis)',
        },
        content: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
        },
        accent: {
          mint: 'var(--accent-mint)',
          amber: 'var(--accent-amber)',
          ember: 'var(--accent-ember)',
          ring: 'var(--focus-ring)',
        }
      },
      fontFamily: {
        sans: [
          'Urbanist',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif'
        ],
        mono: [
          'Geist Mono',
          'ui-monospace',
          'monospace'
        ]
      },
      boxShadow: {
        glass: 'var(--shadow)',
        pop: 'var(--shadow-pop)',
      }
    },
  },
  plugins: [],
}
```

---

## 4. Theme & Glassmorphism Design Tokens (`src/index.css`)

```css
@import url('https://fonts.googleapis.com/css2?family=Urbanist:wght@300;400;500;600;700;800&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

/* ==========================================================================
   THEME DEFINITION: AURORA (SIGNATURE DEFAULT)
   ========================================================================== */
:root,
:root[data-theme="aurora"] {
  --bg-canvas: #070B14;
  --bg-2: #0B1324;
  --bg-elevated: #0F192F;
  --surface: rgba(15, 25, 47, 0.72);
  --surface-hover: rgba(22, 38, 70, 0.88);
  --surface-solid: #111D36;

  /* Ambient Mesh Gradients */
  --glow-a: radial-gradient(closest-side, rgba(16, 42, 69, 0.85), rgba(18, 59, 56, 0.45) 55%, transparent);
  --glow-b: radial-gradient(closest-side, rgba(42, 31, 61, 0.8), rgba(52, 211, 153, 0.2) 55%, transparent);

  /* Glassmorphism & Rim Light */
  --glass: linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.02) 50%, rgba(52, 211, 153, 0.05)), rgba(11, 19, 36, 0.72);
  --glass-flat: rgba(255, 255, 255, 0.05);
  --blur: blur(28px) saturate(175%);

  --rim: rgba(52, 211, 153, 0.22);
  --rim-light: linear-gradient(135deg, rgba(245, 200, 188, 0.6), rgba(52, 211, 153, 0.3) 35%, rgba(255, 255, 255, 0.06) 70%, rgba(52, 211, 153, 0.35));
  --shadow: 0 1px 0 rgba(255, 255, 255, 0.1) inset, 0 32px 64px -30px rgba(0, 0, 0, 0.85);
  --shadow-pop: 0 28px 70px -18px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(52, 211, 153, 0.3);

  --border-subtle: rgba(148, 163, 184, 0.15);
  --border-emphasis: rgba(52, 211, 153, 0.25);

  --text-primary: #F8FAFC;
  --text-secondary: #CBD5E1;
  --text-tertiary: #94A3B8;

  /* Accents */
  --accent-mint: #34D399;
  --accent-amber: #FBBF24;
  --accent-ember: #F5C8BC;

  --mint-grad: linear-gradient(135deg, #34D399, #10B981);
  --ember-grad: linear-gradient(135deg, #F5C8BC, #EAA999);
  --pill-grad: linear-gradient(135deg, #34D399, #F5C8BC);
}

/* ==========================================================================
   GLASS PANEL UTILITY
   ========================================================================== */
.glass-panel {
  background: var(--glass);
  backdrop-filter: var(--blur);
  -webkit-backdrop-filter: var(--blur);
  border: 1px solid var(--border-subtle);
  box-shadow: var(--shadow);
  border-radius: 1.25rem;
  position: relative;
  overflow: hidden;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.glass-panel::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: var(--rim-light);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
  opacity: 0.65;
}

.glass-panel:hover {
  border-color: var(--border-emphasis);
  box-shadow: var(--shadow-pop);
}

/* Ambient Background Mesh */
.mesh {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.mesh__a {
  position: absolute;
  top: -10vw;
  left: -10vw;
  width: 65vw;
  height: 65vw;
  border-radius: 50%;
  background: var(--glow-a);
  filter: blur(80px);
  opacity: 0.7;
}

.mesh__b {
  position: absolute;
  bottom: -15vw;
  right: -10vw;
  width: 70vw;
  height: 70vw;
  border-radius: 50%;
  background: var(--glow-b);
  filter: blur(90px);
  opacity: 0.6;
}
```

---

## 5. Motion Presets & GSAP Hook System (`src/design/motion.ts`)

```typescript
import gsap from 'gsap';

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    document.documentElement.dataset.reduceMotion === 'true' ||
    Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches)
  );
}

// Fade & Slide in entrance
export function animateFadeIn(
  element: HTMLElement | null,
  options?: { duration?: number; y?: number; delay?: number }
) {
  if (!element) return;
  if (prefersReducedMotion()) {
    gsap.set(element, { opacity: 1, y: 0 });
    return;
  }
  gsap.fromTo(
    element,
    { opacity: 0, y: options?.y ?? 14 },
    {
      opacity: 1,
      y: 0,
      duration: options?.duration ?? 0.38,
      delay: options?.delay ?? 0,
      ease: 'power3.out',
    }
  );
}

// Spring pop micro-interaction for buttons / icons
export function triggerButtonPop(target: HTMLElement | null) {
  if (!target || prefersReducedMotion()) return;
  const icon = target.querySelector('svg') || target;
  gsap.fromTo(
    icon,
    { scale: 0.74 },
    { scale: 1, duration: 0.42, ease: 'back.out(2.4)', overwrite: true }
  );
}

// Modal enter transition
export function animateModalEnter(element: HTMLElement | null) {
  if (!element) return;
  if (prefersReducedMotion()) {
    gsap.set(element, { opacity: 1, scale: 1 });
    return;
  }
  gsap.fromTo(
    element,
    { opacity: 0, scale: 0.94, y: 16 },
    { opacity: 1, scale: 1, y: 0, duration: 0.32, ease: 'power3.out' }
  );
}
```

---

## 6. Interactive Aurora Starfield & Multi-Meteor Canvas Engine (`src/design/AuroraStarfield.tsx`)

```typescript
import React, { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  originX: number;
  originY: number;
  size: number;
  baseAlpha: number;
  alpha: number;
  twinkleSpeed: number;
  twinklePhase: number;
  color: string;
  vx: number;
  vy: number;
}

interface ShootingStar {
  x: number;
  y: number;
  length: number;
  speed: number;
  angle: number;
  opacity: number;
  active: boolean;
  colorTail: string;
  colorHead: string;
  lineWidth: number;
}

const STAR_COLORS = [
  'rgba(168, 220, 200, ', // Mint Aurora
  'rgba(238, 178, 163, ', // Peach
  'rgba(236, 210, 154, ', // Amber
  'rgba(255, 255, 255, ', // Starlight White
  'rgba(147, 197, 253, ', // Frost Blue
  'rgba(52, 211, 153, ',  // Emerald Core
];

const METEOR_PALETTES = [
  { tail: 'rgba(52, 211, 153, ', head: 'rgba(255, 255, 255, 0.95)' }, // Aurora Emerald
  { tail: 'rgba(147, 197, 253, ', head: 'rgba(240, 249, 255, 0.95)' }, // Frost Blue
  { tail: 'rgba(245, 200, 188, ', head: 'rgba(255, 250, 245, 0.95)' }, // Soft Peach
  { tail: 'rgba(255, 255, 255, ', head: 'rgba(255, 255, 255, 1.0)' },  // Pure Starlight
];

export const AuroraStarfield: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animId: number;
    let width = 0;
    let height = 0;
    let stars: Star[] = [];
    const shootingStars: ShootingStar[] = [];
    let nextShootingTime = Date.now() + 1500;

    const pointer = {
      x: -1000,
      y: -1000,
      targetX: -1000,
      targetY: -1000,
      active: false,
      radius: 195,
      lastMoved: 0,
    };

    const handlePointerMove = (e: PointerEvent | MouseEvent) => {
      pointer.targetX = e.clientX;
      pointer.targetY = e.clientY;
      pointer.active = true;
      pointer.lastMoved = performance.now();
      if (pointer.x < 0) {
        pointer.x = e.clientX;
        pointer.y = e.clientY;
      }
    };

    const handlePointerLeave = () => {
      pointer.active = false;
    };

    const resize = () => {
      const isMobile = window.innerWidth < 768;
      const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
      width = window.innerWidth;
      height = window.innerHeight;
      pointer.radius = isMobile ? 135 : 195;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
      initStars();
    };

    const initStars = () => {
      const isMobile = width < 768;
      const divisor = isMobile ? 6500 : 7500;
      const maxCount = isMobile ? 85 : 185;
      const count = Math.min(Math.floor((width * height) / divisor), maxCount);
      stars = [];
      for (let i = 0; i < count; i++) {
        const colorPrefix = STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)];
        const posX = Math.random() * width;
        const posY = Math.random() * height;
        const isSpecialTwinkler = Math.random() < 0.16;
        stars.push({
          x: posX,
          y: posY,
          originX: posX,
          originY: posY,
          size: isSpecialTwinkler ? Math.random() * 1.5 + 1.2 : Math.random() * 1.1 + 0.45,
          baseAlpha: isSpecialTwinkler ? Math.random() * 0.4 + 0.45 : Math.random() * 0.4 + 0.2,
          alpha: 0.5,
          twinkleSpeed: Math.random() * 0.035 + 0.012,
          twinklePhase: Math.random() * Math.PI * 2,
          color: colorPrefix,
          vx: (Math.random() - 0.5) * 0.07,
          vy: (Math.random() - 0.5) * 0.07,
        });
      }
    };

    const createShootingStar = (offsetX = 0, offsetY = 0): ShootingStar => {
      const isMobile = width < 768;
      const palette = METEOR_PALETTES[Math.floor(Math.random() * METEOR_PALETTES.length)];
      const startX = Math.random() * (width * 0.85) + offsetX;
      const startY = Math.random() * (height * 0.35) + offsetY;
      const angle = (Math.PI / 4) + (Math.random() * 0.26 - 0.13);
      return {
        x: startX,
        y: startY,
        length: Math.random() * (isMobile ? 60 : 95) + (isMobile ? 55 : 75),
        speed: Math.random() * 8 + (isMobile ? 14 : 18),
        angle,
        opacity: 0.95,
        active: true,
        colorTail: palette.tail,
        colorHead: palette.head,
        lineWidth: Math.random() * 0.7 + 1.2,
      };
    };

    const triggerShootingStars = () => {
      const burstCount = Math.random() < 0.35 ? (Math.random() < 0.5 ? 2 : 3) : 1;
      for (let i = 0; i < burstCount; i++) {
        if (shootingStars.length < 5) {
          shootingStars.push(createShootingStar(i * 60, i * -30));
        }
      }
      nextShootingTime = Date.now() + Math.random() * 1600 + 1200;
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerleave', handlePointerLeave);

    const render = () => {
      if (document.hidden) {
        animId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      // Smooth pointer lerp
      if (pointer.active) {
        pointer.x += (pointer.targetX - pointer.x) * 0.14;
        pointer.y += (pointer.targetY - pointer.y) * 0.14;
        if (performance.now() - pointer.lastMoved > 4000) {
          pointer.active = false;
        }
      }

      // Cursor aura
      if (pointer.active && pointer.x > 0 && pointer.y > 0) {
        const aura = ctx.createRadialGradient(
          pointer.x, pointer.y, 0,
          pointer.x, pointer.y, pointer.radius
        );
        aura.addColorStop(0, 'rgba(52, 211, 153, 0.09)');
        aura.addColorStop(0.45, 'rgba(147, 197, 253, 0.04)');
        aura.addColorStop(1, 'rgba(52, 211, 153, 0)');
        ctx.fillStyle = aura;
        ctx.beginPath();
        ctx.arc(pointer.x, pointer.y, pointer.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      const activeNearbyStars: { x: number; y: number; force: number }[] = [];

      // Render Stars with Elastic Home Return and Magnetic Hover
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        s.twinklePhase += s.twinkleSpeed;
        let currentAlpha = Math.max(0.08, Math.min(1, s.baseAlpha + Math.sin(s.twinklePhase) * 0.35));
        let renderSize = s.size;

        // Elastic return towards celestial home position
        const homeDx = s.originX - s.x;
        const homeDy = s.originY - s.y;
        s.x += homeDx * 0.012;
        s.y += homeDy * 0.012;

        if (pointer.active) {
          const dx = pointer.x - s.x;
          const dy = pointer.y - s.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < pointer.radius && dist > 1) {
            const force = (pointer.radius - dist) / pointer.radius;
            const pull = force * force * 1.6;
            s.x += (dx / dist) * pull;
            s.y += (dy / dist) * pull;

            currentAlpha = Math.min(1, currentAlpha + force * 0.65);
            renderSize = s.size * (1 + force * 0.85);

            activeNearbyStars.push({ x: s.x, y: s.y, force });

            ctx.fillStyle = `${s.color}${(currentAlpha * 0.38).toFixed(2)})`;
            ctx.beginPath();
            ctx.arc(s.x, s.y, renderSize * 2.8, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        s.x += s.vx;
        s.y += s.vy;
        s.originX += s.vx;
        s.originY += s.vy;
        if (s.x < 0) { s.x = width; s.originX = width; }
        if (s.x > width) { s.x = 0; s.originX = 0; }
        if (s.y < 0) { s.y = height; s.originY = height; }
        if (s.y > height) { s.y = 0; s.originY = 0; }

        ctx.fillStyle = `${s.color}${currentAlpha.toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, renderSize, 0, Math.PI * 2);
        ctx.fill();

        if (s.size > 1.3 && (!pointer.active || renderSize === s.size)) {
          ctx.fillStyle = `${s.color}${(currentAlpha * 0.28).toFixed(2)})`;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size * 2.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Constellation Links
      if (activeNearbyStars.length > 1) {
        ctx.lineWidth = 0.8;
        const maxLinkDist = width < 768 ? 80 : 105;
        for (let i = 0; i < activeNearbyStars.length; i++) {
          for (let j = i + 1; j < activeNearbyStars.length; j++) {
            const s1 = activeNearbyStars[i];
            const s2 = activeNearbyStars[j];
            const linkDx = s1.x - s2.x;
            const linkDy = s1.y - s2.y;
            const linkDist = Math.hypot(linkDx, linkDy);

            if (linkDist < maxLinkDist) {
              const lineAlpha = (1 - linkDist / maxLinkDist) * 0.35 * Math.min(s1.force, s2.force);
              ctx.strokeStyle = `rgba(168, 220, 200, ${lineAlpha.toFixed(3)})`;
              ctx.beginPath();
              ctx.moveTo(s1.x, s1.y);
              ctx.lineTo(s2.x, s2.y);
              ctx.stroke();
            }
          }
        }
      }

      // Multi-Meteor Shower
      if (Date.now() > nextShootingTime && shootingStars.length < 5) {
        triggerShootingStars();
      }

      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const ss = shootingStars[i];
        if (!ss.active) {
          shootingStars.splice(i, 1);
          continue;
        }

        const tailX = ss.x - Math.cos(ss.angle) * ss.length;
        const tailY = ss.y - Math.sin(ss.angle) * ss.length;

        const grad = ctx.createLinearGradient(tailX, tailY, ss.x, ss.y);
        grad.addColorStop(0, `${ss.colorTail}0)`);
        grad.addColorStop(0.65, `${ss.colorTail}${(ss.opacity * 0.55).toFixed(2)})`);
        grad.addColorStop(1, ss.colorHead);

        ctx.strokeStyle = grad;
        ctx.lineWidth = ss.lineWidth;
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(ss.x, ss.y);
        ctx.stroke();

        const headGlow = ctx.createRadialGradient(ss.x, ss.y, 0, ss.x, ss.y, 4.5);
        headGlow.addColorStop(0, `rgba(255, 255, 255, ${ss.opacity.toFixed(2)})`);
        headGlow.addColorStop(0.5, `${ss.colorTail}${(ss.opacity * 0.6).toFixed(2)})`);
        headGlow.addColorStop(1, `${ss.colorTail}0)`);
        ctx.fillStyle = headGlow;
        ctx.beginPath();
        ctx.arc(ss.x, ss.y, 4.5, 0, Math.PI * 2);
        ctx.fill();

        ss.x += Math.cos(ss.angle) * ss.speed;
        ss.y += Math.sin(ss.angle) * ss.speed;
        ss.opacity -= 0.015;

        if (ss.opacity <= 0 || ss.x > width + 100 || ss.y > height + 100) {
          ss.active = false;
          shootingStars.splice(i, 1);
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerleave', handlePointerLeave);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      style={{
        opacity: 0.9,
        transform: 'translate3d(0, 0, 0)',
        willChange: 'transform',
        contain: 'strict',
      }}
    />
  );
};
```

---

## 7. Directional Sliding Indicator Tabs Primitive (`src/components/ui/SlidingTabs.tsx`)

```typescript
import React, { useRef, useLayoutEffect, useState } from 'react';
import gsap from 'gsap';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

interface SlidingTabsProps {
  tabs: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
}

export const SlidingTabs: React.FC<SlidingTabsProps> = ({ tabs, activeId, onChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const isFirstRender = useRef(true);

  useLayoutEffect(() => {
    const activeEl = tabRefs.current.get(activeId);
    const container = containerRef.current;
    const pill = pillRef.current;
    if (!activeEl || !container || !pill) return;

    const containerRect = container.getBoundingClientRect();
    const activeRect = activeEl.getBoundingClientRect();
    const targetX = activeRect.left - containerRect.left;
    const targetWidth = activeRect.width;

    if (isFirstRender.current) {
      gsap.set(pill, { x: targetX, width: targetWidth, opacity: 1 });
      isFirstRender.current = false;
    } else {
      gsap.to(pill, {
        x: targetX,
        width: targetWidth,
        duration: 0.35,
        ease: 'power3.out',
      });
    }
  }, [activeId]);

  return (
    <div
      ref={containerRef}
      className="relative flex items-center p-1 bg-white/[0.04] border border-white/10 rounded-full backdrop-blur-md"
    >
      {/* Sliding Pill Indicator */}
      <div
        ref={pillRef}
        className="absolute top-1 bottom-1 rounded-full bg-gradient-to-r from-accent-mint to-accent-ember opacity-0 pointer-events-none shadow-sm"
      />

      {tabs.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            ref={(el) => el && tabRefs.current.set(tab.id, el)}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`relative z-10 px-4 py-1.5 text-xs font-semibold rounded-full transition-colors duration-200 flex items-center gap-1.5 ${
              isActive ? 'text-[#070B14]' : 'text-content-secondary hover:text-white'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  isActive ? 'bg-black/20 text-[#070B14]' : 'bg-white/10 text-content-tertiary'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
```

---

## 8. 2-Minute Quickstart Scaffolding

To spin up a new project using this exact architecture:

```bash
# 1. Create project
npm create vite@latest my-aurora-app -- --template react-ts
cd my-aurora-app

# 2. Install dependencies
npm install gsap @gsap/react lucide-react clsx tailwind-merge react-router-dom
npm install -D tailwindcss postcss autoprefixer

# 3. Initialize Tailwind
npx tailwindcss init -p
```
