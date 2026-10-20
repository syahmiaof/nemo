# Nemo Design System Specification — Tavola-Grade Redesign

## 1. Visual Personality & Product Identity

- **Product Name:** Nemo (`nemo.`)
- **Wordmark:** `nemo.` in Google Urbanist font (weights 300..900)
- **Tagline:** `Track it, finish it.`
- **Design Philosophy:** Midnight luxury operating system for developers, researchers, and creators. Layered glassmorphism, fluid Bezier spline motion, tactile feedback, and restrained editorial warmth.
- **Atmosphere:** Deep midnight navy base (`#070B14` -> `#0C1425`) with dual-point radial mesh glow (`rgba(44, 98, 140, 0.22)` and `rgba(168, 220, 200, 0.12)`).

---

## 2. Layout Geometry & Anti-Collision Formula

To eliminate all layout collisions between the floating vertical dock and content grid:

```css
:root {
  --dock-x: 24px;
  --dock-w: 64px;
  --gutter: clamp(16px, 1.8vw, 32px);
  --max-w: 1540px;
}

.app-shell {
  min-height: 100dvh;
  padding: 22px var(--gutter) 48px calc(var(--dock-x) + var(--dock-w) + var(--gutter));
  max-width: var(--max-w);
  margin-inline: auto;
  overflow-x: clip;
}

@media (max-width: 768px) {
  .app-shell {
    padding: 16px 16px 84px 16px;
  }
}
```

---

## 3. Surface & Glassmorphic Rim-Lighting

All primary cards use the Tavola multi-layer glass token system with a masked 1px perimeter highlight:

```css
:root {
  --glass: rgba(14, 22, 38, 0.72);
  --blur: 24px;
  --rim: rgba(255, 255, 255, 0.10);
  --rim-light: linear-gradient(135deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.03) 60%, rgba(255,255,255,0.08) 100%);
}

.glass-panel {
  background: var(--glass);
  backdrop-filter: blur(var(--blur));
  -webkit-backdrop-filter: blur(var(--blur));
  position: relative;
  border-radius: 20px;
}

.glass-panel::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: var(--rim-light);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}
```

---

## 4. Color Palette & Zero-Strain Action Contrasts

### Primary Action Gradient (Warm Ember / Rosé)
To replace eye-straining washed-out neon cyan, all primary action buttons use a warm, opaque Ember gradient with deep espresso typography:
- **Gradient:** `linear-gradient(135deg, #F5C8BC 0%, #EAA999 100%)`
- **Text Color:** `#2E1813`
- **Contrast Ratio:** 10.5:1 (WCAG AAA Compliance)
- **Glow Shadow:** `0 8px 24px -6px rgba(245, 200, 188, 0.40)`

### Status Accents
- **Mint (Progress & Local State):** `#A8DCC8`
- **Amber (Pending & Warnings):** `#ECD29A`
- **Ember (Overdue & Critical):** `#EEB2A3`
- **Pastel Ticket Backgrounds:**
  - Emerald Mint Ticket: `#BBF0D8` with dark green text `#0A3222`
  - Peach Ticket: `#FFD4C7` with dark crimson text `#3E150F`

---

## 5. Typography

- **Display & Headings:** `Urbanist` (weights 600, 700, 800, 900)
- **Body & Subtitles:** `Urbanist` (weights 400, 500)
- **Numerals, Dates & Badges:** `Geist Mono` / `JetBrains Mono` (tabular figures)

---

## 6. Motion & GSAP Interaction Guidelines

- **Asymmetrical Pill Navigation (`TavolaTabs`):**
  - Uses GSAP dual-edge interpolation: leading edge reaches target at `0.34s power3.out`, trailing edge settles at `0.52s power3.inOut`, creating an elastic stretching physical sensation.
- **Spline Curves (`TavolaSplineChart`):**
  - Native Catmull-Rom Bezier calculation with tension 0.5.
  - Interactive crosshair and floating glass tooltip on pointer hover.
- **Card Entrance (`animateCardsEntrance`):**
  - Staggered `0.6s power3.out` with 50ms interval and subtle 18px translation.
- **Button Pop (`triggerButtonPop`):**
  - Back-spring `0.45s back.out(2.5)` on interactive action.
- **Reduced Motion:**
  - Strict conditional gate `prefersReducedMotion()`. Disables spatial animation when user has configured accessibility preferences.
