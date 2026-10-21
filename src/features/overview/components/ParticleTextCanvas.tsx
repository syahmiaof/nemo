import React, { useRef, useEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { rasterizeQuote, type GlyphGeometry } from "../motion/particleSampler";
import {
  createMorphBuffer,
  drawMorphFrame,
  getCinematicPhase,
  MORPH_DURATION,
  type MorphTheme,
} from "../motion/particleMorph";
import { useReducedMotion } from "@/design/useReducedMotion";

gsap.registerPlugin(useGSAP);
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
const CACHE_LIMIT = 12;

export const ParticleTextCanvas: React.FC<ParticleTextCanvasProps> = ({
  oldQuote,
  newQuote,
  isTransitioning,
  isActive,
  textElementRef,
  onTransitionStart,
  onTransitionComplete,
  theme = "midnight",
  className,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const completionRef = useRef(onTransitionComplete),
    startCallbackRef = useRef(onTransitionStart);
  const startRef = useRef<() => void>(() => {}),
    activeRef = useRef(isActive);
  const cacheRef = useRef(new Map<string, GlyphGeometry>());
  const slowDeviceRef = useRef(false);
  const reducedMotion = useReducedMotion();
  completionRef.current = onTransitionComplete;
  startCallbackRef.current = onTransitionStart;
  activeRef.current = isActive;

  useGSAP(
    (context) => {
      if (!isTransitioning) return;
      if (reducedMotion || slowDeviceRef.current) {
        completionRef.current();
        return;
      }
      const canvas = canvasRef.current;
      if (!canvas) {
        completionRef.current();
        return;
      }
      let cancelled = false,
        pending = false;
      let resizeObserver: ResizeObserver | undefined;
      const start = async () => {
        if (cancelled || pending || timelineRef.current) return;
        pending = true;
        try {
          await document.fonts?.ready;
        } catch {
          /* The DOM and mask share the same fallback face. */
        }
        if (cancelled || !activeRef.current) {
          pending = false;
          return;
        }
        const element = textElementRef.current;
        const width = canvas.clientWidth,
          height = canvas.clientHeight;
        const ctx = canvas.getContext("2d", { alpha: true });
        if (!element || !ctx || width < 1 || height < 1) {
          completionRef.current();
          return;
        }
        const dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 640 ? 1.5 : 2);
        canvas.width = Math.ceil(width * dpr);
        canvas.height = Math.ceil(height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const style = getComputedStyle(element);
        const budget =
          window.innerWidth < 640 ? 240 : window.innerWidth < 1024 ? 400 : 650;
        const geometry = (text: string) => {
          const key = JSON.stringify([
            text,
            width,
            height,
            dpr,
            budget,
            style.font,
            style.letterSpacing,
            style.lineHeight,
            style.maxWidth,
            style.color,
          ]);
          const existing = cacheRef.current.get(key);
          if (existing) {
            cacheRef.current.delete(key);
            cacheRef.current.set(key, existing);
            return existing;
          }
          const sampled = rasterizeQuote(
            text,
            element,
            width,
            height,
            dpr,
            budget,
          );
          if (sampled) {
            cacheRef.current.set(key, sampled);
            if (cacheRef.current.size > CACHE_LIMIT)
              cacheRef.current.delete(cacheRef.current.keys().next().value!);
          }
          return sampled;
        };
        const source = geometry(oldQuote),
          target = geometry(newQuote);
        if (!source?.fragments.length || !target?.fragments.length) {
          completionRef.current();
          return;
        }
        const particles = createMorphBuffer(
          source.fragments,
          target.fragments,
          width,
          height,
          theme,
        );
        const progress = { value: 0 };
        let slowFrames = 0,
          renderFrames = 0;
        const draw = () => {
          if (cancelled) return;
          const started = performance.now();
          canvas.dataset.motionPhase = getCinematicPhase(progress.value);
          drawMorphFrame(ctx, particles, progress.value, width, height, theme, {
            source,
            target,
          });
          renderFrames++;
          if (performance.now() - started > 14) slowFrames++;
        };
        // Paint the complete source mask before the DOM is hidden. No CSS fade.
        draw();
        startCallbackRef.current();
        context.add(() => {
          timelineRef.current = gsap
            .timeline({
              data: "spark-quote-v2",
              paused: !activeRef.current,
              onUpdate: draw,
              onComplete: () => {
                // Keep fully assembled mask visible through the React DOM handoff.
                progress.value = 1;
                draw();
                if (
                  window.innerWidth < 640 &&
                  renderFrames > 15 &&
                  slowFrames / renderFrames > 0.3
                )
                  slowDeviceRef.current = true;
                timelineRef.current = null;
                completionRef.current();
              },
            })
            .to(progress, { value: 1, duration: MORPH_DURATION, ease: "none" });
        });
        // Resize finishes the current phrase safely. The next cycle remeasures
        // the new DOM line boxes; it never scales stale glyph destinations.
        resizeObserver = new ResizeObserver(() => {
          if (canvas.clientWidth !== width || canvas.clientHeight !== height) {
            timelineRef.current?.kill();
            timelineRef.current = null;
            cacheRef.current.clear();
            completionRef.current();
          }
        });
        resizeObserver.observe(canvas);
        pending = false;
      };
      startRef.current = () => {
        void start();
      };
      if (activeRef.current) startRef.current();
      return () => {
        cancelled = true;
        resizeObserver?.disconnect();
        timelineRef.current?.kill();
        timelineRef.current = null;
        startRef.current = () => {};
        delete canvas.dataset.motionPhase;
        canvas.width = 1;
        canvas.height = 1;
      };
    },
    {
      scope: canvasRef,
      dependencies: [
        isTransitioning,
        oldQuote,
        newQuote,
        theme,
        reducedMotion,
        textElementRef,
      ],
      revertOnUpdate: true,
    },
  );

  useEffect(() => {
    if (timelineRef.current) timelineRef.current.paused(!isActive);
    else if (isActive && isTransitioning && !reducedMotion) startRef.current();
  }, [isActive, isTransitioning, reducedMotion]);

  useEffect(
    () => () => {
      cacheRef.current.clear();
    },
    [],
  );
  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={
        className || "absolute inset-0 w-full h-full pointer-events-none z-10"
      }
      style={{
        transform: "translateZ(0)",
        willChange: isTransitioning ? "transform" : "auto",
      }}
    />
  );
};
