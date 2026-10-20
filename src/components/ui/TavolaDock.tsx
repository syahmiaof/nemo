import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderGit2,
  CheckSquare,
  Calendar,
  GraduationCap,
  Target,
  BarChart3,
  Settings,
  Plus,
  Sun,
  Moon,
} from 'lucide-react';
import { db } from '@/db/nemoDb';
import type { WorkspaceSettings } from '@/domain/types';

interface TavolaDockProps {
  onOpenQuickAdd: () => void;
  settings?: WorkspaceSettings;
}

export const TavolaDock: React.FC<TavolaDockProps> = ({ onOpenQuickAdd, settings }) => {
  const toggleTheme = async () => {
    const nextTheme = settings?.theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', nextTheme);
    await db.settings.update('default', { theme: nextTheme });
  };

  const dockItems = [
    { to: '/overview', label: 'Overview', icon: LayoutDashboard },
    { to: '/projects', label: 'Projects', icon: FolderGit2 },
    { to: '/tasks', label: 'Unified Tasks', icon: CheckSquare },
    { to: '/calendar', label: 'Calendar', icon: Calendar },
    { to: '/academics', label: 'Academics', icon: GraduationCap },
    { to: '/goals', label: 'Goals', icon: Target },
    { to: '/insights', label: 'Insights', icon: BarChart3 },
  ];

  return (
    <aside className="hidden md:flex dock" aria-label="Quick Actions Dock">
      {/* Quick Add Button */}
      <button
        type="button"
        onClick={onOpenQuickAdd}
        className="dock__btn text-[#EAA999] hover:bg-[#EAA999]/15 hover:scale-110 active:scale-95 transition-all"
        aria-label="Quick Add"
      >
        <Plus className="w-5 h-5 stroke-[2.8]" />
        <span className="dock__tip">Quick Add Task/Project</span>
      </button>

      <span className="w-6 h-[1px] bg-border-subtle mx-auto my-0.5" aria-hidden="true" />

      {/* Main Nav Items */}
      {dockItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `dock__btn ${isActive ? 'is-active' : ''}`}
            aria-label={item.label}
          >
            <Icon className="w-5 h-5" />
            <span className="dock__tip">{item.label}</span>
          </NavLink>
        );
      })}

      <span className="w-6 h-[1px] bg-border-subtle mx-auto my-0.5" aria-hidden="true" />

      {/* Settings */}
      <NavLink
        to="/settings"
        className={({ isActive }) => `dock__btn ${isActive ? 'is-active' : ''}`}
        aria-label="Settings"
      >
        <Settings className="w-5 h-5" />
        <span className="dock__tip">Settings</span>
      </NavLink>

      {/* Theme Toggle */}
      <button
        type="button"
        onClick={toggleTheme}
        className="dock__btn"
        aria-label="Toggle Theme"
      >
        {settings?.theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        <span className="dock__tip">{settings?.theme === 'light' ? 'Midnight Dark' : 'Clean Light'}</span>
      </button>
    </aside>
  );
};
