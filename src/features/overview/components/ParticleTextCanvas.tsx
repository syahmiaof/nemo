import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { sampleTextGlyphs } from '../motion/particleSampler';
import { createMorphBuffer, drawMorphFrame, type MorphParticle } from '../motion/particleMorph';
import { useReducedMotion } from '@/design/useReducedMotion';

interface ParticleTextCanvasProps {
  oldQuote: string;
  newQuote: string;
  isTransitioning: boolean;
  onTransitionComplete: () => void;
  theme?: 'midnight' | 'daylight' | 'aurora';
  fontSize?: number;
  className?: string;
}

export const ParticleTextCanvas: React.FC<ParticleTextCanvasProps> = ({
  oldQuote,
  newQuote,
  isTransitioning,
  onTransitionComplete,
  theme = 'midnight',
  fontSize = 24,
  className,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!isTransitioning) return;

    if (reducedMotion) {
      onTransitionComplete();
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      onTransitionComplete();
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const width = Math.max(rect.width, 240);
    const height = Math.max(rect.height, 120);

    const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      onTransitionComplete();
      return;
    }

    ctx.scale(dpr, dpr);

    // Responsive particle budget: 350 on mobile, 550 on desktop
    const maxParticles = width < 480 ? 360 : 580;

    // Sample source and target glyph coordinate clouds
    const sourcePoints = sampleTextGlyphs({
      text: oldQuote,
      width,
      height,
      fontSize,
      maxParticles,
    });

    const targetPoints = sampleTextGlyphs({
      text: newQuote,
      width,
      height,
      fontSize,
      maxParticles,
    });

    const particles: MorphParticle[] = createMorphBuffer(
      sourcePoints,
      targetPoints,
      width,
      height,
      theme
    );

    const progress = { value: 0 };

    if (tweenRef.current) {
      tweenRef.current.kill();
    }

    // 1.7 second fairytale stardust particle transformation
    tweenRef.current = gsap.to(progress, {
      value: 1,
      duration: 1.7,
      ease: 'none',
      onUpdate: () => {
        if (!canvasRef.current) return;
        drawMorphFrame(ctx, particles, progress.value, width, height);
      },
      onComplete: () => {
        ctx.clearRect(0, 0, width, height);
        onTransitionComplete();
      },
    });

    return () => {
      if (tweenRef.current) {
        tweenRef.current.kill();
        tweenRef.current = null;
      }
    };
  }, [isTransitioning, oldQuote, newQuote, theme, fontSize, reducedMotion, onTransitionComplete]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className || 'absolute inset-0 w-full h-full pointer-events-none z-10'}
    />
  );
};
