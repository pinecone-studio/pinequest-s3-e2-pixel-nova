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
  if (score >= 90) return 'Маш сайн ажиллалаа.';
  if (score >= 75) return 'Сайн дүн авлаа.';
  if (score >= 60) return 'Шалгалтаа амжилттай дуусгалаа.';
  return 'Дараагийн удаа илүү сайн хийх боломжтой.';
};
