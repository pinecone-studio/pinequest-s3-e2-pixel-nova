jest.mock("@/lib/role-session", () => ({
  getStoredRole: jest.fn(() => "student"),
}));

jest.mock("@/lib/examGuard", () => ({
  getSessionUser: jest.fn(() => ({
    id: "student-1",
    username: "Сурагч Бат",
    role: "student",
  })),
}));

import { apiFetch } from "@/lib/api-client";

describe("apiFetch", () => {
  it("encodes non-Latin user names before sending request headers", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    global.fetch = fetchMock as typeof fetch;

    await apiFetch("/api/sessions/join", {
      method: "POST",
      body: JSON.stringify({ roomCode: "BHT6X6" }),
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Headers;

    expect(headers.get("x-user-name")).toBeNull();
    expect(headers.get("x-user-name-encoded")).toBe(
      "%D0%A1%D1%83%D1%80%D0%B0%D0%B3%D1%87%20%D0%91%D0%B0%D1%82",
    );
  });
});
