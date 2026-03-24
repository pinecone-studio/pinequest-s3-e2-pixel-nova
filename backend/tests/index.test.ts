jest.mock("nanoid", () => ({
  nanoid: () => "test-id",
}));

import app from "../src/index";

describe("backend worker", () => {
  it("returns the health check response", async () => {
    const response = await app.request("http://localhost/");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      status: "ok",
      service: "pinequest-api",
    });
  });

  it("rejects protected routes without auth headers", async () => {
    const response = await app.request("http://localhost/api/exams");

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Missing x-user-id or x-user-role header",
      },
    });
  });
});
