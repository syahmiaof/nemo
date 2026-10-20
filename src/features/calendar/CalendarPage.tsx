import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { db } from '@/db/nemoDb';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { PriorityBadge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import {
  getTodayLocalDateString,
  getMonthDaysGrid,
  getWeekDays,
  formatDisplayDate,
} from '@/lib/dates';
import { generateId } from '@/lib/ids';
import type { ProjectedCalendarItem } from '@/domain/types';

export const CalendarPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const todayStr = getTodayLocalDateString();

  // View mode: month, week, or agenda
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'agenda'>(() => window.matchMedia('(max-width: 767px)').matches ? 'agenda' : 'month');
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());

  // Standalone Event creation modal
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState(todayStr);
  const [eventLocation, setEventLocation] = useState('');
  const [eventDescription, setEventDescription] = useState('');

  // Live queries for projection
  const tasks = useLiveQuery(() => db.tasks.toArray(), []) || [];
  const assignments = useLiveQuery(() => db.assignments.toArray(), []) || [];
  const milestones = useLiveQuery(() => db.milestones.toArray(), []) || [];
  const events = useLiveQuery(() => db.calendarEvents.toArray(), []) || [];
  const settings = useLiveQuery(() => db.settings.get('default'), []);

  const weekStartsOn = settings?.weekStartsOn ?? 1;

  // Build Unified Calendar Projections dynamically (Invariant 2)
  const projectedItems: ProjectedCalendarItem[] = useMemo(() => {
    const list: ProjectedCalendarItem[] = [];

    // 1. Tasks with dueDate
    for (const t of tasks) {
      if (t.dueDate) {
        list.push({
          id: `task_${t.id}`,
          sourceType: 'task',
          sourceId: t.id,
          title: t.title,
          date: t.dueDate,
          time: t.dueTime,
          isAllDay: !t.dueTime,
          status: t.status,
          priority: t.priority,
          color: '#A8DCC8',
        });
      }
    }

    // 2. Assignments with dueDate
    for (const a of assignments) {
      if (a.dueDate) {
        list.push({
          id: `assign_${a.id}`,
          sourceType: 'assignment',
          sourceId: a.id,
          title: `Assignment: ${a.title}`,
          date: a.dueDate,
          time: a.dueTime,
          isAllDay: !a.dueTime,
          status: a.status,
          color: '#ECD29A',
        });
      }
    }

    // 3. Milestones with targetDate
    for (const m of milestones) {
      if (m.targetDate) {
        list.push({
          id: `milestone_${m.id}`,
          sourceType: 'milestone',
          sourceId: m.id,
          title: `Milestone: ${m.title}`,
          date: m.targetDate,
          isAllDay: true,
          status: m.completedAt ? 'done' : 'todo',
          color: '#9AC5EC',
        });
      }
    }

    // 4. Standalone Calendar Events
    for (const e of events) {
      const date = e.startAt.slice(0, 10);
      list.push({
        id: `event_${e.id}`,
        sourceType: 'event',
        sourceId: e.id,
        title: e.title,
        date,
        isAllDay: e.isAllDay,
        color: '#EEB2A3',
      });
    }

    return list;
  }, [tasks, assignments, milestones, events]);

  // Index projected items by date in a single pass O(N) for instant O(1) cell lookups
  const itemsByDate = useMemo(() => {
    const map = new Map<string, ProjectedCalendarItem[]>();
    for (let i = 0; i < projectedItems.length; i++) {
      const item = projectedItems[i];
      const arr = map.get(item.date);
      if (arr) arr.push(item);
      else map.set(item.date, [item]);
    }
    return map;
  }, [projectedItems]);

  // Navigation handlers
  const handlePrev = () => {
    const d = new Date(currentDate);
    if (viewMode === 'week') d.setDate(d.getDate() - 7);
    else { d.setDate(1); d.setMonth(d.getMonth() - 1); }
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (viewMode === 'week') d.setDate(d.getDate() + 7);
    else { d.setDate(1); d.setMonth(d.getMonth() + 1); }
    setCurrentDate(d);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Click on a projected item opens its canonical source
  const handleItemClick = (item: ProjectedCalendarItem) => {
    if (item.sourceType === 'task') {
      navigate('/tasks');
    } else if (item.sourceType === 'assignment') {
      navigate('/academics');
    } else if (item.sourceType === 'milestone') {
      navigate('/projects');
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) {
      error('Title required');
      return;
    }
    const now = new Date().toISOString();
    await db.calendarEvents.add({
      id: generateId('event'),
      title: eventTitle.trim(),
      description: eventDescription.trim() || undefined,
      location: eventLocation.trim() || undefined,
      startAt: eventDate,
      endAt: eventDate,
      isAllDay: true,
      createdAt: now,
      updatedAt: now,
    });
    setEventTitle('');
    setEventLocation('');
    setEventDescription('');
    setIsEventModalOpen(false);
    success('Event created');
  };

  const monthYearLabel = currentDate.toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  // Days for month grid
  const monthDays = useMemo(() => {
    return getMonthDaysGrid(currentDate.getFullYear(), currentDate.getMonth(), weekStartsOn);
  }, [currentDate, weekStartsOn]);

  // Days for week grid
  const weekDays = useMemo(() => {
    return getWeekDays(currentDate, weekStartsOn);
  }, [currentDate, weekStartsOn]);

  const weekdayNames = weekStartsOn === 1 ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="calendar-page space-y-6">
      {/* Calendar Controls Bar */}
      <div className="page-toolbar flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl glass-panel relative z-10">
        <div className="calendar-date-controls flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              className="p-1.5 rounded-lg text-content-secondary hover:text-content-primary hover:bg-white/[0.08] transition-colors"
              aria-label="Previous"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 rounded-lg text-content-secondary hover:text-content-primary hover:bg-white/[0.08] transition-colors"
              aria-label="Next"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <h2 className="text-base font-bold text-content-primary min-w-[140px] tracking-tight">{monthYearLabel}</h2>

          <Button size="sm" variant="ghost" onClick={handleToday} className="text-xs">
            Today
          </Button>
        </div>

        <div className="calendar-view-controls flex items-center gap-2 self-end sm:self-center">
          {/* View Mode Toggle */}
          <div className="flex p-1 rounded-xl bg-white/[0.04] border border-white/10">
            {(['month', 'week', 'agenda'] as const).map((m) => (
              <button
                key={m}
                aria-pressed={viewMode === m}
                onClick={() => setViewMode(m)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition-all ${
                  viewMode === m
                    ? 'bg-white/[0.12] text-white shadow-sm border border-white/15'
                    : 'text-content-tertiary hover:text-white'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <Button size="sm" onClick={() => setIsEventModalOpen(true)} className="gap-1.5">
            <Plus className="w-4 h-4" />
            <span>Event</span>
          </Button>
        </div>
      </div>

      {/* Month View Grid */}
      {viewMode === 'month' && (
        <div className="calendar-grid-scroll rounded-2xl glass-panel relative shadow-sm" tabIndex={0} role="region" aria-label="Month calendar, scroll horizontally on small screens">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-white/[0.08] bg-white/[0.02] text-center py-2.5 text-xs font-semibold text-content-secondary">
            {weekdayNames.map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          {/* 42-day cells grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-white/[0.06]">
            {monthDays.map((dayDate, idx) => {
              const year = dayDate.getFullYear();
              const month = String(dayDate.getMonth() + 1).padStart(2, '0');
              const day = String(dayDate.getDate()).padStart(2, '0');
              const dateKey = `${year}-${month}-${day}`;

              const isCurrentMonth = dayDate.getMonth() === currentDate.getMonth();
              const isTodayCell = dateKey === todayStr;
              const itemsForDay = itemsByDate.get(dateKey) || [];

              return (
                <div
                  key={idx}
                  className={`min-h-[110px] p-2.5 flex flex-col justify-between transition-colors ${
                    !isCurrentMonth ? 'bg-white/[0.01] opacity-35' : 'bg-transparent hover:bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-mono font-semibold w-6 h-6 flex items-center justify-center rounded-full ${
                        isTodayCell
                          ? 'bg-accent-mint text-[#080d19] font-bold shadow-md'
                          : 'text-content-secondary'
                      }`}
                    >
                      {dayDate.getDate()}
                    </span>
                  </div>

                  {/* Day Events / Deadlines List */}
                  <div className="space-y-1 flex-1 overflow-y-auto max-h-20">
                    {itemsForDay.slice(0, 3).map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleItemClick(item)}
                        className="w-full text-left px-2 py-0.5 rounded-md text-[10px] font-medium truncate flex items-center gap-1 transition-all hover:scale-[1.02]"
                        style={{
                          backgroundColor: `${item.color}20`,
                          borderLeft: `3px solid ${item.color}`,
                          color: '#FFFFFF',
                        }}
                        title={`${item.title} (${item.sourceType})`}
                      >
                        <span className="truncate">{item.title}</span>
                      </button>
                    ))}
                    {itemsForDay.length > 3 && (
                      <span className="text-[9px] font-mono text-content-tertiary block px-1">
                        +{itemsForDay.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Week View Grid */}
      {viewMode === 'week' && (
        <div className="calendar-grid-scroll rounded-2xl border border-border-subtle bg-surface shadow-sm" tabIndex={0} role="region" aria-label="Week calendar, scroll horizontally on small screens">
          <div className="grid grid-cols-7 border-b border-border-subtle bg-surface-hover/50 text-center py-2 text-xs font-semibold text-content-secondary">
            {weekDays.map((d, i) => (
              <div key={i}>
                <span>{weekdayNames[i]} </span>
                <span className="font-mono">{d.getDate()}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 divide-x divide-border-subtle min-h-[360px]">
            {weekDays.map((dayDate, idx) => {
              const year = dayDate.getFullYear();
              const month = String(dayDate.getMonth() + 1).padStart(2, '0');
              const day = String(dayDate.getDate()).padStart(2, '0');
              const dateKey = `${year}-${month}-${day}`;
              const isTodayCell = dateKey === todayStr;
              const itemsForDay = itemsByDate.get(dateKey) || [];

              return (
                <div key={idx} className="p-2 space-y-2">
                  <div className="text-center pb-2 border-b border-border-subtle">
                    <span
                      className={`text-xs font-mono font-semibold px-2 py-0.5 rounded-full ${
                        isTodayCell ? 'bg-accent-mint text-canvas' : 'text-content-secondary'
                      }`}
                    >
                      {formatDisplayDate(dateKey)}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {itemsForDay.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleItemClick(item)}
                        className="w-full text-left p-2 rounded-lg text-xs font-medium space-y-1 border transition-all"
                        style={{
                          backgroundColor: `${item.color}15`,
                          borderColor: `${item.color}40`,
                        }}
                      >
                        <p className="font-semibold text-content-primary line-clamp-2">{item.title}</p>
                        <p className="text-[10px] text-content-tertiary font-mono capitalize">
                          {item.sourceType} {item.time ? `• ${item.time}` : ''}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Agenda View */}
      {viewMode === 'agenda' && (
        <div className="space-y-4 max-w-3xl mx-auto">
          {projectedItems.filter(item => item.date.startsWith(`${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`)).length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-surface border border-border-subtle text-content-secondary">
              No projected deadlines or events scheduled.
            </div>
          ) : (
            projectedItems
              .filter(item => item.date.startsWith(`${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`))
              .sort((a, b) => a.date.localeCompare(b.date))
              .map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  role={item.sourceType === 'event' ? undefined : 'button'}
                  tabIndex={item.sourceType === 'event' ? undefined : 0}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleItemClick(item); } }}
                  className="calendar-agenda-row flex items-center justify-between gap-3 p-4 rounded-xl bg-surface border border-border-subtle hover:border-border-emphasis transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-10 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <div>
                      <h4 className="text-sm font-semibold text-content-primary group-hover:text-accent-mint transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-xs text-content-tertiary font-mono mt-0.5">
                        {formatDisplayDate(item.date)} {item.time ? `at ${item.time}` : ''} •{' '}
                        <span className="capitalize">{item.sourceType}</span>
                      </p>
                    </div>
                  </div>

                  {item.priority && <PriorityBadge priority={item.priority} size="sm" />}
                </div>
              ))
          )}
        </div>
      )}

      {/* Standalone Event Creation Modal */}
      <Modal isOpen={isEventModalOpen} onClose={() => setIsEventModalOpen(false)} title="New Calendar Event">
        <form onSubmit={handleCreateEvent} className="space-y-4">
          <Input
            label="Event Title"
            placeholder="e.g. Project Demo Review"
            value={eventTitle}
            onChange={(e) => setEventTitle(e.target.value)}
            required
            autoFocus
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Date"
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              required
            />
            <Input
              label="Location (Optional)"
              placeholder="e.g. Zoom / Meeting Room B"
              value={eventLocation}
              onChange={(e) => setEventLocation(e.target.value)}
            />
          </div>

          <Textarea
            label="Description"
            placeholder="Event details or agenda..."
            value={eventDescription}
            onChange={(e) => setEventDescription(e.target.value)}
            rows={3}
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-border-subtle">
            <Button type="button" variant="ghost" onClick={() => setIsEventModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Event</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
