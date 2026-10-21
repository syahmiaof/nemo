# Nemo Sprint 6: Particle Motion Technical Report

## 1. Overview
The **Spark of Focus** animation is an engineered Canvas 2D and GSAP particle morphing system. Rather than using an opacity fade, blur, or character swap, the system translates letterforms into physical coordinate clouds that swirl through space and coalesce into the target quote.

---

## 2. Text Sampling Pipeline (`particleSampler.ts`)

### 2.1 Rasterization & Text Wrapping
1. An offscreen 2D canvas is initialized with the card's dimensions and scaled by `window.devicePixelRatio` (capped at 2.0 to balance fidelity and fill rate).
2. Quotes are split into words and formatted using canvas `measureText` to fit within card bounds (`maxWidth = width - 40`).
3. Sentences are centered vertically and horizontally using font metrics:
   ```ts
   ctx.font = `600 ${fontSize}px "Urbanist", -apple-system, sans-serif`;
   ctx.fillStyle = '#ffffff';
   ```

### 2.2 Alpha Mask Thresholding
1. `ctx.getImageData(0, 0, width, height)` captures pixel data.
2. The grid is scanned with a step size of `3` to extract dense coordinates where `alpha > 130`.
3. If sampled points exceed `maxParticles` (360 on mobile, 580 on desktop), a deterministic stride subsampling reduces the cloud to the target budget.

---

## 3. Coordinate Morphing & Orbital Trajectories (`particleMorph.ts`)

### 3.1 Point Cloud Matching
When transforming from Quote A to Quote B:
- Point counts are matched by duplicating or interpolating nearest neighbors.
- Points are sorted spatially to minimize erratic long-distance crisscrossing while preserving organic motion.

### 3.2 Cubic Bézier Swirl Trajectories
Each particle follows a 4-point Bézier curve:
- $P_0$: Source point on old letterform.
- $P_1$: Outward expansion control point:
  $$P_1 = P_0 + \vec{v}_{\text{drift}} + \text{orbitalOffset}$$
- $P_2$: Vortex swirl control point curving towards the center of mass.
- $P_3$: Target point on new letterform.

Formula:
$$B(t) = (1-t)^3 P_0 + 3(1-t)^2 t P_1 + 3(1-t) t^2 P_2 + t^3 P_3$$

### 3.3 Theme-Adaptive Stardust Palettes
- **Midnight**: Soft mint (`#6EE7B7`), ivory peach (`#FDE68A`), and lavender glimmers (`#C4B5FD`).
- **Daylight**: Slate blue (`#3B82F6`), deep emerald (`#059669`), and amber gold (`#D97706`).
- **Aurora**: Luminous cyan (`#22D3EE`), emerald glow (`#10B981`), and cosmic violet (`#A855F7`).

---

## 4. GSAP Orchestration & DOM Handoff

```
[0.0s] Old DOM Quote Sharp & Visible
   │
   ├─► [Trigger Transition] Canvas mounts with pre-sampled Quote A points.
   │   DOM quote opacity fades to 0 in 150ms.
   │
   ├─► [0.0s - 0.45s] Disintegration: Letters dissolve into particles with outward acceleration.
   │
   ├─► [0.45s - 1.10s] Orbital Swirl: Particles follow Bézier vortex curves in dynamic 3D-feel motion.
   │
   ├─► [1.10s - 1.70s] Reformation: Particles attract to destination points and settle with power3.out.
   │
   └─► [1.70s] Transition Complete:
       Canvas clears frame and releases buffers.
       New DOM Quote opacity restores to 100%.
```

---

## 5. Accessibility & Reduced Motion
If `prefers-reduced-motion` is active:
- Particle sampling and canvas animations are completely bypassed.
- Quotes change instantly without motion, preserving full readability and user comfort.
