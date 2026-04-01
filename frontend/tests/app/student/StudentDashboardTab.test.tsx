import { fireEvent, render, screen } from "@testing-library/react";
import StudentDashboardTab from "@/app/student/components/StudentDashboardTab";

const defaultProps = {
  loading: false,
  currentUserId: "student-1",
  currentUserName: "Золбоо Бат",
  exams: [
    {
      id: "exam-1",
      title: "English Mock Exam",
      description: "Англи хэл",
      scheduledAt: "2026-03-30T03:00:00.000Z",
      roomCode: "ROOM01",
      questions: [],
      duration: 40,
      createdAt: "2026-03-29T03:00:00.000Z",
    },
    {
      id: "exam-2",
      title: "Mongolian Literature",
      description: "Монгол хэл",
      scheduledAt: "2026-03-30T05:00:00.000Z",
      roomCode: "ROOM02",
      questions: [],
      duration: 40,
      createdAt: "2026-03-29T05:00:00.000Z",
    },
    {
      id: "exam-3",
      title: "Russian Practice",
      description: "Орос хэл",
      scheduledAt: "2026-03-30T07:00:00.000Z",
      roomCode: "ROOM03",
      questions: [],
      duration: 40,
      createdAt: "2026-03-29T07:00:00.000Z",
    },
    {
      id: "exam-4",
      title: "Social Studies",
      description: "Нийгэм",
      scheduledAt: "2026-03-30T09:00:00.000Z",
      roomCode: "ROOM04",
      questions: [],
      duration: 40,
      createdAt: "2026-03-29T09:00:00.000Z",
    },
  ],
  selectedExam: null,
  levelInfo: { level: 12, minXP: 1200 },
  studentProgress: { xp: 2100 },
  nextLevel: { minXP: 2400 },
  currentRank: 3,
  studentCount: 20,
  leaderboardXp: 2100,
  leaderboardLevel: 12,
  studentHistory: [
    {
      examId: "history-1",
      title: "Математик",
      percentage: 54,
      score: 54,
      totalPoints: 100,
      grade: "C" as const,
      date: "2026-03-25T10:00:00Z",
    },
    {
      examId: "history-2",
      title: "Физик",
      percentage: 83,
      score: 83,
      totalPoints: 100,
      grade: "B" as const,
      date: "2026-03-30T10:00:00Z",
    },
  ],
  termLeaderboardEntries: [
    { rank: 1, id: "student-9", fullName: "Топ", xp: 2800, level: 13 },
    { rank: 3, id: "student-2", fullName: "Бат", xp: 2400, level: 11 },
    { rank: 4, id: "student-1", fullName: "Золбоо Бат", xp: 2100, level: 12 },
    { rank: 5, id: "student-3", fullName: "Сараа", xp: 2050, level: 11 },
  ],
  teacherName: "Г. Сарантуяа",
  onOpenExamDetail: jest.fn(),
  onCloseExamDetail: jest.fn(),
  onOpenExams: jest.fn(),
  onOpenProgress: jest.fn(),
};

describe("StudentDashboardTab", () => {
  it("renders the screenshot-style home overview", () => {
    render(<StudentDashboardTab {...defaultProps} />);

    expect(screen.getByText("Шалгалт өгөх")).toBeInTheDocument();
    expect(screen.getByText("Таны эрэмбэ")).toBeInTheDocument();
    expect(screen.getByText("Дараагийн шалгалтууд")).toBeInTheDocument();
    expect(screen.getByText("83%")).toBeInTheDocument();
    expect(screen.getByText("English Mock Exam")).toBeInTheDocument();
    expect(screen.getAllByText("Англи хэл").length).toBeGreaterThan(0);
    expect(screen.getByText("Золбоо")).toBeInTheDocument();
    expect(screen.getAllByText("Сурагч").length).toBe(2);
    expect(screen.queryByText("Бат")).not.toBeInTheDocument();
    expect(screen.queryByText("Сараа")).not.toBeInTheDocument();
    expect(screen.getByText("YOU")).toBeInTheDocument();
    expect(screen.getByText("300xp")).toBeInTheDocument();
    expect(screen.queryByText("Топ")).not.toBeInTheDocument();
    expect(screen.getByText("#3")).toBeInTheDocument();
  });

  it("opens exams from the upcoming exams header", () => {
    const onOpenExams = jest.fn();
    render(<StudentDashboardTab {...defaultProps} onOpenExams={onOpenExams} />);

    fireEvent.click(screen.getByRole("button", { name: /Бүгдийг харах/i }));
    expect(onOpenExams).toHaveBeenCalledTimes(1);
  });

  it("opens inline exam detail from a schedule card", () => {
    const onOpenExamDetail = jest.fn();
    render(
      <StudentDashboardTab
        {...defaultProps}
        onOpenExamDetail={onOpenExamDetail}
      />,
    );

    fireEvent.click(screen.getAllByRole("button", { name: "Дэлгэрэнгүй" })[0]!);
    expect(onOpenExamDetail).toHaveBeenCalledTimes(1);
    expect(onOpenExamDetail.mock.calls[0]?.[0]).toMatchObject({
      id: "exam-1",
      title: "English Mock Exam",
    });
  });

  it("opens progress from the average score card", () => {
    const onOpenProgress = jest.fn();
    render(
      <StudentDashboardTab {...defaultProps} onOpenProgress={onOpenProgress} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Ахиц харах" }));
    expect(onOpenProgress).toHaveBeenCalledTimes(1);
  });

  it("renders loading skeletons", () => {
    const { container } = render(<StudentDashboardTab {...defaultProps} loading={true} />);

    expect(
      screen.getByLabelText("student-dashboard-loading"),
    ).toBeInTheDocument();
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });

  it("keeps the layout stable even without history", () => {
    render(<StudentDashboardTab {...defaultProps} studentHistory={[]} />);

    expect(screen.getByText("83%")).toBeInTheDocument();
    expect(screen.getAllByText("Нийгэм").length).toBeGreaterThan(0);
    expect(screen.getByText("Таны эрэмбэ")).toBeInTheDocument();
  });

  it("still renders without a public rank value", () => {
    render(<StudentDashboardTab {...defaultProps} currentRank={null} />);

    expect(screen.getByText("Золбоо")).toBeInTheDocument();
    expect(screen.getByText("#3")).toBeInTheDocument();
  });

  it("orders leaderboard rows by XP even if incoming ranks are stale", () => {
    render(
      <StudentDashboardTab
        {...defaultProps}
        currentRank={2}
        studentCount={3}
        leaderboardXp={45}
        leaderboardLevel={12}
        termLeaderboardEntries={[
          { rank: 1, id: "student-2", fullName: "Бат", xp: 20, level: 11 },
          { rank: 2, id: "student-1", fullName: "Золбоо Бат", xp: 45, level: 12 },
          { rank: 3, id: "student-3", fullName: "Сараа", xp: 10, level: 11 },
        ]}
      />,
    );

    expect(screen.getByText("#1")).toBeInTheDocument();
    expect(screen.getByText("45")).toBeInTheDocument();
    expect(screen.queryByText("25xp")).not.toBeInTheDocument();
  });

  it("renders exam detail inline when a home exam is selected", () => {
    render(
      <StudentDashboardTab
        {...defaultProps}
        selectedExam={defaultProps.exams[0]}
      />,
    );

    expect(screen.getByText("Start Exam")).toBeInTheDocument();
    expect(screen.getByText("English Mock Exam")).toBeInTheDocument();
    expect(screen.getByText("Англи хэл")).toBeInTheDocument();
    expect(screen.getByText("ROOM01")).toBeInTheDocument();
  });
});
