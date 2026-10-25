import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderGit2,
  CheckSquare,
  Calendar,
  MoreHorizontal,
  GraduationCap,
  Target,
  Sparkles,
  HeartPulse,
  Wallet,
  BarChart3,
  Settings,
  Cloud,
  Bot,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';
import { useLocation } from 'react-router-dom';
import gsap from 'gsap';

interface MobileNavProps {
  onOpenAskNemo?: () => void;
  onOpenSearch?: () => void;
  onOpenQuickAdd?: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  onOpenAskNemo,
  onOpenSearch,
}) => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const { pathname } = useLocation();
  const moreActive = ['/academics', '/goals', '/vision', '/health', '/finance', '/insights', '/settings'].some(path => pathname.startsWith(path));

  const mainTabs = [
    { to: '/overview', label: 'Today', icon: LayoutDashboard },
    { to: '/projects', label: 'Projects', icon: FolderGit2 },
    { to: '/tasks', label: 'Tasks', icon: CheckSquare },
    { to: '/calendar', label: 'Calendar', icon: Calendar },
  ];

  const moreTabs = [
    { to: '/academics', label: 'Academics', icon: GraduationCap, desc: 'Semesters, subjects & assignments' },
    { to: '/goals', label: 'Goals', icon: Target, desc: 'Target milestones & progress' },
    { to: '/vision', label: 'Vision', icon: Sparkles, desc: 'Aspirations, dream boards & manifestations' },
    { to: '/health', label: 'Health', icon: HeartPulse, desc: 'Hydration, diet, workouts & metrics' },
    { to: '/finance', label: 'Finance', icon: Wallet, desc: 'Commitments, debt payoff, wishlist & savings' },
    { to: '/insights', label: 'Insights', icon: BarChart3, desc: 'Local metrics & charts' },
    { to: '/settings', label: 'Settings', icon: Settings, desc: 'Profile, appearance & backups' },
  ];

  let activeIndex = -1;
  if (pathname.startsWith('/overview')) activeIndex = 0;
  else if (pathname.startsWith('/projects')) activeIndex = 1;
  else if (pathname.startsWith('/tasks')) activeIndex = 2;
  else if (pathname.startsWith('/calendar')) activeIndex = 3;
  else if (moreActive || isMoreOpen) activeIndex = 4;

  const navRef = useRef<HTMLElement | null>(null);
  const tabRefs = useRef<(HTMLAnchorElement | HTMLButtonElement | null)[]>([]);
  const pillRef = useRef<HTMLDivElement | null>(null);
  const isInitialMount = useRef(true);
  const prevIndexRef = useRef(activeIndex);

  useLayoutEffect(() => {
    const nav = navRef.current;
    const pill = pillRef.current;
    if (!nav || !pill) return;

    if (activeIndex < 0) {
      gsap.to(pill, { opacity: 0, duration: 0.2 });
      return;
    }

    const target = tabRefs.current[activeIndex];
    if (!target) return;

    const navRect = nav.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const pillWidth = Math.min(targetRect.width - 14, 60);
    const left = targetRect.left - navRect.left + (targetRect.width - pillWidth) / 2;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (isInitialMount.current || prefersReducedMotion) {
      gsap.set(pill, { x: left, width: pillWidth, opacity: 1, scaleX: 1 });
      isInitialMount.current = false;
    } else {
      const direction = activeIndex >= prevIndexRef.current ? 1 : -1;
      prevIndexRef.current = activeIndex;

      // WhatsApp / iOS fluid elasticity: slight morph/stretch in direction of movement
      const tl = gsap.timeline();
      tl.to(pill, {
        x: left,
        width: pillWidth,
        opacity: 1,
        duration: 0.38,
        ease: 'power3.out',
      });
      tl.fromTo(
        pill,
        { scaleX: 1.14, transformOrigin: direction > 0 ? 'left center' : 'right center' },
        { scaleX: 1, duration: 0.42, ease: 'back.out(1.6)' },
        0
      );

      const icon = target.querySelector('svg');
      if (icon) {
        gsap.fromTo(
          icon,
          { scale: 0.76, y: 2.5 },
          { scale: 1.08, y: -1, duration: 0.36, ease: 'back.out(2.4)' }
        );
      }
    }
  }, [activeIndex, pathname, isMoreOpen]);

  // Handle window resize for accurate pill recalculation
  useEffect(() => {
    const handleResize = () => {
      const nav = navRef.current;
      const pill = pillRef.current;
      if (!nav || !pill || activeIndex < 0) return;
      const target = tabRefs.current[activeIndex];
      if (!target) return;
      const navRect = nav.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const pillWidth = Math.min(targetRect.width - 14, 60);
      const left = targetRect.left - navRect.left + (targetRect.width - pillWidth) / 2;
      gsap.set(pill, { x: left, width: pillWidth });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeIndex]);

  return (
    <>
      {/* 5-item Bottom Bar with iOS Glass Fluid Navigation */}
      <nav
        ref={navRef}
        aria-label="Mobile Navigation"
        className="mobile-nav md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0A1222]/90 backdrop-blur-2xl border-t border-white/[0.08] shadow-[0_-8px_32px_rgba(0,0,0,0.45)] flex items-center justify-around h-14 px-1 safe-area-pb overflow-hidden"
      >
        {/* Animated Sliding Glass Fluid Pill Indicator */}
        <div
          ref={pillRef}
          aria-hidden="true"
          className="mobile-nav__pill absolute left-0 top-1.5 h-[44px] rounded-xl pointer-events-none bg-gradient-to-b from-accent-mint/20 via-accent-mint/10 to-transparent border border-accent-mint/35 shadow-[0_2px_12px_rgba(168,220,200,0.18),inset_0_1px_0_rgba(255,255,255,0.25)] backdrop-blur-md"
          style={{ opacity: 0 }}
        />

        {mainTabs.map((item, idx) => {
          const Icon = item.icon;
          const isCurrent = activeIndex === idx;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              ref={(el) => { tabRefs.current[idx] = el; }}
              className={({ isActive }) =>
                cn(
                  'relative z-10 flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium transition-all select-none',
                  isActive ? 'text-accent-mint font-semibold' : 'text-content-secondary hover:text-content-primary active:scale-95'
                )
              }
            >
              <Icon className="w-5 h-5 mb-0.5 transition-transform" />
              <span className="leading-tight">{item.label}</span>
              {isCurrent && (
                <span className="w-1 h-1 rounded-full bg-accent-mint shadow-[0_0_6px_#a8dcc8] mt-0.5" />
              )}
            </NavLink>
          );
        })}

        {/* More Trigger */}
        <button
          ref={(el) => { tabRefs.current[4] = el; }}
          onClick={() => setIsMoreOpen(true)}
          className={cn(
            'relative z-10 flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium transition-all select-none',
            isMoreOpen || moreActive ? 'text-accent-mint font-semibold' : 'text-content-secondary hover:text-content-primary active:scale-95'
          )}
          aria-label="Open more navigation options"
          aria-haspopup="dialog"
          aria-expanded={isMoreOpen}
        >
          <MoreHorizontal className="w-5 h-5 mb-0.5 transition-transform" />
          <span className="leading-tight">More</span>
          {activeIndex === 4 && (
            <span className="w-1 h-1 rounded-full bg-accent-mint shadow-[0_0_6px_#a8dcc8] mt-0.5" />
          )}
        </button>
      </nav>

      <Modal isOpen={isMoreOpen} onClose={() => setIsMoreOpen(false)} title="Workspace Utilities & Modules" maxWidth="md" presentation="sheet">
        {/* Quick Utilities in Mobile Sheet */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {onOpenAskNemo && (
            <button
              type="button"
              onClick={() => {
                setIsMoreOpen(false);
                onOpenAskNemo();
              }}
              className="flex items-center gap-2.5 p-3 rounded-xl bg-accent-mint/10 border border-accent-mint/30 text-left hover:bg-accent-mint/20 transition-colors"
            >
              <Bot className="w-5 h-5 text-accent-mint flex-shrink-0" />
              <div>
                <p className="font-bold text-xs text-content-primary">Ask Nemo</p>
                <p className="text-[10px] text-content-secondary">Local Assistant</p>
              </div>
            </button>
          )}

          {onOpenSearch && (
            <button
              type="button"
              onClick={() => {
                setIsMoreOpen(false);
                onOpenSearch();
              }}
              className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-hover/70 border border-border-subtle text-left hover:bg-surface-hover transition-colors"
            >
              <Search className="w-5 h-5 text-accent-ember flex-shrink-0" />
              <div>
                <p className="font-bold text-xs text-content-primary">Quick Search</p>
                <p className="text-[10px] text-content-secondary">Find any record</p>
              </div>
            </button>
          )}
        </div>

        <div className="more-modules grid grid-cols-1 gap-2.5">
          {moreTabs.map(({icon: Icon, ...item}) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setIsMoreOpen(false)}
              className={({isActive}) => cn('flex items-center gap-4 p-3 rounded-xl border transition-colors',
                isActive ? 'bg-surface-hover border-border-emphasis text-accent-mint' : 'bg-surface border-border-subtle text-content-primary')}
            >
              <Icon className="w-5 h-5 shrink-0 text-accent-mint" />
              <div className="min-w-0">
                <p className="font-semibold text-sm">{item.label}</p>
                <p className="text-xs text-content-secondary">{item.desc}</p>
              </div>
            </NavLink>
          ))}
        </div>
        <p className="flex items-center justify-center gap-2 text-xs text-content-secondary mt-3">
          <Cloud size={15} className="text-accent-mint" /> Local-first workspace · Cloud sync in Settings
        </p>
      </Modal>
    </>
  );
};
