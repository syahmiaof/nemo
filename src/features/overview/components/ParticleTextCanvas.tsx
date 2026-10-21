import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { sampleTextGlyphs, type Point } from '../motion/particleSampler';
import { createMorphBuffer, drawMorphFrame, getMorphPhase, type MorphParticle, type MorphTheme } from '../motion/particleMorph';
import { useReducedMotion } from '@/design/useReducedMotion';

interface ParticleTextCanvasProps {
  oldQuote: string;
  newQuote: string;
  isTransitioning: boolean;
  isActive: boolean;
  textElementRef: React.RefObject<HTMLParagraphElement | null>;
  onTransitionStart: () => void;
  onTransitionComplete: () => void;
  theme?: MorphTheme;
  fontSize?: number;
  className?: string;
}

const SAMPLE_CACHE_LIMIT = 12;

export const ParticleTextCanvas: React.FC<ParticleTextCanvasProps> = ({
  oldQuote,
  newQuote,
  isTransitioning,
  isActive,
  textElementRef,
  onTransitionStart,
  onTransitionComplete,
  theme = 'midnight',
  fontSize = 24,
  className,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const completionRef = useRef(onTransitionComplete);
  const transitionStartRef = useRef(onTransitionStart);
  const startRef = useRef<() => void>(() => undefined);
  const activeRef = useRef(isActive);
  const pendingRef = useRef(false);
  const cacheRef = useRef(new Map<string, Point[]>());
  const reducedMotion = useReducedMotion();
  completionRef.current = onTransitionComplete;
  transitionStartRef.current = onTransitionStart;
  activeRef.current = isActive;

  useEffect(() => {
    if (!isTransitioning) return;
    if (reducedMotion) {
      completionRef.current();
      return;
    }

    let cancelled = false;
    const canvas = canvasRef.current;
    if (!canvas) {
      completionRef.current();
      return;
    }

    const start = async () => {
      if (pendingRef.current || tweenRef.current) return;
      pendingRef.current = true;
      // Font readiness keeps particle contours aligned with the actual DOM face.
      try {
        if (document.fonts?.ready) await document.fonts.ready;
      } catch {
        // Continue with the browser fallback font if the font set fails to load.
      }
      if (cancelled || !activeRef.current || !canvasRef.current) {
        pendingRef.current = false;
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const width = Math.max(rect.width, 240);
      const height = Math.max(rect.height, 110);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);

      const ctx = canvas.getContext('2d', { alpha: true });
      if (!ctx) {
        pendingRef.current = false;
        completionRef.current();
        return;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const textElement = textElementRef.current;
      const style = textElement ? getComputedStyle(textElement) : null;
      const actualFontSize = parseFloat(style?.fontSize || '') || fontSize;
      const actualFont = style?.font || `${style?.fontWeight ?? 600} ${actualFontSize}px ${style?.fontFamily ?? 'Urbanist, sans-serif'}`;
      const actualLineHeight = style?.lineHeight && style.lineHeight !== 'normal'
        ? (parseFloat(style.lineHeight) / actualFontSize)
        : 1.35;
      const actualTextWidth = Math.max(80, Math.min(textElement?.clientWidth || width - 24, width));
      const maxParticles = width < 480 ? 340 : 520;

      const pointsFor = (text: string) => {
        const key = `${text}\u0000${actualFont}\u0000${actualFontSize}\u0000${actualLineHeight}\u0000${actualTextWidth}\u0000${width}\u0000${height}\u0000${dpr}\u0000${maxParticles}`;
        const cached = cacheRef.current.get(key);
        if (cached) return cached;
        const points = sampleTextGlyphs({
          text,
          width,
          height,
          font: actualFont,
          fontSize: actualFontSize,
          lineHeight: actualLineHeight,
          maxTextWidth: actualTextWidth,
          maxParticles,
          dpr,
        });
        if (cacheRef.current.size >= SAMPLE_CACHE_LIMIT) {
          const oldestKey = cacheRef.current.keys().next().value;
          if (oldestKey) cacheRef.current.delete(oldestKey);
        }
        cacheRef.current.set(key, points);
        return points;
      };

      const particles: MorphParticle[] = createMorphBuffer(
        pointsFor(oldQuote),
        pointsFor(newQuote),
        width,
        height,
        theme
      );
      const progress = { value: 0 };
      const previousTween = tweenRef.current as gsap.core.Tween | null;
      if (previousTween) previousTween.kill();
      transitionStartRef.current();
      tweenRef.current = gsap.to(progress, {
        value: 1,
        duration: 1.7,
        ease: 'none',
        paused: !activeRef.current,
        onUpdate: () => {
          if (!cancelled && canvasRef.current) {
            canvas.dataset.motionPhase = getMorphPhase(progress.value);
            drawMorphFrame(ctx, particles, progress.value, width, height, theme);
          }
        },
        onComplete: () => {
          ctx.clearRect(0, 0, width, height);
          delete canvas.dataset.motionPhase;
          tweenRef.current = null;
          pendingRef.current = false;
          if (!cancelled) completionRef.current();
        },
      });
      pendingRef.current = false;
    };

    startRef.current = () => { void start(); };
    if (isActive) startRef.current();

    return () => {
      cancelled = true;
      tweenRef.current?.kill();
      tweenRef.current = null;
      pendingRef.current = false;
      const context = canvas.getContext('2d');
      if (context) context.clearRect(0, 0, canvas.width, canvas.height);
      startRef.current = () => undefined;
    };
  }, [isTransitioning, oldQuote, newQuote, theme, fontSize, reducedMotion, textElementRef]);

  // Activity changes pause/resume the existing tween instead of restarting it.
  useEffect(() => {
    if (tweenRef.current) {
      tweenRef.current.paused(!isActive);
    } else if (isActive && isTransitioning && !reducedMotion) {
      startRef.current();
    }
  }, [isActive, isTransitioning, reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className || 'absolute inset-0 w-full h-full pointer-events-none z-10'}
    />
  );
};
