import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { db } from '@/db/nemoDb';
import { generateId } from '@/lib/ids';
import { isValidWebUrl, getProjectWebPreviewUrl, getFallbackWebPreviewUrl } from '@/lib/utils';
import { resizeAndCompressCover } from '@/lib/avatar';
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
  const [customPreviewUrl, setCustomPreviewUrl] = useState('');
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
          if (blob) {
            setImageBlobData(blob.data);
            if (blob.data.startsWith('http')) {
              setCustomPreviewUrl(blob.data);
            }
          }
        });
      } else {
        setCustomPreviewUrl('');
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
      setCustomPreviewUrl('');
      setImageBlobData(null);
      setIsImageDirty(false);
    }
  }, [projectToEdit, isOpen]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      error('Invalid file type', 'Please select a valid image file (JPEG, PNG, WebP, or GIF).');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      error('File too large', 'Please choose an image under 20MB.');
      return;
    }

    try {
      const compressed = await resizeAndCompressCover(file, 1280, 0.82);
      setImageBlobData(compressed.dataUrl);
      setIsImageDirty(true);
      success('Cover loaded', 'Image compressed and preview ready.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not process image';
      error('Upload error', msg);
    }
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

        {/* Cover Image / Web Preview */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-content-secondary">
            Project Screenshot / Cover Preview
          </label>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Input
              placeholder="Paste Image URL or Web Preview Link (e.g. https://...)"
              value={customPreviewUrl}
              onChange={(e) => {
                const val = e.target.value;
                setCustomPreviewUrl(val);
                if (val.trim()) {
                  const resolved = getProjectWebPreviewUrl(val.trim()) || val.trim();
                  setImageBlobData(resolved);
                  setIsImageDirty(true);
                } else {
                  setImageBlobData(null);
                  setIsImageDirty(true);
                }
              }}
              className="flex-1 text-xs"
            />
            {liveUrl.trim() && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  const generated = getProjectWebPreviewUrl(liveUrl.trim());
                  if (generated) {
                    setCustomPreviewUrl(generated);
                    setImageBlobData(generated);
                    setIsImageDirty(true);
                    success('Preview Generated', 'Fetched live web screenshot for preview.');
                  }
                }}
                className="text-xs whitespace-nowrap shrink-0"
              >
                Fetch from Live URL
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3 pt-1">
            <span className="text-[11px] text-content-tertiary">Or upload file:</span>
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
                onClick={() => {
                  setImageBlobData(null);
                  setCustomPreviewUrl('');
                  setIsImageDirty(true);
                }}
                className="text-accent-ember text-xs"
              >
                Remove
              </Button>
            )}
          </div>

          {imageBlobData && (
            <div className="mt-2 rounded-xl overflow-hidden border border-accent-mint/40 max-h-40 w-full relative group">
              <img
                src={imageBlobData}
                alt="Active Cover Preview"
                className="w-full h-40 object-cover"
                onError={() => {
                  const fb = getFallbackWebPreviewUrl(liveUrl);
                  if (fb && imageBlobData !== fb) {
                    setImageBlobData(fb);
                  }
                }}
              />
              <span className="absolute bottom-2 right-2 px-2.5 py-1 rounded-md bg-navy-950/85 text-[10px] text-accent-mint font-semibold border border-accent-mint/30 shadow-md">
                Active Cover Preview
              </span>
            </div>
          )}

          {!imageBlobData && getProjectWebPreviewUrl(liveUrl) && (
            <div className="mt-2 rounded-xl overflow-hidden border border-accent-mint/30 bg-surface-subtle p-2 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-accent-mint font-medium px-1">
                <span>Auto URL Preview (WhatsApp-style)</span>
                <span className="text-[10px] text-content-tertiary">Live web screenshot</span>
              </div>
              <div className="rounded-lg overflow-hidden border border-border-subtle max-h-36 w-full">
                <img
                  src={getProjectWebPreviewUrl(liveUrl)!}
                  alt="Live URL Preview"
                  className="w-full h-36 object-cover"
                  onError={(e) => {
                    const fb = getFallbackWebPreviewUrl(liveUrl);
                    if (fb) (e.target as HTMLImageElement).src = fb;
                  }}
                />
              </div>
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
