import { useEffect, useState } from 'react';
import { Link, ScrollRestoration } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/nemoDb';
import { getWorkspaceMode, switchWorkspace } from '@/db/workspace';
import { TavolaTabs } from '@/components/ui/TavolaTabs';
import { TavolaDock } from '@/components/ui/TavolaDock';
import { MobileNav } from './MobileNav';
import { QuickAddModal } from './QuickAddModal';
import { QuickSearchModal } from './QuickSearchModal';
import { AskNemoDrawer } from '@/features/assistant/AskNemoDrawer';
import { OnboardingModal } from './OnboardingModal';
import { ToastProvider } from '@/components/ui/Toast';
import { Plus, HardDrive, WifiOff, FlaskConical } from 'lucide-react';
import { RouteTransition } from './RouteTransition';
import { WelcomeOverlay } from './WelcomeOverlay';
import { getInitials } from '@/lib/avatar';

const navTabs = [
  { to: '/overview', label: 'Overview' },
  { to: '/projects', label: 'Projects' },
  { to: '/tasks', label: 'Tasks' },
  { to: '/calendar', label: 'Calendar' },
  { to: '/academics', label: 'Academics' },
  { to: '/goals', label: 'Goals' },
  { to: '/insights', label: 'Insights' },
];

export function AppShell() {
  const [quickAdd, setQuickAdd] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [askNemoOpen, setAskNemoOpen] = useState(false);
  const [welcomeDone, setWelcomeDone] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [modeError, setModeError] = useState('');
  const [timeStr, setTimeStr] = useState(() =>
    new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeStr(new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }));
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const settings = useLiveQuery(() => db.settings.get('default'), []);
  const avatarBlob = useLiveQuery(
    () => (settings?.avatarBlobId ? db.assetBlobs.get(settings.avatarBlobId) : undefined),
    [settings?.avatarBlobId]
  );

  const demo = getWorkspaceMode() === 'demo';

  useEffect(() => {
    document.documentElement.dataset.theme = settings?.theme || 'dark';
    document.documentElement.dataset.reduceMotion = String(settings?.reduceMotion || false);
  }, [settings?.theme, settings?.reduceMotion]);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  // Global Ctrl+K / Cmd+K search shortcut
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const changeMode = () => {
    try {
      switchWorkspace(demo ? 'real' : 'demo');
    } catch (e) {
      setModeError(e instanceof Error ? e.message : 'Workspace could not switch.');
    }
  };

  return (
    <ToastProvider>
      <div className="nemo-app">
        <WelcomeOverlay onComplete={() => setWelcomeDone(true)} />
        <ScrollRestoration />
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <div className="mesh" aria-hidden="true">
          <i className="mesh__a" />
          <i className="mesh__b" />
        </div>
        {settings?.theme === 'aurora' && <div className="aurora-backdrop" aria-hidden="true" />}

        {/* Dedicated Global Utility Rail */}
        <TavolaDock
          onOpenQuickAdd={() => setQuickAdd(true)}
          onOpenSearch={() => setSearchOpen(true)}
          onOpenAskNemo={() => setAskNemoOpen(true)}
          settings={settings}
        />

        <div className="app-shell">
          <header className="app-header">
            <Link to="/overview" className="wordmark" aria-label="Nemo overview">
              <span className="brand-mark">
                <img src="/nemo-icon.svg" width="48" height="48" alt="" />
              </span>
              <span>
                nemo<span className="brand-dot">.</span>
              </span>
            </Link>

            <div className="header-navigation">
              <TavolaTabs tabs={navTabs} />
            </div>

            <div className="header-tools">
              <div className="header-time-pill hidden xl:inline-flex" title="Local System Time">
                <span className="live-pulse" />
                <span>{timeStr}</span>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setQuickAdd(true)}
                aria-label="Quick Add"
              >
                <Plus size={21} />
              </button>
              <Link
                to="/settings"
                className="profile-button overflow-hidden"
                aria-label="Profile and settings"
              >
                {avatarBlob?.data ? (
                  <img
                    src={avatarBlob.data}
                    alt={settings?.displayName || 'Profile'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  getInitials(settings?.displayName)
                )}
              </Link>
            </div>
          </header>

          <div className="workspace-strip">
            <span className="workspace-status">
              {online ? <HardDrive size={13} /> : <WifiOff size={13} />}
              <span>
                {demo
                  ? 'DEMO WORKSPACE · Fictional data'
                  : online
                  ? 'Personal workspace · Saved on this device'
                  : 'Offline · Saved on this device'}
              </span>
            </span>
            <button onClick={changeMode} className="workspace-switch">
              <FlaskConical size={14} />
              {demo ? 'Return to my workspace' : 'Explore demo'}
            </button>
          </div>

          {modeError && (
            <p role="alert" className="text-accent-ember mb-4">
              {modeError}
            </p>
          )}

          <main id="main-content" tabIndex={-1}>
            <RouteTransition />
          </main>
        </div>

        {/* Mobile Navigation */}
        <MobileNav
          onOpenAskNemo={() => setAskNemoOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
          onOpenQuickAdd={() => setQuickAdd(true)}
        />

        {/* Modals & Drawers */}
        <QuickAddModal isOpen={quickAdd} onClose={() => setQuickAdd(false)} />
        <QuickSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
        <AskNemoDrawer isOpen={askNemoOpen} onClose={() => setAskNemoOpen(false)} />

        {settings && !settings.onboardingCompleted && welcomeDone && (
          <OnboardingModal isOpen onComplete={() => {}} settings={settings} />
        )}
      </div>
    </ToastProvider>
  );
}
