import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { db } from '@/db/nemoDb';
import { generateId } from '@/lib/ids';
import { isValidWebUrl } from '@/lib/utils';
import type { Project, Priority, ProjectStatus } from '@/domain/types';

interface ProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectToEdit?: Project | null;
}

export const ProjectFormModal: React.FC<ProjectFormModalProps> = ({
  isOpen,
  onClose,
  projectToEdit,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [clientLabel, setClientLabel] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [status, setStatus] = useState<ProjectStatus>('not_started');
  const [dueDate, setDueDate] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [techStackInput, setTechStackInput] = useState('');
  const [liveUrl, setLiveUrl] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [imageBlobData, setImageBlobData] = useState<string | null>(null);
  const [isImageDirty, setIsImageDirty] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { success, error } = useToast();

  useEffect(() => {
    if (projectToEdit) {
      setTitle(projectToEdit.title);
      setDescription(projectToEdit.description || '');
      setCategory(projectToEdit.category || '');
      setClientLabel(projectToEdit.clientLabel || '');
      setPriority(projectToEdit.priority);
      setStatus(projectToEdit.status);
      setDueDate(projectToEdit.dueDate || '');
      setTagsInput(projectToEdit.tags.join(', '));
      setTechStackInput(projectToEdit.techStack.join(', '));
      setLiveUrl(projectToEdit.liveUrl || '');
      setRepoUrl(projectToEdit.repoUrl || '');
      setNotes(projectToEdit.notes || '');

      if (projectToEdit.previewBlobId) {
        db.assetBlobs.get(projectToEdit.previewBlobId).then((blob) => {
          if (blob) setImageBlobData(blob.data);
        });
      }
    } else {
      setTitle('');
      setDescription('');
      setCategory('');
      setClientLabel('');
      setPriority('medium');
      setStatus('not_started');
      setDueDate('');
      setTagsInput('');
      setTechStackInput('');
      setLiveUrl('');
      setRepoUrl('');
      setNotes('');
      setImageBlobData(null);
      setIsImageDirty(false);
    }
  }, [projectToEdit, isOpen]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      error('File too large', 'Please choose an image under 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageBlobData(reader.result);
        setIsImageDirty(true);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      error('Title required', 'Please provide a project title.');
      return;
    }

    if (liveUrl && !isValidWebUrl(liveUrl)) {
      error('Invalid Live URL', 'Must be a valid web URL starting with http:// or https://');
      return;
    }

    if (repoUrl && !isValidWebUrl(repoUrl)) {
      error('Invalid Repository URL', 'Must be a valid web URL starting with http:// or https://');
      return;
    }

    setIsSubmitting(true);
    const now = new Date().toISOString();

    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      const techStack = techStackInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      let previewBlobId = projectToEdit?.previewBlobId;

      if (imageBlobData && (isImageDirty || !previewBlobId)) {
        // If replacing existing image, remove previous blob to avoid orphan leaks
        if (projectToEdit?.previewBlobId) {
          await db.assetBlobs.delete(projectToEdit.previewBlobId);
        }
        previewBlobId = generateId('blob');
        await db.assetBlobs.put({
          id: previewBlobId,
          ownerType: 'project',
          ownerId: projectToEdit ? projectToEdit.id : 'pending',
          mimeType: 'image/png',
          size: imageBlobData.length,
          data: imageBlobData,
          createdAt: now,
        });
      } else if (!imageBlobData && projectToEdit?.previewBlobId) {
        // User removed the image cover
        await db.assetBlobs.delete(projectToEdit.previewBlobId);
        previewBlobId = undefined;
      }

      if (projectToEdit) {
        // Updating existing project
        const isCompletingNow = status === 'completed' && projectToEdit.status !== 'completed';
        const isReopeningNow = status !== 'completed' && projectToEdit.status === 'completed';

        let completedAt = projectToEdit.completedAt;
        if (isCompletingNow) {
          completedAt = now;
        } else if (isReopeningNow) {
          completedAt = undefined;
        }

        await db.projects.update(projectToEdit.id, {
          title: title.trim(),
          description: description.trim() || undefined,
          category: category.trim() || undefined,
          clientLabel: clientLabel.trim() || undefined,
          priority,
          status,
          dueDate: dueDate || undefined,
          completedAt,
          tags,
          techStack,
          liveUrl: liveUrl.trim() || undefined,
          repoUrl: repoUrl.trim() || undefined,
          notes: notes.trim() || undefined,
          previewBlobId,
          updatedAt: now,
        });

        success('Project updated', `"${title.trim()}" has been saved.`);
      } else {
        // Creating new project
        const id = generateId('proj');
        if (previewBlobId) {
          await db.assetBlobs.update(previewBlobId, { ownerId: id });
        }

        await db.projects.add({
          id,
          title: title.trim(),
          description: description.trim() || undefined,
          category: category.trim() || undefined,
          clientLabel: clientLabel.trim() || undefined,
          priority,
          status,
          dueDate: dueDate || undefined,
          completedAt: status === 'completed' ? now : undefined,
          tags,
          techStack,
          liveUrl: liveUrl.trim() || undefined,
          repoUrl: repoUrl.trim() || undefined,
          notes: notes.trim() || undefined,
          previewBlobId,
          createdAt: now,
          updatedAt: now,
        });

        success('Project created', `"${title.trim()}" is ready.`);
      }

      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save project';
      error('Error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={projectToEdit ? 'Edit Project' : 'New Project'}
      description="Define project metadata, dates, links, and local cover."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Project Title"
          placeholder="e.g. Mobile Banking App"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Category"
            placeholder="e.g. Client Work, Open Source"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <Input
            label="Client Label (Optional)"
            placeholder="e.g. Acme Corp"
            value={clientLabel}
            onChange={(e) => setClientLabel(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as ProjectStatus)}
            options={[
              { value: 'not_started', label: 'Not Started' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'on_hold', label: 'On Hold' },
              { value: 'completed', label: 'Completed' },
            ]}
          />

          <Select
            label="Priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
            options={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
              { value: 'urgent', label: 'Urgent' },
            ]}
          />

          <Input
            label="Target Due Date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Tech Stack (comma separated)"
            placeholder="React, TypeScript, Tailwind"
            value={techStackInput}
            onChange={(e) => setTechStackInput(e.target.value)}
          />
          <Input
            label="Tags (comma separated)"
            placeholder="mobile, frontend, v1"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Live URL (Optional)"
            placeholder="https://example.com"
            value={liveUrl}
            onChange={(e) => setLiveUrl(e.target.value)}
          />
          <Input
            label="Repository URL (Optional)"
            placeholder="https://github.com/..."
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
          />
        </div>

        {/* Cover Image Upload (Local blob, zero cloud dependency) */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-content-secondary">
            Project Screenshot / Cover Image (Stored locally in IndexedDB)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="text-xs text-content-tertiary file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-surface-hover file:text-content-primary hover:file:bg-surface-solid cursor-pointer"
            />
            {imageBlobData && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setImageBlobData(null)}
                className="text-accent-ember text-xs"
              >
                Remove
              </Button>
            )}
          </div>
          {imageBlobData && (
            <div className="mt-2 rounded-xl overflow-hidden border border-border-subtle max-h-36 w-full">
              <img src={imageBlobData} alt="Preview" className="w-full h-36 object-cover" />
            </div>
          )}
        </div>

        <Textarea
          label="Project Notes & Context"
          placeholder="Detailed goals, key requirements, or reference links..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-subtle">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {projectToEdit ? 'Save Changes' : 'Create Project'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
