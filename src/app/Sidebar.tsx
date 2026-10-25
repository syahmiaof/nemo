import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderGit2,
  CheckSquare,
  Calendar,
  GraduationCap,
  Target,
  Sparkles,
  Moon,
  HeartPulse,
  Wallet,
  BarChart3,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WorkspaceSettings } from '@/domain/types';

interface SidebarProps {
  settings?: WorkspaceSettings;
}

export const Sidebar: React.FC<SidebarProps> = ({ settings }) => {
  const navWorkspace = [
    { to: '/overview', label: 'Overview', icon: LayoutDashboard },
    { to: '/projects', label: 'Projects', icon: FolderGit2 },
    { to: '/tasks', label: 'Tasks', icon: CheckSquare },
    { to: '/calendar', label: 'Calendar', icon: Calendar },
  ];

  const navPersonal = [
    { to: '/academics', label: 'Academics', icon: GraduationCap },
    { to: '/goals', label: 'Goals', icon: Target },
    { to: '/vision', label: 'Vision', icon: Sparkles },
    { to: '/ibadah', label: 'Ibadah', icon: Moon },
    { to: '/health', label: 'Health', icon: HeartPulse },
    { to: '/finance', label: 'Finance', icon: Wallet },
    { to: '/insights', label: 'Insights', icon: BarChart3 },
  ];

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all group select-none',
      isActive
        ? 'bg-surface-hover text-content-primary shadow-sm font-semibold border border-border-subtle'
        : 'text-content-secondary hover:text-content-primary hover:bg-surface/50'
    );

  return (
    <aside className="hidden md:flex flex-col w-60 h-screen sticky top-0 bg-elevated border-r border-border-subtle z-30 select-none">
      {/* Brand & Wordmark */}
      <div className="p-5 border-b border-border-subtle flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img src="/nemo-icon.svg" alt="Nemo Logo" className="w-7 h-7 rounded-lg shadow-sm" />
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-bold tracking-tight text-content-primary font-sans">nemo</span>
              <span className="w-1.5 h-1.5 rounded-full bg-accent-mint inline-block"></span>
            </div>
            <p className="text-[10px] text-content-tertiary font-mono tracking-wider uppercase">Track it, finish it.</p>
          </div>
        </div>
      </div>

      {/* Nav Content */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div>
          <p className="px-3 mb-2 text-[10px] font-mono tracking-widest text-content-tertiary uppercase">Workspace</p>
          <nav className="space-y-1">
            {navWorkspace.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink key={item.to} to={item.to} className={linkClass}>
                  <Icon className="w-4 h-4 text-content-tertiary group-hover:text-accent-mint transition-colors" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div>
          <p className="px-3 mb-2 text-[10px] font-mono tracking-widest text-content-tertiary uppercase">Personal</p>
          <nav className="space-y-1">
            {navPersonal.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink key={item.to} to={item.to} className={linkClass}>
                  <Icon className="w-4 h-4 text-content-tertiary group-hover:text-accent-mint transition-colors" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer / Privacy & Settings */}
      <div className="p-3 border-t border-border-subtle bg-surface/30 space-y-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface/50 border border-border-subtle/50 text-[11px] text-content-secondary">
          <ShieldCheck className="w-3.5 h-3.5 text-accent-mint flex-shrink-0" />
          <span className="truncate">Browser-local • 100% Private</span>
        </div>

        <NavLink to="/settings" className={linkClass}>
          <Settings className="w-4 h-4 text-content-tertiary group-hover:text-accent-mint transition-colors" />
          <div className="flex-1 truncate">
            <span className="block truncate">{settings?.displayName || 'Settings'}</span>
          </div>
        </NavLink>
      </div>
    </aside>
  );
};
