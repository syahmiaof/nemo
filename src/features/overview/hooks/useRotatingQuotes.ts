import { useState, useEffect, useRef, useCallback } from 'react';
import { MOTIVATIONAL_QUOTES, type MotivationalQuote } from '../data/motivationalQuotes';
import { useReducedMotion } from '@/design/useReducedMotion';

export interface UseRotatingQuotesOptions {
  quotes?: MotivationalQuote[];
  intervalMs?: number;
  initialPaused?: boolean;
  shuffle?: boolean;
  isActive?: boolean;
}

export interface UseRotatingQuotesReturn {
  currentQuote: MotivationalQuote;
  nextQuote: MotivationalQuote;
  isPaused: boolean;
  togglePause: () => void;
  pause: () => void;
  resume: () => void;
  setIsPaused: React.Dispatch<React.SetStateAction<boolean>>;
  advanceNext: () => void;
  isTransitioning: boolean;
  setTransitioning: (val: boolean | ((prev: boolean) => boolean)) => void;
  currentIndex: number;
  deck: MotivationalQuote[];
  prefersReducedMotion: boolean;
  isDocumentVisible: boolean;
}

/**
 * Fisher-Yates shuffle that produces a random permutation of quotes.
 */
function shuffleDeck(quotes: MotivationalQuote[]): MotivationalQuote[] {
  const result = [...quotes];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
}

/**
 * Creates the next shuffled deck, guaranteeing that the first quote
 * does not immediately repeat the last quote of the previous deck.
 */
function createNextDeck(quotes: MotivationalQuote[], lastQuoteId?: string): MotivationalQuote[] {
  const nextDeck = shuffleDeck(quotes);
  if (quotes.length > 1 && lastQuoteId && nextDeck[0]?.id === lastQuoteId) {
    const swapIdx = Math.floor(Math.random() * (nextDeck.length - 1)) + 1;
    const temp = nextDeck[0];
    nextDeck[0] = nextDeck[swapIdx];
    nextDeck[swapIdx] = temp;
  }
  return nextDeck;
}

/**
 * Hook managing 5000ms rotating motivational quotes with non-repeating deck shuffle,
 * active visibility awareness, manual pause/resume, and reduced-motion compliance.
 */
export function useRotatingQuotes(options: UseRotatingQuotesOptions = {}): UseRotatingQuotesReturn {
  const {
    quotes = MOTIVATIONAL_QUOTES,
    intervalMs = 5000,
    initialPaused = false,
    shuffle = true,
    isActive = true,
  } = options;

  const reducedMotion = useReducedMotion();
  const [isPaused, setIsPaused] = useState<boolean>(initialPaused);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const transitioningRef = useRef(isTransitioning);
  transitioningRef.current = isTransitioning;

  // Track document visibility
  const [isDocumentVisible, setIsDocumentVisible] = useState<boolean>(() => {
    if (typeof document === 'undefined') return true;
    return !document.hidden;
  });

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const handleVisibilityChange = () => {
      setIsDocumentVisible(!document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Atomic state for the current shuffled deck, the upcoming cycle deck, and pointer
  const [deckState, setDeckState] = useState<{
    deck: MotivationalQuote[];
    upcomingDeck: MotivationalQuote[];
    currentIndex: number;
  }>(() => {
    const activeDeck = shuffle ? shuffleDeck(quotes) : [...quotes];
    const upcoming = shuffle
      ? createNextDeck(quotes, activeDeck[activeDeck.length - 1]?.id)
      : [...quotes];
    return {
      deck: activeDeck,
      upcomingDeck: upcoming,
      currentIndex: 0,
    };
  });

  // Keep options in sync if quotes or shuffle strategy changes
  const quotesRef = useRef(quotes);
  quotesRef.current = quotes;
  const shuffleRef = useRef(shuffle);
  shuffleRef.current = shuffle;
  const reducedMotionRef = useRef(reducedMotion);
  reducedMotionRef.current = reducedMotion;

  // Advance to next quote in the shuffled deck
  const advanceNext = useCallback(() => {
    // The consumer owns the transition lifecycle. The old 400ms timeout
    // raced the 1.7s particle tween and could expose DOM text over the canvas.
    setIsTransitioning(!reducedMotionRef.current);

    setDeckState((prev) => {
      const { deck: currentDeck, upcomingDeck: currentUpcoming, currentIndex: currentIdx } = prev;
      const allQuotes = quotesRef.current;
      const shouldShuffle = shuffleRef.current;

      if (currentIdx + 1 < currentDeck.length) {
        return {
          ...prev,
          currentIndex: currentIdx + 1,
        };
      }

      // Reached the end of the deck: advance into the upcoming deck without immediate repeats
      const nextDeck = currentUpcoming.length > 0
        ? currentUpcoming
        : (shouldShuffle
            ? createNextDeck(allQuotes, currentDeck[currentDeck.length - 1]?.id)
            : [...allQuotes]);

      const freshUpcoming = shouldShuffle
        ? createNextDeck(allQuotes, nextDeck[nextDeck.length - 1]?.id)
        : [...allQuotes];

      return {
        deck: nextDeck,
        upcomingDeck: freshUpcoming,
        currentIndex: 0,
      };
    });
  }, []);

  // Control pause actions
  const togglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  const pause = useCallback(() => {
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    setIsPaused(false);
  }, []);

  // Automatic rotation timer of active visibility
  const shouldRotate = !isPaused && isActive && isDocumentVisible && !reducedMotion;

  useEffect(() => {
    if (!shouldRotate || intervalMs <= 0) {
      return;
    }

    const timer = setInterval(() => {
      // A manual transition may start just before this interval fires. Keep
      // its destination stable until the renderer completes its handoff.
      if (!transitioningRef.current) advanceNext();
    }, intervalMs);

    return () => {
      clearInterval(timer);
    };
  }, [shouldRotate, intervalMs, advanceNext]);

  const { deck, upcomingDeck, currentIndex } = deckState;

  const currentQuote: MotivationalQuote =
    deck[currentIndex] ?? quotes[0] ?? { id: 'fallback', text: '', category: 'focus' };

  const nextQuote: MotivationalQuote =
    currentIndex + 1 < deck.length
      ? (deck[currentIndex + 1] ?? currentQuote)
      : (upcomingDeck[0] ?? deck[0] ?? currentQuote);

  return {
    currentQuote,
    nextQuote,
    isPaused,
    togglePause,
    pause,
    resume,
    setIsPaused,
    advanceNext,
    isTransitioning,
    setTransitioning: setIsTransitioning,
    currentIndex,
    deck,
    prefersReducedMotion: reducedMotion,
    isDocumentVisible,
  };
}
