import { Platform } from 'react-native';

import {
  API_FALLBACK_BASE_URL,
  buildProgressSummary,
  computeRemainingSeconds,
  formatCountdown,
  getApiBaseUrl,
  getIntegrityCapabilities,
  getResultMessage,
  normalizeApiError,
} from '@/lib/student-app/utils';

describe('student app utils', () => {
  it('returns the fallback backend URL when env is not set', () => {
    expect(API_FALLBACK_BASE_URL).toBe('https://backend.zbymba4.workers.dev');
  });

  it('parses API error messages from JSON responses', () => {
    const error = new Error(JSON.stringify({ error: { message: 'Room code invalid' } }));

    expect(normalizeApiError(error, 'fallback')).toBe('Room code invalid');
  });

  it('formats countdown values safely', () => {
    expect(formatCountdown(125)).toBe('02:05');
    expect(formatCountdown(-1)).toBe('00:00');
  });

  it('never returns negative remaining seconds', () => {
    const originalNow = Date.now;
    Date.now = jest.fn(() => 1_000);

    expect(computeRemainingSeconds(900)).toBe(0);
    expect(computeRemainingSeconds(2_500)).toBe(2);

    Date.now = originalNow;
  });

  it('maps score bands to encouraging result messages', () => {
    expect(getResultMessage(95)).toContain('Excellent');
    expect(getResultMessage(78)).toContain('Strong result');
    expect(getResultMessage(45)).toContain('starting point');
  });
});

describe('normalizeApiError edge cases', () => {
  it('returns fallback for non-Error values', () => {
    expect(normalizeApiError('string error', 'fb')).toBe('fb');
    expect(normalizeApiError(null, 'fb')).toBe('fb');
    expect(normalizeApiError(undefined, 'fb')).toBe('fb');
  });

  it('returns raw message when not valid JSON', () => {
    const error = new Error('plain text error');
    expect(normalizeApiError(error, 'fb')).toBe('plain text error');
  });

  it('extracts top-level message from JSON', () => {
    const error = new Error(JSON.stringify({ message: 'Top level' }));
    expect(normalizeApiError(error, 'fb')).toBe('Top level');
  });

  it('extracts string error from JSON', () => {
    const error = new Error(JSON.stringify({ error: 'String error' }));
    expect(normalizeApiError(error, 'fb')).toBe('String error');
  });

  it('returns fallback when JSON has no extractable message', () => {
    const error = new Error(JSON.stringify({ other: 'data' }));
    expect(normalizeApiError(error, 'fb')).toBe('fb');
  });
});

describe('getApiBaseUrl', () => {
  const originalEnv = process.env.EXPO_PUBLIC_API_BASE_URL;

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.EXPO_PUBLIC_API_BASE_URL = originalEnv;
    } else {
      delete process.env.EXPO_PUBLIC_API_BASE_URL;
    }
  });

  it('returns env URL when set', () => {
    process.env.EXPO_PUBLIC_API_BASE_URL = 'https://custom.api.com';
    expect(getApiBaseUrl()).toBe('https://custom.api.com');
  });

  it('returns fallback when env is empty', () => {
    process.env.EXPO_PUBLIC_API_BASE_URL = '';
    expect(getApiBaseUrl()).toBe(API_FALLBACK_BASE_URL);
  });
});

describe('computeRemainingSeconds', () => {
  it('returns 0 for null input', () => {
    expect(computeRemainingSeconds(null)).toBe(0);
  });
});

describe('formatCountdown', () => {
  it('formats zero seconds', () => {
    expect(formatCountdown(0)).toBe('00:00');
  });

  it('formats exactly one hour', () => {
    expect(formatCountdown(3600)).toBe('60:00');
  });
});

describe('platform integrity capabilities', () => {
  it('returns a structured capability object', () => {
    expect(getIntegrityCapabilities()).toMatchObject({
      screenshotProtectionSupported: false,
      backgroundDetectionSupported: true,
    });
  });

  it('uses the current platform value', () => {
    expect(['android', 'ios', 'web']).toContain(Platform.OS);
  });
});

describe('buildProgressSummary', () => {
  it('builds summary stats from history rows', () => {
    const summary = buildProgressSummary([
      {
        sessionId: '1',
        examId: 'e1',
        title: 'Exam 1',
        status: 'graded',
        score: 80,
        earnedPoints: 8,
        totalPoints: 10,
        scheduledAt: '2026-03-01T10:00:00.000Z',
        startedAt: '2026-03-01T10:00:00.000Z',
        submittedAt: '2026-03-01T10:30:00.000Z',
      },
      {
        sessionId: '2',
        examId: 'e2',
        title: 'Exam 2',
        status: 'graded',
        score: 90,
        earnedPoints: 9,
        totalPoints: 10,
        scheduledAt: '2026-03-02T10:00:00.000Z',
        startedAt: '2026-03-02T10:00:00.000Z',
        submittedAt: '2026-03-02T10:30:00.000Z',
      },
    ]);

    expect(summary.totalSessions).toBe(2);
    expect(summary.gradedSessions).toBe(2);
    expect(summary.averageScore).toBe(85);
    expect(summary.bestScore).toBe(90);
  });
});
