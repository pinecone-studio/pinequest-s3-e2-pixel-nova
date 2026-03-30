import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import TeacherStudentsTab from "@/app/teacher/components/TeacherStudentsTab";
import type { Exam } from "@/app/teacher/types";

describe("TeacherStudentsTab", () => {
  const scheduledExam: Exam = {
    id: "exam-1",
    title: "Математик",
    className: "10А",
    groupName: "Заавал",
    description: "Давтлагын шалгалт",
    scheduledAt: "2026-03-27T09:30:00.000Z",
    roomCode: "ROOM42",
    duration: 45,
    createdAt: "2026-03-20T09:00:00.000Z",
    questions: [],
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-03-27T09:15:00"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders the schedule starting from today and keeps the time column separate from the scroll area", () => {
    render(<TeacherStudentsTab exams={[]} onAddSchedule={() => {}} />);

    expect(screen.getByText("3 сарын 27")).toBeInTheDocument();

    const hourLabel = screen.getByText("08 цаг");
    expect(hourLabel.parentElement).toHaveClass("shrink-0");
    expect(hourLabel.parentElement).toHaveStyle({ width: "88px" });
  });

  it("shows a check icon after room code is copied in card view", async () => {
    const onCopyCode = jest.fn().mockResolvedValue(true);

    render(
      <TeacherStudentsTab
        exams={[scheduledExam]}
        onAddSchedule={() => {}}
        onCopyCode={onCopyCode}
      />,
    );

    fireEvent.click(screen.getByLabelText("Card view"));
    fireEvent.click(screen.getByLabelText("Өрөөний код хуулах"));

    await waitFor(() => expect(onCopyCode).toHaveBeenCalledWith("ROOM42"));
    await waitFor(() =>
      expect(screen.getByLabelText("Хуулагдлаа")).toBeInTheDocument(),
    );
  });
});
