# Nemo Design System Specification

## 1. Visual Personality & Identity

- **Product Name:** Nemo
- **Wordmark:** `nemo.` in high-legibility geometric sans-serif
- **Tagline:** `Track it, finish it.`
- **Design Philosophy:** Tactile, restrained, high-density, editorial productivity workspace.
- **Palette Tone:** Deep midnight navy background with layered, semi-translucent glass panels, crisp borders, and purposeful contextual accents.

## 2. Color Palette & Design Tokens

### Midnight Navy (Dark - Default)
```css
:root[data-theme="dark"], :root {
  --bg-canvas: #0A1222;
  --bg-elevated: #0F1A2D;
  --surface: #142138;
  --surface-hover: #1B2C44;
  --surface-solid: #17243A;
  
  --border-subtle: rgba(225, 236, 248, 0.10);
  --border-emphasis: rgba(225, 236, 248, 0.19);
  
  --text-primary: #EEF2FB;
  --text-secondary: #A3B0C7;
  --text-tertiary: #8696B0;
  
  --accent-mint: #A8DCC8;
  --accent-amber: #ECD29A;
  --accent-ember: #EEB2A3;
  --focus-ring: #B4E5D5;
}
```

### Clean Slate (Accessible Light Alternative)
```css
:root[data-theme="light"] {
  --bg-canvas: #F4F7FB;
  --bg-elevated: #FFFFFF;
  --surface: #FFFFFF;
  --surface-hover: #EDF2F9;
  --surface-solid: #F0F4FA;
  
  --border-subtle: rgba(20, 33, 56, 0.10);
  --border-emphasis: rgba(20, 33, 56, 0.20);
  
  --text-primary: #0F1A2D;
  --text-secondary: #4A5B75;
  --text-tertiary: #71829E;
  
  --accent-mint: #1B7A5C;
  --accent-amber: #8A6014;
  --accent-ember: #A83624;
  --focus-ring: #1B7A5C;
}
```

## 3. Typography
- **Primary Interface Font:** System sans-serif / Geist Sans fallback (`Inter`, system-ui, -apple-system, sans-serif).
- **Code & Numerals Font:** Monospace / Geist Mono fallback (`JetBrains Mono`, `Fira Code`, monospace).

## 4. Layout & Responsive Breakpoints
- **Desktop (>= 1280px):** Permanent left sidebar navigation (~240px), top status/action bar, main workspace canvas, contextual panels when active.
- **Tablet (768px - 1279px):** Collapsible sidebar, optimized 2-column or 1-column layouts.
- **Mobile (<= 767px):** Compact top header with brand and quick add, 5-tab bottom navigation (`Today`, `Projects`, `Tasks`, `Calendar`, `More`).

## 5. Motion System (GSAP & CSS Transitions)
- **Route transitions:** 200ms subtle fade and slight vertical translation.
- **Interactive surfaces:** 150ms smooth CSS transitions for hover, focus, and active states.
- **Dialogs & Drawers:** 220ms ease-out entry with focus trapping.
- **Reduced Motion:** Fully honors `prefers-reduced-motion` media queries and explicit user settings in Nemo.
