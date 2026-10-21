import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  CheckSquare,
  FolderGit2,
  GraduationCap,
  Target,
  Flag,
  ArrowRight,
  CalendarDays,
} from 'lucide-react';
import { db } from '@/db/nemoDb';
import { formatDisplayDate } from '@/lib/dates';

interface SearchResultItem {
  id: string;
  type: 'task' | 'project' | 'assignment' | 'goal' | 'milestone' | 'event';
  title: string;
  subtitle?: string;
  badge?: string;
  route: string;
  focusRecord?: { type: string; id: string };
}

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickSearchModal: React.FC<QuickSearchModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const focusFrame = useRef<number | null>(null);

  function openResult(item: SearchResultItem) {
    navigate(item.route, { state: item.focusRecord ? { focusRecord: item.focusRecord } : null });
    onClose();
  }

  useEffect(() => {
    if (isOpen) {
      previouslyFocused.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      focusFrame.current = window.requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      previouslyFocused.current?.focus();
    }
    return () => {
      if (focusFrame.current !== null) window.cancelAnimationFrame(focusFrame.current);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (results.length > 0 ? (prev + 1) % results.length : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (results.length > 0 ? (prev - 1 + results.length) % results.length : 0));
      } else if (e.key === 'Enter') {
        if (results[selectedIndex]) {
          e.preventDefault();
          openResult(results[selectedIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, navigate, onClose]);

  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      setResults([]);
      return;
    }

    let active = true;

    async function searchAll() {
      const [tasks, projects, assignments, goals, milestones, events] = await Promise.all([
        db.tasks.toArray(),
        db.projects.toArray(),
        db.assignments.toArray(),
        db.goals.toArray(),
        db.milestones.toArray(),
        db.calendarEvents.toArray(),
      ]);

      if (!active) return;

      const items: SearchResultItem[] = [];

      // 1. Projects
      for (const p of projects) {
        if (p.title.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q))) {
          items.push({
            id: p.id,
            type: 'project',
            title: p.title,
            subtitle: p.dueDate ? `Due ${formatDisplayDate(p.dueDate)}` : p.category,
            badge: p.status.replace('_', ' '),
            route: `/projects/${p.id}`,
            focusRecord: { type: 'project', id: p.id },
          });
        }
      }

      // 2. Tasks
      for (const t of tasks) {
        if (t.title.toLowerCase().includes(q) || (t.notes && t.notes.toLowerCase().includes(q))) {
          items.push({
            id: t.id,
            type: 'task',
            title: t.title,
            subtitle: t.dueDate ? `Due ${formatDisplayDate(t.dueDate)}` : undefined,
            badge: t.priority.toUpperCase(),
            route: '/tasks',
            focusRecord: { type: 'task', id: t.id },
          });
        }
      }

      // 3. Assignments
      for (const a of assignments) {
        if (a.title.toLowerCase().includes(q) || (a.description && a.description.toLowerCase().includes(q))) {
          items.push({
            id: a.id,
            type: 'assignment',
            title: a.title,
            subtitle: a.dueDate ? `Due ${formatDisplayDate(a.dueDate)}` : undefined,
            badge: a.status.replace('_', ' '),
            route: '/academics',
            focusRecord: { type: 'assignment', id: a.id },
          });
        }
      }

      // 4. Goals
      for (const g of goals) {
        if (g.title.toLowerCase().includes(q) || (g.why && g.why.toLowerCase().includes(q))) {
          items.push({
            id: g.id,
            type: 'goal',
            title: g.title,
            subtitle: g.category,
            badge: g.status.toUpperCase(),
            route: `/goals/${g.id}`,
            focusRecord: { type: 'goal', id: g.id },
          });
        }
      }

      // 5. Milestones
      for (const m of milestones) {
        if (m.title.toLowerCase().includes(q)) {
          items.push({
            id: m.id,
            type: 'milestone',
            title: m.title,
            subtitle: m.targetDate ? `Target ${formatDisplayDate(m.targetDate)}` : undefined,
            badge: m.ownerType.toUpperCase(),
            route: `/${m.ownerType === 'goal' ? 'goals' : 'projects'}/${m.ownerId}`,
            focusRecord: { type: 'milestone', id: m.id },
          });
        }
      }

      // 6. Standalone calendar events
      for (const event of events) {
        if (event.title.toLowerCase().includes(q) || event.description?.toLowerCase().includes(q) || event.location?.toLowerCase().includes(q)) {
          items.push({
            id: event.id,
            type: 'event',
            title: event.title,
            subtitle: event.location || event.startAt.slice(0, 10),
            badge: 'EVENT',
            route: '/calendar',
            focusRecord: { type: 'event', id: event.id },
          });
        }
      }

      setResults(items.slice(0, 15));
      setSelectedIndex(0);
    }

    void searchAll();

    return () => {
      active = false;
    };
  }, [query]);

  if (!isOpen) return null;

  const getTypeIcon = (type: SearchResultItem['type']) => {
    switch (type) {
      case 'project':
        return <FolderGit2 className="w-4 h-4 text-accent-amber" />;
      case 'task':
        return <CheckSquare className="w-4 h-4 text-accent-mint" />;
      case 'assignment':
        return <GraduationCap className="w-4 h-4 text-accent-ember" />;
      case 'goal':
        return <Target className="w-4 h-4 text-emerald-400" />;
      case 'milestone':
        return <Flag className="w-4 h-4 text-indigo-400" />;
      case 'event':
        return <CalendarDays className="w-4 h-4 text-accent-ember" />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Quick Search"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Palette Panel */}
      <div className="relative w-full max-w-lg bg-[#0E1729] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 border-b border-white/10 bg-[#132038]">
          <Search className="w-5 h-5 text-content-tertiary flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks, projects, coursework, goals..."
            className="w-full bg-transparent border-0 px-3 py-3.5 text-sm text-white placeholder-content-tertiary focus:outline-none focus:ring-0"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 text-content-tertiary hover:text-white rounded"
              aria-label="Clear search query"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-content-tertiary ml-2">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {query.trim() === '' ? (
            <div className="p-8 text-center text-content-tertiary text-xs">
              <p>Type to search across your local records.</p>
              <p className="mt-1 text-[11px] text-content-tertiary/70">
                Supports tasks, projects, assignments, goals, and milestones.
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-content-tertiary text-xs">
              No results found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            results.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={`${item.type}-${item.id}`}
                  type="button"
                  onClick={() => openResult(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all ${
                    isSelected
                      ? 'bg-accent-mint/15 text-white border border-accent-mint/30'
                      : 'hover:bg-white/[0.04] text-content-secondary border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div className="p-2 rounded-lg bg-white/[0.05] flex-shrink-0">
                      {getTypeIcon(item.type)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-xs text-white truncate">{item.title}</p>
                      {item.subtitle && (
                        <p className="text-[11px] text-content-tertiary truncate">{item.subtitle}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {item.badge && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-content-tertiary">
                        {item.badge}
                      </span>
                    )}
                    <ArrowRight className="w-3.5 h-3.5 text-content-tertiary opacity-0 group-hover:opacity-100" />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 border-t border-white/[0.06] bg-[#0A1222]/60 flex items-center justify-between text-[11px] text-content-tertiary">
          <span>Navigate with &uarr; &darr;</span>
          <span>Select with Enter</span>
        </div>
      </div>
    </div>
  );
};
