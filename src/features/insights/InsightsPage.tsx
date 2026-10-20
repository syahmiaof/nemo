import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { BarChart3, Calendar, CheckCircle2, Clock, AlertTriangle, BookOpen } from 'lucide-react';
import { db } from '@/db/nemoDb';
import { isOverdue, getYearFromDate } from '@/lib/dates';
import { EmptyState } from '@/components/ui/EmptyState';

export const InsightsPage: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  const projects = useLiveQuery(() => db.projects.toArray(), []) || [];
  const tasks = useLiveQuery(() => db.tasks.toArray(), []) || [];
  const assignments = useLiveQuery(() => db.assignments.toArray(), []) || [];

  // Available years from project history
  const availableYears = useMemo(() => {
    const years = new Set<number>([currentYear]);
    for (const p of projects) {
      const createdYear = getYearFromDate(p.createdAt);
      if (createdYear) years.add(createdYear);
      const completedYear = getYearFromDate(p.completedAt);
      if (completedYear) years.add(completedYear);
    }
    return Array.from(years).sort((a, b) => b - a);
  }, [projects, currentYear]);

  // Project statistics for selected year
  const allTimeProjectsCount = projects.length;
  const activeProjectsCount = projects.filter((p) => p.status === 'in_progress' && !p.archivedAt).length;

  const createdInSelectedYear = projects.filter((p) => getYearFromDate(p.createdAt) === selectedYear).length;
  const completedInSelectedYear = projects.filter((p) => getYearFromDate(p.completedAt) === selectedYear).length;

  // Monthly breakdown of completed projects in selected year (Invariant 5)
  const monthlyCompletedProjects = useMemo(() => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    const counts = new Array(12).fill(0);

    for (const p of projects) {
      if (p.completedAt && getYearFromDate(p.completedAt) === selectedYear) {
        const monthIndex = new Date(p.completedAt).getMonth();
        if (monthIndex >= 0 && monthIndex < 12) {
          counts[monthIndex]++;
        }
      }
    }

    return months.map((month, idx) => ({
      month,
      count: counts[idx],
    }));
  }, [projects, selectedYear]);

  const maxMonthlyCount = Math.max(...monthlyCompletedProjects.map((m) => m.count), 1);

  // Tasks distribution
  const openTasks = tasks.filter((t) => t.status !== 'done');
  const completedTasks = tasks.filter((t) => t.status === 'done');
  const overdueTasks = tasks.filter((t) => t.dueDate && isOverdue(t.dueDate) && t.status !== 'done');
  const taskCompletionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  // Academics summary
  const totalAssignments = assignments.length;
  const submittedAssignments = assignments.filter((a) => a.status === 'submitted' || a.status === 'graded').length;
  const gradedAssignments = assignments.filter((a) => a.status === 'graded').length;

  const hasData = projects.length > 0 || tasks.length > 0 || assignments.length > 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Header & Year Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl glass-panel relative z-10">
        <div className="flex items-center gap-3 relative z-10">
          <div className="p-3 rounded-xl bg-white/[0.06] border border-white/10 text-accent-mint">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-content-primary">Local Workspace Insights</h2>
            <p className="text-xs text-content-secondary">
              Derived entirely from real local data. No simulated metrics, no cloud tracking.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center relative z-10">
          <Calendar className="w-4 h-4 text-content-tertiary" />
          <span className="text-xs text-content-secondary font-medium">Reporting Year:</span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
            className="px-3 py-1.5 rounded-xl bg-white/[0.06] border border-white/10 text-xs font-mono font-bold text-content-primary cursor-pointer"
          >
            {availableYears.map((yr) => (
              <option key={yr} value={yr} className="bg-[#0b101e] text-white">
                {yr}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!hasData ? (
        <EmptyState
          icon={BarChart3}
          title="No insights data available yet"
          description="As you create projects, complete tasks, and submit academic assignments, accurate reports will appear here automatically."
        />
      ) : (
        <>
          {/* Projects Core Numbers */}
          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-content-tertiary mb-3">
              Projects Velocity ({selectedYear})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl glass-panel relative">
                <p className="text-xs text-content-tertiary font-medium">All-Time Projects</p>
                <p className="text-3xl font-bold text-content-primary mt-1">{allTimeProjectsCount}</p>
                <p className="text-[11px] text-content-tertiary mt-1">Across all years</p>
              </div>

              <div className="p-5 rounded-2xl glass-panel relative">
                <p className="text-xs text-content-tertiary font-medium">Active Now</p>
                <p className="text-3xl font-bold text-accent-mint mt-1">{activeProjectsCount}</p>
                <p className="text-[11px] text-content-tertiary mt-1">Currently in progress</p>
              </div>

              <div className="p-5 rounded-2xl glass-panel relative">
                <p className="text-xs text-content-tertiary font-medium">Created in {selectedYear}</p>
                <p className="text-3xl font-bold text-content-primary mt-1">{createdInSelectedYear}</p>
                <p className="text-[11px] text-content-tertiary mt-1">Initiatives started</p>
              </div>

              <div className="p-5 rounded-2xl glass-panel relative">
                <p className="text-xs text-content-tertiary font-medium">Completed in {selectedYear}</p>
                <p className="text-3xl font-bold text-accent-mint mt-1">{completedInSelectedYear}</p>
                <p className="text-[11px] text-content-tertiary mt-1">Based on actual completedAt</p>
              </div>
            </div>
          </div>

          {/* Monthly Completed Projects Chart */}
          <div className="p-6 rounded-2xl glass-panel relative space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div>
                <h3 className="text-sm font-bold text-content-primary">
                  Monthly Completed Projects ({selectedYear})
                </h3>
                <p className="text-xs text-content-tertiary mt-0.5">
                  Grouped by verified completion date timestamp
                </p>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-white/[0.06] border border-white/10 text-accent-mint">
                Total: {completedInSelectedYear}
              </span>
            </div>

            {completedInSelectedYear === 0 ? (
              <div className="py-12 text-center text-xs text-content-tertiary">
                No projects were marked as completed in {selectedYear}.
              </div>
            ) : (
              <div className="pt-6 pb-2">
                <div className="flex items-end justify-between gap-2 h-44 border-b border-border-subtle px-2">
                  {monthlyCompletedProjects.map((m) => {
                    const heightPercent = m.count > 0 ? Math.round((m.count / maxMonthlyCount) * 100) : 4;
                    return (
                      <div key={m.month} className="flex-1 flex flex-col items-center gap-2 group">
                        <span className="text-[10px] font-mono text-content-tertiary group-hover:text-accent-mint transition-colors">
                          {m.count > 0 ? m.count : ''}
                        </span>
                        <div
                          className="w-full max-w-[32px] rounded-t-md transition-all duration-300"
                          style={{
                            height: `${heightPercent}%`,
                            backgroundColor: m.count > 0 ? 'var(--accent-mint)' : 'var(--border-subtle)',
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
                {/* Month labels */}
                <div className="flex justify-between gap-2 px-2 pt-2">
                  {monthlyCompletedProjects.map((m) => (
                    <span key={m.month} className="flex-1 text-center text-[10px] font-mono text-content-tertiary">
                      {m.month}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Tasks & Academics Summary Grids */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tasks Distribution */}
            <div className="p-6 rounded-2xl glass-panel relative space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <h3 className="text-sm font-bold text-content-primary">Tasks Distribution</h3>
                <span className="text-xs font-mono text-content-secondary">
                  {taskCompletionRate}% Finished
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className="flex items-center gap-2.5 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-accent-mint" />
                    <span>Completed Tasks</span>
                  </div>
                  <span className="font-mono font-bold text-content-primary">{completedTasks.length}</span>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className="flex items-center gap-2.5 text-xs">
                    <Clock className="w-4 h-4 text-accent-amber" />
                    <span>Open / Pending Tasks</span>
                  </div>
                  <span className="font-mono font-bold text-content-primary">{openTasks.length}</span>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className="flex items-center gap-2.5 text-xs">
                    <AlertTriangle className="w-4 h-4 text-accent-ember" />
                    <span>Overdue Tasks</span>
                  </div>
                  <span className={`font-mono font-bold ${overdueTasks.length > 0 ? 'text-accent-ember' : 'text-content-primary'}`}>
                    {overdueTasks.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Academics Progress */}
            <div className="p-6 rounded-2xl glass-panel relative space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <h3 className="text-sm font-bold text-content-primary">Coursework Submissions</h3>
                <span className="text-xs font-mono text-content-secondary">
                  {totalAssignments > 0 ? Math.round((submittedAssignments / totalAssignments) * 100) : 0}% Submitted
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className="flex items-center gap-2.5 text-xs">
                    <BookOpen className="w-4 h-4 text-accent-mint" />
                    <span>Submitted Assignments</span>
                  </div>
                  <span className="font-mono font-bold text-content-primary">{submittedAssignments}</span>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className="flex items-center gap-2.5 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-accent-mint" />
                    <span>Graded Coursework</span>
                  </div>
                  <span className="font-mono font-bold text-content-primary">{gradedAssignments}</span>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className="flex items-center gap-2.5 text-xs">
                    <Clock className="w-4 h-4 text-accent-amber" />
                    <span>Pending Deadlines</span>
                  </div>
                  <span className="font-mono font-bold text-content-primary">
                    {totalAssignments - submittedAssignments}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
