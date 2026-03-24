import { createMiddleware } from "hono/factory";
import type { AppEnv } from "../types";

// Role guard — restricts access to specific roles
export function requireRole(role: "teacher" | "student") {
  return createMiddleware<AppEnv>(async (c, next) => {
    const user = c.get("user");
    if (!user) {
      return c.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        401
      );
    }
    if (user.role !== role) {
      return c.json(
        { success: false, error: { code: "FORBIDDEN", message: `This action requires '${role}' role` } },
        403
      );
    }
    await next();
  });
}
