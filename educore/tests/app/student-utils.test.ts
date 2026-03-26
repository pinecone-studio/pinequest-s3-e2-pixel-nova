import {
  API_FALLBACK_BASE_URL,
  computeRemainingSeconds,
  formatCountdown,
  getApiBaseUrl,
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
    expect(getResultMessage(95)).toContain('Маш сайн');
    expect(getResultMessage(78)).toContain('Сайн');
    expect(getResultMessage(45)).toContain('боломжтой');
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

describe('getResultMessage boundaries', () => {
  it('returns correct message at 90 boundary', () => {
    expect(getResultMessage(90)).toContain('Маш сайн');
  });

  it('returns correct message at 75 boundary', () => {
    expect(getResultMessage(75)).toContain('Сайн');
  });

  it('returns correct message at 60 boundary', () => {
    expect(getResultMessage(60)).toContain('амжилттай');
  });

  it('returns encouragement below 60', () => {
    expect(getResultMessage(59)).toContain('боломжтой');
  });
});
