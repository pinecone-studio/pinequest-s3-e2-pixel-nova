import { render, screen, waitFor } from "@testing-library/react";

import TeacherCheatAlertModal from "@/app/teacher/components/TeacherCheatAlertModal";
import { getLatestSnapshot } from "@/api/cheat";

jest.mock("@/api/cheat", () => ({
  getLatestSnapshot: jest.fn(),
}));

const mockGetLatestSnapshot = getLatestSnapshot as jest.MockedFunction<
  typeof getLatestSnapshot
>;

describe("TeacherCheatAlertModal", () => {
  beforeEach(() => {
    mockGetLatestSnapshot.mockReset();
  });

  it("shows the latest snapshot when one is available", async () => {
    mockGetLatestSnapshot.mockResolvedValue({
      objectKey: "cheat-snapshots/session-1/student-1/latest.jpg",
      assetUrl: "https://example.com/latest.jpg",
    });

    render(
      <TeacherCheatAlertModal
        notification={{
          id: "notif-1",
          userId: "teacher-1",
          role: "teacher",
          type: "student_flagged",
          severity: "warning",
          status: "unread",
          title: "Flagged",
          message: "Potential violation",
          examId: "exam-1",
          sessionId: "session-1",
          studentId: "student-1",
          metadata: { studentName: "Nora" },
          createdAt: "2026-04-03T10:00:00.000Z",
        }}
        onClose={jest.fn()}
        onDisqualify={jest.fn()}
        onWarn={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(mockGetLatestSnapshot).toHaveBeenCalledWith("session-1");
    });

    expect(await screen.findByAltText("Nora snapshot")).toHaveAttribute(
      "src",
      "https://example.com/latest.jpg",
    );
    expect(
      screen.getByRole("link", { name: "Open snapshot" }),
    ).toHaveAttribute("href", "https://example.com/latest.jpg");
  });
});
