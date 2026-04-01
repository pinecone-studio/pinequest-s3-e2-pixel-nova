import type { Context } from "hono";
import type { ApiSuccess, ApiError, ApiPaginated } from "../types";

export function success<T>(c: Context, data: T, status: number = 200) {
  return c.json<ApiSuccess<T>>({ success: true, data }, status as any);
}

export function error(c: Context, code: string, message: string, status: number = 400) {
  return c.json<ApiError>({ success: false, error: { code, message } }, status as any);
}

export function paginated<T>(c: Context, data: T[], page: number, limit: number, total: number) {
  return c.json<ApiPaginated<T>>({
    success: true,
    data,
    pagination: { page, limit, total },
  });
}

export function notFound(c: Context, resource: string = "Resource") {
  return error(c, "NOT_FOUND", `${resource} not found`, 404);
}

export function unauthorized(c: Context, message: string = "Unauthorized") {
  return error(c, "UNAUTHORIZED", message, 401);
}

export function forbidden(c: Context, message: string = "Forbidden") {
  return error(c, "FORBIDDEN", message, 403);
}

export function tooManyRequests(
  c: Context,
  message: string = "Too many requests",
  retryAfterSeconds: number = 60,
) {
  c.header("Retry-After", String(retryAfterSeconds));
  return error(c, "TOO_MANY_REQUESTS", message, 429);
}
