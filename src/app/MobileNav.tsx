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
  HardDrive,
  Bot,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';
import { useLocation } from 'react-router-dom';

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
  const moreActive = ['/academics', '/goals', '/insights', '/settings'].some(path => pathname.startsWith(path));

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
            isMoreOpen || moreActive ? 'text-accent-mint font-semibold' : 'text-content-secondary hover:text-content-primary'
          )}
          aria-label="Open more navigation options"
          aria-haspopup="dialog"
          aria-expanded={isMoreOpen}
        >
          <MoreHorizontal className="w-5 h-5 mb-0.5" />
          <span>More</span>
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
                <p className="font-bold text-xs text-white">Ask Nemo</p>
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
              className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.04] border border-white/10 text-left hover:bg-white/[0.08] transition-colors"
            >
              <Search className="w-5 h-5 text-accent-ember flex-shrink-0" />
              <div>
                <p className="font-bold text-xs text-white">Quick Search</p>
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
                isActive ? 'bg-surface-hover border-border-emphasis' : 'bg-surface border-border-subtle')}
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
          <HardDrive size={15} /> Saved on this device · Export backups in Settings
        </p>
      </Modal>
    </>
  );
};
