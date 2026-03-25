import { createClerkClient, verifyToken } from "@clerk/backend";
import type { AppContext } from "../types";

export const getClerkUserId = async (c: AppContext) => {
  const authHeader = c.req.header("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) return null;
  try {
    const payload = await verifyToken(token, {
      secretKey: c.env.CLERK_SECRET_KEY,
    });
    return payload?.sub ?? null;
  } catch {
    return null;
  }
};

export const getClerkClient = (c: AppContext) => {
  return createClerkClient({
    secretKey: c.env.CLERK_SECRET_KEY,
  });
};
