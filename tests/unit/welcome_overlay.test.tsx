import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { WelcomeOverlay, replayWelcomeAnimation } from '@/app/WelcomeOverlay';
import { db } from '@/db/nemoDb';

describe('WelcomeOverlay Signature Launch Experience', () => {
  beforeEach(async () => {
    localStorage.clear();
    sessionStorage.clear();
    // Ensure default settings exist in DB
    await db.settings.put({
      id: 'default',
      displayName: 'Alex',
      theme: 'dark',
      accent: 'mint',
      weekStartsOn: 1,
      hourFormat: '24h',
      reduceMotion: false,
      onboardingCompleted: true,
      databaseVersion: 1,
    });
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('renders official brand elements: nemo. wordmark, tagline, and emblem', async () => {
    render(<WelcomeOverlay />);

    expect(screen.getByRole('dialog', { name: /welcome to nemo/i })).toBeInTheDocument();
    expect(screen.getByText('nemo')).toBeInTheDocument();
    expect(screen.getByText('Track it, finish it.')).toBeInTheDocument();

    // Verify readiness state gets reached
    await waitFor(() => {
      expect(screen.getByText(/workspace ready/i)).toBeInTheDocument();
    });
  });

  it('dismisses immediately on Escape key press and persists to localStorage', async () => {
    const onComplete = vi.fn();
    render(<WelcomeOverlay onComplete={onComplete} />);

    expect(screen.getByRole('dialog', { name: /welcome to nemo/i })).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(localStorage.getItem('nemo_welcome_seen')).toBeTruthy();
    expect(sessionStorage.getItem('nemo_session_welcomed')).toBe('true');
  });

  it('dismisses immediately on click and marks session as welcomed', async () => {
    render(<WelcomeOverlay />);
    const overlay = screen.getByRole('dialog', { name: /welcome to nemo/i });

    fireEvent.click(overlay);

    expect(localStorage.getItem('nemo_welcome_seen')).toBeTruthy();
    expect(sessionStorage.getItem('nemo_session_welcomed')).toBe('true');
  });

  it('does not auto-open if session was already welcomed in current tab', () => {
    sessionStorage.setItem('nemo_session_welcomed', 'true');
    render(<WelcomeOverlay />);

    expect(screen.queryByRole('dialog', { name: /welcome to nemo/i })).not.toBeInTheDocument();
  });

  it('re-opens full launch experience when replayWelcomeAnimation event is dispatched', async () => {
    sessionStorage.setItem('nemo_session_welcomed', 'true');
    render(<WelcomeOverlay />);

    expect(screen.queryByRole('dialog', { name: /welcome to nemo/i })).not.toBeInTheDocument();

    // Trigger replay event
    act(() => {
      replayWelcomeAnimation();
    });

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /welcome to nemo/i })).toBeInTheDocument();
    });
  });
});
