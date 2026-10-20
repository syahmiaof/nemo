import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { BarChart3, FolderKanban, CheckCircle2, BookOpen, ArrowUpRight } from 'lucide-react';
import { db } from '@/db/nemoDb';
import { isOverdue } from '@/lib/dates';
import { monthlyCounts } from '@/domain/chart';
import { TavolaSplineChart } from '@/components/ui/TavolaSplineChart';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const InsightsPage: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [series, setSeries] = useState<'tasks' | 'projects'>('tasks');
  const data = useLiveQuery(async () => {
    const [projects, tasks, assignments] = await Promise.all([
      db.projects.toArray(), db.tasks.toArray(), db.assignments.toArray(),
    ]);
    return { projects, tasks, assignments };
  }, []);
  const projects = data?.projects ?? [];
  const tasks = data?.tasks ?? [];
  const assignments = data?.assignments ?? [];
  const years = new Set([currentYear, selectedYear]);
  for (const item of [...projects, ...tasks]) {
    for (const timestamp of [item.createdAt, item.completedAt]) {
      if (timestamp) {
        const year = new Date(timestamp).getFullYear();
        if (Number.isFinite(year)) years.add(year);
      }
    }
  }
  const dates = (series === 'tasks' ? tasks : projects).map((item) => item.completedAt);
  const values = monthlyCounts(dates, selectedYear);
  const comparison = monthlyCounts(dates, selectedYear - 1);
  const total = values.reduce((sum, value) => sum + value, 0);
  const previousTotal = comparison.reduce((sum, value) => sum + value, 0);
  const difference = total - previousTotal;
  const bestMonth = values.indexOf(Math.max(...values));
  const activeProjects = projects.filter((project) => project.status === 'in_progress' && !project.archivedAt).length;
  const createdInYear = monthlyCounts(projects.map((project) => project.createdAt), selectedYear).reduce((sum, value) => sum + value, 0);
  const done = tasks.filter((task) => task.status === 'done').length;
  const inProgress = tasks.filter((task) => task.status === 'in_progress').length;
  const toDo = tasks.length - done - inProgress;
  const overdue = tasks.filter((task) => task.status !== 'done' && isOverdue(task.dueDate)).length;
  const completionRate = tasks.length ? Math.round(done / tasks.length * 100) : 0;
  const doneAngle = tasks.length ? done / tasks.length * 360 : 0;
  const progressAngle = tasks.length ? inProgress / tasks.length * 360 : 0;
  const submitted = assignments.filter((assignment) => assignment.status === 'submitted' || assignment.status === 'graded').length;
  const graded = assignments.filter((assignment) => assignment.status === 'graded').length;

  return (
    <div className="insights-page">
      <header className="insights-header">
        <h1>Workspace<br />Insights</h1>
        <div className="insights-head-stat"><span className="insights-stat-icon"><FolderKanban size={22} /></span><div><strong>{projects.length}</strong><span>All-time projects</span></div></div>
        <div className="insights-head-stat"><span className="insights-stat-icon"><BarChart3 size={22} /></span><div><strong>{activeProjects}</strong><span>Active right now</span></div></div>
        <div className="insights-head-stat"><span className="insights-stat-icon"><CheckCircle2 size={22} /></span><div><strong>{done}</strong><span>Tasks completed</span></div></div>
        <label className="insights-year"><span className="sr-only">Reporting year</span><select value={selectedYear} onChange={(event) => setSelectedYear(Number(event.target.value))}>{[...years].sort((a, b) => b - a).map((year) => <option key={year}>{year}</option>)}</select></label>
      </header>

      <div className="insights-layout">
        <section className="glass-panel insights-analysis" aria-labelledby="completion-title" aria-busy={!data}>
          <div className="insights-panel-heading">
            <h2 id="completion-title">Completion rhythm</h2>
            <div className="insights-segments" aria-label="Chart measure">
              <button type="button" aria-pressed={series === 'tasks'} onClick={() => setSeries('tasks')}>Tasks</button>
              <button type="button" aria-pressed={series === 'projects'} onClick={() => setSeries('projects')}>Projects</button>
            </div>
          </div>
          <div className="insights-analysis-summary">
            <div className="insights-total"><strong>{total}</strong><span>{series} completed in {selectedYear}</span></div>
            <span className={`insights-change ${difference < 0 ? 'is-negative' : ''}`}>{difference > 0 ? '+' : ''}{difference} vs {selectedYear - 1}</span>
            <div className="insights-mini-stat"><span>Best month</span><strong>{total ? MONTHS[bestMonth] : '—'}</strong><small>{total ? `${values[bestMonth]} completed` : 'No completions yet'}</small></div>
          </div>
          <div className="insights-legend"><span><i />{selectedYear}</span><span><i />{selectedYear - 1}</span></div>
          <TavolaSplineChart labels={MONTHS} values={values} comparisonValues={comparison} seriesName={`${selectedYear}`} comparisonName={`${selectedYear - 1}`} unit={series} height={350} />
          <p className="insights-footnote">{!data ? 'Loading your workspace…' : total === 0 && previousTotal === 0 ? `No ${series} completed in either year yet. Your real progress will appear here.` : 'Completions are grouped by their recorded completion date in your local time.'}</p>
        </section>

        <section className="glass-panel insights-distribution" aria-labelledby="task-mix-title">
          <div className="insights-panel-heading"><h2 id="task-mix-title">Task mix</h2><span>{tasks.length} total</span></div>
          <div className="insights-donut" role="img" aria-label={`${completionRate}% completed: ${done} done, ${inProgress} in progress, ${toDo} to do`} style={{ background: tasks.length ? `conic-gradient(from -90deg, var(--chart-peach, #efb2a2) 0deg ${doneAngle}deg, #a8dcca ${doneAngle}deg ${doneAngle + progressAngle}deg, #ecd59a ${doneAngle + progressAngle}deg 360deg)` : 'var(--border-subtle)' }}>
            <div><strong>{tasks.length ? `${completionRate}%` : '—'}</strong><span>{tasks.length ? 'completed' : 'No tasks yet'}</span></div>
          </div>
          <div className="insights-distribution-rows">
            {[{ name: 'Completed', count: done, color: 'var(--chart-peach, #efb2a2)' }, { name: 'In progress', count: inProgress, color: '#a8dcca' }, { name: 'To do', count: toDo, color: '#ecd59a' }].map((item) => <div key={item.name}>
              <div><i style={{ background: item.color }} /><span>{item.name}</span><strong>{item.count}</strong></div>
              <div className="insights-bar"><span style={{ width: `${tasks.length ? item.count / tasks.length * 100 : 0}%`, background: item.color }} /></div>
            </div>)}
          </div>
          <p className="insights-footnote">{overdue ? `${overdue} open ${overdue === 1 ? 'task is' : 'tasks are'} overdue.` : 'No overdue tasks.'} Based on all tasks in this workspace.</p>
        </section>
      </div>

      <div className="insights-bottom-grid">
        <section className="glass-panel insights-bottom-panel"><div className="insights-panel-heading"><h2>Project momentum</h2><ArrowUpRight size={22} aria-hidden="true" /></div><div className="insights-bottom-metrics"><div><strong>{createdInYear}</strong><span>Created in {selectedYear}</span></div><div><strong>{monthlyCounts(projects.map((project) => project.completedAt), selectedYear).reduce((sum, value) => sum + value, 0)}</strong><span>Completed in {selectedYear}</span></div><div><strong>{activeProjects}</strong><span>In progress now</span></div></div></section>
        <section className="glass-panel insights-bottom-panel"><div className="insights-panel-heading"><h2>Academic progress</h2><BookOpen size={22} aria-hidden="true" /></div><div className="insights-bottom-metrics"><div><strong>{assignments.length}</strong><span>Total assignments</span></div><div><strong>{submitted}</strong><span>Submitted or graded</span></div><div><strong>{graded}</strong><span>Graded</span></div></div></section>
      </div>
      <p className="insights-source">Calculated from your workspace on this device. No simulated metrics.</p>
    </div>
  );
};
