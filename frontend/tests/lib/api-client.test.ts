jest.mock("@/lib/role-session", () => ({
  getStoredRole: jest.fn(() => "student"),
}));

jest.mock("@/lib/examGuard", () => ({
  getSessionUser: jest.fn(() => ({
    id: "student-1",
    username: "John Doe",
    role: "student",
  })),
}));

import { apiFetch, getApiBaseUrl, unwrapApi } from "@/lib/api-client";

const mockedFetch = jest.fn<typeof fetch>();

const createResponse = ({
  status = 200,
  contentType = "application/json",
  jsonData,
  textData,
}: {
  status?: number;
  contentType?: string;
  jsonData?: unknown;
  textData?: string;
}) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (name: string) =>
        name.toLowerCase() === "content-type" ? contentType : null,
    },
    json: async () => jsonData,
    text: async () =>
      textData ??
      (jsonData === undefined ? "" : JSON.stringify(jsonData)),
  }) as Response;

describe("api-client", () => {
  beforeEach(() => {
    global.fetch = mockedFetch as unknown as typeof fetch;
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
    mockedFetch.mockReset();
  });

  it("uses env base url and sets auth headers for json requests", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.com/";
    mockedFetch.mockResolvedValue(
      createResponse({
        jsonData: { success: true, data: { ok: true } },
      }),
    );

    const payload = await apiFetch<{ data?: { ok: boolean } }>("/api/ping", {
      method: "POST",
      body: JSON.stringify({ ping: true }),
    });

    expect(payload).toEqual({ success: true, data: { ok: true } });
    expect(getApiBaseUrl()).toBe("https://api.example.com");

    const [url, options] = mockedFetch.mock.calls[0] ?? [];
    expect(url).toBe("https://api.example.com/api/ping");

    const headers = options?.headers as Headers;
    expect(headers.get("Content-Type")).toBe("application/json");
    expect(headers.get("x-user-id")).toBe("student-1");
    expect(headers.get("x-user-role")).toBe("student");
    expect(headers.get("x-user-name")).toBe("John Doe");
  });

  it("does not force content-type for FormData uploads", async () => {
    mockedFetch.mockResolvedValue(
      createResponse({
        jsonData: { uploaded: true },
      }),
    );

    const formData = new FormData();
    formData.append("file", new Blob(["hello"]), "hello.txt");

    await apiFetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const [, options] = mockedFetch.mock.calls[0] ?? [];
    const headers = options?.headers as Headers;
    expect(headers.get("Content-Type")).toBeNull();
  });

  it("returns undefined for 204 responses", async () => {
    mockedFetch.mockResolvedValue(
      createResponse({
        status: 204,
        contentType: "",
        textData: "",
      }),
    );

    const payload = await apiFetch("/api/empty");
    expect(payload).toBeUndefined();
  });

  it("parses JSON error envelopes into readable errors", async () => {
    mockedFetch.mockResolvedValue(
      createResponse({
        status: 401,
        jsonData: {
          success: false,
          error: { code: "UNAUTHORIZED", message: "Invalid code" },
        },
      }),
    );

    await expect(apiFetch("/api/fail")).rejects.toThrow("Invalid code");
  });

  it("wraps network errors with clearer context", async () => {
    mockedFetch.mockRejectedValue(new Error("connect ECONNREFUSED"));

    await expect(apiFetch("/api/down")).rejects.toThrow(
      "Failed to reach API: connect ECONNREFUSED",
    );
  });

  it("unwraps envelope payloads safely", () => {
    expect(unwrapApi({ data: { id: "1" } })).toEqual({ id: "1" });
    expect(unwrapApi({ id: "2" })).toEqual({ id: "2" });
  });
});
