import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderGit2,
  CheckSquare,
  Calendar,
  MoreHorizontal,
  GraduationCap,
  Target,
  BarChart3,
  Settings,
  X,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const MobileNav: React.FC = () => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const mainTabs = [
    { to: '/overview', label: 'Today', icon: LayoutDashboard },
    { to: '/projects', label: 'Projects', icon: FolderGit2 },
    { to: '/tasks', label: 'Tasks', icon: CheckSquare },
    { to: '/calendar', label: 'Calendar', icon: Calendar },
  ];

  const moreTabs = [
    { to: '/academics', label: 'Academics', icon: GraduationCap, desc: 'Semesters, subjects & assignments' },
    { to: '/goals', label: 'Goals', icon: Target, desc: 'Target milestones & progress' },
    { to: '/insights', label: 'Insights', icon: BarChart3, desc: 'Local metrics & charts' },
    { to: '/settings', label: 'Settings', icon: Settings, desc: 'Profile, appearance & backups' },
  ];

  return (
    <>
      {/* 5-item Bottom Bar */}
      <nav aria-label="Mobile Navigation" className="mobile-nav md:hidden fixed bottom-0 left-0 right-0 z-40 bg-elevated/95 backdrop-blur-md border-t border-border-subtle flex items-center justify-around h-16 px-1 safe-area-pb">
        {mainTabs.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium transition-colors select-none',
                  isActive ? 'text-accent-mint font-semibold' : 'text-content-secondary hover:text-content-primary'
                )
              }
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        {/* More Trigger */}
        <button
          onClick={() => setIsMoreOpen(true)}
          className={cn(
            'flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium transition-colors select-none',
            isMoreOpen ? 'text-accent-mint font-semibold' : 'text-content-secondary hover:text-content-primary'
          )}
          aria-label="Open more navigation options"
        >
          <MoreHorizontal className="w-5 h-5 mb-0.5" />
          <span>More</span>
        </button>
      </nav>

      {/* More Bottom Sheet Drawer */}
      {isMoreOpen && (
        <div
          className="fixed inset-0 z-50 bg-canvas/80 backdrop-blur-sm flex flex-col justify-end"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsMoreOpen(false);
          }}
        >
          <div className="bg-elevated border-t border-border-emphasis rounded-t-3xl p-6 pb-12 shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-border-subtle mb-4">
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold text-content-primary">More Modules</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface border border-border-subtle text-content-tertiary">
                  Nemo
                </span>
              </div>
              <button
                onClick={() => setIsMoreOpen(false)}
                className="p-1.5 rounded-lg text-content-tertiary hover:text-content-primary hover:bg-surface-hover"
                aria-label="Close sheet"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {moreTabs.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setIsMoreOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-4 p-3 rounded-xl border transition-all',
                        isActive
                          ? 'bg-surface-hover border-border-emphasis text-content-primary font-semibold'
                          : 'bg-surface/50 border-border-subtle text-content-secondary hover:text-content-primary'
                      )
                    }
                  >
                    <div className="p-2 rounded-lg bg-surface border border-border-subtle text-accent-mint">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold text-content-primary">{item.label}</p>
                      <p className="text-xs text-content-tertiary">{item.desc}</p>
                    </div>
                  </NavLink>
                );
              })}
            </div>

            <div className="mt-5 pt-4 border-t border-border-subtle flex items-center justify-center gap-2 text-xs text-content-tertiary">
              <ShieldCheck className="w-4 h-4 text-accent-mint" />
              <span>Offline-capable • IndexedDB Protected</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
