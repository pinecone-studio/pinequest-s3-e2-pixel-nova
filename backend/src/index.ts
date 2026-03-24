import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { errorHandler } from "./middleware/error-handler";
import type { AppEnv } from "./types";
import auth from "./routes/auth.routes";
import examRoutes from "./routes/exam.routes";
import sessionRoutes from "./routes/session.routes";
import cheatRoutes from "./routes/cheat.routes";
import studentRoutes from "./routes/student.routes";
import analyticsRoutes from "./routes/analytics.routes";
import xpRoutes from "./routes/xp.routes";
import savedRoutes from "./routes/saved.routes";

const app = new Hono<AppEnv>();

// Global middleware
app.use("*", logger());
app.use("*", cors({
  origin: ["http://localhost:3000", "http://localhost:5173"],
  allowHeaders: ["Content-Type", "x-user-id", "x-user-role"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
}));
app.onError(errorHandler);

// Health check
app.get("/", (c) => c.json({ status: "ok", service: "pinequest-api" }));

// Mount routes
app.route("/api/auth", auth);
app.route("/api/exams", examRoutes);
app.route("/api/sessions", sessionRoutes);
app.route("/api/cheat", cheatRoutes);
app.route("/api/student", studentRoutes);
app.route("/api/analytics", analyticsRoutes);
app.route("/api/xp", xpRoutes);
app.route("/api/saved", savedRoutes);

export default app;
