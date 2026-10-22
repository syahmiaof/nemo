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
}

const STAR_COLORS = [
  'rgba(168, 220, 200, ', // Mint
  'rgba(238, 178, 163, ', // Peach
  'rgba(236, 210, 154, ', // Amber
  'rgba(255, 255, 255, ', // Starlight
  'rgba(147, 197, 253, ', // Frost Blue
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
    let shootingStar: ShootingStar | null = null;
    let nextShootingTime = Date.now() + 4000;

    // Interactive pointer state
    const pointer = {
      x: -1000,
      y: -1000,
      targetX: -1000,
      targetY: -1000,
      active: false,
      radius: 160,
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
      pointer.radius = isMobile ? 120 : 170;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
      initStars();
    };

    const initStars = () => {
      const isMobile = width < 768;
      const count = Math.min(Math.floor((width * height) / (isMobile ? 16000 : 12000)), isMobile ? 48 : 95);
      stars = [];
      for (let i = 0; i < count; i++) {
        const colorPrefix = STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)];
        const posX = Math.random() * width;
        const posY = Math.random() * height;
        stars.push({
          x: posX,
          y: posY,
          originX: posX,
          originY: posY,
          size: Math.random() * 1.6 + 0.5,
          baseAlpha: Math.random() * 0.45 + 0.25,
          alpha: 0.5,
          twinkleSpeed: Math.random() * 0.03 + 0.012,
          twinklePhase: Math.random() * Math.PI * 2,
          color: colorPrefix,
          vx: (Math.random() - 0.5) * 0.06,
          vy: (Math.random() - 0.5) * 0.06,
        });
      }
    };

    const triggerShootingStar = () => {
      shootingStar = {
        x: Math.random() * width * 0.8,
        y: Math.random() * (height * 0.4),
        length: Math.random() * 80 + 60,
        speed: Math.random() * 12 + 16,
        angle: (Math.PI / 4) + (Math.random() * 0.2 - 0.1),
        opacity: 0.9,
        active: true,
      };
      nextShootingTime = Date.now() + Math.random() * 10000 + 8000;
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
        aura.addColorStop(0, 'rgba(168, 220, 200, 0.08)');
        aura.addColorStop(0.45, 'rgba(147, 197, 253, 0.03)');
        aura.addColorStop(1, 'rgba(168, 220, 200, 0)');

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

        // Interactive cursor physics: gravitation pull & luminescent boost
        if (pointer.active) {
          const dx = pointer.x - s.x;
          const dy = pointer.y - s.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < pointer.radius && dist > 1) {
            const force = (pointer.radius - dist) / pointer.radius;
            // Gentle gravitational drift towards cursor
            s.x += (dx / dist) * force * 1.4;
            s.y += (dy / dist) * force * 1.4;

            // Boost alpha & scale
            currentAlpha = Math.min(1, currentAlpha + force * 0.55);
            renderSize = s.size * (1 + force * 0.7);

            activeNearbyStars.push({ x: s.x, y: s.y, force });

            // Extra radiant aura for influenced stars
            ctx.fillStyle = `${s.color}${(currentAlpha * 0.35).toFixed(2)})`;
            ctx.beginPath();
            ctx.arc(s.x, s.y, renderSize * 2.6, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Natural idle drift
        s.x += s.vx;
        s.y += s.vy;
        if (s.x < 0) s.x = width;
        if (s.x > width) s.x = 0;
        if (s.y < 0) s.y = height;
        if (s.y > height) s.y = 0;

        ctx.fillStyle = `${s.color}${currentAlpha.toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, renderSize, 0, Math.PI * 2);
        ctx.fill();

        // Subtle glow for naturally larger stars
        if (s.size > 1.4 && (!pointer.active || renderSize === s.size)) {
          ctx.fillStyle = `${s.color}${(currentAlpha * 0.25).toFixed(2)})`;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size * 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw faint constellation linkages between stars close to the cursor
      if (activeNearbyStars.length > 1) {
        ctx.lineWidth = 0.75;
        for (let i = 0; i < activeNearbyStars.length; i++) {
          for (let j = i + 1; j < activeNearbyStars.length; j++) {
            const s1 = activeNearbyStars[i];
            const s2 = activeNearbyStars[j];
            const linkDx = s1.x - s2.x;
            const linkDy = s1.y - s2.y;
            const linkDist = Math.sqrt(linkDx * linkDx + linkDy * linkDy);
            const maxLinkDist = 85;

            if (linkDist < maxLinkDist) {
              const lineAlpha = (1 - linkDist / maxLinkDist) * 0.28 * Math.min(s1.force, s2.force);
              ctx.strokeStyle = `rgba(168, 220, 200, ${lineAlpha.toFixed(3)})`;
              ctx.beginPath();
              ctx.moveTo(s1.x, s1.y);
              ctx.lineTo(s2.x, s2.y);
              ctx.stroke();
            }
          }
        }
      }

      // Check shooting star trigger
      if (Date.now() > nextShootingTime && !shootingStar?.active) {
        triggerShootingStar();
      }

      // Draw active shooting star streak
      if (shootingStar && shootingStar.active) {
        const ss = shootingStar;
        const tailX = ss.x - Math.cos(ss.angle) * ss.length;
        const tailY = ss.y - Math.sin(ss.angle) * ss.length;

        const grad = ctx.createLinearGradient(tailX, tailY, ss.x, ss.y);
        grad.addColorStop(0, 'rgba(168, 220, 200, 0)');
        grad.addColorStop(1, `rgba(255, 255, 255, ${ss.opacity})`);

        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(ss.x, ss.y);
        ctx.stroke();

        ss.x += Math.cos(ss.angle) * ss.speed;
        ss.y += Math.sin(ss.angle) * ss.speed;
        ss.opacity -= 0.016;

        if (ss.opacity <= 0 || ss.x > width || ss.y > height) {
          ss.active = false;
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
        opacity: 0.85,
        transform: 'translate3d(0, 0, 0)',
        willChange: 'transform',
        contain: 'strict',
      }}
    />
  );
};
