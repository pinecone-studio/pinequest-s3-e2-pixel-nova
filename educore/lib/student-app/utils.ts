import { Platform } from 'react-native';

import type {
  IntegrityCapability,
  SessionDetailResponse,
  SessionResultResponse,
  StudentExamHistoryItem,
  StudentProgressSummary,
} from './types';

export const API_FALLBACK_BASE_URL = 'https://backend.zbymba4.workers.dev';

export const normalizeApiError = (error: unknown, fallback: string) => {
  if (!(error instanceof Error) || !error.message) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(error.message) as {
      message?: string;
      error?: string | { message?: string };
    };

    if (typeof parsed.message === 'string' && parsed.message.trim()) {
      return parsed.message;
    }

    if (typeof parsed.error === 'string' && parsed.error.trim()) {
      return parsed.error;
    }

    if (
      parsed.error &&
      typeof parsed.error === 'object' &&
      typeof parsed.error.message === 'string' &&
      parsed.error.message.trim()
    ) {
      return parsed.error.message;
    }
  } catch {
    return error.message;
  }

  return fallback;
};

export const getApiBaseUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  return envUrl && envUrl.length > 0 ? envUrl : API_FALLBACK_BASE_URL;
};

export const computeRemainingSeconds = (timerEndsAt: number | null) => {
  if (!timerEndsAt) return 0;
  return Math.max(0, Math.ceil((timerEndsAt - Date.now()) / 1000));
};

export const formatCountdown = (seconds: number) => {
  const clamped = Math.max(0, seconds);
  const mins = Math.floor(clamped / 60)
    .toString()
    .padStart(2, '0');
  const secs = Math.floor(clamped % 60)
    .toString()
    .padStart(2, '0');
  return `${mins}:${secs}`;
};

export const getResultMessage = (score: number) => {
  if (score >= 90) {
    return 'Excellent work. You handled this exam with confidence.';
  }
  if (score >= 75) {
    return 'Strong result. Keep this momentum going.';
  }
  if (score >= 60) {
    return 'Exam completed successfully. Review the details and keep improving.';
  }
  return 'This attempt gives you a starting point. Review the answers and try again stronger.';
};

export const getIntegrityCapabilities = (): IntegrityCapability => {
  if (Platform.OS === 'android') {
    return {
      screenshotProtectionSupported: false,
      screenshotDetectionSupported: false,
      copyPasteRestricted: true,
      backgroundDetectionSupported: true,
      notes: [
        'Lifecycle events can be logged during an active exam.',
        'Copy and paste can be reduced in answer fields.',
        'Full screenshot blocking needs a native screen-capture module before release hardening.',
      ],
    };
  }

  if (Platform.OS === 'ios') {
    return {
      screenshotProtectionSupported: false,
      screenshotDetectionSupported: false,
      copyPasteRestricted: true,
      backgroundDetectionSupported: true,
      notes: [
        'Lifecycle events can be logged during an active exam.',
        'Copy and paste can be reduced in answer fields.',
        'iOS screenshot prevention is limited and should be treated as detect-or-warn only.',
      ],
    };
  }

  return {
    screenshotProtectionSupported: false,
    screenshotDetectionSupported: false,
    copyPasteRestricted: false,
    backgroundDetectionSupported: true,
    notes: ['Web and preview environments use warning-only integrity controls.'],
  };
};

export const formatDateTime = (value?: string | null) => {
  if (!value) return 'Not available';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Not available';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const getEntryStatusLabel = (entryStatus: string | null | undefined) => {
  return entryStatus === 'late' ? 'Late entry' : 'On time';
};

export const getSessionStateLabel = (status: string) => {
  switch (status) {
    case 'late':
      return 'Late entry';
    case 'joined':
      return 'Ready to start';
    case 'in_progress':
      return 'In progress';
    case 'submitting':
      return 'Submitting';
    case 'submitted':
      return 'Submitted';
    case 'graded':
      return 'Graded';
    default:
      return status.replace(/_/g, ' ');
  }
};

export const buildProgressSummary = (
  history: StudentExamHistoryItem[],
): StudentProgressSummary => {
  const graded = history.filter((item) => typeof item.score === 'number');
  const scores = graded
    .map((item) => item.score)
    .filter((score): score is number => typeof score === 'number');

  return {
    totalSessions: history.length,
    gradedSessions: graded.length,
    averageScore:
      scores.length > 0
        ? Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length)
        : null,
    bestScore: scores.length > 0 ? Math.max(...scores) : null,
    latestScore: history[0]?.score ?? null,
    latestCompletedAt: history[0]?.submittedAt ?? null,
  };
};

export const mergeSessionResult = (
  result: SessionResultResponse,
  xpEarned?: number | null,
): SessionResultResponse => ({
  ...result,
  xpEarned: xpEarned ?? result.xpEarned ?? null,
});

export const deriveTimerEndsAt = (detail: SessionDetailResponse) => {
  if (!detail.session.startedAt) {
    return null;
  }

  return (
    new Date(detail.session.startedAt).getTime() +
    detail.exam.durationMin * 60 * 1000
  );
};
