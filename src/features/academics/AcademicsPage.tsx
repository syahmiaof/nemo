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
} from 'lucide-react';
import { db } from '@/db/nemoDb';
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
import type { Assignment, AssignmentStatus, Task } from '@/domain/types';

export const AcademicsPage: React.FC = () => {
  const { success, error } = useToast();
  const todayStr = getTodayLocalDateString();

  // Modals state
  const [isSemesterModalOpen, setIsSemesterModalOpen] = useState(false);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [assignmentToEdit, setAssignmentToEdit] = useState<Assignment | null>(null);

  // Active selections
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');

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

  const handleOpenAssignmentModal = (assignment?: Assignment) => {
    if (assignment) {
      setAssignmentToEdit(assignment);
      setAssignTitle(assignment.title);
      setAssignDescription(assignment.description || '');
      setAssignStatus(assignment.status);
      setAssignDueDate(assignment.dueDate || '');
      setAssignDueTime(assignment.dueTime || '');
      setAssignUrl(assignment.submissionUrl || '');
      setAssignWeight(assignment.weightPercent?.toString() || '');
      setAssignScoreObtained(assignment.scoreObtained?.toString() || '');
      setAssignScoreMax(assignment.scoreMaximum?.toString() || '');
    } else {
      setAssignmentToEdit(null);
      setAssignTitle('');
      setAssignDescription('');
      setAssignStatus('not_started');
      setAssignDueDate(todayStr);
      setAssignDueTime('');
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

    const now = new Date().toISOString();
    const weightPercent = assignWeight ? parseFloat(assignWeight) : undefined;
    const scoreObtained = assignScoreObtained ? parseFloat(assignScoreObtained) : undefined;
    const scoreMaximum = assignScoreMax ? parseFloat(assignScoreMax) : undefined;

    if (assignmentToEdit) {
      await db.assignments.update(assignmentToEdit.id, {
        title: assignTitle.trim(),
        description: assignDescription.trim() || undefined,
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
      success('Assignment updated');
    } else {
      await db.assignments.add({
        id: generateId('assign'),
        subjectId: targetSubjectId,
        title: assignTitle.trim(),
        description: assignDescription.trim() || undefined,
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
      success('Assignment added');
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
    await db.tasks.update(task.id, {
      status: nextStatus,
      completedAt: nextStatus === 'done' ? new Date().toISOString() : undefined,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    if (itemToDelete.type === 'semester') {
      await db.semesters.delete(itemToDelete.id);
    } else if (itemToDelete.type === 'subject') {
      await db.subjects.delete(itemToDelete.id);
      await db.assignments.where('subjectId').equals(itemToDelete.id).delete();
    } else if (itemToDelete.type === 'assignment') {
      await db.assignments.delete(itemToDelete.id);
      await db.tasks.where('parentId').equals(itemToDelete.id).delete();
    }
    setItemToDelete(null);
    success('Item deleted');
  };

  const filteredAssignments = selectedSubjectId
    ? assignments.filter((a) => a.subjectId === selectedSubjectId)
    : assignments;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header & Semester Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl glass-panel relative z-10">
        <div className="flex items-center gap-3 relative z-10">
          <div className="p-3 rounded-xl bg-white/[0.06] border border-white/10 text-accent-mint">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-content-primary">Academic Track</h2>
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

          {/* Right 3 Cols: Assignments */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono uppercase tracking-wider text-content-tertiary">
                Assignments & Coursework ({filteredAssignments.length})
              </h3>
              <Button size="sm" onClick={() => handleOpenAssignmentModal()} className="gap-1.5">
                <Plus className="w-4 h-4" />
                <span>New Assignment</span>
              </Button>
            </div>

            {filteredAssignments.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="No assignments recorded"
                description="Add assignments with deadlines, weight, scores, and track completion status."
                actionLabel="Add Assignment"
                onAction={() => handleOpenAssignmentModal()}
              />
            ) : (
              <div className="space-y-4">
                {filteredAssignments.map((assign) => {
                  const subject = subjects.find((s) => s.id === assign.subjectId);
                  const isLate = assign.dueDate && isOverdue(assign.dueDate) && assign.status !== 'submitted' && assign.status !== 'graded';
                  const assignSubtasks = tasks.filter((t) => t.parentType === 'assignment' && t.parentId === assign.id);

                  return (
                    <div
                      key={assign.id}
                      className="p-5 rounded-2xl glass-panel relative group space-y-4 hover:border-white/20 transition-all shadow-sm"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 relative z-10">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {subject && (
                              <span
                                className="text-[10px] px-2 py-0.5 rounded-full font-mono text-content-primary"
                                style={{ backgroundColor: `${subject.color}25`, border: `1px solid ${subject.color}50` }}
                              >
                                {subject.code || subject.title}
                              </span>
                            )}
                            <h4 className="text-base font-bold text-content-primary">{assign.title}</h4>
                          </div>
                          {assign.description && (
                            <p className="text-xs text-content-secondary max-w-xl">{assign.description}</p>
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
                            title="Edit Assignment"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setItemToDelete({ type: 'assignment', id: assign.id, title: assign.title })}
                            className="p-1.5 rounded-lg text-content-tertiary hover:text-accent-ember hover:bg-surface-hover"
                            title="Delete Assignment"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Meta stats bar */}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-content-tertiary pt-2 border-t border-border-subtle">
                        {assign.dueDate && (
                          <div className="flex items-center gap-1 font-mono">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Deadline: {formatDisplayDate(assign.dueDate)}</span>
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

                        {assign.submissionUrl && (
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

      {/* Assignment Modal */}
      <Modal
        isOpen={isAssignmentModalOpen}
        onClose={() => setIsAssignmentModalOpen(false)}
        title={assignmentToEdit ? 'Edit Assignment' : 'New Assignment'}
        maxWidth="lg"
      >
        <form onSubmit={handleSaveAssignment} className="space-y-4">
          <Input
            label="Assignment Title"
            placeholder="e.g. Final Research Project"
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
              options={[
                { value: 'not_started', label: 'Not Started' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'submitted', label: 'Submitted' },
                { value: 'graded', label: 'Graded' },
              ]}
            />
            <Input
              label="Submission URL"
              placeholder="https://canvas.edu/..."
              value={assignUrl}
              onChange={(e) => setAssignUrl(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Due Date"
              type="date"
              value={assignDueDate}
              onChange={(e) => setAssignDueDate(e.target.value)}
            />
            <Input
              label="Due Time"
              type="time"
              value={assignDueTime}
              onChange={(e) => setAssignDueTime(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Weight (%)"
              type="number"
              placeholder="e.g. 25"
              value={assignWeight}
              onChange={(e) => setAssignWeight(e.target.value)}
            />
            <Input
              label="Score Obtained"
              type="number"
              placeholder="e.g. 92"
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
            label="Description / Requirements"
            placeholder="Outline instructions, rubric criteria..."
            value={assignDescription}
            onChange={(e) => setAssignDescription(e.target.value)}
            rows={3}
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-border-subtle">
            <Button type="button" variant="ghost" onClick={() => setIsAssignmentModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {assignmentToEdit ? 'Save Changes' : 'Create Assignment'}
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
