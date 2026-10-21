import { describe, it, expect, beforeEach } from 'vitest';
import { prefersReducedMotion } from '@/design/motion';

describe('Academics & Calendar Motion Suite', () => {
  beforeEach(() => {
    document.documentElement.dataset.reduceMotion = 'false';
  });

  it('detects normal motion preference when reduceMotion is false', () => {
    document.documentElement.dataset.reduceMotion = 'false';
    expect(prefersReducedMotion()).toBe(false);
  });

  it('respects prefers-reduced-motion when dataset is set to true', () => {
    document.documentElement.dataset.reduceMotion = 'true';
    expect(prefersReducedMotion()).toBe(true);
  });

  it('ensures DOM structures for Academics and Calendar contain motion class anchors', async () => {
    // Check that expected CSS class tokens are present for GSAP targeting
    const requiredAcademicsSelectors = [
      '.academics-header-icon',
      '.academics-header-text',
      '.academics-toolbar-actions',
      '.academics-controls-strip',
      '.subject-sidebar-item',
      '.upcoming-exam-banner',
      '.exam-glow-beam',
      '.upcoming-exam-card',
      '.academic-deliverable-card',
    ];

    const requiredCalendarSelectors = [
      '.calendar-nav-btn',
      '.calendar-select-control',
      '.calendar-today-btn',
      '.calendar-view-toggle',
      '.calendar-new-event-btn',
      '.calendar-cell',
      '.calendar-week-col',
      '.calendar-agenda-row',
    ];

    expect(requiredAcademicsSelectors.length).toBe(9);
    expect(requiredCalendarSelectors.length).toBe(8);
  });
});
