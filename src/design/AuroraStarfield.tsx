import React, { useEffect, useRef } from 'react';
import { useReducedMotion } from '@/design/useReducedMotion';

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
  const reduced = useReducedMotion();

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

    // Interactive pointer state
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
      // Initialize pointer position on first move to prevent lerping from (-1000,-1000)
      if (pointer.x < 0) {
        pointer.x = e.clientX;
        pointer.y = e.clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        pointer.targetX = e.touches[0].clientX;
        pointer.targetY = e.touches[0].clientY;
        pointer.active = true;
        pointer.lastMoved = performance.now();
        if (pointer.x < 0) {
          pointer.x = pointer.targetX;
          pointer.y = pointer.targetY;
        }
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
      // High-density starry sky for a deeply immersive celestial canopy
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
      // Spawn meteors from diverse upper/left quadrants
      const startX = Math.random() * (width * 0.85) + offsetX;
      const startY = Math.random() * (height * 0.35) + offsetY;
      const angle = (Math.PI / 4) + (Math.random() * 0.26 - 0.13); // diagonal sweep ~38° - 52°
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
      // 35% chance to spawn twin or triplet meteors simultaneously
      const burstCount = Math.random() < 0.35 ? (Math.random() < 0.5 ? 2 : 3) : 1;
      for (let i = 0; i < burstCount; i++) {
        if (shootingStars.length < 5) {
          shootingStars.push(createShootingStar(i * 60, i * -30));
        }
      }
      // Rapid cadence: every 1.2 to 2.8 seconds
      nextShootingTime = Date.now() + Math.random() * 1600 + 1200;
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('pointerleave', handlePointerLeave);

    if (reduced) {
      // Static starry background for reduced motion preference
      ctx.clearRect(0, 0, width, height);
      for (const s of stars) {
        ctx.fillStyle = `${s.color}${s.baseAlpha})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      }
      return () => {
        window.removeEventListener('resize', resize);
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('pointerleave', handlePointerLeave);
      };
    }

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

        // Auto-fade pointer if inactive for more than 4 seconds
        if (performance.now() - pointer.lastMoved > 4000) {
          pointer.active = false;
        }
      }

      // Render soft interactive cursor aura
      if (pointer.active && pointer.x > 0 && pointer.y > 0) {
        const aura = ctx.createRadialGradient(
          pointer.x,
          pointer.y,
          0,
          pointer.x,
          pointer.y,
          pointer.radius
        );
        aura.addColorStop(0, 'rgba(52, 211, 153, 0.09)');
        aura.addColorStop(0.45, 'rgba(147, 197, 253, 0.04)');
        aura.addColorStop(1, 'rgba(52, 211, 153, 0)');

        ctx.fillStyle = aura;
        ctx.beginPath();
        ctx.arc(pointer.x, pointer.y, pointer.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Stars within pointer influence to draw constellation lines
      const activeNearbyStars: { x: number; y: number; force: number }[] = [];

      // Render & drift stars
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

        // Interactive cursor physics: gravitation pull & luminescent boost
        if (pointer.active) {
          const dx = pointer.x - s.x;
          const dy = pointer.y - s.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < pointer.radius && dist > 1) {
            const force = (pointer.radius - dist) / pointer.radius;
            // Magnetic quadratic pull towards cursor
            const pull = force * force * 1.6;
            s.x += (dx / dist) * pull;
            s.y += (dy / dist) * pull;

            // Boost alpha & scale
            currentAlpha = Math.min(1, currentAlpha + force * 0.65);
            renderSize = s.size * (1 + force * 0.85);

            activeNearbyStars.push({ x: s.x, y: s.y, force });

            // Extra radiant aura for influenced stars
            ctx.fillStyle = `${s.color}${(currentAlpha * 0.38).toFixed(2)})`;
            ctx.beginPath();
            ctx.arc(s.x, s.y, renderSize * 2.8, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Natural cosmic drift
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

        // Subtle glow for naturally larger stars
        if (s.size > 1.3 && (!pointer.active || renderSize === s.size)) {
          ctx.fillStyle = `${s.color}${(currentAlpha * 0.28).toFixed(2)})`;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size * 2.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw constellation linkages between stars close to the cursor
      if (activeNearbyStars.length > 1) {
        ctx.lineWidth = 0.8;
        const isMobile = width < 768;
        const maxLinkDist = isMobile ? 80 : 105;
        for (let i = 0; i < activeNearbyStars.length; i++) {
          for (let j = i + 1; j < activeNearbyStars.length; j++) {
            const s1 = activeNearbyStars[i];
            const s2 = activeNearbyStars[j];
            const linkDx = s1.x - s2.x;
            const linkDy = s1.y - s2.y;
            const linkDist = Math.sqrt(linkDx * linkDx + linkDy * linkDy);

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

      // Check shooting star trigger (more frequent, multiple concurrent)
      if (Date.now() > nextShootingTime && shootingStars.length < 5) {
        triggerShootingStars();
      }

      // Render and step active shooting stars
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

        // Radiant glow point at the meteor head
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
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('pointerleave', handlePointerLeave);
      cancelAnimationFrame(animId);
    };
  }, [reduced]);

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
