import { render, screen } from "@testing-library/react";
import TeacherScheduleDetailPanel from "@/app/teacher/components/TeacherScheduleDetailPanel";
import type { Exam, ExamRosterDetail } from "@/app/teacher/types";

describe("TeacherScheduleDetailPanel", () => {
  const exam: Exam = {
    id: "exam-1",
    title: "Математик",
    scheduledAt: "2026-03-30T09:00:00.000Z",
    roomCode: "ROOM42",
    duration: 45,
    expectedStudentsCount: 10,
    createdAt: "2026-03-28T09:00:00.000Z",
    questions: [],
  };

  const roster: ExamRosterDetail = {
    examId: "exam-1",
    title: "Математик",
    roomCode: "ROOM42",
    durationMin: 45,
    expectedStudentsCount: 10,
    scheduledAt: "2026-03-30T09:00:00.000Z",
    startedAt: null,
    finishedAt: null,
    participants: [],
  };

  it("renders the attendance summary as a donut with the percentage in the middle", () => {
    render(
      <TeacherScheduleDetailPanel
        exam={exam}
        roster={roster}
        rosterLoading={false}
        attendanceJoined={6}
        attendanceSubmitted={4}
        onBack={() => {}}
      />,
    );

    expect(screen.getByText("Шалгалтын ирц")).toBeInTheDocument();
    expect(screen.getByText("Мэдээлэл оруулаагүй байна.")).toBeInTheDocument();
    expect(screen.getByLabelText("Ирц 60 хувь")).toBeInTheDocument();
    expect(screen.getByText("60%")).toBeInTheDocument();
  });
});
