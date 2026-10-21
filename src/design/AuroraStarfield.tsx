import React, { useEffect, useRef } from 'react';
import { useReducedMotion } from '@/design/useReducedMotion';

interface Star {
  x: number;
  y: number;
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

    const resize = () => {
      const isMobile = window.innerWidth < 768;
      const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
      width = window.innerWidth;
      height = window.innerHeight;
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
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
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
      };
    }

    const render = () => {

      if (document.hidden) {
        animId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      // Render & drift stars
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        s.twinklePhase += s.twinkleSpeed;
        const currentAlpha = Math.max(0.08, Math.min(1, s.baseAlpha + Math.sin(s.twinklePhase) * 0.35));

        s.x += s.vx;
        s.y += s.vy;
        if (s.x < 0) s.x = width;
        if (s.x > width) s.x = 0;
        if (s.y < 0) s.y = height;
        if (s.y > height) s.y = 0;

        ctx.fillStyle = `${s.color}${currentAlpha})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();

        // Subtle glow for larger stars
        if (s.size > 1.4) {
          ctx.fillStyle = `${s.color}${currentAlpha * 0.25})`;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size * 2.2, 0, Math.PI * 2);
          ctx.fill();
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
