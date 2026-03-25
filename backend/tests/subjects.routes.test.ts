import {
  jsonRequest,
  queueDbResults,
  resetDbMock,
  teacherHeaders,
  workerEnv,
} from "./helpers/mock-db";
import app from "../src/index";

describe("subjects routes", () => {
  beforeEach(() => resetDbMock());

  it("POST /api/subjects creates a subject", async () => {
    queueDbResults(
      [{ id: "teacher-1", fullName: "Test Teacher" }], // auth
      undefined, // insert
      [{ id: "test-id", name: "Mathematics", code: "MATH101", description: "Basic math" }], // select created
    );

    const res = await app.request(
      "http://localhost/api/subjects",
      jsonRequest({ name: "Mathematics", code: "MATH101", description: "Basic math" }, teacherHeaders()),
      workerEnv,
    );

    expect(res.status).toBe(201);
    const json: any = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.name).toBe("Mathematics");
  });

  it("GET /api/subjects lists all subjects", async () => {
    queueDbResults(
      [{ id: "teacher-1", fullName: "Test Teacher" }], // auth
      [{ id: "s1", name: "Math", code: "MATH", description: null }], // select all
    );

    const res = await app.request(
      "http://localhost/api/subjects",
      { headers: teacherHeaders() },
      workerEnv,
    );

    expect(res.status).toBe(200);
    const json: any = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toHaveLength(1);
  });

  it("PUT /api/subjects/:id updates a subject", async () => {
    queueDbResults(
      [{ id: "teacher-1", fullName: "Test Teacher" }], // auth
      [{ id: "s1", name: "Math", code: "MATH" }], // find existing
      undefined, // update
      [{ id: "s1", name: "Mathematics", code: "MATH" }], // select updated
    );

    const res = await app.request(
      "http://localhost/api/subjects/s1",
      {
        method: "PUT",
        headers: { "content-type": "application/json", ...teacherHeaders() },
        body: JSON.stringify({ name: "Mathematics" }),
      },
      workerEnv,
    );

    expect(res.status).toBe(200);
    const json: any = await res.json();
    expect(json.success).toBe(true);
  });

  it("DELETE /api/subjects/:id deletes a subject", async () => {
    queueDbResults(
      [{ id: "teacher-1", fullName: "Test Teacher" }], // auth
      [{ id: "s1", name: "Math", code: "MATH" }], // find existing
      undefined, // delete
    );

    const res = await app.request(
      "http://localhost/api/subjects/s1",
      { method: "DELETE", headers: teacherHeaders() },
      workerEnv,
    );

    expect(res.status).toBe(200);
    const json: any = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.deleted).toBe(true);
  });

  it("returns 404 when updating non-existent subject", async () => {
    queueDbResults(
      [{ id: "teacher-1", fullName: "Test Teacher" }], // auth
      [], // find existing — empty
    );

    const res = await app.request(
      "http://localhost/api/subjects/nonexistent",
      {
        method: "PUT",
        headers: { "content-type": "application/json", ...teacherHeaders() },
        body: JSON.stringify({ name: "Test" }),
      },
      workerEnv,
    );

    expect(res.status).toBe(404);
  });
});
