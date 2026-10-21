import React, { useState, useMemo, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar,
  Trash2,
} from 'lucide-react';
import { db } from '@/db/nemoDb';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PriorityBadge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import {
  getTodayLocalDateString,
  getMonthDaysGrid,
  getWeekDays,
  formatDisplayDate,
} from '@/lib/dates';
import { generateId } from '@/lib/ids';
import type { CalendarEvent, ProjectedCalendarItem } from '@/domain/types';
import { useReducedMotion } from '@/design/useReducedMotion';
import { formatClockTime } from '@/lib/timeFormat';

gsap.registerPlugin(useGSAP);

function calendarEventDate(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value.slice(0, 10)
    : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function calendarEventTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export const CalendarPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { success, error } = useToast();
  const todayStr = getTodayLocalDateString();

  // View mode: month, week, or agenda
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'agenda'>(() => window.matchMedia('(max-width: 767px)').matches ? 'agenda' : 'month');
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const motionRoot = useRef<HTMLDivElement>(null);
  const lastPeriod = useRef<number | null>(null);
  const reduced = useReducedMotion();
  useGSAP(() => {
    const period = currentDate.getTime();
    const previous = lastPeriod.current;
    lastPeriod.current = period;
    if (previous === null || reduced || !motionRoot.current) return;
    const region = motionRoot.current.querySelector<HTMLElement>('.calendar-grid-scroll, .calendar-agenda');
    if (!region) return;
    const direction = period >= previous ? 1 : -1;
    gsap.fromTo(region, { x: 24 * direction, opacity: .35 }, {
      x: 0, opacity: 1, duration: .55, ease: 'power3.out', clearProps: 'transform,opacity',
    });
  }, { scope: motionRoot, dependencies: [currentDate, viewMode, reduced], revertOnUpdate: true });

  // Standalone Event creation modal
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState(todayStr);
  const [eventEndDate, setEventEndDate] = useState(todayStr);
  const [eventStartTime, setEventStartTime] = useState('09:00');
  const [eventEndTime, setEventEndTime] = useState('10:00');
  const [eventIsAllDay, setEventIsAllDay] = useState(true);
  const [eventLocation, setEventLocation] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventToEdit, setEventToEdit] = useState<CalendarEvent | null>(null);
  const [eventToDelete, setEventToDelete] = useState<CalendarEvent | null>(null);
  const openedRouteEvent = useRef<string | null>(null);

  // Live queries for projection
  const tasks = useLiveQuery(() => db.tasks.toArray(), []) || [];
  const assignments = useLiveQuery(() => db.assignments.toArray(), []) || [];
  const milestones = useLiveQuery(() => db.milestones.toArray(), []) || [];
  const events = useLiveQuery(() => db.calendarEvents.toArray(), []) || [];
  const settings = useLiveQuery(() => db.settings.get('default'), []);
  const hourFormat = settings?.hourFormat ?? '24h';

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

    // 2. Assignments & Exams with dueDate
    for (const a of assignments) {
      if (a.dueDate) {
        const isExam =
          a.title.toLowerCase().includes('exam') ||
          a.title.toLowerCase().includes('quiz') ||
          a.description?.includes('[EXAM]');
        const cleanTitle = a.title.replace(/^exam:\s*/i, '').replace(/^\[exam\]\s*/i, '');

        list.push({
          id: `assign_${a.id}`,
          sourceType: 'assignment',
          sourceId: a.id,
          title: isExam ? `Exam: ${cleanTitle}` : `Assignment: ${cleanTitle}`,
          date: a.dueDate,
          time: a.dueTime,
          isAllDay: !a.dueTime,
          status: a.status,
          color: isExam ? '#F28B82' : '#ECD29A',
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
      const start = e.isAllDay ? null : new Date(e.startAt);
      const date = /^\d{4}-\d{2}-\d{2}$/.test(e.startAt)
        ? e.startAt
        : start && !Number.isNaN(start.getTime())
          ? `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`
          : e.startAt.slice(0, 10);
      list.push({
        id: `event_${e.id}`,
        sourceType: 'event',
        sourceId: e.id,
        title: e.title,
        date,
        time: start && !Number.isNaN(start.getTime()) ? formatClockTime(start, hourFormat) : undefined,
        isAllDay: e.isAllDay,
        color: '#EEB2A3',
      });
    }

    return list;
  }, [tasks, assignments, milestones, events, hourFormat]);

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
    } else if (item.sourceType === 'event') {
      const event = events.find((candidate) => candidate.id === item.sourceId);
      if (!event) return;
      setEventToEdit(event);
      setEventTitle(event.title);
      setEventDate(calendarEventDate(event.startAt));
      setEventEndDate(calendarEventDate(event.endAt));
      setEventStartTime(calendarEventTime(event.startAt) || '09:00');
      setEventEndTime(calendarEventTime(event.endAt) || '10:00');
      setEventIsAllDay(event.isAllDay);
      setEventLocation(event.location || '');
      setEventDescription(event.description || '');
      setIsEventModalOpen(true);
    }
  };

  React.useEffect(() => {
    const focusRecord = (location.state as { focusRecord?: { type: string; id: string } } | null)?.focusRecord;
    if (focusRecord?.type !== 'event') {
      openedRouteEvent.current = null;
      return;
    }
    if (openedRouteEvent.current === focusRecord.id) return;
    const event = events.find((candidate) => candidate.id === focusRecord.id);
    if (!event) return;
    openedRouteEvent.current = event.id;
    handleItemClick({ id: `event_${event.id}`, sourceType: 'event', sourceId: event.id, title: event.title, date: calendarEventDate(event.startAt), isAllDay: event.isAllDay });
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, events, navigate]);

  const resetEventForm = () => {
    setEventToEdit(null);
    setEventTitle('');
    setEventDate(todayStr);
    setEventEndDate(todayStr);
    setEventStartTime('09:00');
    setEventEndTime('10:00');
    setEventIsAllDay(true);
    setEventLocation('');
    setEventDescription('');
    setIsEventModalOpen(false);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) {
      error('Title required');
      return;
    }
    const startAt = eventIsAllDay ? eventDate : new Date(`${eventDate}T${eventStartTime}:00`).toISOString();
    const endAt = eventIsAllDay ? eventEndDate : new Date(`${eventEndDate}T${eventEndTime}:00`).toISOString();
    if (new Date(endAt).getTime() < new Date(startAt).getTime()) {
      error('End must be after start');
      return;
    }
    const now = new Date().toISOString();
    const changes = {
      title: eventTitle.trim(),
      description: eventDescription.trim() || undefined,
      location: eventLocation.trim() || undefined,
      startAt,
      endAt,
      isAllDay: eventIsAllDay,
      updatedAt: now,
    };
    if (eventToEdit) {
      await db.calendarEvents.update(eventToEdit.id, changes);
      success('Event updated');
    } else {
      await db.calendarEvents.add({ id: generateId('event'), ...changes, createdAt: now });
      success('Event created');
    }
    resetEventForm();
  };

  const handleDeleteEvent = async () => {
    if (!eventToDelete) return;
    await db.calendarEvents.delete(eventToDelete.id);
    setEventToDelete(null);
    resetEventForm();
    success('Event deleted');
  };

  const todayActual = new Date();
  const todayDisplayString = `Today is ${todayActual.getDate()} ${todayActual.toLocaleString('en-US', { month: 'long' })} ${todayActual.getFullYear()}`;

  const monthsList = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentYearNum = currentDate.getFullYear();
  const currentMonthNum = currentDate.getMonth();

  const yearsRange = useMemo(() => {
    const list: number[] = [];
    const base = new Date().getFullYear();
    for (let y = base - 4; y <= base + 5; y++) {
      list.push(y);
    }
    return list;
  }, []);

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMonth = parseInt(e.target.value, 10);
    setCurrentDate(new Date(currentYearNum, newMonth, 1));
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = parseInt(e.target.value, 10);
    setCurrentDate(new Date(newYear, currentMonthNum, 1));
  };

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
    <div ref={motionRoot} className="calendar-page space-y-6">
      {/* Calendar Controls Bar */}
      <div className="page-toolbar flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl glass-panel relative z-10">
        <div className="calendar-date-controls flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              className="p-1.5 rounded-lg text-content-secondary hover:text-content-primary hover:bg-surface-hover transition-colors cursor-pointer"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 rounded-lg text-content-secondary hover:text-content-primary hover:bg-surface-hover transition-colors cursor-pointer"
              aria-label="Next month"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Month & Year Selectors for instant jumping */}
          <div className="flex items-center gap-1.5">
            <select
              value={currentMonthNum}
              onChange={handleMonthChange}
              className="px-2.5 py-1.5 rounded-xl bg-surface border border-border-subtle text-xs font-bold text-content-primary cursor-pointer hover:border-border-emphasis transition-colors"
              aria-label="Select month"
            >
              {monthsList.map((m, idx) => (
                <option key={m} value={idx}>{m}</option>
              ))}
            </select>

            <select
              value={currentYearNum}
              onChange={handleYearChange}
              className="px-2.5 py-1.5 rounded-xl bg-surface border border-border-subtle text-xs font-bold text-content-primary cursor-pointer hover:border-border-emphasis transition-colors font-mono"
              aria-label="Select year"
            >
              {yearsRange.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleToday}
            className="text-xs font-medium text-content-secondary hover:text-content-primary transition-colors flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-surface-hover cursor-pointer"
            title="Jump to today"
          >
            <Calendar className="w-3.5 h-3.5 text-content-tertiary" />
            <span>{todayDisplayString}</span>
          </button>
        </div>

        <div className="calendar-view-controls flex items-center gap-2 self-end sm:self-center">
          {/* View Mode Toggle */}
          <div className="flex p-1 rounded-xl bg-surface-muted/60 border border-border-subtle">
            {(['month', 'week', 'agenda'] as const).map((m) => (
              <button
                key={m}
                aria-pressed={viewMode === m}
                onClick={() => setViewMode(m)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition-all ${
                  viewMode === m
                    ? 'bg-accent-mint/15 text-accent-mint shadow-sm border border-accent-mint/35 font-bold'
                    : 'text-content-tertiary hover:text-content-primary'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <Button size="sm" onClick={() => { resetEventForm(); setIsEventModalOpen(true); }} className="gap-1.5">
            <Plus className="w-4 h-4" />
            <span>Event</span>
          </Button>
        </div>
      </div>

      {/* Month View Grid */}
      {viewMode === 'month' && (
        <div className="calendar-grid-scroll rounded-2xl glass-panel relative shadow-sm" tabIndex={0} role="region" aria-label="Month calendar, scroll horizontally on small screens">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-border-subtle bg-surface-muted/30 text-center py-2.5 text-xs font-semibold text-content-secondary">
            {weekdayNames.map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          {/* 42-day cells grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-border-subtle">
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
                    !isCurrentMonth ? 'bg-surface-muted/20 opacity-40' : 'bg-transparent hover:bg-surface-muted/20'
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
                        className="calendar-event-chip w-full text-left px-2 py-0.5 rounded-md text-[10px] font-semibold truncate flex items-center gap-1 transition-all hover:scale-[1.02]"
                        style={{
                          backgroundColor: `${item.color}20`,
                          borderLeft: `3px solid ${item.color}`,
                          color: 'var(--text-primary)',
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
        <div className="calendar-agenda space-y-4 max-w-3xl mx-auto">
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
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleItemClick(item); } }}
                  className="calendar-agenda-row w-full text-left flex items-center justify-between gap-3 p-4 rounded-xl bg-surface border border-border-subtle hover:border-border-emphasis transition-all cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring"
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
      <Modal isOpen={isEventModalOpen} onClose={resetEventForm} title={eventToEdit ? 'Edit Calendar Event' : 'New Calendar Event'}>
        <form onSubmit={handleSaveEvent} className="space-y-4">
          <Input
            label="Event Title"
            placeholder="e.g. Project Demo Review"
            value={eventTitle}
            onChange={(e) => setEventTitle(e.target.value)}
            required
            autoFocus
          />

          <label className="flex items-center gap-2 text-xs font-medium text-content-secondary">
            <input type="checkbox" checked={eventIsAllDay} onChange={(e) => setEventIsAllDay(e.target.checked)} className="rounded border-border-subtle text-accent-mint focus:ring-accent-ring" />
            All-day event
          </label>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Starts"
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              required
            />
            {!eventIsAllDay && <Input label="Start time" type="time" value={eventStartTime} onChange={(e) => setEventStartTime(e.target.value)} required />}
            <Input label="Ends" type="date" value={eventEndDate} onChange={(e) => setEventEndDate(e.target.value)} required />
            {!eventIsAllDay && <Input label="End time" type="time" value={eventEndTime} onChange={(e) => setEventEndTime(e.target.value)} required />}
          </div>

          <Input label="Location (Optional)" placeholder="e.g. Zoom / Meeting Room B" value={eventLocation} onChange={(e) => setEventLocation(e.target.value)} />

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
            {eventToEdit && <Button type="button" variant="danger" onClick={() => setEventToDelete(eventToEdit)}><Trash2 className="w-4 h-4" /> Delete</Button>}
            <Button type="submit">{eventToEdit ? 'Save Event' : 'Create Event'}</Button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog
        isOpen={Boolean(eventToDelete)}
        onClose={() => setEventToDelete(null)}
        onConfirm={handleDeleteEvent}
        title="Delete calendar event?"
        description={`“${eventToDelete?.title || 'This event'}” will be removed from this workspace.`}
        confirmLabel="Delete event"
      />
    </div>
  );
};
