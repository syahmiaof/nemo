import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Search,
  Plus,
  Bot,
  Settings,
} from 'lucide-react';
import type { WorkspaceSettings } from '@/domain/types';

export interface TavolaDockProps {
  onOpenQuickAdd: () => void;
  onOpenSearch?: () => void;
  onOpenAskNemo?: () => void;
  settings?: WorkspaceSettings;
}

export const TavolaDock: React.FC<TavolaDockProps> = ({
  onOpenQuickAdd,
  onOpenSearch,
  onOpenAskNemo,
}) => {
  return (
    <aside className="hidden md:flex dock" aria-label="Global Utility Rail">
      {/* 1. Global Quick Search */}
      <button
        type="button"
        onClick={onOpenSearch}
        className="dock__btn text-content-secondary hover:text-content-primary hover:scale-105 active:scale-95 transition-all"
        aria-label="Search workspace"
      >
        <Search className="w-5 h-5 stroke-[2.2]" />
        <span className="dock__tip">Search (Ctrl+K)</span>
      </button>

      {/* 2. Quick Add Button */}
      <button
        type="button"
        onClick={onOpenQuickAdd}
        className="dock__btn text-[#EAA999] hover:bg-[#EAA999]/15 hover:scale-110 active:scale-95 transition-all"
        aria-label="Quick Add"
      >
        <Plus className="w-5 h-5 stroke-[2.8]" />
        <span className="dock__tip">Quick Add</span>
      </button>

      <span className="w-6 h-[1px] bg-border-subtle mx-auto my-0.5" aria-hidden="true" />

      {/* 3. Ask Nemo Assistant */}
      <button
        type="button"
        onClick={onOpenAskNemo}
        className="dock__btn text-accent-mint hover:bg-accent-mint/15 hover:scale-105 active:scale-95 transition-all"
        aria-label="Ask Nemo Assistant"
      >
        <Bot className="w-5 h-5 stroke-[2.2]" />
        <span className="dock__tip">Ask Nemo</span>
      </button>

      <span className="w-6 h-[1px] bg-border-subtle mx-auto my-0.5" aria-hidden="true" />

      {/* 4. Settings Link */}
      <NavLink
        to="/settings"
        className={({ isActive }) =>
          `dock__btn ${isActive ? 'is-active' : 'text-content-secondary hover:text-content-primary'} hover:scale-105 active:scale-95 transition-all`
        }
        aria-label="Settings"
      >
        <Settings className="w-5 h-5" />
        <span className="dock__tip">Settings</span>
      </NavLink>
    </aside>
  );
};
