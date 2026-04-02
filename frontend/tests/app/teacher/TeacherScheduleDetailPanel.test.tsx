import { render, screen } from "@testing-library/react";
import TeacherScheduleDetailPanel from "@/app/teacher/components/TeacherScheduleDetailPanel";
import type { Exam, ExamRosterDetail } from "@/app/teacher/types";

describe("TeacherScheduleDetailPanel", () => {
  const exam: Exam = {
    id: "exam-1",
    title: "Mathematics",
    scheduledAt: "2026-03-30T09:00:00.000Z",
    roomCode: "ROOM42",
    duration: 45,
    expectedStudentsCount: 10,
    createdAt: "2026-03-28T09:00:00.000Z",
    questions: [],
  };

  const roster: ExamRosterDetail = {
    examId: "exam-1",
    title: "Mathematics",
    roomCode: "ROOM42",
    durationMin: 45,
    expectedStudentsCount: 10,
    scheduledAt: "2026-03-30T09:00:00.000Z",
    startedAt: null,
    finishedAt: null,
    participants: [],
  };

  it("renders the monitoring summary cards with real roster totals", () => {
    render(
      <TeacherScheduleDetailPanel
        exam={exam}
        roster={{
          ...roster,
          participants: [
            {
              sessionId: "session-1",
              studentId: "student-1",
              studentName: "А. Ануужин",
              studentCode: "34344534",
              status: "graded",
              answeredCount: 28,
              totalQuestions: 30,
              progressPercent: 100,
              submittedAt: "2026-03-30T03:40:00.000Z",
              startedAt: "2026-03-30T03:00:00.000Z",
              flagCount: 0,
              isFlagged: false,
              violationScore: 0,
              riskLevel: "low",
              lastViolationAt: null,
              topViolationType: null,
              eventCount: 0,
              latestEvent: null,
              countByType: {},
              score: 28,
            },
            {
              sessionId: "session-2",
              studentId: "student-2",
              studentName: "А. Анусүрэн",
              studentCode: "34344535",
              status: "in_progress",
              answeredCount: 0,
              totalQuestions: 30,
              progressPercent: 0,
              submittedAt: null,
              startedAt: "2026-03-30T03:05:00.000Z",
              flagCount: 1,
              isFlagged: true,
              violationScore: 15,
              riskLevel: "high",
              lastViolationAt: "2026-03-30T03:21:00.000Z",
              topViolationType: "window_blur",
              eventCount: 2,
              latestEvent: {
                createdAt: "2026-03-30T03:21:00.000Z",
                eventSource: "browser",
                eventType: "window_blur",
                label: "Цонхноос гарсан",
                severity: "warning",
              },
              countByType: { window_blur: 2 },
              score: null,
            },
          ],
        }}
        rosterLoading={false}
        attendanceJoined={6}
        attendanceSubmitted={1}
        onBack={() => {}}
      />,
    );

    expect(screen.getByText("Шалгалтын үйл явц")).toBeInTheDocument();
    expect(screen.getByText("Өрөөний код")).toBeInTheDocument();
    expect(screen.getByText("ROOM42")).toBeInTheDocument();
    expect(screen.getAllByText("Илгээсэн").length).toBeGreaterThan(0);
    expect(screen.getByText("А. Ануужин")).toBeInTheDocument();
    expect(screen.getByText("34344534")).toBeInTheDocument();
    expect(screen.getByText("28/30")).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(screen.getByText("2026.03.30-11:40")).toBeInTheDocument();
    expect(screen.getByText("Хэвийн")).toBeInTheDocument();
    expect(screen.getAllByText("Зөрчил").length).toBeGreaterThan(0);
    expect(screen.getByText("Нийт 10 сурагч")).toBeInTheDocument();
  });

  it("shows finished text instead of countdown for completed exams", () => {
    render(
      <TeacherScheduleDetailPanel
        exam={{
          ...exam,
          status: "finished",
          finishedAt: "2026-03-30T10:00:00.000Z",
        }}
        roster={{
          ...roster,
          finishedAt: "2026-03-30T10:00:00.000Z",
        }}
        rosterLoading={false}
        attendanceJoined={10}
        attendanceSubmitted={10}
        onBack={() => {}}
      />,
    );

    expect(screen.getByText("Шалгалт дуусахад")).toBeInTheDocument();
    expect(screen.getByText("Дууссан")).toBeInTheDocument();
  });
});
