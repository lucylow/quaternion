/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { screen, fireEvent, waitFor } from '@testing-library/dom';
import '@testing-library/jest-dom';
import { JudgeHUD } from '../components/game/JudgeHUD';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(() => Promise.resolve()),
  },
});

describe('JudgeHUD', () => {
  const mockProps = {
    seed: 12345,
    commanderId: 'AUREN',
    mapConfig: {
      type: 'Crystalline Plains',
      width: 40,
      height: 30,
    },
    outcome: 'Victory',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders summary and 3 AI highlights after successful generation', async () => {
    // Mock successful fetch response
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            replayId: 'test-replay-001',
            url: 'https://example.com/replay.json.gz',
            summary: 'A test game showing strategic dominance through resource control.',
            aiHighlights: [
              { t: 45, actor: 'AUREN', action: 'Quantum Core', reason: 'Strategic placement enabled 20% efficiency boost.' },
              { t: 120, actor: 'Player', action: 'Mass Deploy', reason: 'Captured critical node shifting control to 60/40.' },
              { t: 180, actor: 'VIREL', action: 'Reactor Overclock', reason: 'Energy surge powered final push overwhelming defenses.' },
            ],
            meta: {
              engineCommit: 'abc123',
              partial: false,
              contentHash: 'sha256:test',
            },
          }),
      } as Response)
    );

    render(<JudgeHUD {...mockProps} />);

    // Click Generate Replay
    const generateBtn = screen.getByText(/Generate Replay/i);
    fireEvent.click(generateBtn);

    // Wait for summary to appear
    await waitFor(() => {
      expect(screen.getByText(/test game showing strategic dominance/i)).toBeInTheDocument();
    });

    // Check for 3 AI highlights
    expect(screen.getByText(/Quantum Core/i)).toBeInTheDocument();
    expect(screen.getByText(/Mass Deploy/i)).toBeInTheDocument();
    expect(screen.getByText(/Reactor Overclock/i)).toBeInTheDocument();
  });

  it('shows warning badge when meta.partial is true', async () => {
    // Mock partial replay response
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            replayId: 'partial-replay-001',
            url: 'https://example.com/partial.json.gz',
            summary: 'Partial replay with summarized ticks.',
            aiHighlights: [],
            meta: {
              engineCommit: 'def456',
              partial: true,
              contentHash: 'sha256:partial',
              nonDeterminism: {
                reason: 'Ticks 95-145 summarized due to non-deterministic pathfinding.',
              },
            },
          }),
      } as Response)
    );

    render(<JudgeHUD {...mockProps} />);

    const generateBtn = screen.getByText(/Generate Replay/i);
    fireEvent.click(generateBtn);

    // Wait for partial warning
    await waitFor(() => {
      expect(screen.getByText(/Partial Replay/i)).toBeInTheDocument();
    });

    // Check for nonDeterminism reason
    expect(screen.getByText(/non-deterministic pathfinding/i)).toBeInTheDocument();
  });

  it('copies share link to clipboard when Share button clicked', async () => {
    // Mock successful fetch
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            replayId: 'share-test-001',
            url: 'https://example.com/share.json.gz',
            summary: 'Test replay for sharing.',
            aiHighlights: [],
            meta: {
              engineCommit: 'ghi789',
              partial: false,
              contentHash: 'sha256:share',
            },
          }),
      } as Response)
    );

    render(<JudgeHUD {...mockProps} />);

    // Generate replay first
    const generateBtn = screen.getByText(/Generate Replay/i);
    fireEvent.click(generateBtn);

    // Wait for share button to appear
    await waitFor(() => {
      expect(screen.getByLabelText(/Share replay link/i)).toBeInTheDocument();
    });

    // Click share button
    const shareBtn = screen.getByLabelText(/Share replay link/i);
    fireEvent.click(shareBtn);

    // Verify clipboard was called
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://example.com/share.json.gz');
  });
});
