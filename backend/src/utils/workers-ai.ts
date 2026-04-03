type WorkersAiApiError = {
  code: string;
  status: number;
  message: string;
};

const DAILY_LIMIT_PATTERNS = [
  /daily limit/i,
  /daily quota/i,
  /quota.*reached/i,
  /usage limit/i,
];

const RATE_LIMIT_PATTERNS = [
  /rate limit/i,
  /\b429\b/,
  /too many requests/i,
];

const extractErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  if (error && typeof error === "object") {
    const maybeMessage = (error as { message?: unknown }).message;
    if (typeof maybeMessage === "string" && maybeMessage.trim()) {
      return maybeMessage;
    }
  }

  return "";
};

export const normalizeWorkersAiError = (
  error: unknown,
  fallbackMessage: string,
): WorkersAiApiError => {
  const rawMessage = extractErrorMessage(error);

  if (DAILY_LIMIT_PATTERNS.some((pattern) => pattern.test(rawMessage))) {
    return {
      code: "AI_DAILY_LIMIT_REACHED",
      status: 503,
      message:
        "Workers AI is still reporting its daily limit. If you just reset it in Cloudflare, please wait a few minutes and retry.",
    };
  }

  if (RATE_LIMIT_PATTERNS.some((pattern) => pattern.test(rawMessage))) {
    return {
      code: "AI_RATE_LIMITED",
      status: 429,
      message: "Workers AI is rate limited right now. Please retry in a moment.",
    };
  }

  return {
    code: "AI_UNAVAILABLE",
    status: 502,
    message: fallbackMessage,
  };
};
