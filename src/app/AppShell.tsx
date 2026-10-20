import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, ensureSettings } from '@/db/nemoDb';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { Header } from './Header';
import { QuickAddModal } from './QuickAddModal';
import { OnboardingModal } from './OnboardingModal';
import { ToastProvider } from '@/components/ui/Toast';

export const AppShell: React.FC = () => {
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const location = useLocation();

  // Load settings reactively from Dexie
  const settings = useLiveQuery(() => db.settings.get('default'), []);

  // Ensure default settings exist on first boot
  useEffect(() => {
    ensureSettings().then((s) => {
      document.documentElement.setAttribute('data-theme', s.theme || 'dark');
    });
  }, []);

  // Sync theme changes to HTML attribute
  useEffect(() => {
    if (settings?.theme) {
      document.documentElement.setAttribute('data-theme', settings.theme);
    }
  }, [settings?.theme]);

  // Route-aware titles
  const getHeaderInfo = () => {
    const p = location.pathname;
    if (p.startsWith('/overview')) return { title: 'Overview', subtitle: "Today's commitments and immediate priorities" };
    if (p.startsWith('/projects')) return { title: 'Projects', subtitle: 'Manage initiatives, milestones, and deliverable health' };
    if (p.startsWith('/tasks')) return { title: 'Unified Tasks', subtitle: 'Single canonical task tracking across all workflows' };
    if (p.startsWith('/calendar')) return { title: 'Unified Calendar', subtitle: 'Projected deadlines, milestone targets, and schedule' };
    if (p.startsWith('/academics')) return { title: 'Academics', subtitle: 'Semesters, courses, and assignment tracking' };
    if (p.startsWith('/goals')) return { title: 'Goals', subtitle: 'Measurable targets and milestone progression' };
    if (p.startsWith('/insights')) return { title: 'Insights', subtitle: 'Accurate local performance metrics and yearly distribution' };
    if (p.startsWith('/settings')) return { title: 'Settings', subtitle: 'Workspace profile, appearance, and backup management' };
    return { title: 'Nemo', subtitle: 'Track it, finish it.' };
  };

  const headerInfo = getHeaderInfo();

  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-canvas text-content-primary">
        {/* Desktop Sidebar */}
        <Sidebar settings={settings} />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
          <Header
            title={headerInfo.title}
            subtitle={headerInfo.subtitle}
            onOpenQuickAdd={() => setIsQuickAddOpen(true)}
            settings={settings}
          />

          <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>
        </div>

        {/* Mobile Navigation */}
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
