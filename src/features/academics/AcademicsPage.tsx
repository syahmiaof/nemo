import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  GraduationCap,
  Plus,
  BookOpen,
  Calendar,
  ExternalLink,
  CheckCircle2,
  Circle,
  Edit2,
  Trash2,
  Clock,
} from 'lucide-react';
import {
  db,
  atomicDeleteSemester,
  atomicDeleteSubject,
  atomicDeleteAssignment,
  atomicSetTaskStatus,
} from '@/db/nemoDb';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { StatusBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { generateId } from '@/lib/ids';
import { formatDisplayDate, isOverdue, getTodayLocalDateString } from '@/lib/dates';
import { isValidWebUrl } from '@/lib/utils';
import type { Assignment, AssignmentStatus, Task } from '@/domain/types';
import { useCollectionMotion } from '@/design/useCollectionMotion';
import { MotionTitle } from '@/components/ui/MotionTitle';

export const AcademicsPage: React.FC = () => {
  const { success, error } = useToast();
  const todayStr = getTodayLocalDateString();

  // Modals state
  const [isSemesterModalOpen, setIsSemesterModalOpen] = useState(false);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [assignmentToEdit, setAssignmentToEdit] = useState<Assignment | null>(null);

  // Active selections & filters
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'assignments' | 'exams'>('all');
  const [deliverableType, setDeliverableType] = useState<'assignment' | 'exam'>('assignment');

  // Delete dialog state
  const [itemToDelete, setItemToDelete] = useState<{
    type: 'semester' | 'subject' | 'assignment';
    id: string;
    title: string;
  } | null>(null);

  // Queries
  const semesters = useLiveQuery(() => db.semesters.toArray(), []) || [];
  const subjects = useLiveQuery(
    () => (selectedSemesterId ? db.subjects.where('semesterId').equals(selectedSemesterId).toArray() : db.subjects.toArray()),
    [selectedSemesterId]
  ) || [];
  const assignments = useLiveQuery(() => db.assignments.toArray(), []) || [];
  const tasks = useLiveQuery(() => db.tasks.where('parentType').equals('assignment').toArray(), []) || [];

  // Default selection if available
  React.useEffect(() => {
    if (!selectedSemesterId && semesters.length > 0) {
      setSelectedSemesterId(semesters[0].id);
    }
  }, [semesters, selectedSemesterId]);

  // Form states
  const [semesterTitle, setSemesterTitle] = useState('');
  const [subjectTitle, setSubjectTitle] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [subjectLecturer, setSubjectLecturer] = useState('');
  const [subjectColor, setSubjectColor] = useState('#A8DCC8');

  // Assignment form states
  const [assignTitle, setAssignTitle] = useState('');
  const [assignDescription, setAssignDescription] = useState('');
  const [assignStatus, setAssignStatus] = useState<AssignmentStatus>('not_started');
  const [assignDueDate, setAssignDueDate] = useState('');
  const [assignDueTime, setAssignDueTime] = useState('');
  const [assignUrl, setAssignUrl] = useState('');
  const [assignWeight, setAssignWeight] = useState('');
  const [assignScoreObtained, setAssignScoreObtained] = useState('');
  const [assignScoreMax, setAssignScoreMax] = useState('');

  // Inline assignment subtask input
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [activeAssignmentForSubtask, setActiveAssignmentForSubtask] = useState<string | null>(null);

  const isExamEntity = (item: Assignment) => {
    return (
      item.title.toLowerCase().includes('exam') ||
      item.title.toLowerCase().includes('quiz') ||
      item.description?.includes('[EXAM]')
    );
  };

  const getExamCountdown = (dueDate?: string) => {
    if (!dueDate) return null;
    if (dueDate === todayStr) return { label: 'Today', urgency: 'urgent' };
    const d1 = new Date(todayStr);
    const d2 = new Date(dueDate);
    const diffDays = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) return { label: 'Tomorrow', urgency: 'urgent' };
    if (diffDays > 1) return { label: `In ${diffDays} days`, urgency: diffDays <= 7 ? 'soon' : 'normal' };
    return { label: 'Passed', urgency: 'passed' };
  };

  // Handlers
  const handleSaveSemester = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!semesterTitle.trim()) return;
    const id = generateId('sem');
    await db.semesters.add({
      id,
      title: semesterTitle.trim(),
      status: 'active',
      createdAt: new Date().toISOString(),
    });
    setSelectedSemesterId(id);
    setSemesterTitle('');
    setIsSemesterModalOpen(false);
    success('Semester created');
  };

  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectTitle.trim() || !selectedSemesterId) return;
    const id = generateId('subj');
    await db.subjects.add({
      id,
      semesterId: selectedSemesterId,
      code: subjectCode.trim() || undefined,
      title: subjectTitle.trim(),
      lecturer: subjectLecturer.trim() || undefined,
      color: subjectColor,
      createdAt: new Date().toISOString(),
    });
    setSelectedSubjectId(id);
    setSubjectTitle('');
    setSubjectCode('');
    setSubjectLecturer('');
    setIsSubjectModalOpen(false);
    success('Subject created');
  };

  const handleOpenAssignmentModal = (
    assignment?: Assignment,
    defaultType: 'assignment' | 'exam' = 'assignment'
  ) => {
    if (assignment) {
      setAssignmentToEdit(assignment);
      const isExam = isExamEntity(assignment);
      setDeliverableType(isExam ? 'exam' : 'assignment');
      setAssignTitle(assignment.title.replace(/^\[exam\]\s*/i, '').replace(/^exam:\s*/i, ''));
      setAssignDescription(assignment.description?.replace(/\[EXAM\]\s*/g, '').trim() || '');
      setAssignStatus(assignment.status);
      setAssignDueDate(assignment.dueDate || '');
      setAssignDueTime(assignment.dueTime || '');
      setAssignUrl(assignment.submissionUrl || '');
      setAssignWeight(assignment.weightPercent?.toString() || '');
      setAssignScoreObtained(assignment.scoreObtained?.toString() || '');
      setAssignScoreMax(assignment.scoreMaximum?.toString() || '');
    } else {
      setAssignmentToEdit(null);
      setDeliverableType(defaultType);
      setAssignTitle('');
      setAssignDescription('');
      setAssignStatus('not_started');
      setAssignDueDate(todayStr);
      setAssignDueTime(defaultType === 'exam' ? '09:00' : '');
      setAssignUrl('');
      setAssignWeight('');
      setAssignScoreObtained('');
      setAssignScoreMax('');
    }
    setIsAssignmentModalOpen(true);
  };

  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTitle.trim()) {
      error('Title required');
      return;
    }

    const targetSubjectId = selectedSubjectId || subjects[0]?.id;
    if (!targetSubjectId) {
      error('Subject required', 'Please create a subject before adding assignments.');
      return;
    }

    if (assignUrl.trim() && !isValidWebUrl(assignUrl.trim())) {
      error('Invalid URL', 'Portal link must be a valid web URL starting with http:// or https://');
      return;
    }

    const now = new Date().toISOString();
    const weightPercent = assignWeight ? parseFloat(assignWeight) : undefined;
    const scoreObtained = assignScoreObtained ? parseFloat(assignScoreObtained) : undefined;
    const scoreMaximum = assignScoreMax ? parseFloat(assignScoreMax) : undefined;

    let finalTitle = assignTitle.trim();
    let finalDesc = assignDescription.trim();

    if (deliverableType === 'exam') {
      if (!finalTitle.toLowerCase().includes('exam') && !finalTitle.toLowerCase().includes('quiz')) {
        finalTitle = `Exam: ${finalTitle}`;
      }
      if (!finalDesc.includes('[EXAM]')) {
        finalDesc = finalDesc ? `[EXAM] ${finalDesc}` : '[EXAM]';
      }
    }

    if (assignmentToEdit) {
      await db.assignments.update(assignmentToEdit.id, {
        title: finalTitle,
        description: finalDesc || undefined,
        status: assignStatus,
        dueDate: assignDueDate || undefined,
        dueTime: assignDueTime || undefined,
        submissionUrl: assignUrl.trim() || undefined,
        weightPercent,
        scoreObtained,
        scoreMaximum,
        submittedAt: assignStatus === 'submitted' || assignStatus === 'graded' ? now : undefined,
        updatedAt: now,
      });
      success(deliverableType === 'exam' ? 'Exam schedule updated' : 'Assignment updated');
    } else {
      await db.assignments.add({
        id: generateId('assign'),
        subjectId: targetSubjectId,
        title: finalTitle,
        description: finalDesc || undefined,
        status: assignStatus,
        dueDate: assignDueDate || undefined,
        dueTime: assignDueTime || undefined,
        submissionUrl: assignUrl.trim() || undefined,
        weightPercent,
        scoreObtained,
        scoreMaximum,
        submittedAt: assignStatus === 'submitted' ? now : undefined,
        createdAt: now,
        updatedAt: now,
      });
      success(deliverableType === 'exam' ? 'Exam scheduled & synced to Calendar' : 'Assignment added');
    }

    setIsAssignmentModalOpen(false);
  };

  // Add assignment subtask directly to canonical Tasks
  const handleAddAssignmentSubtask = async (assignmentId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    const now = new Date().toISOString();
    await db.tasks.add({
      id: generateId('task'),
      title: newSubtaskTitle.trim(),
      status: 'todo',
      priority: 'medium',
      parentType: 'assignment',
      parentId: assignmentId,
      tags: ['academic'],
      createdAt: now,
      updatedAt: now,
    });
    setNewSubtaskTitle('');
    setActiveAssignmentForSubtask(null);
    success('Subtask added to canonical tasks');
  };

  const handleToggleSubtask = async (task: Task) => {
    const nextStatus = task.status === 'done' ? 'todo' : 'done';
    await atomicSetTaskStatus(db, task.id, nextStatus);
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    if (itemToDelete.type === 'semester') {
      await atomicDeleteSemester(db, itemToDelete.id);
      if (selectedSemesterId === itemToDelete.id) {
        setSelectedSemesterId('');
      }
    } else if (itemToDelete.type === 'subject') {
      await atomicDeleteSubject(db, itemToDelete.id);
      if (selectedSubjectId === itemToDelete.id) {
        setSelectedSubjectId('');
      }
    } else if (itemToDelete.type === 'assignment') {
      await atomicDeleteAssignment(db, itemToDelete.id);
    }
    setItemToDelete(null);
    success('Item deleted');
  };

  const subjectDeliverables = React.useMemo(() => {
    return selectedSubjectId
      ? assignments.filter((a) => a.subjectId === selectedSubjectId)
      : assignments;
  }, [assignments, selectedSubjectId]);

  const upcomingExams = React.useMemo(() => {
    return subjectDeliverables
      .filter((a) => isExamEntity(a) && a.dueDate && a.status !== 'submitted' && a.status !== 'graded')
      .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));
  }, [subjectDeliverables]);

  const filteredAssignments = React.useMemo(() => {
    if (filterType === 'assignments') {
      return subjectDeliverables.filter((a) => !isExamEntity(a));
    }
    if (filterType === 'exams') {
      return subjectDeliverables.filter((a) => isExamEntity(a));
    }
    return subjectDeliverables;
  }, [subjectDeliverables, filterType]);

  const assignmentCount = subjectDeliverables.filter((a) => !isExamEntity(a)).length;
  const examCount = subjectDeliverables.filter((a) => isExamEntity(a)).length;
  const assignmentsRef = useCollectionMotion<HTMLDivElement>(`${selectedSemesterId}:${selectedSubjectId}:${filterType}:${filteredAssignments.map((assignment) => assignment.id).join(',')}`);

  return (
    <div className="academics-page space-y-6">
      {/* Top Header & Semester Selector */}
      <div className="page-toolbar flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl glass-panel relative z-10">
        <div className="flex items-center gap-3 relative z-10">
          <div className="p-3 rounded-xl bg-white/[0.06] border border-white/10 text-accent-mint">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <MotionTitle as="h2" text="Academic Track" className="text-lg font-bold text-content-primary" />
            <p className="text-xs text-content-secondary">
              Organize semesters, courses, and submission deliverables.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {semesters.length > 0 && (
            <select
              value={selectedSemesterId}
              onChange={(e) => setSelectedSemesterId(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-surface-hover border border-border-subtle text-xs font-semibold text-content-primary cursor-pointer"
            >
              {semesters.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          )}

          <Button size="sm" onClick={() => setIsSemesterModalOpen(true)} className="gap-1.5">
            <Plus className="w-4 h-4" />
            <span>New Semester</span>
          </Button>
        </div>
      </div>

      {semesters.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No semesters set up yet"
          description="Create your current academic semester to organize subjects, lectures, and upcoming coursework."
          actionLabel="Create Semester"
          onAction={() => setIsSemesterModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Col: Subjects list */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono uppercase tracking-wider text-content-tertiary">Subjects</h3>
              <Button size="sm" variant="ghost" onClick={() => setIsSubjectModalOpen(true)} className="text-xs gap-1">
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </Button>
            </div>

            <div className="space-y-1.5">
              <button
                onClick={() => setSelectedSubjectId('')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  selectedSubjectId === ''
                    ? 'bg-surface-hover text-content-primary font-semibold border border-border-subtle'
                    : 'text-content-secondary hover:bg-surface/50 hover:text-content-primary'
                }`}
              >
                All Subjects ({assignments.length})
              </button>

              {subjects.map((sub) => {
                const count = assignments.filter((a) => a.subjectId === sub.id).length;
                const isSelected = selectedSubjectId === sub.id;

                return (
                  <div
                    key={sub.id}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-white/[0.1] border-white/20 text-white font-semibold'
                        : 'bg-white/[0.03] border-white/10 text-content-secondary hover:text-white hover:bg-white/[0.06]'
                    }`}
                  >
                    <button
                      onClick={() => setSelectedSubjectId(sub.id)}
                      className="flex items-center gap-2.5 min-w-0 flex-1 text-left"
                    >
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: sub.color }} />
                      <div className="min-w-0">
                        <p className="text-xs truncate">{sub.title}</p>
                        {sub.code && <p className="text-[10px] text-content-tertiary font-mono">{sub.code}</p>}
                      </div>
                    </button>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-surface border border-border-subtle font-mono text-content-tertiary">
                        {count}
                      </span>
                      <button
                        onClick={() => setItemToDelete({ type: 'subject', id: sub.id, title: sub.title })}
                        className="text-content-tertiary hover:text-accent-ember p-1"
                        title="Delete Subject"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right 3 Cols: Deliverables & Exams */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface border border-border-subtle w-fit">
                <button
                  type="button"
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    filterType === 'all'
                      ? 'bg-accent-mint text-navy-950 shadow-sm'
                      : 'text-content-secondary hover:text-content-primary'
                  }`}
                >
                  All ({subjectDeliverables.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('assignments')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    filterType === 'assignments'
                      ? 'bg-accent-mint text-navy-950 shadow-sm'
                      : 'text-content-secondary hover:text-content-primary'
                  }`}
                >
                  Assignments ({assignmentCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('exams')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    filterType === 'exams'
                      ? 'bg-rose-400 text-navy-950 shadow-sm'
                      : 'text-content-secondary hover:text-content-primary'
                  }`}
                >
                  Exams & Tests ({examCount})
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenAssignmentModal(undefined, 'exam')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Add Exam</span>
                </button>
                <Button size="sm" onClick={() => handleOpenAssignmentModal(undefined, 'assignment')} className="gap-1.5">
                  <Plus className="w-4 h-4" />
                  <span>New Assignment</span>
                </Button>
              </div>
            </div>

            {/* Upcoming Exams Highlights Strip (if any exams upcoming) */}
            {upcomingExams.length > 0 && filterType !== 'assignments' && (
              <div className="p-4 rounded-2xl bg-rose-500/[0.08] border border-rose-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    Upcoming Exam Schedule
                  </span>
                  <span className="text-[11px] font-mono text-rose-300/80">
                    {upcomingExams.length} scheduled
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {upcomingExams.map((exam) => {
                    const sub = subjects.find((s) => s.id === exam.subjectId);
                    const countdown = getExamCountdown(exam.dueDate);
                    const cleanTitle = exam.title.replace(/^exam:\s*/i, '').replace(/^\[exam\]\s*/i, '');
                    return (
                      <div
                        key={exam.id}
                        onClick={() => handleOpenAssignmentModal(exam)}
                        className="p-3 rounded-xl bg-surface/80 hover:bg-surface border border-rose-500/25 hover:border-rose-500/40 transition-all cursor-pointer space-y-1.5 group"
                      >
                        <div className="flex items-center justify-between gap-1">
                          {sub && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded font-mono truncate" style={{ backgroundColor: `${sub.color}25`, color: sub.color }}>
                              {sub.code || sub.title}
                            </span>
                          )}
                          {countdown && (
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                              countdown.urgency === 'urgent'
                                ? 'bg-rose-500 text-white font-bold animate-pulse'
                                : 'bg-rose-500/20 text-rose-300'
                            }`}>
                              {countdown.label}
                            </span>
                          )}
                        </div>
                        <h5 className="text-xs font-bold text-content-primary group-hover:text-rose-300 transition-colors truncate">
                          {cleanTitle}
                        </h5>
                        <div className="flex items-center gap-2 text-[11px] text-content-tertiary font-mono">
                          <Clock className="w-3 h-3 text-rose-400" />
                          <span>{formatDisplayDate(exam.dueDate!)}</span>
                          {exam.dueTime && <span>{exam.dueTime}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {filteredAssignments.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="No assignments recorded"
                description="Add assignments with deadlines, weight, scores, and track completion status."
                actionLabel="Add Assignment"
                onAction={() => handleOpenAssignmentModal()}
              />
            ) : (
              <div ref={assignmentsRef} className="space-y-4">
                {filteredAssignments.map((assign) => {
                  const subject = subjects.find((s) => s.id === assign.subjectId);
                  const isExam = isExamEntity(assign);
                  const countdown = getExamCountdown(assign.dueDate);
                  const cleanTitle = assign.title.replace(/^exam:\s*/i, '').replace(/^\[exam\]\s*/i, '');
                  const cleanDesc = assign.description?.replace(/\[EXAM\]\s*/g, '').trim();
                  const isLate = !isExam && assign.dueDate && isOverdue(assign.dueDate) && assign.status !== 'submitted' && assign.status !== 'graded';
                  const assignSubtasks = tasks.filter((t) => t.parentType === 'assignment' && t.parentId === assign.id);

                  return (
                    <div
                      key={assign.id}
                      className={`p-5 rounded-2xl glass-panel relative group space-y-4 transition-all shadow-sm ${
                        isExam ? 'hover:border-rose-500/40 border-rose-500/20' : 'hover:border-white/20'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 relative z-10">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {isExam && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 tracking-wider font-mono">
                                EXAM
                              </span>
                            )}
                            {isExam && countdown && (
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                                countdown.urgency === 'urgent'
                                  ? 'bg-rose-500 text-white font-bold'
                                  : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                              }`}>
                                {countdown.label}
                              </span>
                            )}
                            {subject && (
                              <span
                                className="text-[10px] px-2 py-0.5 rounded-full font-mono text-content-primary"
                                style={{ backgroundColor: `${subject.color}25`, border: `1px solid ${subject.color}50` }}
                              >
                                {subject.code || subject.title}
                              </span>
                            )}
                            <h4 className="text-base font-bold text-content-primary">{cleanTitle}</h4>
                          </div>
                          {cleanDesc && (
                            <p className="text-xs text-content-secondary max-w-xl">{cleanDesc}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 self-start">
                          <StatusBadge status={assign.status} size="sm" />
                          {isLate && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-accent-ember/15 text-accent-ember border border-accent-ember/30 font-semibold">
                              Late
                            </span>
                          )}

                          <button
                            onClick={() => handleOpenAssignmentModal(assign)}
                            className="p-1.5 rounded-lg text-content-tertiary hover:text-content-primary hover:bg-surface-hover"
                            title={isExam ? 'Edit Exam' : 'Edit Assignment'}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setItemToDelete({ type: 'assignment', id: assign.id, title: cleanTitle })}
                            className="p-1.5 rounded-lg text-content-tertiary hover:text-accent-ember hover:bg-surface-hover"
                            title={isExam ? 'Delete Exam' : 'Delete Assignment'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Meta stats bar */}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-content-tertiary pt-2 border-t border-border-subtle">
                        {assign.dueDate && (
                          <div className="flex items-center gap-1 font-mono">
                            <Calendar className={`w-3.5 h-3.5 ${isExam ? 'text-rose-400' : ''}`} />
                            <span>{isExam ? 'Exam Date' : 'Deadline'}: {formatDisplayDate(assign.dueDate)}</span>
                            {assign.dueTime && <span>at {assign.dueTime}</span>}
                          </div>
                        )}

                        {assign.weightPercent !== undefined && (
                          <div className="font-mono">Weight: {assign.weightPercent}%</div>
                        )}

                        {assign.scoreObtained !== undefined && assign.scoreMaximum !== undefined && (
                          <div className="font-mono text-accent-mint font-semibold">
                            Grade: {assign.scoreObtained} / {assign.scoreMaximum}
                          </div>
                        )}

                        {isValidWebUrl(assign.submissionUrl) && (
                          <a
                            href={assign.submissionUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-accent-mint hover:underline"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Portal Link</span>
                          </a>
                        )}
                      </div>

                      {/* Subtasks from Canonical Tasks table */}
                      <div className="p-3 rounded-xl bg-surface-hover/50 border border-border-subtle/50 space-y-2">
                        <div className="flex items-center justify-between text-xs font-semibold text-content-secondary">
                          <span>Subtasks ({assignSubtasks.filter((t) => t.status === 'done').length}/{assignSubtasks.length})</span>
                          <button
                            onClick={() => setActiveAssignmentForSubtask(activeAssignmentForSubtask === assign.id ? null : assign.id)}
                            className="text-accent-mint hover:underline text-[11px]"
                          >
                            {activeAssignmentForSubtask === assign.id ? 'Close' : '+ Add Subtask'}
                          </button>
                        </div>

                        {activeAssignmentForSubtask === assign.id && (
                          <form onSubmit={(e) => handleAddAssignmentSubtask(assign.id, e)} className="flex gap-2 pt-1">
                            <Input
                              placeholder="Add task for this assignment..."
                              value={newSubtaskTitle}
                              onChange={(e) => setNewSubtaskTitle(e.target.value)}
                              className="text-xs"
                              autoFocus
                            />
                            <Button type="submit" size="sm">
                              Add
                            </Button>
                          </form>
                        )}

                        {assignSubtasks.map((task) => (
                          <div key={task.id} className="flex items-center gap-2.5 text-xs">
                            <button
                              onClick={() => handleToggleSubtask(task)}
                              className="text-content-tertiary hover:text-accent-mint"
                            >
                              {task.status === 'done' ? (
                                <CheckCircle2 className="w-4 h-4 text-accent-mint" />
                              ) : (
                                <Circle className="w-4 h-4" />
                              )}
                            </button>
                            <span className={task.status === 'done' ? 'line-through text-content-tertiary' : 'text-content-primary'}>
                              {task.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Semester Modal */}
      <Modal isOpen={isSemesterModalOpen} onClose={() => setIsSemesterModalOpen(false)} title="New Semester">
        <form onSubmit={handleSaveSemester} className="space-y-4">
          <Input
            label="Semester Name"
            placeholder="e.g. Fall 2026 / Semester 1"
            value={semesterTitle}
            onChange={(e) => setSemesterTitle(e.target.value)}
            required
            autoFocus
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsSemesterModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Semester</Button>
          </div>
        </form>
      </Modal>

      {/* Subject Modal */}
      <Modal isOpen={isSubjectModalOpen} onClose={() => setIsSubjectModalOpen(false)} title="New Subject">
        <form onSubmit={handleSaveSubject} className="space-y-4">
          <Input
            label="Subject Title"
            placeholder="e.g. Data Structures & Algorithms"
            value={subjectTitle}
            onChange={(e) => setSubjectTitle(e.target.value)}
            required
            autoFocus
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Subject Code"
              placeholder="e.g. CS201"
              value={subjectCode}
              onChange={(e) => setSubjectCode(e.target.value)}
            />
            <Input
              label="Lecturer (Optional)"
              placeholder="e.g. Dr. Aris"
              value={subjectLecturer}
              onChange={(e) => setSubjectLecturer(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-content-secondary mb-1">Color Tag</label>
            <div className="flex gap-2">
              {['#A8DCC8', '#ECD29A', '#EEB2A3', '#9AC5EC', '#C59AEC', '#ECA0C5'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSubjectColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${
                    subjectColor === c ? 'scale-110 border-content-primary' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsSubjectModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Subject</Button>
          </div>
        </form>
      </Modal>

      {/* Assignment & Exam Modal */}
      <Modal
        isOpen={isAssignmentModalOpen}
        onClose={() => setIsAssignmentModalOpen(false)}
        title={
          assignmentToEdit
            ? deliverableType === 'exam'
              ? 'Edit Exam'
              : 'Edit Assignment'
            : deliverableType === 'exam'
            ? 'Schedule Exam / Test'
            : 'New Assignment'
        }
        maxWidth="lg"
      >
        <form onSubmit={handleSaveAssignment} className="space-y-4">
          {/* Deliverable Type Switcher */}
          {!assignmentToEdit && (
            <div className="flex items-center gap-2 p-1 rounded-xl bg-surface border border-border-subtle">
              <button
                type="button"
                onClick={() => setDeliverableType('assignment')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  deliverableType === 'assignment'
                    ? 'bg-accent-mint text-navy-950 shadow-sm'
                    : 'text-content-secondary hover:text-content-primary'
                }`}
              >
                Assignment
              </button>
              <button
                type="button"
                onClick={() => setDeliverableType('exam')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  deliverableType === 'exam'
                    ? 'bg-rose-500 text-white shadow-sm'
                    : 'text-content-secondary hover:text-content-primary'
                }`}
              >
                Exam / Test
              </button>
            </div>
          )}

          <Input
            label={deliverableType === 'exam' ? 'Exam Title' : 'Assignment Title'}
            placeholder={deliverableType === 'exam' ? 'e.g. Midterm Examination, Final Exam' : 'e.g. Final Research Project'}
            value={assignTitle}
            onChange={(e) => setAssignTitle(e.target.value)}
            required
            autoFocus
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Status"
              value={assignStatus}
              onChange={(e) => setAssignStatus(e.target.value as AssignmentStatus)}
              options={
                deliverableType === 'exam'
                  ? [
                      { value: 'not_started', label: 'Upcoming' },
                      { value: 'in_progress', label: 'Revising' },
                      { value: 'submitted', label: 'Completed' },
                      { value: 'graded', label: 'Graded' },
                    ]
                  : [
                      { value: 'not_started', label: 'Not Started' },
                      { value: 'in_progress', label: 'In Progress' },
                      { value: 'submitted', label: 'Submitted' },
                      { value: 'graded', label: 'Graded' },
                    ]
              }
            />
            <Input
              label={deliverableType === 'exam' ? 'Portal / Timetable Link' : 'Submission URL'}
              placeholder="https://canvas.edu/..."
              value={assignUrl}
              onChange={(e) => setAssignUrl(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label={deliverableType === 'exam' ? 'Exam Date' : 'Due Date'}
              type="date"
              value={assignDueDate}
              onChange={(e) => setAssignDueDate(e.target.value)}
            />
            <Input
              label={deliverableType === 'exam' ? 'Exam Time' : 'Due Time'}
              type="time"
              value={assignDueTime}
              onChange={(e) => setAssignDueTime(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Weight (%)"
              type="number"
              placeholder="e.g. 40"
              value={assignWeight}
              onChange={(e) => setAssignWeight(e.target.value)}
            />
            <Input
              label="Score Obtained"
              type="number"
              placeholder="e.g. 88"
              value={assignScoreObtained}
              onChange={(e) => setAssignScoreObtained(e.target.value)}
            />
            <Input
              label="Score Max"
              type="number"
              placeholder="e.g. 100"
              value={assignScoreMax}
              onChange={(e) => setAssignScoreMax(e.target.value)}
            />
          </div>

          <Textarea
            label={deliverableType === 'exam' ? 'Exam Venue / Hall / Syllabus Notes' : 'Description / Requirements'}
            placeholder={deliverableType === 'exam' ? 'e.g. Exam Hall B, Seat 42. Chapters 1-6.' : 'Outline instructions, rubric criteria...'}
            value={assignDescription}
            onChange={(e) => setAssignDescription(e.target.value)}
            rows={3}
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-border-subtle">
            <Button type="button" variant="ghost" onClick={() => setIsAssignmentModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {assignmentToEdit
                ? 'Save Changes'
                : deliverableType === 'exam'
                ? 'Schedule Exam'
                : 'Create Assignment'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Item Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleDeleteItem}
        title={`Delete ${itemToDelete?.type}?`}
        description={`Are you sure you want to delete "${itemToDelete?.title}"? Any child items will be deleted safely.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
};
