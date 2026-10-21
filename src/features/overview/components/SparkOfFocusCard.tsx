import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Pause, Play, ChevronRight, Wand2 } from 'lucide-react';
import { useRotatingQuotes } from '../hooks/useRotatingQuotes';
import { ParticleTextCanvas } from './ParticleTextCanvas';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/nemoDb';
import { cn } from '@/lib/utils';

interface SparkOfFocusCardProps {
  className?: string;
}

export const SparkOfFocusCard: React.FC<SparkOfFocusCardProps> = ({ className }) => {
  const settings = useLiveQuery(() => db.settings.get('default'), []);
  const rawTheme = (settings?.theme || 'midnight') as string;
  const theme = (rawTheme === 'daylight' || rawTheme === 'light')
    ? 'daylight'
    : rawTheme === 'aurora'
    ? 'aurora'
    : 'midnight';

  const [isInViewport, setIsInViewport] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const isAutoActive = isInViewport && !isHovered && !isFocused;

  const {
    currentQuote,
    isPaused,
    togglePause,
    advanceNext,
    isTransitioning,
    setTransitioning,
    prefersReducedMotion,
    isDocumentVisible,
  } = useRotatingQuotes({ intervalMs: 5200, isActive: isAutoActive });

  const [displayedQuote, setDisplayedQuote] = useState(currentQuote);
  const containerRef = useRef<HTMLDivElement>(null);
  const quoteTextRef = useRef<HTMLParagraphElement>(null);
  const currentQuoteRef = useRef(currentQuote);
  const pointerFocusedRef = useRef(false);
  currentQuoteRef.current = currentQuote;
  const isActive = isInViewport && !isHovered && !isFocused && isDocumentVisible;
  const [particleHasStarted, setParticleHasStarted] = useState(false);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    if (!('IntersectionObserver' in window)) {
      setIsInViewport(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      setIsInViewport(entry.isIntersecting && entry.intersectionRatio >= 0.1);
    }, { threshold: [0, 0.1] });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // When currentQuote changes, initiate particle morph transition
  useEffect(() => {
    if (currentQuote.id === displayedQuote.id) return;

    if (prefersReducedMotion) {
      setDisplayedQuote(currentQuote);
      setParticleHasStarted(false);
      return;
    }

    setParticleHasStarted(false);
    setTransitioning(true);
  }, [currentQuote, displayedQuote, prefersReducedMotion, setTransitioning]);

  const handleTransitionComplete = useCallback(() => {
    setDisplayedQuote(currentQuoteRef.current);
    setParticleHasStarted(false);
    setTransitioning(false);
  }, [setTransitioning]);

  const handleTransitionStart = useCallback(() => {
    setParticleHasStarted(true);
  }, []);

  return (
    <section
      ref={containerRef}
      data-enter
      onPointerEnter={() => setIsHovered(true)}
      onPointerDown={() => { pointerFocusedRef.current = true; }}
      onPointerLeave={() => {
        setIsHovered(false);
        if (pointerFocusedRef.current) {
          pointerFocusedRef.current = false;
          setIsFocused(false);
        }
      }}
      onFocusCapture={() => setIsFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          pointerFocusedRef.current = false;
          setIsFocused(false);
        }
      }}
      className={cn(
        'glass-panel p-3.5 sm:p-4 rounded-2xl relative overflow-hidden flex flex-col justify-between min-h-[145px] transition-all border border-border-subtle hover:border-border-emphasis',
        className
      )}
      aria-label="Spark of focus motivational quote"
    >
      {/* Decorative Enchanted Stardust Ambient Aura */}
      <div
        className="absolute -top-12 -right-12 w-36 h-36 rounded-full pointer-events-none blur-3xl opacity-20 bg-accent-mint"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full pointer-events-none blur-3xl opacity-15 bg-accent-ember"
        aria-hidden="true"
      />

      {/* Card Header: Icon, Title & Category Badge */}
      <div className="flex items-center justify-between gap-3 relative z-20 mb-1">
        <div className="flex items-center gap-2 text-accent-mint">
          <Wand2 size={16} className="text-accent-mint animate-pulse" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-content-primary">
            Spark of focus
          </h2>
        </div>

        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider bg-accent-mint/10 border border-accent-mint/25 text-accent-mint select-none">
          {displayedQuote.category}
        </span>
      </div>

      {/* Main Quote Area (DOM text at rest; Canvas during active particle morph) */}
      <div className="flex-1 flex items-center justify-center relative min-h-[68px] py-1 px-2 z-10 select-none">
        {/* Real Accessible DOM Typography */}
        <p
          ref={quoteTextRef}
          className={cn(
            'text-base sm:text-lg font-semibold text-center leading-snug tracking-tight text-content-primary transition-opacity duration-300 font-heading max-w-md',
            isTransitioning && particleHasStarted ? 'opacity-0' : 'opacity-100'
          )}
        >
          &ldquo;{displayedQuote.text}&rdquo;
        </p>

        {/* Live Stardust Canvas Particle Engine */}
        <ParticleTextCanvas
          oldQuote={`“${displayedQuote.text}”`}
          newQuote={`“${currentQuote.text}”`}
          isTransitioning={isTransitioning}
          isActive={isActive}
          textElementRef={quoteTextRef}
          onTransitionStart={handleTransitionStart}
          onTransitionComplete={handleTransitionComplete}
          theme={theme}
          fontSize={18}
          className="absolute inset-0 w-full h-full pointer-events-none z-20"
        />
      </div>

      {/* Footer Controls: Status Indicator & Playback Buttons */}
      <div className="flex items-center justify-between text-xs text-content-tertiary relative z-20 pt-1.5 border-t border-border-subtle/50">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'w-2 h-2 rounded-full transition-all',
              isPaused ? 'bg-amber-400' : 'bg-accent-mint animate-pulse'
            )}
          />
          <span className="text-[11px] font-mono">
            {isPaused ? 'Paused' : 'Transforms every 5s'}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={togglePause}
            className="p-1.5 rounded-lg text-content-secondary hover:text-content-primary hover:bg-surface-hover transition-colors cursor-pointer"
            aria-label={isPaused ? 'Resume quote rotation' : 'Pause quote rotation'}
            title={isPaused ? 'Resume' : 'Pause'}
          >
            {isPaused ? <Play size={13} /> : <Pause size={13} />}
          </button>

          <button
            type="button"
            onClick={advanceNext}
            className="p-1.5 rounded-lg text-content-secondary hover:text-content-primary hover:bg-surface-hover transition-colors cursor-pointer"
            aria-label="Next motivational quote"
            title="Next Quote"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </section>
  );
};
