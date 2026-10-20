import React, { useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import gsap from 'gsap';

interface TabItem {
  to: string;
  label: string;
}

interface TavolaTabsProps {
  tabs: TabItem[];
}

export const TavolaTabs: React.FC<TavolaTabsProps> = ({ tabs }) => {
  const location = useLocation();
  const trackRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    const track = trackRef.current;
    const pill = pillRef.current;
    if (!track || !pill) return;

    const updatePill = (instant = false) => {
      const activeLink = track.querySelector('a.tab.is-active') as HTMLAnchorElement | null;
      if (!activeLink) {
        gsap.to(pill, { opacity: 0, duration: 0.2 });
        return;
      }

      const targetX = activeLink.offsetLeft;
      const targetW = activeLink.offsetWidth;

      if (instant || isFirstRender.current) {
        gsap.set(pill, {
          x: targetX,
          width: targetW,
          opacity: 1,
        });
        isFirstRender.current = false;
      } else {
        gsap.to(pill, {
          x: targetX,
          width: targetW,
          opacity: 1,
          duration: 0.32,
          ease: 'power3.out',
          overwrite: 'auto',
        });
      }
    };

    updatePill();

    // Re-check when fonts are confirmed ready
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => updatePill(true));
    }

    const handleResize = () => updatePill(true);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [location.pathname, tabs]);

  return (
    <nav className="tabs" aria-label="Main Navigation">
      <div ref={trackRef} className="tabs__track">
        {/* The Smooth Floating Glass Pill Behind Active Tab */}
        <span ref={pillRef} className="tabs__indicator" aria-hidden="true" />

        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) => `tab ${isActive ? 'is-active' : ''}`}
          >
            {tab.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
