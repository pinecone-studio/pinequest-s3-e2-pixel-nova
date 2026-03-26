import { getSessionUser, type User } from "@/lib/examGuard";
import { getApiBaseUrl } from "@/lib/api-client";

type ApiEnvelope<T> = {
  data?: T;
  error?: {
    code?: string;
    message?: string;
  };
  message?: string;
};

type RequestOptions = RequestInit & {
  user?: User | null;
};

const unwrapResponse = <T,>(value: ApiEnvelope<T> | T): T => {
  if (value && typeof value === "object" && "data" in value) {
    return (value as ApiEnvelope<T>).data as T;
  }
  return value as T;
};

const buildHeaders = (
  headers: HeadersInit | undefined,
  body: BodyInit | null | undefined,
  user?: User | null,
) => {
  const resolvedUser = user ?? getSessionUser();
  const nextHeaders = new Headers(headers);

  if (resolvedUser) {
    nextHeaders.set("x-user-id", resolvedUser.id);
    nextHeaders.set("x-user-role", resolvedUser.role);
  }

  const hasBody = body !== undefined && body !== null;
  const isFormData =
    typeof FormData !== "undefined" && body instanceof FormData;

  if (hasBody && !isFormData && !nextHeaders.has("Content-Type")) {
    nextHeaders.set("Content-Type", "application/json");
  }

  return nextHeaders;
};

const readErrorMessage = async (response: Response) => {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    try {
      const payload = (await response.json()) as ApiEnvelope<unknown>;
      return (
        payload.error?.message ||
        payload.message ||
        `Request failed: ${response.status}`
      );
    } catch {
      return `Request failed: ${response.status}`;
    }
  }

  const text = await response.text();
  return text || `Request failed: ${response.status}`;
};

const readPayload = async <T,>(response: Response): Promise<T> => {
  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    return (await response.text()) as T;
  }

  const text = await response.text();
  if (!text.trim()) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
};

export const API_BASE_URL = getApiBaseUrl();

export const apiRequest = async <T,>(
  path: string,
  { user, headers, ...init }: RequestOptions = {},
): Promise<T> => {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: buildHeaders(headers, user),
    });
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Network request failed";
    throw new Error(`API unreachable: ${message}`);
  }

  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      ...init,
      headers: buildHeaders(headers, init.body, user),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown network error";
    throw new Error(`Failed to reach API: ${message}`);
  }

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const payload = await readPayload<ApiEnvelope<T> | T>(response);
  return unwrapResponse<T>(payload);
};
