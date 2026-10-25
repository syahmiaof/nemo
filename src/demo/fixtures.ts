import { BackupSchema, type BackupData } from '@/domain/schemas';
import type { AssetBlob, Milestone, Priority, Task } from '@/domain/types';
import { DEFAULT_ROADMAP_ITEMS_2026 } from '@/features/overview/data/defaultRoadmaps';

type FixtureData = BackupData['data'];

const PROJECTS = [
  ['Orbit Analytics', 'SaaS', 'A privacy-first product analytics workspace.', 'TypeScript', 'Orbit Studio'],
  ['Forma Commerce', 'E-commerce', 'A thoughtful storefront for independent furniture makers.', 'React', 'Forma Living'],
  ['Cloud Infrastructure Lab', 'Infrastructure', 'Repeatable cloud environments with observable services.', 'Terraform', 'Personal'],
  ['Pulse Mobile', 'Mobile', 'A quiet daily planning companion for focused work.', 'React Native', 'Pulse Collective'],
  ['Atlas API Gateway', 'Backend', 'A typed gateway with rate limits and operational visibility.', 'Node.js', 'Atlas Labs'],
  ['Academy Learning Portal', 'Education', 'Outcome-based courses and clear learner progress.', 'Next.js', 'Academy'],
  ['Field Notes CMS', 'Publishing', 'An editorial toolkit for a small independent journal.', 'TypeScript', 'Field Notes'],
  ['Harbour Booking', 'Travel', 'Accessible reservations for a coastal retreat.', 'React', 'Harbour House'],
  ['Thread Design System', 'Design', 'Shared interface foundations for a growing product team.', 'Storybook', 'Thread Studio'],
  ['Monograph Portfolio', 'Portfolio', 'A typographic home for an independent photographer.', 'Astro', 'Monograph'],
  ['Canopy Inventory', 'Operations', 'Stock movements and replenishment for a plant shop.', 'React', 'Canopy'],
  ['Signal Status Page', 'Developer tools', 'Clear incident communication and service history.', 'TypeScript', 'Signal'],
  ['Locale City Guide', 'Travel', 'Neighbourhood stories and walking routes.', 'Next.js', 'Locale'],
  ['Ledger Invoice Studio', 'Finance', 'A small invoicing workspace for freelancers.', 'React', 'Ledger'],
  ['Relay Support Desk', 'SaaS', 'A shared inbox built around clear ownership.', 'Node.js', 'Relay'],
  ['Morrow Habit Journal', 'Wellbeing', 'A gentle journal for consistent daily routines.', 'React', 'Morrow'],
  ['Northstar Research Hub', 'Research', 'Searchable interviews and product research findings.', 'TypeScript', 'Northstar'],
  ['Terrain Trail Planner', 'Outdoors', 'Saved routes and practical packing checklists.', 'React', 'Terrain'],
] as const;

const TASK_STAGES = [
  'Map the primary user journey', 'Validate the domain model', 'Build the core workflow',
  'Connect persisted data', 'Refine the responsive layouts', 'Review keyboard navigation',
  'Verify the release checklist', 'Document the handover',
] as const;
const PRIORITIES: Priority[] = ['high', 'medium', 'urgent', 'low'];
const PALETTES = [
  ['#101c35', '#efb4a2', '#a8dcca'], ['#26392f', '#e5d9b3', '#9bbd8a'],
  ['#252138', '#c4b9ec', '#efbb9a'], ['#172e3b', '#a4d4df', '#f1cc8e'],
  ['#3a282d', '#efb6aa', '#b0c4dc'], ['#22302c', '#b8d5bb', '#e7c69a'],
];

