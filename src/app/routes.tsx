import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from './AppShell';
import { OverviewPage } from '@/features/overview/OverviewPage';
import { ProjectsPage } from '@/features/projects/ProjectsPage';
import { ProjectDetailPage } from '@/features/projects/ProjectDetailPage';
import { TasksPage } from '@/features/tasks/TasksPage';
import { CalendarPage } from '@/features/calendar/CalendarPage';
import { AcademicsPage } from '@/features/academics/AcademicsPage';
import { GoalsPage } from '@/features/goals/GoalsPage';
import { GoalDetailPage } from '@/features/goals/GoalDetailPage';
import { HealthPage } from '@/features/health/HealthPage';
import { FinancePage } from '@/features/finance/FinancePage';
import { VisionBoardPage } from '@/features/vision/VisionBoardPage';
import { IbadahPage } from '@/features/ibadah/IbadahPage';
import { InsightsPage } from '@/features/insights/InsightsPage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { Button } from '@/components/ui/Button';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
    <div className="p-4 rounded-2xl bg-surface border border-border-subtle text-accent-ember font-mono text-2xl font-bold">
      404
    </div>
    <h2 className="text-xl font-bold text-content-primary">Page Not Found</h2>
    <p className="text-xs text-content-secondary max-w-sm">
      The route you requested does not exist or this item is not stored on this device.
    </p>
    <Link to="/overview">
      <Button size="sm">Return to Overview</Button>
    </Link>
  </div>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/overview" replace /> },
      { path: 'overview', element: <OverviewPage /> },
      { path: 'projects', element: <ProjectsPage /> },
      { path: 'projects/:id', element: <ProjectDetailPage /> },
      { path: 'tasks', element: <TasksPage /> },
      { path: 'calendar', element: <CalendarPage /> },
      { path: 'academics', element: <AcademicsPage /> },
      { path: 'academics/semesters/:id', element: <AcademicsPage /> },
      { path: 'academics/subjects/:id', element: <AcademicsPage /> },
      { path: 'academics/assignments/:id', element: <AcademicsPage /> },
      { path: 'goals', element: <GoalsPage /> },
      { path: 'goals/:id', element: <GoalDetailPage /> },
      { path: 'vision', element: <VisionBoardPage /> },
      { path: 'ibadah', element: <IbadahPage /> },
      { path: 'health', element: <HealthPage /> },
      { path: 'finance', element: <FinancePage /> },
      { path: 'insights', element: <InsightsPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
