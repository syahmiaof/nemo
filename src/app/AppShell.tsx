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
import { ToastProvider } from '@/components/ui/Toast';
import { Plus, FlaskConical } from 'lucide-react';
import { RouteTransition } from './RouteTransition';
import { WelcomeOverlay } from './WelcomeOverlay';
import { getInitials } from '@/lib/avatar';
import { AuthProvider } from '@/features/auth/AuthContext';
import { AuthModal } from '@/features/auth/AuthModal';
import { SyncIndicator } from '@/components/ui/SyncIndicator';

const navTabs = [
  { to: '/overview', label: 'Overview' },
  { to: '/projects', label: 'Projects' },
  { to: '/tasks', label: 'Tasks' },
  { to: '/academics', label: 'Academics' },
  { to: '/calendar', label: 'Calendar' },
  { to: '/goals', label: 'Goals' },
  { to: '/insights', label: 'Insights' },
];

export function AppShell() {
  const [quickAdd, setQuickAdd] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [askNemoOpen, setAskNemoOpen] = useState(false);
  const [welcomeDone, setWelcomeDone] = useState(false);
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
    <AuthProvider>
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
                <SyncIndicator />
                {demo && (
                  <button
                    type="button"
                    onClick={changeMode}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/35 text-amber-300 hover:bg-amber-500/25 transition-all text-xs font-semibold cursor-pointer shadow-sm"
                    title="Currently in Demo Mode. Click to return to your real workspace."
                  >
                    <FlaskConical size={13} className="text-amber-400" />
                    <span>Demo Mode &bull; Exit</span>
                  </button>
                )}
                <div className="header-time-pill hidden xl:inline-flex" title="Local System Time">
                  <span className="live-pulse" />
                  <span>{timeStr}</span>
                </div>
                <div className="hidden sm:flex flex-col items-end text-right px-1 leading-tight select-none">
                  <span className="text-xs font-semibold text-content-primary truncate max-w-[140px]">
                    {settings?.displayName || 'My Workspace'}
                  </span>
                  <span className="text-[11px] text-content-tertiary font-mono">
                    {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
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

            {demo && (
              <div className="flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-amber-500/[0.08] border border-amber-500/25 text-xs text-amber-200/90 mb-3.5 transition-all">
                <div className="flex items-center gap-2">
                  <FlaskConical size={14} className="text-amber-400 flex-shrink-0" />
                  <span><strong>Demo Workspace:</strong> Exploring fictional sample data. Personal records remain isolated and safe.</span>
                </div>
                <button
                  onClick={changeMode}
                  className="text-amber-300 hover:text-white font-semibold underline underline-offset-2 ml-3 flex-shrink-0 cursor-pointer"
                >
                  Return to my workspace &rarr;
                </button>
              </div>
            )}

            {modeError && (
              <p role="alert" className="text-accent-ember mb-4">
                {modeError}
              </p>
            )}

            <main id="main-content" tabIndex={-1}>
              <RouteTransition key={welcomeDone ? 'ready' : 'intro'} />
            </main>
          </div>

          {/* Mobile Navigation */}
          <MobileNav
            onOpenAskNemo={() => setAskNemoOpen(true)}
            onOpenSearch={() => setSearchOpen(true)}
            onOpenQuickAdd={() => setQuickAdd(true)}
          />

          {/* Modals & Drawers */}
          <AuthModal />
          <QuickAddModal isOpen={quickAdd} onClose={() => setQuickAdd(false)} />
          <QuickSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
          <AskNemoDrawer isOpen={askNemoOpen} onClose={() => setAskNemoOpen(false)} />
        </div>
      </ToastProvider>
    </AuthProvider>
  );
}
