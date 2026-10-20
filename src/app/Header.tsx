import React from 'react';
import { Plus, Sun, Moon, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { WorkspaceSettings } from '@/domain/types';
import { db } from '@/db/nemoDb';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onOpenQuickAdd: () => void;
  settings?: WorkspaceSettings;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, onOpenQuickAdd, settings }) => {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
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

  return (
    <header className="sticky top-0 z-20 bg-elevated/80 backdrop-blur-md border-b border-border-subtle px-4 md:px-8 py-3.5 flex items-center justify-between">
      {/* Title & Context */}
      <div>
        <h1 className="text-lg md:text-xl font-bold tracking-tight text-content-primary flex items-center gap-2">
          {title}
        </h1>
        {subtitle && <p className="text-xs text-content-tertiary mt-0.5">{subtitle}</p>}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Offline/Online Status Pill */}
        <div
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface border border-border-subtle text-[11px] text-content-secondary"
          title={isOnline ? 'Online mode (browser local)' : 'Offline mode (cached assets)'}
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

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-content-secondary hover:text-content-primary hover:bg-surface-hover border border-border-subtle transition-colors"
          aria-label="Toggle theme"
          title={settings?.theme === 'light' ? 'Switch to Midnight Dark' : 'Switch to Clean Light'}
        >
          {settings?.theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>

        {/* Quick Add Button */}
        <Button onClick={onOpenQuickAdd} size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Quick Add</span>
        </Button>
      </div>
    </header>
  );
};
