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
  currentRank: 4,
  studentCount: 20,
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
    { rank: 1, id: "student-2", fullName: "Бат", xp: 2400, level: 11 },
    { rank: 2, id: "student-3", fullName: "Сараа", xp: 2300, level: 11 },
    { rank: 4, id: "student-1", fullName: "Золбоо Бат", xp: 2100, level: 12 },
  ],
  onOpenExams: jest.fn(),
  onOpenProgress: jest.fn(),
};

describe("StudentDashboardTab", () => {
  it("renders the screenshot-style schedule and XP panels", () => {
    render(<StudentDashboardTab {...defaultProps} />);

    expect(screen.getByText("Шалгалтын хуваарь")).toBeInTheDocument();
    expect(screen.getByText("Ахиц дэвшил")).toBeInTheDocument();
    expect(screen.getByText("83%")).toBeInTheDocument();
    expect(screen.getByText("Физик")).toBeInTheDocument();
    expect(screen.getByText("XP оноо")).toBeInTheDocument();
    expect(screen.getByText("Англи хэл")).toBeInTheDocument();
    expect(screen.getByText("Монгол хэл")).toBeInTheDocument();
    expect(screen.getByText("Золбоо")).toBeInTheDocument();
    expect(screen.getByText("you")).toBeInTheDocument();
    expect(screen.getByText("#4 / 20")).toBeInTheDocument();
  });

  it("opens exams from the schedule header", () => {
    const onOpenExams = jest.fn();
    render(<StudentDashboardTab {...defaultProps} onOpenExams={onOpenExams} />);

    fireEvent.click(screen.getByRole("button", { name: /Бүгдийг харах/i }));
    expect(onOpenExams).toHaveBeenCalledTimes(1);
  });

  it("opens progress from the compact chart action", () => {
    const onOpenProgress = jest.fn();
    render(
      <StudentDashboardTab {...defaultProps} onOpenProgress={onOpenProgress} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Ахиц харах" }));
    expect(onOpenProgress).toHaveBeenCalledTimes(1);
  });

  it("renders loading skeletons", () => {
    const { container } = render(
      <StudentDashboardTab {...defaultProps} loading={true} />,
    );

    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });

  it("keeps the layout stable even without history", () => {
    render(<StudentDashboardTab {...defaultProps} studentHistory={[]} />);

    expect(screen.getByText("83%")).toBeInTheDocument();
    expect(screen.getAllByText("Нийгэм").length).toBeGreaterThan(0);
    expect(screen.getByText("XP оноо")).toBeInTheDocument();
  });

  it("still renders without a public rank value", () => {
    render(<StudentDashboardTab {...defaultProps} currentRank={null} />);

    expect(screen.getByText("Золбоо")).toBeInTheDocument();
    expect(screen.queryByText("#4 / 20")).not.toBeInTheDocument();
  });
});
