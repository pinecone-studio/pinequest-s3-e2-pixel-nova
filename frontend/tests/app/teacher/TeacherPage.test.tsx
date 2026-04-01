import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import TeacherPage from "@/app/teacher/page";
import { updateExam } from "@/api/exams";

const mockSetExams = jest.fn();
const mockShowToast = jest.fn();
const mockHandleSchedule = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock("@/components/RoleNavbar", () => {
  function MockRoleNavbar() {
    return <div>Role navbar</div>;
  }

  return MockRoleNavbar;
});

jest.mock("@/app/teacher/components/TeacherHeader", () => {
  function MockTeacherHeader() {
    return <div>Teacher header</div>;
  }

  return MockTeacherHeader;
});

jest.mock("@/app/teacher/components/ExamScheduleCard", () => ({
  __esModule: true,
  default: ({ onSchedule }: { onSchedule: () => Promise<void> }) => (
    <button type="button" onClick={() => void onSchedule()}>
      Save schedule
    </button>
  ),
}));

jest.mock("@/app/teacher/components/TeacherPageContent", () => ({
  __esModule: true,
  default: ({
    onOpenScheduleForm,
  }: {
    onOpenScheduleForm: () => void;
  }) => (
    <button type="button" onClick={onOpenScheduleForm}>
      Open schedule
    </button>
  ),
}));

jest.mock("@/lib/backend-auth", () => ({
  getAuthUsers: jest.fn().mockResolvedValue([
    {
      id: "teacher-1",
      fullName: "Ada Teacher",
      role: "teacher",
      email: null,
      avatarUrl: null,
    },
  ]),
  getStudentProfileForTeacher: jest.fn(),
}));

jest.mock("@/lib/role-session", () => ({
  buildSessionUser: (user: { id: string; fullName: string; role: string }) => ({
    id: user.id,
    username: user.fullName,
    password: "",
    role: user.role,
    createdAt: "",
  }),
  getStoredSelectedUserId: () => "teacher-1",
  setStoredRole: jest.fn(),
  setStoredSelectedUserId: jest.fn(),
}));

jest.mock("@/lib/examGuard", () => ({
  STORAGE_KEYS: { users: "users" },
  ensureDemoAccounts: jest.fn(),
  getJSON: jest.fn(() => []),
  setJSON: jest.fn(),
  setSessionUser: jest.fn(),
  type: {},
}));

jest.mock("@/app/teacher/hooks/useTeacherData", () => ({
  useTeacherData: () => ({
    loading: false,
    exams: [],
    setExams: mockSetExams,
    showToast: mockShowToast,
    currentUser: {
      id: "teacher-1",
      username: "Ada Teacher",
      role: "teacher",
      createdAt: "",
      password: "",
    },
    submissions: [],
    studentProgress: {},
    users: [],
    notifications: [],
    unreadNotificationCount: 0,
    markNotificationRead: jest.fn(),
    markAllNotificationsRead: jest.fn(),
    toast: null,
  }),
}));

jest.mock("@/app/teacher/hooks/useExamManagement", () => ({
  useExamManagement: () => ({
    selectedScheduleExamId: "",
    setSelectedScheduleExamId: jest.fn(),
    scheduleDate: "2026-03-31T10:00:00.000Z",
    setScheduleDate: jest.fn(),
    scheduleExamType: "progress",
    setScheduleExamType: jest.fn(),
    scheduleClassName: "10A",
    setScheduleClassName: jest.fn(),
    scheduleGroupName: "",
    setScheduleGroupName: jest.fn(),
    scheduleSubjectName: "",
    setScheduleSubjectName: jest.fn(),
    scheduleDescription: "",
    setScheduleDescription: jest.fn(),
    durationMinutes: 45,
    setDurationMinutes: jest.fn(),
    handleSchedule: mockHandleSchedule,
    copyCode: jest.fn(),
  }),
}));

jest.mock("@/app/teacher/hooks/useExamStats", () => ({
  useExamStats: () => ({
    activeExamId: null,
    selectedSubmission: null,
  }),
}));

jest.mock("@/app/teacher/hooks/useExamAttendanceStats", () => ({
  useExamAttendanceStats: () => ({
    stats: null,
    loading: false,
  }),
}));

jest.mock("@/api/exams", () => ({
  updateExam: jest.fn(),
}));

const mockUpdateExam = updateExam as jest.MockedFunction<typeof updateExam>;

describe("TeacherPage", () => {
  beforeEach(() => {
    mockSetExams.mockReset();
    mockShowToast.mockReset();
    mockHandleSchedule.mockReset();
    mockUpdateExam.mockReset();
    mockHandleSchedule.mockResolvedValue({
      id: "exam-1",
      title: "Algebra Final",
      roomCode: "ROOM01",
      scheduledAt: "2026-03-31T10:00:00.000Z",
      questions: [],
      createdAt: "2026-03-31T09:00:00.000Z",
      enabledCheatDetections: undefined,
    });
  });

  it("closes the schedule modal after schedule save succeeds", async () => {
    render(<TeacherPage />);

    fireEvent.click(await screen.findByRole("button", { name: "Open schedule" }));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Save schedule" }));
    });

    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: "Save schedule" }),
      ).not.toBeInTheDocument();
    });
    expect(mockUpdateExam).not.toHaveBeenCalled();
  });

  it("keeps the scheduled exam and skips API updates after scheduling", async () => {
    render(<TeacherPage />);

    fireEvent.click(await screen.findByRole("button", { name: "Open schedule" }));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Save schedule" }));
    });

    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: "Save schedule" }),
      ).not.toBeInTheDocument();
    });
    expect(mockUpdateExam).not.toHaveBeenCalled();
  });

  it("schedules once without opening any follow-up configuration dialog", async () => {
    render(<TeacherPage />);

    fireEvent.click(await screen.findByRole("button", { name: "Open schedule" }));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Save schedule" }));
    });

    await waitFor(() => {
      expect(
        screen.queryByRole("heading", {
          name: "Луйврын илрүүлэлтийн тохиргоо",
        }),
      ).not.toBeInTheDocument();
      expect(mockHandleSchedule).toHaveBeenCalledTimes(1);
      expect(mockUpdateExam).not.toHaveBeenCalled();
      expect(mockSetExams).not.toHaveBeenCalled();
      expect(mockShowToast).not.toHaveBeenCalledWith(
        expect.stringContaining("илрүүлэлтийн тохиргоо"),
      );
    });
  });
});
