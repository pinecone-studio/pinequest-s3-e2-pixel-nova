import type { ErrorHandler } from "hono";
import type { AppEnv } from "../types";

export const errorHandler: ErrorHandler<AppEnv> = (err, c) => {
  console.error(`[ERROR] ${err.message}`, err.stack);

  return c.json(
    {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: c.env ? err.message : "Internal server error",
      },
    },
    500
  );
};
