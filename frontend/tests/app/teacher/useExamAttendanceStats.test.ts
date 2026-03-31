import { act, renderHook, waitFor } from "@testing-library/react";

import { useExamAttendanceStats } from "@/app/teacher/hooks/useExamAttendanceStats";
import { apiFetch } from "@/lib/api-client";
import { openTeacherExamLiveStream } from "@/app/teacher/hooks/teacher-api";

jest.mock("@/lib/api-client", () => ({
  apiFetch: jest.fn(),
  unwrapApi: (payload: { data?: unknown } | unknown) =>
    payload && typeof payload === "object" && "data" in payload
      ? (payload as { data?: unknown }).data
      : payload,
}));

jest.mock("@/app/teacher/hooks/teacher-api", () => ({
  openTeacherExamLiveStream: jest.fn(),
}));

const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;
const mockOpenTeacherExamLiveStream =
  openTeacherExamLiveStream as jest.MockedFunction<
    typeof openTeacherExamLiveStream
  >;

describe("useExamAttendanceStats", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockApiFetch.mockReset();
    mockOpenTeacherExamLiveStream.mockReset();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it("hydrates from the live stream when updates arrive", async () => {
    mockApiFetch.mockResolvedValue({
      data: {
        expected: 10,
        joined: 1,
        submitted: 0,
        attendance_rate: 10,
        submission_rate: 0,
      },
    });

    mockOpenTeacherExamLiveStream.mockImplementation((_examId, handlers) => {
      handlers.onMessage({
        examStatus: "active",
        generatedAt: new Date().toISOString(),
        roster: {
          examId: "exam-1",
          title: "Demo",
          roomCode: "ROOM01",
          durationMin: 45,
          expectedStudentsCount: 10,
          scheduledAt: null,
          startedAt: null,
          finishedAt: null,
          participants: [],
        },
        stats: {
          expected: 10,
          joined: 4,
          submitted: 2,
          attendance_rate: 40,
          submission_rate: 20,
        },
      });
      return jest.fn();
    });

    const { result } = renderHook(() =>
      useExamAttendanceStats("exam-1", true),
    );

    await waitFor(() => {
      expect(result.current.stats).toEqual({
        expected: 10,
        joined: 4,
        submitted: 2,
        attendance_rate: 40,
        submission_rate: 20,
      });
    });

    expect(mockOpenTeacherExamLiveStream).toHaveBeenCalledWith(
      "exam-1",
      expect.objectContaining({
        onMessage: expect.any(Function),
        onError: expect.any(Function),
      }),
    );
  });

  it("falls back to polling when the live stream errors", async () => {
    mockApiFetch
      .mockResolvedValueOnce({
        data: {
          expected: 10,
          joined: 1,
          submitted: 0,
          attendance_rate: 10,
          submission_rate: 0,
        },
      })
      .mockResolvedValueOnce({
        data: {
          expected: 10,
          joined: 3,
          submitted: 1,
          attendance_rate: 30,
          submission_rate: 10,
        },
      })
      .mockResolvedValue({
        data: {
          expected: 10,
          joined: 5,
          submitted: 2,
          attendance_rate: 50,
          submission_rate: 20,
        },
      });

    mockOpenTeacherExamLiveStream.mockImplementation((_examId, handlers) => {
      handlers.onError?.(new Error("stream failed"));
      return jest.fn();
    });

    const { result } = renderHook(() =>
      useExamAttendanceStats("exam-1", true),
    );

    await waitFor(() => {
      expect(result.current.stats).toEqual({
        expected: 10,
        joined: 3,
        submitted: 1,
        attendance_rate: 30,
        submission_rate: 10,
      });
    });

    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      expect(result.current.stats).toEqual({
        expected: 10,
        joined: 5,
        submitted: 2,
        attendance_rate: 50,
        submission_rate: 20,
      });
    });
  });
});