/** Mulberry32: fixtures vary naturally but never depend on Math.random(). */
function seededRandom(seed: number) {
  return () => {
    seed |= 0;
    seed = seed + 0x6D2B79F5 | 0;
    let value = Math.imul(seed ^ seed >>> 15, 1 | seed);
    value = value + Math.imul(value ^ value >>> 7, 61 | value) ^ value;
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

function localDate(value: Date): string {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
}

/** Original geometric artwork generated locally; no remote image dependencies. */
function projectCover(index: number, title: string, createdAt: string): AssetBlob {
  const [background, ink, accent] = PALETTES[index % PALETTES.length];
  const motifs = [
    `<circle cx="530" cy="190" r="130" fill="none" stroke="${ink}" stroke-width="38"/><circle cx="530" cy="190" r="66" fill="${accent}"/><path d="M345 330 730 50" stroke="${background}" stroke-width="22"/>`,
    `<path d="M375 330V115L490 55V270Z M510 270V55L625 115V330Z" fill="${ink}"/><path d="m375 330 115-60 135 60-115 60Z" fill="${accent}"/>`,
    `<g fill="none" stroke="${ink}" stroke-width="18"><path d="M350 295 450 115 550 295 650 115"/><path d="M350 350 450 170 550 350 650 170" opacity=".4"/></g>`,
    `<rect x="390" y="75" width="240" height="280" rx="100" fill="${ink}"/><rect x="440" y="125" width="140" height="180" rx="60" fill="${background}"/><circle cx="510" cy="215" r="38" fill="${accent}"/>`,
    `<g stroke="${ink}" stroke-width="2" fill="none"><path d="m350 210 150-150 150 150-150 150Z"/><path d="m390 210 110-110 110 110-110 110Z"/><path d="m430 210 70-70 70 70-70 70Z"/></g><circle cx="500" cy="210" r="30" fill="${accent}"/>`,
    `<path d="M340 330 430 90 520 330Z" fill="${ink}"/><path d="M470 330 560 90 650 330Z" fill="${accent}"/><path d="M490 275h100" stroke="${background}" stroke-width="10"/>`,
  ];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 440"><rect width="800" height="440" fill="${background}"/><path d="M40 55H260M40 380H760" stroke="${ink}" opacity=".3"/><text x="40" y="330" font-family="sans-serif" font-size="40" font-weight="600" fill="${ink}">${title.split(' ')[0]}</text>${motifs[index % motifs.length]}</svg>`;
  return {
    id: `demo-cover-${index + 1}`, ownerType: 'project', ownerId: `demo-project-${index + 1}`,
    mimeType: 'image/svg+xml', size: new TextEncoder().encode(svg).length,
    data: `data:image/svg+xml;base64,${btoa(svg)}`, createdAt,
  };
}

/** Build one immutable-in-time seed, anchored to the local day on first entry/reset. */
export function createDemoFixtures(anchor = new Date()): FixtureData {
  const today = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate(), 12);
  const random = seededRandom(73021);
  const dateAt = (days: number) => {
    const value = new Date(today);
    value.setDate(value.getDate() + days);
    return value;
  };
  const date = (days: number) => localDate(dateAt(days));
  const iso = (days: number) => dateAt(days).toISOString();
  const monthsAgo = (months: number) => new Date(today.getFullYear(), today.getMonth() - months, 12, 12);
  const historicalMonths = [14, 12, 10, 8, 6, 4, 3, 2, 1];
  const projects: FixtureData['projects'] = PROJECTS.map(([title, category, description, tech, client], index) => {
    const completed = index >= 9;
    const end = completed ? monthsAgo(historicalMonths[index - 9]) : dateAt(12 + index * 5);
    const start = new Date(end);
    start.setDate(start.getDate() - 55 - index);
    return {
      id: `demo-project-${index + 1}`, title, description, category,
      priority: PRIORITIES[index % 4],
      status: completed ? 'completed' : index === 8 ? 'on_hold' : index >= 6 ? 'not_started' : 'in_progress',
      createdAt: start.toISOString(), startedAt: index < 6 || completed ? start.toISOString() : undefined,
      dueDate: localDate(end), completedAt: completed ? end.toISOString() : undefined,
      updatedAt: completed ? end.toISOString() : iso(0),
      clientLabel: client, tags: [category.toLowerCase(), 'demo'], techStack: [tech, 'TypeScript'],
      notes: 'Fictional demo project. All changes remain in the isolated demo workspace.',
      previewBlobId: `demo-cover-${index + 1}`,
    };
  });
  const tasks: Task[] = projects.flatMap((project, projectIndex) => TASK_STAGES.map((stage, stageIndex) => {
    const historical = project.status === 'completed';
    const status = historical || (projectIndex < 6 && stageIndex < projectIndex % 4 + 1) ? 'done'
      : projectIndex < 6 && stageIndex === projectIndex % 4 + 1 ? 'in_progress' : 'todo';
    const dueOffset = stageIndex * 2 + projectIndex - 7;
    const finish = historical ? new Date(project.completedAt!) : dateAt(-((projectIndex * 2 + stageIndex) % 7));
    if (historical) finish.setDate(finish.getDate() - (7 - stageIndex) * 3);
    const due = historical ? localDate(finish) : date(dueOffset);
    return {
      id: `demo-task-${projectIndex * 8 + stageIndex + 1}`,
      title: `${stage} · ${project.title}`,
      notes: `Define acceptance criteria and record the outcome for ${project.title}.`,
      status, priority: PRIORITIES[(projectIndex + stageIndex) % 4],
      dueDate: due, dueTime: ['09:00', '11:30', '14:00', '16:30'][stageIndex % 4],
      estimatedMinutes: 25 + Math.floor(random() * 6) * 15,
      parentType: 'project' as const, parentId: project.id, tags: [stageIndex < 2 ? 'planning' : stageIndex < 6 ? 'build' : 'review'],
      createdAt: project.createdAt, updatedAt: status === 'done' ? finish.toISOString() : iso(0),
      completedAt: status === 'done' ? finish.toISOString() : undefined,
      blockedReason: projectIndex === 8 ? 'Waiting for the shared component inventory.' : undefined,
    };
  }));
  const standalone = ['Plan next week’s priorities', 'Review the learning journal', 'Back up the current workspace', 'Prepare the mentor check-in', 'Read the accessibility field guide', 'Tidy the development environment'];
  standalone.forEach((title, index) => tasks.push({
    id: `demo-task-${145 + index}`, title, status: index === 5 ? 'done' : index === 0 ? 'in_progress' : 'todo',
    priority: PRIORITIES[index % 4], dueDate: date(index < 3 ? 0 : index - 2),
    estimatedMinutes: 25, tags: ['personal'], createdAt: iso(-12), updatedAt: iso(0),
    completedAt: index === 5 ? iso(-1) : undefined,
  }));
  const milestones: Milestone[] = projects.flatMap((project, index) => [0, 1].map(order => ({
    id: `demo-project-milestone-${index * 2 + order + 1}`, ownerType: 'project' as const, ownerId: project.id,
    title: order === 0 ? 'Core workflow accepted' : 'Release and handover',
    order, targetDate: order === 1 ? project.dueDate : localDate(new Date(new Date(project.createdAt).getTime() + 25 * 86400000)),
    completedAt: project.status === 'completed' ? project.completedAt : index < 3 && order === 0 ? iso(-5) : undefined,
  })));
  const semesters: FixtureData['semesters'] = [
    { id: 'demo-semester-1', title: 'Software Engineering · Current term', status: 'active', startDate: date(-45), endDate: date(80), createdAt: iso(-60) },
    { id: 'demo-semester-2', title: 'Computing Foundations · Previous term', status: 'completed', startDate: date(-220), endDate: date(-90), createdAt: iso(-230) },
  ];
  const subjectTitles = ['Cloud Architecture', 'Human Computer Interaction', 'Network Security', 'Database Systems', 'Algorithms & Data Structures', 'Software Quality'];
  const subjects: FixtureData['subjects'] = subjectTitles.map((title, index) => ({
    id: `demo-subject-${index + 1}`, semesterId: index < 3 ? semesters[0].id : semesters[1].id,
    title, code: ['CS301', 'CS315', 'CS322', 'CS210', 'CS220', 'CS230'][index],
    lecturer: ['Dr. Nadia Rahman', 'Dr. Lim Wei', 'Dr. Amir Hassan', 'Dr. Siti Noor', 'Dr. Daniel Tan', 'Dr. Farah Aziz'][index],
    color: ['#A8DCC8', '#EDB5A4', '#EAD396', '#B9B0E0', '#9BC6DB', '#C4D2AB'][index],
    createdAt: index < 3 ? iso(-45) : iso(-220),
  }));
  const assignmentTitles = [
    ['Design a resilient web service', 'Compare container deployment strategies', 'Implement an observability dashboard', 'Present the infrastructure cost review'],
    ['Interview five prototype users', 'Audit a checkout keyboard flow', 'Build the high-fidelity prototype', 'Present usability study findings'],
    ['Configure segmented lab networks', 'Document a threat model', 'Analyse packet capture evidence', 'Demonstrate incident response'],
    ['Normalise the library catalogue', 'Implement transactional borrowing', 'Benchmark indexed search queries', 'Submit the data recovery report'],
    ['Compare graph traversal strategies', 'Implement a priority scheduler', 'Profile sorting performance', 'Present the complexity analysis'],
    ['Write acceptance criteria', 'Build the regression test suite', 'Run an accessibility review', 'Submit the release quality report'],
  ];
  const assignments: FixtureData['assignments'] = subjects.flatMap((subject, subjectIndex) => assignmentTitles[subjectIndex].map((title, index) => {
    const previous = subjectIndex >= 3;
    const status = previous ? 'graded' : index === 0 ? 'submitted' : index === 1 ? 'in_progress' : 'not_started';
    const due = previous ? -180 + index * 20 : [-3, 0, 7, 18][index] + subjectIndex * 2;
    const isExamItem = index === 3;
    const finalTitle = isExamItem ? `Exam: ${title}` : title;
    const finalDesc = isExamItem
      ? `[EXAM] Comprehensive exam covering core ${subject.title.toLowerCase()} curriculum. Exam Hall B, Seat ${12 + subjectIndex}.`
      : `Apply the ${subject.title.toLowerCase()} concepts to a practical case study.`;
    return {
      id: `demo-assignment-${subjectIndex * 4 + index + 1}`, subjectId: subject.id, title: finalTitle, status,
      description: finalDesc,
      dueDate: date(due), dueTime: isExamItem ? '09:00' : '23:59', weightPercent: 25,
      scoreObtained: previous ? 74 + Math.floor(random() * 22) : undefined,
      scoreMaximum: previous ? 100 : undefined,
      submittedAt: previous || status === 'submitted' ? iso(due - 2) : undefined,
      createdAt: subject.createdAt, updatedAt: previous ? iso(due + 7) : iso(0),
    };
  }));
  const eventTitles = [
    'Orbit product walkthrough', 'Cloud architecture lab', 'Forma stakeholder review', 'Network security workshop',
    'Weekly planning', 'Prototype usability session', 'Pulse design critique', 'API reliability review',
    'Mentor office hours', 'Open source study group', 'Course project presentation', 'Portfolio feedback session',
    'Accessibility reading circle', 'Infrastructure pairing session', 'Quarterly learning review', 'Community developer meetup',
    'Academy content workshop', 'Research synthesis session', 'Semester retrospective', 'Release readiness review',
  ];
  const calendarEvents: FixtureData['calendarEvents'] = eventTitles.map((title, index) => {
    const start = dateAt(index < 6 ? index - 2 : (index - 5) * 3);
    start.setHours(9 + index % 7, 0, 0, 0);
    const end = new Date(start.getTime() + (index % 3 + 1) * 3600000);
    const allDay = index === 10 || index === 18;
    return {
      id: `demo-event-${index + 1}`, title, description: 'Fictional demo event; edit this schedule freely.',
      location: index % 2 ? 'Campus collaboration room' : 'Online',
      startAt: allDay ? localDate(start) : start.toISOString(), endAt: allDay ? localDate(start) : end.toISOString(),
      isAllDay: allDay, subjectId: index % 3 === 1 ? subjects[index % 6].id : undefined,
      createdAt: iso(-30), updatedAt: iso(-2),
    };
  });
  const goalTitles = ['Ship a polished portfolio', 'Build dependable cloud skills', 'Create a sustainable freelance practice', 'Improve accessible interface design', 'Complete the computing foundations', 'Contribute to open source'];
  const goals: FixtureData['goals'] = goalTitles.map((title, index) => ({
    id: `demo-goal-${index + 1}`, title,
    why: ['Make selected work easy to explore.', 'Operate services with confidence.', 'Protect focused work and client relationships.', 'Make every workflow usable with a keyboard.', 'Build a strong technical foundation.', 'Learn through small, useful contributions.'][index],
    category: ['Career', 'Learning', 'Business', 'Design', 'Academics', 'Community'][index],
    status: index === 4 ? 'achieved' : index === 5 ? 'planned' : 'active',
    targetDate: date(index === 4 ? -85 : 30 + index * 14), createdAt: iso(index === 4 ? -230 : -60),
    achievedAt: index === 4 ? iso(-85) : undefined, updatedAt: index === 4 ? iso(-85) : iso(0),
  }));
  const goalMilestoneTitles = [
    ['Select three case studies', 'Write project narratives', 'Prepare cover artwork', 'Review the mobile experience', 'Publish and collect feedback'],
    ['Finish networking fundamentals', 'Deploy a container service', 'Add service observability', 'Practise recovery procedures', 'Document the operating guide'],
    ['Define the ideal client', 'Create a discovery checklist', 'Prepare proposal templates', 'Refine the handover process', 'Review the monthly workload'],
    ['Audit keyboard navigation', 'Review colour contrast', 'Practise screen reader testing', 'Improve form error messages', 'Publish an accessibility checklist'],
    ['Complete database exercises', 'Finish algorithm labs', 'Pass the security assessment', 'Submit the team project', 'Review final feedback'],
    ['Choose a community project', 'Read contribution guidance', 'Reproduce an open issue', 'Submit a small improvement', 'Respond to review feedback'],
  ];
  goals.forEach((goal, index) => goalMilestoneTitles[index].forEach((title, order) => milestones.push({
    id: `demo-goal-milestone-${index * 5 + order + 1}`, ownerType: 'goal', ownerId: goal.id,
    title, order, targetDate: date(index === 4 ? -110 + order * 5 : 5 + order * 7 + index * 3),
    completedAt: index === 4 ? iso(-110 + order * 5) : index < 4 && order < index % 3 + 1 ? iso(-12 + order * 3) : undefined,
  })));

  const hydrationLogs: FixtureData['hydrationLogs'] = [
    { id: 'demo-hyd-1', date: date(0), amountMl: 500, loggedAt: iso(0) },
    { id: 'demo-hyd-2', date: date(0), amountMl: 500, loggedAt: iso(0) },
    { id: 'demo-hyd-3', date: date(0), amountMl: 750, loggedAt: iso(0) },
    { id: 'demo-hyd-4', date: date(-1), amountMl: 1000, loggedAt: iso(-1) },
    { id: 'demo-hyd-5', date: date(-1), amountMl: 1250, loggedAt: iso(-1) },
    { id: 'demo-hyd-6', date: date(-2), amountMl: 2200, loggedAt: iso(-2) },
    { id: 'demo-hyd-7', date: date(-3), amountMl: 2500, loggedAt: iso(-3) },
    { id: 'demo-hyd-8', date: date(-4), amountMl: 2100, loggedAt: iso(-4) },
    { id: 'demo-hyd-9', date: date(-5), amountMl: 2400, loggedAt: iso(-5) },
    { id: 'demo-hyd-10', date: date(-6), amountMl: 2600, loggedAt: iso(-6) },
  ];

  const dietLogs: FixtureData['dietLogs'] = [
    {
      id: 'demo-diet-1',
      date: date(0),
      mealType: 'breakfast',
      foodName: 'Rolled Oats with Berries & Whey Protein',
      calories: 420,
      proteinG: 32,
      carbsG: 55,
      fatG: 8,
      loggedAt: iso(0),
    },
    {
      id: 'demo-diet-2',
      date: date(0),
      mealType: 'lunch',
      foodName: 'Grilled Chicken Breast with Quinoa & Greens',
      calories: 680,
      proteinG: 48,
      carbsG: 62,
      fatG: 14,
      loggedAt: iso(0),
    },
    {
      id: 'demo-diet-3',
      date: date(0),
      mealType: 'snack',
      foodName: 'Greek Yogurt with Honey & Walnuts',
      calories: 230,
      proteinG: 18,
      carbsG: 16,
      fatG: 9,
      loggedAt: iso(0),
    },
    {
      id: 'demo-diet-4',
      date: date(-1),
      mealType: 'breakfast',
      foodName: 'Avocado Toast with Poached Eggs',
      calories: 480,
      proteinG: 22,
      carbsG: 40,
      fatG: 24,
      loggedAt: iso(-1),
    },
    {
      id: 'demo-diet-5',
      date: date(-1),
      mealType: 'lunch',
      foodName: 'Salmon Bowl with Brown Rice & Edamame',
      calories: 720,
      proteinG: 42,
      carbsG: 68,
      fatG: 22,
      loggedAt: iso(-1),
    },
  ];

  const workoutLogs: FixtureData['workoutLogs'] = [
    {
      id: 'demo-wkt-1',
      date: date(0),
      type: 'jogging',
      title: 'Morning Lake Trail Run',
      durationMinutes: 32,
      distanceKm: 5.4,
      caloriesBurned: 350,
      completedAt: iso(0),
    },
    {
      id: 'demo-wkt-2',
      date: date(-1),
      type: 'strength',
      title: 'Upper Body Hypertrophy',
      durationMinutes: 50,
      caloriesBurned: 310,
      exercises: [
        {
          id: 'ex-demo-1',
          name: 'Barbell Bench Press',
          sets: [
            { setNumber: 1, reps: 10, weightKg: 65, completed: true },
            { setNumber: 2, reps: 10, weightKg: 70, completed: true },
            { setNumber: 3, reps: 8, weightKg: 72.5, completed: true },
          ],
        },
        {
          id: 'ex-demo-2',
          name: 'Dumbbell Incline Press',
          sets: [
            { setNumber: 1, reps: 12, weightKg: 24, completed: true },
            { setNumber: 2, reps: 10, weightKg: 26, completed: true },
          ],
        },
      ],
      completedAt: iso(-1),
    },
    {
      id: 'demo-wkt-3',
      date: date(-3),
      type: 'running',
      title: 'Interval Sprint Session',
      durationMinutes: 28,
      distanceKm: 4.8,
      caloriesBurned: 320,
      completedAt: iso(-3),
    },
    {
      id: 'demo-wkt-4',
      date: date(-5),
      type: 'strength',
      title: 'Legs & Core Power',
      durationMinutes: 55,
      caloriesBurned: 380,
      completedAt: iso(-5),
    },
  ];

  const bodyMetrics: FixtureData['bodyMetrics'] = [
    { id: 'demo-bm-1', date: date(-28), weightKg: 74.5, bodyFatPercent: 17.5, loggedAt: iso(-28) },
    { id: 'demo-bm-2', date: date(-21), weightKg: 73.9, bodyFatPercent: 17.1, loggedAt: iso(-21) },
    { id: 'demo-bm-3', date: date(-14), weightKg: 73.2, bodyFatPercent: 16.7, loggedAt: iso(-14) },
    { id: 'demo-bm-4', date: date(-7), weightKg: 72.8, bodyFatPercent: 16.4, loggedAt: iso(-7) },
    { id: 'demo-bm-5', date: date(0), weightKg: 72.3, bodyFatPercent: 16.1, loggedAt: iso(0) },
  ];

  const financialProfiles: FixtureData['financialProfiles'] = [
    { id: 'profile-default', monthlyIncomeNet: 4500, paydayDayOfMonth: 25, currency: 'MYR', updatedAt: iso(0) },
  ];

  const financialCommitments: FixtureData['financialCommitments'] = [
    { id: 'demo-com-1', title: 'Apartment Rental & Maintenance', amount: 750, category: 'needs', dueDayOfMonth: 1, isPaidThisMonth: true, lastPaidMonthYear: '2026-10', autoRenew: true, createdAt: iso(-60), updatedAt: iso(0) },
    { id: 'demo-com-2', title: 'TNB Electricity & Water Utilities', amount: 120, category: 'utilities', dueDayOfMonth: 15, isPaidThisMonth: true, lastPaidMonthYear: '2026-10', autoRenew: true, createdAt: iso(-60), updatedAt: iso(0) },
    { id: 'demo-com-3', title: 'Time Fibre Internet 200Mbps', amount: 99, category: 'utilities', dueDayOfMonth: 20, isPaidThisMonth: false, autoRenew: true, createdAt: iso(-60), updatedAt: iso(0) },
    { id: 'demo-com-4', title: 'Medical Card & Life Takaful', amount: 180, category: 'protection', dueDayOfMonth: 28, isPaidThisMonth: false, autoRenew: true, createdAt: iso(-60), updatedAt: iso(0) },
    { id: 'demo-com-5', title: 'Spotify & Netflix Premium', amount: 55, category: 'lifestyle', dueDayOfMonth: 10, isPaidThisMonth: true, lastPaidMonthYear: '2026-10', autoRenew: true, createdAt: iso(-60), updatedAt: iso(0) },
  ];

  const debts: FixtureData['debts'] = [
    { id: 'demo-dbt-1', title: 'PTPTN Tertiary Education Loan', creditor: 'PTPTN', originalPrincipal: 28000, currentBalance: 14200, interestRatePercent: 1.0, monthlyInstallment: 250, priority: 'snowball', targetPayoffDate: '2031-06-30', createdAt: iso(-180), updatedAt: iso(0) },
    { id: 'demo-dbt-2', title: 'Car Hire Purchase Loan (Myvi)', creditor: 'Maybank Islamic', originalPrincipal: 48000, currentBalance: 21600, interestRatePercent: 3.2, monthlyInstallment: 490, priority: 'normal', targetPayoffDate: '2029-12-31', createdAt: iso(-240), updatedAt: iso(0) },
  ];

  const debtPayments: FixtureData['debtPayments'] = [
    { id: 'demo-dpay-1', debtId: 'demo-dbt-1', amount: 250, paidAt: iso(-10), note: 'Automated Salary Deduction' },
  ];

  const wishlistItems: FixtureData['wishlistItems'] = [
    { id: 'demo-wsh-1', title: 'Sony WH-1000XM5 Noise Cancelling', estimatedPrice: 1299, priority: 'medium', coolingOffDays: 14, storeUrl: 'https://shopee.com.my', addedAt: iso(-4), isBought: false },
    { id: 'demo-wsh-2', title: 'Ergonomic Desk Chair', estimatedPrice: 850, priority: 'high', coolingOffDays: 7, addedAt: iso(-18), isBought: false },
    { id: 'demo-wsh-3', title: 'Mechanical Keyboard Keychron Q1', estimatedPrice: 720, priority: 'low', coolingOffDays: 30, addedAt: iso(-2), isBought: false },
  ];

  const savingsGoals: FixtureData['savingsGoals'] = [
    { id: 'demo-svg-1', title: '3-Month Emergency Runway', targetAmount: 6000, currentAmount: 3500, category: 'emergency', color: '#34D399', createdAt: iso(-120), updatedAt: iso(0) },
    { id: 'demo-svg-2', title: 'Japan Winter Holiday Fund', targetAmount: 4500, currentAmount: 2200, category: 'travel', targetDate: '2027-02-15', color: '#38BDF8', createdAt: iso(-90), updatedAt: iso(0) },
  ];

  const savingsDeposits: FixtureData['savingsDeposits'] = [
    { id: 'demo-sdep-1', savingsGoalId: 'demo-svg-1', amount: 500, type: 'deposit', loggedAt: iso(-15), note: 'Previous Paycheck Allocation' },
  ];

  const visionItems: FixtureData['visionItems'] = [
    {
      id: 'demo-vis-1',
      title: 'Japan Cherry Blossom & Kyoto Tour',
      description: 'Explore the historic alleys of Gion, Mount Fuji, and serene tea houses.',
      imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80',
      imageThumbnailUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=400&q=80',
      horizon: 'mid_term',
      category: 'travel_adventure',
      targetDate: '2027-04-10',
      estimatedCost: 7500,
      linkedSavingsGoalId: 'demo-svg-2',
      whyItMatters: 'Experience ancient shrines, temples, and tranquil spring foliage in person.',
      status: 'in_progress',
      order: 0,
      createdAt: iso(-60),
      updatedAt: iso(0),
    },
    {
      id: 'demo-vis-2',
      title: 'Aesthetic Minimal Dual-Monitor Setup',
      description: 'Clean Scandinavian walnut standing desk with ambient bias backlighting.',
      imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=1200&q=80',
      imageThumbnailUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=400&q=80',
      horizon: 'short_term',
      category: 'career_tech',
      targetDate: '2026-12-15',
      estimatedCost: 3500,
      whyItMatters: 'Deep focus environment for engineering and creative flow.',
      status: 'in_progress',
      order: 1,
      createdAt: iso(-30),
      updatedAt: iso(0),
    },
    {
      id: 'demo-vis-3',
      title: 'Contemporary Architectural Villa',
      description: 'Spacious light-filled sanctuary with private garden courtyard and lap pool.',
      imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      imageThumbnailUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80',
      horizon: 'long_term',
      category: 'wealth_finance',
      targetDate: '2029-12-31',
      estimatedCost: 850000,
      whyItMatters: 'Long-term family security and generational sanctuary.',
      status: 'dreaming',
      order: 2,
      createdAt: iso(-90),
      updatedAt: iso(0),
    },
  ];

  const data: FixtureData = {
    settings: { id: 'default', displayName: 'Alex Morgan', theme: 'aurora', accent: 'ember', weekStartsOn: 1, hourFormat: '24h', reduceMotion: false, onboardingCompleted: true, databaseVersion: 1 },
    projects, tasks, milestones, semesters, subjects, assignments, calendarEvents, goals,
    goalTaskLinks: goals.filter(goal => goal.status !== 'achieved').flatMap((goal, index) => [0, 1, 2].map(offset => ({
      id: `demo-link-${index * 3 + offset + 1}`, goalId: goal.id, taskId: tasks[index * 8 + offset + 3].id, createdAt: iso(-5),
    }))),
    focusSelections: tasks.slice(144, 147).map((task, index) => ({ id: `demo-focus-${index + 1}`, taskId: task.id, effectiveLocalDate: date(0), chosenAt: iso(0) })),
    assetBlobs: projects.map((project, index) => projectCover(index, project.title, project.createdAt)),
    hydrationLogs,
    dietLogs,
    workoutLogs,
    bodyMetrics,
    financialProfiles,
    financialCommitments,
    debts,
    debtPayments,
    wishlistItems,
    savingsGoals,
    savingsDeposits,
    visionItems,
    monthlyRoadmaps: DEFAULT_ROADMAP_ITEMS_2026,
    incomeItems: [],
    ibadahDailyLogs: [],
    qadhaPrayers: [],
    qadhaFastings: [],
  };
  return BackupSchema.parse({ app: 'nemo', version: 1, exportedAt: iso(0), data }).data;
}
