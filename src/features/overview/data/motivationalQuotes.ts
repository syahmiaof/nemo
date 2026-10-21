export type QuoteCategory =
  | 'focus'
  | 'discipline'
  | 'execution'
  | 'time'
  | 'study'
  | 'creativity'
  | 'resilience'
  | 'clarity'
  | 'momentum'
  | 'mindset';

export interface MotivationalQuote {
  id: string;
  text: string;
  category: QuoteCategory;
  author?: string;
}

export const MOTIVATIONAL_QUOTES: MotivationalQuote[] = [
  // Category A - Focus (1-10)
  { id: 'quote-1', text: 'Give your attention a destination.', category: 'focus' },
  { id: 'quote-2', text: 'One clear priority changes the day.', category: 'focus' },
  { id: 'quote-3', text: 'Focus is a promise you keep.', category: 'focus' },
  { id: 'quote-4', text: 'Make space for meaningful work.', category: 'focus' },
  { id: 'quote-5', text: 'Protect the hour that matters.', category: 'focus' },
  { id: 'quote-6', text: 'Attention is your quiet advantage.', category: 'focus' },
  { id: 'quote-7', text: 'A calm mind moves with purpose.', category: 'focus' },
  { id: 'quote-8', text: 'Choose depth over distraction.', category: 'focus' },
  { id: 'quote-9', text: 'Let the next step be enough.', category: 'focus' },
  { id: 'quote-10', text: 'Your best work needs room to breathe.', category: 'focus' },

  // Category B - Discipline (11-20)
  { id: 'quote-11', text: 'Show up before motivation arrives.', category: 'discipline' },
  { id: 'quote-12', text: 'Build the habit, then trust it.', category: 'discipline' },
  { id: 'quote-13', text: 'Small promises create strong momentum.', category: 'discipline' },
  { id: 'quote-14', text: 'Consistency turns effort into skill.', category: 'discipline' },
  { id: 'quote-15', text: 'Do the work no one applauds.', category: 'discipline' },
  { id: 'quote-16', text: 'Keep going when progress feels ordinary.', category: 'discipline' },
  { id: 'quote-17', text: 'A steady pace still moves forward.', category: 'discipline' },
  { id: 'quote-18', text: 'Make discipline feel like freedom.', category: 'discipline' },
  { id: 'quote-19', text: 'The routine carries the dream.', category: 'discipline' },
  { id: 'quote-20', text: 'Progress follows repeated attention.', category: 'discipline' },

  // Category C - Execution (21-30)
  { id: 'quote-21', text: 'Start small, but start today.', category: 'execution' },
  { id: 'quote-22', text: 'Make the next move visible.', category: 'execution' },
  { id: 'quote-23', text: 'An idea grows when you act.', category: 'execution' },
  { id: 'quote-24', text: 'Finish a little more than yesterday.', category: 'execution' },
  { id: 'quote-25', text: 'Action gives ambition its shape.', category: 'execution' },
  { id: 'quote-26', text: 'Trade perfect plans for honest progress.', category: 'execution' },
  { id: 'quote-27', text: 'Move before doubt gets comfortable.', category: 'execution' },
  { id: 'quote-28', text: 'A finished step changes everything.', category: 'execution' },
  { id: 'quote-29', text: 'Decisions become progress through action.', category: 'execution' },
  { id: 'quote-30', text: 'Turn intention into something real.', category: 'execution' },

  // Category D - Time (31-40)
  { id: 'quote-31', text: 'Spend your minutes on your future.', category: 'time' },
  { id: 'quote-32', text: 'Time respects a clear decision.', category: 'time' },
  { id: 'quote-33', text: 'Own your hours, own your direction.', category: 'time' },
  { id: 'quote-34', text: 'Your calendar reveals your priorities.', category: 'time' },
  { id: 'quote-35', text: 'Make today worth remembering.', category: 'time' },
  { id: 'quote-36', text: 'Less noise. More meaningful hours.', category: 'time' },
  { id: 'quote-37', text: 'Guard your time with intention.', category: 'time' },
  { id: 'quote-38', text: 'A focused hour can shift a week.', category: 'time' },
  { id: 'quote-39', text: 'Make room for the important things.', category: 'time' },
  { id: 'quote-40', text: 'Your time deserves deliberate choices.', category: 'time' },

  // Category E - Study (41-50)
  { id: 'quote-41', text: 'Learn deeply, not just quickly.', category: 'study' },
  { id: 'quote-42', text: 'Understanding begins with curiosity.', category: 'study' },
  { id: 'quote-43', text: 'One page today becomes confidence.', category: 'study' },
  { id: 'quote-44', text: 'Ask better questions, find better paths.', category: 'study' },
  { id: 'quote-45', text: 'Practice turns confusion into clarity.', category: 'study' },
  { id: 'quote-46', text: 'Build knowledge one session at a time.', category: 'study' },
  { id: 'quote-47', text: 'Be patient with difficult chapters.', category: 'study' },
  { id: 'quote-48', text: 'Your effort is shaping tomorrow\'s skill.', category: 'study' },
  { id: 'quote-49', text: 'Study for mastery, not applause.', category: 'study' },
  { id: 'quote-50', text: 'Let curiosity lead the next hour.', category: 'study' },

  // Category F - Creativity & Building (51-60)
  { id: 'quote-51', text: 'Build the thing you wish existed.', category: 'creativity' },
  { id: 'quote-52', text: 'Every version teaches you something.', category: 'creativity' },
  { id: 'quote-53', text: 'Ship the lesson, then improve.', category: 'creativity' },
  { id: 'quote-54', text: 'Great work begins as a rough draft.', category: 'creativity' },
  { id: 'quote-55', text: 'Make something useful today.', category: 'creativity' },
  { id: 'quote-56', text: 'Your next iteration can surprise you.', category: 'creativity' },
  { id: 'quote-57', text: 'Give your ideas a working form.', category: 'creativity' },
  { id: 'quote-58', text: 'Craft grows through honest revision.', category: 'creativity' },
  { id: 'quote-59', text: 'Build with care. Improve with courage.', category: 'creativity' },
  { id: 'quote-60', text: 'Progress is a product of practice.', category: 'creativity' },

  // Category G - Resilience (61-70)
  { id: 'quote-61', text: 'Pause if needed. Do not disappear.', category: 'resilience' },
  { id: 'quote-62', text: 'A hard day is still a day of growth.', category: 'resilience' },
  { id: 'quote-63', text: 'Reset gently and begin again.', category: 'resilience' },
  { id: 'quote-64', text: 'Keep the lesson, release the setback.', category: 'resilience' },
  { id: 'quote-65', text: 'You can restart without starting over.', category: 'resilience' },
  { id: 'quote-66', text: 'Challenges reveal what matters.', category: 'resilience' },
  { id: 'quote-67', text: 'Let mistakes become better methods.', category: 'resilience' },
  { id: 'quote-68', text: 'Steady effort outlasts noisy doubt.', category: 'resilience' },
  { id: 'quote-69', text: 'Breathe, refocus, and take one step.', category: 'resilience' },
  { id: 'quote-70', text: 'You are allowed to learn slowly.', category: 'resilience' },

  // Category H - Clarity (71-80)
  { id: 'quote-71', text: 'Clear priorities lighten heavy days.', category: 'clarity' },
  { id: 'quote-72', text: 'Simplify the path in front of you.', category: 'clarity' },
  { id: 'quote-73', text: 'Know what matters before you move.', category: 'clarity' },
  { id: 'quote-74', text: 'Clarity makes courage practical.', category: 'clarity' },
  { id: 'quote-75', text: 'Subtract distraction. Add intention.', category: 'clarity' },
  { id: 'quote-76', text: 'One honest goal beats ten vague wishes.', category: 'clarity' },
  { id: 'quote-77', text: 'Give each task a reason.', category: 'clarity' },
  { id: 'quote-78', text: 'The next step deserves your full mind.', category: 'clarity' },
  { id: 'quote-79', text: 'Progress begins with a clear direction.', category: 'clarity' },
  { id: 'quote-80', text: 'Make the important work unmistakable.', category: 'clarity' },

  // Category I - Momentum (81-90)
  { id: 'quote-81', text: 'Little wins have lasting energy.', category: 'momentum' },
  { id: 'quote-82', text: 'Momentum starts with one completed task.', category: 'momentum' },
  { id: 'quote-83', text: 'Keep the chain moving forward.', category: 'momentum' },
  { id: 'quote-84', text: 'Every checked box tells a story.', category: 'momentum' },
  { id: 'quote-85', text: 'One step can change your pace.', category: 'momentum' },
  { id: 'quote-86', text: 'Collect progress, not pressure.', category: 'momentum' },
  { id: 'quote-87', text: 'Today\'s effort is tomorrow\'s leverage.', category: 'momentum' },
  { id: 'quote-88', text: 'Your rhythm is worth protecting.', category: 'momentum' },
  { id: 'quote-89', text: 'Quiet movement creates visible results.', category: 'momentum' },
  { id: 'quote-90', text: 'Let progress become your daily habit.', category: 'momentum' },

  // Category J - Mindset (91-100)
  { id: 'quote-91', text: 'Be ambitious about what you finish.', category: 'mindset' },
  { id: 'quote-92', text: 'Your future is built in ordinary hours.', category: 'mindset' },
  { id: 'quote-93', text: 'Create before you compare.', category: 'mindset' },
  { id: 'quote-94', text: 'Let excellence grow from patience.', category: 'mindset' },
  { id: 'quote-95', text: 'Stay curious. Stay committed.', category: 'mindset' },
  { id: 'quote-96', text: 'You do not need a perfect morning.', category: 'mindset' },
  { id: 'quote-97', text: 'Choose courage over endless preparation.', category: 'mindset' },
  { id: 'quote-98', text: 'Work with purpose, rest without guilt.', category: 'mindset' },
  { id: 'quote-99', text: 'Make progress feel personal.', category: 'mindset' },
  { id: 'quote-100', text: 'Build a life worthy of your attention.', category: 'mindset' },
];
