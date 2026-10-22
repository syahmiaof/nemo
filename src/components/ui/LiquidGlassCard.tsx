import React, { useRef, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { useReducedMotion } from '@/design/useReducedMotion';

export interface LiquidGlassCardProps extends React.HTMLAttributes<HTMLElement> {
  as?: 'section' | 'div' | 'article';
  children: React.ReactNode;
  className?: string;
  tiltMaxAngle?: number;
  elevated?: boolean;
  interactive?: boolean;
}

export const LiquidGlassCard = forwardRef<HTMLElement, LiquidGlassCardProps>(
  (
    {
      as: Component = 'section',
      children,
      className = '',
      tiltMaxAngle = 6.5,
      elevated = true,
      interactive = true,
      ...rest
    },
    forwardedRef
  ) => {
    const cardRef = useRef<HTMLElement | null>(null);
    useImperativeHandle(forwardedRef, () => cardRef.current as HTMLElement);

    const reduced = useReducedMotion();
    const [styleState, setStyleState] = useState({
      rotX: 0,
      rotY: 0,
      glowX: 50,
      glowY: 50,
      isHovered: false,
      scale: 1,
    });

    const handlePointerMove = useCallback(
      (e: React.PointerEvent<HTMLElement>) => {
        if (reduced || !interactive || !cardRef.current) return;

        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Normalized from -1 to 1
        const normX = Math.min(Math.max((x / rect.width) * 2 - 1, -1), 1);
        const normY = Math.min(Math.max((y / rect.height) * 2 - 1, -1), 1);

        const rotX = -normY * tiltMaxAngle;
        const rotY = normX * tiltMaxAngle;

        const glowX = Math.round((x / rect.width) * 100);
        const glowY = Math.round((y / rect.height) * 100);

        setStyleState({
          rotX,
          rotY,
          glowX,
          glowY,
          isHovered: true,
          scale: 1.012,
        });
      },
      [reduced, interactive, tiltMaxAngle]
    );

    const handlePointerLeave = useCallback(() => {
      setStyleState((prev) => ({
        ...prev,
        rotX: 0,
        rotY: 0,
        isHovered: false,
        scale: 1,
      }));
    }, []);

    const DynamicComponent = Component as any;

    return (
      <DynamicComponent
        ref={cardRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        className={`liquid-glass-card group relative transition-all duration-300 ease-out ${
          elevated ? 'liquid-glass-elevated' : ''
        } ${className}`}
        style={{
          transform: reduced
            ? 'none'
            : `perspective(1000px) rotateX(${styleState.rotX.toFixed(2)}deg) rotateY(${styleState.rotY.toFixed(2)}deg) scale3d(${styleState.scale}, ${styleState.scale}, 1)`,
          willChange: styleState.isHovered ? 'transform' : 'auto',
        }}
        {...rest}
      >
        {/* Dynamic Liquid Specular Gleam Layer (Follows cursor) */}
        {!reduced && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300 overflow-hidden"
            style={{
              opacity: styleState.isHovered ? 1 : 0.4,
              background: `radial-gradient(circle 420px at ${styleState.glowX}% ${styleState.glowY}%, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0.04) 40%, transparent 75%)`,
              zIndex: 1,
            }}
          />
        )}

        {/* Dynamic Prismatic Fluid Chromatic Hue on Tilt */}
        {!reduced && styleState.isHovered && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-25 mix-blend-overlay transition-opacity duration-300"
            style={{
              background: `linear-gradient(${styleState.rotY * 18 + 135}deg, rgba(168, 220, 200, 0.3) 0%, rgba(238, 178, 163, 0.2) 50%, rgba(147, 197, 253, 0.3) 100%)`,
              zIndex: 1,
            }}
          />
        )}

        {/* Prismatic Liquid Edge Highlight & Bevel */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit] border border-white/20 shadow-[inset_0_1.5px_2px_0_rgba(255,255,255,0.45),inset_0_-1.5px_2px_0_rgba(0,0,0,0.35),inset_0_0_24px_0_rgba(168,220,200,0.06)]"
          style={{ zIndex: 2 }}
        />

        {children}
      </DynamicComponent>
    );
  }
);

LiquidGlassCard.displayName = 'LiquidGlassCard';
