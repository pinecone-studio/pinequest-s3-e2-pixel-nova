import { createMiddleware } from "hono/factory";
import type { AppEnv } from "../types";
import { tooManyRequests } from "../utils/response";

export type RateLimitTier =
  | "generalRead"
  | "teacherMutation"
  | "studentWrite"
  | "highCost";

type RateLimitBindingName =
  | "RATE_LIMIT_GENERAL_READ"
  | "RATE_LIMIT_TEACHER_MUTATION"
  | "RATE_LIMIT_STUDENT_WRITE"
  | "RATE_LIMIT_HIGH_COST";

type RateLimitPolicy = {
  binding: RateLimitBindingName;
  retryAfterSeconds: number;
  tier: RateLimitTier;
};

type RateLimitDescriptor = RateLimitPolicy & {
  key: string;
};

type RequestShape = {
  headers: Headers;
  method: string;
  pathname: string;
};

const RATE_LIMIT_POLICIES: Record<RateLimitTier, RateLimitPolicy> = {
  generalRead: {
    binding: "RATE_LIMIT_GENERAL_READ",
    retryAfterSeconds: 60,
    tier: "generalRead",
  },
  teacherMutation: {
    binding: "RATE_LIMIT_TEACHER_MUTATION",
    retryAfterSeconds: 60,
    tier: "teacherMutation",
  },
  studentWrite: {
    binding: "RATE_LIMIT_STUDENT_WRITE",
    retryAfterSeconds: 60,
    tier: "studentWrite",
  },
  highCost: {
    binding: "RATE_LIMIT_HIGH_COST",
    retryAfterSeconds: 60,
    tier: "highCost",
  },
};

const HIGH_COST_ROUTES = new Set([
  "POST /api/agent/exam-generator/generate",
  "POST /api/pdf/assets",
  "POST /api/pdf/extract",
  "POST /api/pdf/generate",
  "POST /api/pdf/upload",
]);

const getRequestRole = (headers: Headers) => {
  const role = headers.get("x-user-role");
  return role === "student" || role === "teacher" ? role : null;
};

export const getClientIdentifier = (headers: Headers) => {
  const cfConnectingIp = headers.get("cf-connecting-ip");
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "local";
  }

  const realIp = headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  return "local";
};

const getSessionScope = (pathname: string) => {
  const sessionScopedRoute = pathname.match(
    /^\/api\/sessions\/([^/]+)\/(answer|submit)$/i,
  );

  if (sessionScopedRoute?.[1]) {
    return `session:${sessionScopedRoute[1]}`;
  }

  return "global";
};

const getTier = (request: RequestShape): RateLimitTier | null => {
  const pathname = request.pathname;
  const method = request.method.toUpperCase();

  if (method === "OPTIONS" || !pathname.startsWith("/api/")) {
    return null;
  }

  if (HIGH_COST_ROUTES.has(`${method} ${pathname}`)) {
    return "highCost";
  }

  if (method === "GET" || method === "HEAD") {
    return "generalRead";
  }

  return getRequestRole(request.headers) === "student"
    ? "studentWrite"
    : "teacherMutation";
};

export const getRateLimitDescriptor = (
  request: RequestShape,
): RateLimitDescriptor | null => {
  const tier = getTier(request);
  if (!tier) {
    return null;
  }

  const policy = RATE_LIMIT_POLICIES[tier];
  const userId = request.headers.get("x-user-id")?.trim();
  const actorId = userId || getClientIdentifier(request.headers);

  let key = `${tier}:${actorId}`;

  if (tier === "studentWrite") {
    key = `${key}:${getSessionScope(request.pathname)}`;
  }

  return {
    ...policy,
    key,
  };
};

export const rateLimitMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const url = new URL(c.req.url);
  const descriptor = getRateLimitDescriptor({
    headers: c.req.raw.headers,
    method: c.req.method,
    pathname: url.pathname,
  });

  if (!descriptor) {
    await next();
    return;
  }

  const limiter = c.env[descriptor.binding];

  if (!limiter) {
    await next();
    return;
  }

  try {
    const outcome = await limiter.limit({ key: descriptor.key });

    if (!outcome.success) {
      return tooManyRequests(
        c,
        "Rate limit exceeded. Please wait before retrying.",
        descriptor.retryAfterSeconds,
      );
    }
  } catch (err) {
    console.error("Rate limiting failed open", err);
  }

  await next();
});
