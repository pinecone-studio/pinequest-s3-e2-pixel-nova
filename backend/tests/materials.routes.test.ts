import {
  jsonRequest,
  queueDbResults,
  resetDbMock,
  teacherHeaders,
  workerEnv,
} from "./helpers/mock-db";
import app from "../src/index";

describe("materials routes", () => {
  beforeEach(() => resetDbMock());

  it("POST /api/materials/:examId creates a material (teacher)", async () => {
    queueDbResults(
      [{ id: "teacher-1", fullName: "Test Teacher" }], // auth
      [{ id: "exam-1", teacherId: "teacher-1" }], // find exam
      undefined, // insert
      [{ id: "test-id", examId: "exam-1", fileName: "notes.pdf", fileType: "pdf", materialType: "attachment", fileUrl: "https://r2.example.com/notes.pdf" }], // select created
    );

    const res = await app.request(
      "http://localhost/api/materials/exam-1",
      jsonRequest({
        fileName: "notes.pdf",
        fileType: "pdf",
        materialType: "attachment",
        fileUrl: "https://r2.example.com/notes.pdf",
      }, teacherHeaders()),
      workerEnv,
    );

    expect(res.status).toBe(201);
    const json: any = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.fileName).toBe("notes.pdf");
  });

  it("GET /api/materials/:examId lists materials", async () => {
    queueDbResults(
      [{ id: "teacher-1", fullName: "Test Teacher" }], // auth
      [{ id: "m1", examId: "exam-1", fileName: "notes.pdf", fileType: "pdf", materialType: "attachment", fileUrl: "https://example.com/f" }], // select all
    );

    const res = await app.request(
      "http://localhost/api/materials/exam-1",
      { headers: teacherHeaders() },
      workerEnv,
    );

    expect(res.status).toBe(200);
    const json: any = await res.json();
    expect(json.data).toHaveLength(1);
  });

  it("DELETE /api/materials/:examId/:materialId removes material (teacher)", async () => {
    queueDbResults(
      [{ id: "teacher-1", fullName: "Test Teacher" }], // auth
      [{ id: "exam-1", teacherId: "teacher-1" }], // find exam
      [{ id: "m1", examId: "exam-1" }], // find material
      undefined, // delete
    );

    const res = await app.request(
      "http://localhost/api/materials/exam-1/m1",
      { method: "DELETE", headers: teacherHeaders() },
      workerEnv,
    );

    expect(res.status).toBe(200);
    const json: any = await res.json();
    expect(json.data.deleted).toBe(true);
  });

  it("returns 404 when adding material to non-owned exam", async () => {
    queueDbResults(
      [{ id: "teacher-1", fullName: "Test Teacher" }], // auth
      [], // find exam — empty (not owned)
    );

    const res = await app.request(
      "http://localhost/api/materials/exam-1",
      jsonRequest({
        fileName: "notes.pdf",
        fileType: "pdf",
        materialType: "attachment",
        fileUrl: "https://example.com/f",
      }, teacherHeaders()),
      workerEnv,
    );

    expect(res.status).toBe(404);
  });
});
