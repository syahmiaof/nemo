import { describe, it, expect } from 'vitest';
import { parseNotesSubtasks, serializeNotesSubtasks } from '@/features/tasks/SubtaskSection';

describe('Tasks Motion & Subtasks Engine', () => {
  it('parses markdown checklists from notes accurately', () => {
    const rawNotes = `Initial draft notes.
- [ ] Research competitor features
- [x] Create Figma tokens
- [ ] Implement GSAP animations
General concluding remarks.`;

    const { subtasks, otherNotes } = parseNotesSubtasks(rawNotes);

    expect(subtasks).toHaveLength(3);
    expect(subtasks[0]).toEqual({
      id: expect.any(String),
      text: 'Research competitor features',
      completed: false,
    });
    expect(subtasks[1]).toEqual({
      id: expect.any(String),
      text: 'Create Figma tokens',
      completed: true,
    });
    expect(subtasks[2]).toEqual({
      id: expect.any(String),
      text: 'Implement GSAP animations',
      completed: false,
    });

    expect(otherNotes).toContain('Initial draft notes.');
    expect(otherNotes).toContain('General concluding remarks.');
  });

  it('serializes updated subtasks back into clean markdown notes', () => {
    const initialSubtasks = [
      { id: '1', text: 'Step 1', completed: true },
      { id: '2', text: 'Step 2', completed: false },
    ];
    const initialOther = ['Top level context'];

    const serialized = serializeNotesSubtasks(initialSubtasks, initialOther);
    expect(serialized).toContain('Top level context');
    expect(serialized).toContain('- [x] Step 1');
    expect(serialized).toContain('- [ ] Step 2');

    // Round-trip verification
    const parsed = parseNotesSubtasks(serialized);
    expect(parsed.subtasks).toHaveLength(2);
    expect(parsed.subtasks[0].completed).toBe(true);
    expect(parsed.subtasks[1].completed).toBe(false);
  });

  it('handles empty or undefined notes gracefully', () => {
    const empty = parseNotesSubtasks(undefined);
    expect(empty.subtasks).toEqual([]);
    expect(empty.otherNotes).toEqual([]);

    const serializedEmpty = serializeNotesSubtasks([], []);
    expect(serializedEmpty).toBe('');
  });
});
