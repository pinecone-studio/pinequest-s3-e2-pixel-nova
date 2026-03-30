import type { Context } from "hono";

// Hono app environment — used by all routes
export type AppEnv = {
  Bindings: Env & {
    R2_ACCESS_KEY_ID?: string;
    R2_ACCOUNT_ID?: string;
    R2_BUCKET_NAME?: string;
    R2_SECRET_ACCESS_KEY?: string;
  };
  Variables: {
    user: AuthUser;
  };
};

// Authenticated user attached to context by auth middleware
export type AuthUser = {
  id: string;
  role: "teacher" | "student";
  fullName: string;
};

// Standard API response types
export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiError = {
  success: false;
  error: {
    code: string;
    message: string;
  };
};

export type ApiPaginated<T> = {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
};

export type AppContext = Context<AppEnv>;
