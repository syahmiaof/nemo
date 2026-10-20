import React, { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { db } from '@/db/nemoDb';
import { useReducedMotion } from '@/design/useReducedMotion';

interface WelcomeOverlayProps {
  /** Optional callback invoked when overlay completes its exit */
  onComplete?: () => void;
  /** Whether to bypass auto-show if session was already welcomed (default: false, so hard refreshes always show) */
  skipIfSessionWelcomed?: boolean;
}

const STORAGE_KEY_WELCOME = 'nemo_welcome_seen';
const SESSION_KEY_SEEN = 'nemo_session_welcomed';

export const WelcomeOverlay: React.FC<WelcomeOverlayProps> = ({
  onComplete,
  skipIfSessionWelcomed = false,
}) => {
  const reducedMotion = useReducedMotion();
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    if (skipIfSessionWelcomed && sessionStorage.getItem(SESSION_KEY_SEEN)) {
      return false;
    }
    return true;
  });
  const [isAbbreviated, setIsAbbreviated] = useState<boolean>(false);
  const [workspaceReady, setWorkspaceReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const mintNodeRef = useRef<SVGCircleElement>(null);
  const peachNodeRef = useRef<SVGCircleElement>(null);
  const ribbonPathRef = useRef<SVGPathElement>(null);
  const underpathRef = useRef<SVGPathElement>(null);
  const wordmarkRef = useRef<HTMLDivElement>(null);
  const taglineRef = useRef<HTMLParagraphElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  // Perform genuine workspace readiness check
  useEffect(() => {
    let mounted = true;
    const verifyWorkspace = async () => {
      try {
        await db.settings.get('default');
      } catch (err) {
        console.warn('Workspace readiness fallback', err);
      } finally {
        if (mounted) {
          setWorkspaceReady(true);
        }
      }
    };
    verifyWorkspace();
    return () => {
      mounted = false;
    };
  }, []);

  // Graceful exit function
  const dismiss = useCallback(() => {
    if (timelineRef.current) {
      timelineRef.current.kill();
      timelineRef.current = null;
    }

    // Mark as seen both in localStorage and sessionStorage
    try {
      localStorage.setItem(STORAGE_KEY_WELCOME, Date.now().toString());
      sessionStorage.setItem(SESSION_KEY_SEEN, 'true');
    } catch {
      // Ignore private browsing storage errors
    }

    if (!containerRef.current || reducedMotion) {
      setIsOpen(false);
      onComplete?.();
      return;
    }

    gsap.to(containerRef.current, {
      opacity: 0,
      scale: 1.02,
      duration: 0.35,
      ease: 'power2.inOut',
      onComplete: () => {
        setIsOpen(false);
        onComplete?.();
      },
    });
  }, [reducedMotion, onComplete]);

  // Keyboard and click dismiss listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        dismiss();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, dismiss]);

  // Global event listener for manual replays (e.g. from Settings)
  useEffect(() => {
    const handleReplay = () => {
      setIsAbbreviated(false);
      setIsOpen(true);
    };

    window.addEventListener('nemo:replay-welcome', handleReplay);
    return () => {
      window.removeEventListener('nemo:replay-welcome', handleReplay);
    };
  }, []);

  // Animation Sequence
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const container = containerRef.current;

    // Respect reduced motion: instant subtle dissolve
    if (reducedMotion) {
      const timer = setTimeout(() => {
        dismiss();
      }, isAbbreviated ? 600 : 1200);
      return () => clearTimeout(timer);
    }

    // Set initial GSAP properties
    gsap.set(container, { opacity: 1, scale: 1 });

    const tl = gsap.timeline({
      onComplete: () => {
        dismiss();
      },
    });
    timelineRef.current = tl;

    if (isAbbreviated) {
      // Abbreviated return-visit animation (~650ms total)
      tl.fromTo(
        svgRef.current,
        { scale: 0.9, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.28, ease: 'power2.out' }
      )
        .fromTo(
          wordmarkRef.current,
          { opacity: 0, y: 6 },
          { opacity: 1, y: 0, duration: 0.22, ease: 'power2.out' },
          '-=0.15'
        )
        .to({}, { duration: 0.3 }); // brief hold
    } else {
      // Signature Full Launch Animation (~1.9s)
      const ribbonPath = ribbonPathRef.current;
      const ribbonLength =
        ribbonPath && typeof ribbonPath.getTotalLength === 'function'
          ? ribbonPath.getTotalLength()
          : 350;

      if (ribbonPath) {
        gsap.set(ribbonPath, {
          strokeDasharray: ribbonLength,
          strokeDashoffset: ribbonLength,
        });
      }

      // 1. Initial State
      gsap.set(svgRef.current, { scale: 0.85, opacity: 0 });
      gsap.set(mintNodeRef.current, { scale: 0, transformOrigin: '31px 94px' });
      gsap.set(peachNodeRef.current, { scale: 0, transformOrigin: '101px 30px' });
      gsap.set(wordmarkRef.current, { opacity: 0, y: 12 });
      gsap.set(taglineRef.current, { opacity: 0, y: 8 });
      gsap.set(statusRef.current, { opacity: 0 });

      // 2. Tile Entrance & Mint checkpoint origin
      tl.to(svgRef.current, {
        scale: 1,
        opacity: 1,
        duration: 0.45,
        ease: 'power3.out',
      })
        .to(
          mintNodeRef.current,
          {
            scale: 1,
            duration: 0.35,
            ease: 'back.out(2.2)',
          },
          '-=0.2'
        )
        // 3. Flowing route emblem reveal from checkpoint to completion
        .to(
          ribbonPath,
          {
            strokeDashoffset: 0,
            duration: 0.65,
            ease: 'power2.inOut',
          },
          '-=0.15'
        )
        // 4. Peach completion node pop
        .to(
          peachNodeRef.current,
          {
            scale: 1,
            duration: 0.38,
            ease: 'back.out(2.4)',
          },
          '-=0.25'
        )
        // 5. "nemo." wordmark reveal
        .to(
          wordmarkRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.35,
            ease: 'power2.out',
          },
          '-=0.2'
        )
        // 6. "Track it, finish it." tagline reveal
        .to(
          taglineRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.32,
            ease: 'power2.out',
          },
          '-=0.15'
        )
        // 7. Workspace ready indicator
        .to(
          statusRef.current,
          {
            opacity: 1,
            duration: 0.25,
            ease: 'power1.out',
          },
          '-=0.1'
        )
        // 8. Gentle hold for contemplation before seamless handoff
        .to({}, { duration: 1.2 });
    }

    return () => {
      tl.kill();
    };
  }, [isOpen, isAbbreviated, reducedMotion, dismiss]);

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to Nemo"
      onClick={dismiss}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-6 select-none cursor-pointer"
      style={{
        backgroundColor: '#0A1222',
        backgroundImage: 'radial-gradient(circle at 50% 45%, rgba(26, 44, 76, 0.4) 0%, #0A1222 75%)',
      }}
    >
      <div className="relative flex flex-col items-center text-center max-w-sm">
        {/* Signature SVG Emblem */}
        <div className="relative mb-6">
          <svg
            ref={svgRef}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 128 128"
            fill="none"
            className="w-24 h-24 sm:w-28 sm:h-28 drop-shadow-[0_12px_24px_rgba(0,0,0,0.45)]"
          >
            <defs>
              <linearGradient id="ribbonGrad" x1="30" y1="92" x2="89" y2="28" gradientUnits="userSpaceOnUse">
                <stop stopColor="#a8e4d2" />
                <stop offset="0.28" stopColor="#59657f" />
                <stop offset="0.65" stopColor="#edb6a5" />
                <stop offset="1" stopColor="#ffe5c9" />
              </linearGradient>
              <linearGradient id="edgeGrad" x1="28" y1="41" x2="95" y2="91" gradientUnits="userSpaceOnUse">
                <stop stopColor="#fff5e9" />
                <stop offset="1" stopColor="#a7b9d5" />
              </linearGradient>
            </defs>

            {/* Emblem Rounded Tile */}
            <rect
              x="1"
              y="1"
              width="126"
              height="126"
              rx="30"
              fill="#0b162c"
              stroke="#405677"
              strokeWidth="2"
            />

            {/* Route Underpath Guide */}
            <path
              ref={underpathRef}
              d="M31 94C49 115 91 110 104 78"
              stroke="#426182"
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* Flowing Ribbon Path */}
            <path
              ref={ribbonPathRef}
              d="M31 94C7 69 25 28 49 30C72 31 78 75 95 73C108 72 111 51 101 30C119 59 111 96 91 95C69 94 61 52 44 53C28 53 23 78 31 94Z"
              fill="url(#ribbonGrad)"
              stroke="url(#edgeGrad)"
              strokeWidth="1.5"
            />

            {/* Mint Checkpoint Origin Node */}
            <circle
              ref={mintNodeRef}
              cx="31"
              cy="94"
              r="8"
              fill="#ace7d5"
              stroke="#d2fff0"
              strokeWidth="1.5"
            />

            {/* Peach Completion Node */}
            <circle
              ref={peachNodeRef}
              cx="101"
              cy="30"
              r="10"
              fill="#f6bb9b"
              stroke="#ffe5ca"
              strokeWidth="1.5"
            />
          </svg>
        </div>

        {/* nemo. Wordmark */}
        <div
          ref={wordmarkRef}
          className="text-4xl sm:text-5xl font-black tracking-tight text-white flex items-baseline justify-center"
          style={{ fontFamily: 'Urbanist, sans-serif' }}
        >
          <span>nemo</span>
          <span className="text-[#eeb2a3] ml-0.5">.</span>
        </div>

        {/* Tagline */}
        <p
          ref={taglineRef}
          className="mt-2 text-sm sm:text-base font-medium text-slate-300 tracking-wide"
        >
          Track it, finish it.
        </p>

        {/* Workspace Readiness Badge */}
        <div
          ref={statusRef}
          className="mt-6 flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 text-xs font-mono text-slate-300"
        >
          <span
            className={`w-1.5 h-1.5 rounded-full transition-colors ${
              workspaceReady ? 'bg-accent-mint shadow-[0_0_8px_var(--accent-mint)]' : 'bg-slate-500 animate-pulse'
            }`}
          />
          <span>{workspaceReady ? 'Workspace ready' : 'Initializing workspace...'}</span>
        </div>

        {/* Quick Dismiss Instruction */}
        <p className="mt-8 text-[11px] font-mono tracking-widest uppercase text-slate-400/80">
          Click or press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-slate-300 border border-white/15">Esc</kbd> to skip
        </p>
      </div>
    </div>
  );
};

/** Helper function to programmatically trigger the signature welcome animation from anywhere */
export function replayWelcomeAnimation(): void {
  window.dispatchEvent(new CustomEvent('nemo:replay-welcome'));
}
