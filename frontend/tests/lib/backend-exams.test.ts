import { syncExamToBackend } from "@/lib/backend-exams";

const mockFetch = jest.fn();
const createMockResponse = (payload: unknown, ok = true, status = 200) => ({
  ok,
  status,
  json: async () => payload,
  text: async () => JSON.stringify(payload),
});

describe("syncExamToBackend", () => {
  const teacherUser = {
    id: "teacher-1",
    role: "teacher" as const,
  };

  beforeEach(() => {
    mockFetch.mockReset();
    global.fetch = mockFetch as unknown as typeof fetch;
  });

  it("maps manual questions to backend payload and falls back to single creates when batch fails", async () => {
    mockFetch
      .mockResolvedValueOnce(
        createMockResponse(
          {
            success: true,
            data: { id: "exam-1", title: "Шалгалт" },
          },
          true,
          201,
        ),
      )
      .mockResolvedValueOnce(
        createMockResponse(
          {
            success: false,
            error: { message: "Failed to batch create questions" },
          },
          false,
          500,
        ),
      )
      .mockResolvedValueOnce(
        createMockResponse({ success: true, data: { id: "q-1" } }, true, 201),
      )
      .mockResolvedValueOnce(
        createMockResponse({ success: true, data: { id: "q-2" } }, true, 201),
      );

    await syncExamToBackend(teacherUser, {
      title: "Шалгалт",
      duration: 45,
      questions: [
        {
          type: "mcq",
          text: "2+2 хэд вэ?",
          points: 1,
          correctAnswer: "4",
          options: ["3", "4", "", "5"],
        },
        {
          type: "open",
          text: "Нэр үг гэж юу вэ?",
          points: 2,
          correctAnswer: "Юм, үзэгдлийн нэр",
        },
      ],
    });

    expect(mockFetch).toHaveBeenCalledTimes(4);

    const batchCall = mockFetch.mock.calls[1];
    expect(batchCall?.[0]).toContain("/api/exams/exam-1/questions/batch");
    expect(JSON.parse(String(batchCall?.[1]?.body))).toEqual({
      questions: [
        {
          type: "multiple_choice",
          questionText: "2+2 хэд вэ?",
          points: 1,
          options: [
            { label: "A", text: "3", isCorrect: false },
            { label: "B", text: "4", isCorrect: true },
            { label: "C", text: "5", isCorrect: false },
          ],
        },
        {
          type: "short_answer",
          questionText: "Нэр үг гэж юу вэ?",
          points: 2,
          correctAnswerText: "Юм, үзэгдлийн нэр",
        },
      ],
    });

    const fallbackCall = mockFetch.mock.calls[2];
    expect(fallbackCall?.[0]).toContain("/api/exams/exam-1/questions");
    expect(JSON.parse(String(fallbackCall?.[1]?.body))).toEqual({
      type: "multiple_choice",
      questionText: "2+2 хэд вэ?",
      points: 1,
      options: [
        { label: "A", text: "3", isCorrect: false },
        { label: "B", text: "4", isCorrect: true },
        { label: "C", text: "5", isCorrect: false },
      ],
    });
  });
});
