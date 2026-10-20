import React, { useState, useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, ensureSettings } from '@/db/nemoDb';
import { TavolaTabs } from '@/components/ui/TavolaTabs';
import { TavolaDock } from '@/components/ui/TavolaDock';
import { MobileNav } from './MobileNav';
import { QuickAddModal } from './QuickAddModal';
import { OnboardingModal } from './OnboardingModal';
import { ToastProvider } from '@/components/ui/Toast';
import { Plus, Sun, Moon, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const AppShell: React.FC = () => {
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const settings = useLiveQuery(() => db.settings.get('default'), []);

  useEffect(() => {
    ensureSettings().then((s) => {
      document.documentElement.setAttribute('data-theme', s.theme || 'dark');
    });
  }, []);

  useEffect(() => {
    if (settings?.theme) {
      document.documentElement.setAttribute('data-theme', settings.theme);
    }
  }, [settings?.theme]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const toggleTheme = async () => {
    const nextTheme = settings?.theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', nextTheme);
    await db.settings.update('default', { theme: nextTheme });
  };

  const navTabs = [
    { to: '/overview', label: 'Overview' },
    { to: '/projects', label: 'Projects' },
    { to: '/tasks', label: 'Tasks' },
    { to: '/calendar', label: 'Calendar' },
    { to: '/academics', label: 'Academics' },
    { to: '/goals', label: 'Goals' },
    { to: '/insights', label: 'Insights' },
    { to: '/settings', label: 'Settings' },
  ];

  return (
    <ToastProvider>
      <div className="relative min-h-screen text-content-primary selection:bg-accent-mint/20 selection:text-accent-mint font-sans">
        {/* Tavola Ambient Background Mesh */}
        <div className="mesh" aria-hidden="true">
          <i className="mesh__a" />
          <i className="mesh__b" />
        </div>

        {/* Tavola Floating Left Dock */}
        <TavolaDock onOpenQuickAdd={() => setIsQuickAddOpen(true)} settings={settings} />

        {/* Tavola Layout Container (Math-calculated padding prevents all dock collision) */}
        <div className="app-shell flex flex-col">
          {/* Top Bar (Tavola Floating Navigation Grid) */}
          <header className="grid grid-cols-[auto_1fr] md:grid-cols-[auto_1fr_auto] items-center gap-4 sm:gap-6 mb-7 pb-2 select-none">
            {/* Brand Logo */}
            <Link to="/overview" className="flex items-center gap-3 group select-none flex-shrink-0">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#F5C8BC] to-[#EAA999] text-[#2E1813] flex items-center justify-center shadow-[0_8px_20px_-8px_rgba(245,200,188,0.5)] group-hover:scale-105 transition-transform">
                <span className="font-mono font-extrabold text-base">N</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black tracking-tight text-content-primary font-sans">nemo</span>
                <span className="w-2 h-2 rounded-full bg-accent-mint inline-block animate-pulse" />
              </div>
            </Link>

            {/* Center Floating Glass Pill Tabs */}
            <div className="hidden md:flex justify-center max-w-fit mx-auto">
              <TavolaTabs tabs={navTabs} />
            </div>

            {/* Right Tools & Actions */}
            <div className="flex items-center justify-end gap-2.5 flex-shrink-0">
              {/* Local / Offline status pill */}
              <div
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface border border-border-subtle text-[11px] font-semibold text-content-secondary shadow-sm"
                title={isOnline ? 'Local IndexedDB (100% Private)' : 'Offline mode'}
              >
                {isOnline ? (
                  <>
                    <Wifi className="w-3.5 h-3.5 text-accent-mint" />
                    <span>Local</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3.5 h-3.5 text-accent-amber" />
                    <span>Offline</span>
                  </>
                )}
              </div>

              {/* Theme Toggle Button */}
              <button
                type="button"
                onClick={toggleTheme}
                className="p-2.5 rounded-full text-content-secondary hover:text-content-primary hover:bg-surface border border-border-subtle shadow-sm transition-all active:scale-90"
                aria-label="Toggle theme"
              >
                {settings?.theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </button>

              {/* Quick Add Button (Warm Luxury Ember - Zero Eye Strain!) */}
              <Button
                variant="primary"
                onClick={() => setIsQuickAddOpen(true)}
                size="sm"
                className="rounded-full px-4 gap-1.5 shadow-md"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span className="hidden sm:inline">Quick Add</span>
              </Button>
            </div>
          </header>

          {/* Main View Area */}
          <main className="flex-1 w-full">
            <Outlet />
          </main>
        </div>

        {/* Mobile Navigation Bar */}
        <MobileNav />

        {/* Quick Add Universal Modal */}
        <QuickAddModal
          isOpen={isQuickAddOpen}
          onClose={() => setIsQuickAddOpen(false)}
        />

        {/* First-Run Onboarding Modal */}
        {settings && !settings.onboardingCompleted && (
          <OnboardingModal
            isOpen={!settings.onboardingCompleted}
            onComplete={() => {}}
            settings={settings}
          />
        )}
      </div>
    </ToastProvider>
  );
};
