import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import TeacherStudentsTab from "@/app/teacher/components/TeacherStudentsTab";
import type { Exam } from "@/app/teacher/types";

describe("TeacherStudentsTab", () => {
  const scheduledExam: Exam = {
    id: "exam-1",
    title: "Англи хэл 10А",
    className: "10А",
    groupName: "Заавал",
    description: "Давтлагын шалгалт",
    scheduledAt: "2026-03-27T09:30:00.000Z",
    roomCode: "ROOM42",
    duration: 45,
    createdAt: "2026-03-20T09:00:00.000Z",
    questions: [],
  };

  const finishedExam: Exam = {
    id: "exam-2",
    title: "Математик 9Б",
    className: "9Б",
    groupName: "Сонгон",
    description: "Өмнөх шалгалт",
    scheduledAt: "2026-03-25T09:30:00.000Z",
    finishedAt: "2026-03-25T10:15:00.000Z",
    roomCode: "ROOM99",
    duration: 45,
    createdAt: "2026-03-20T09:00:00.000Z",
    questions: [],
  };

  const staleFinishedExam: Exam = {
    id: "exam-3",
    title: "Англи хэл улирлын шалгалт",
    className: "10А",
    groupName: "Сонгон судлал",
    status: "active",
    description: "Хугацаа нь дууссан шалгалт",
    scheduledAt: "2026-03-27T00:00:00.000Z",
    roomCode: "ROOM77",
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

  it("renders the schedule starting from today in calendar view", () => {
    render(<TeacherStudentsTab exams={[]} onAddSchedule={() => {}} />);

    fireEvent.click(screen.getByLabelText("Calendar view"));

    expect(screen.getByText("3 сарын 27")).toBeInTheDocument();
    expect(screen.getByText("08 цаг")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Удахгүй болох шалгалтууд" }),
    ).not.toBeInTheDocument();
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

  it("filters schedule cards by upcoming and finished exams", () => {
    render(
      <TeacherStudentsTab
        exams={[scheduledExam, finishedExam]}
        onAddSchedule={() => {}}
      />,
    );

    expect(screen.getByText("Англи хэл 10А")).toBeInTheDocument();
    expect(screen.getByText(/10А анги/)).toBeInTheDocument();
    expect(screen.queryByText("Математик 9Б")).not.toBeInTheDocument();
    expect(screen.queryByText(/Хичээл:/)).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Удахгүй болох шалгалтууд" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Дууссан шалгалтууд" }));

    expect(screen.getByText("Математик 9Б")).toBeInTheDocument();
    expect(screen.getByText(/9Б анги/)).toBeInTheDocument();
    expect(screen.queryByText("Англи хэл 10А")).not.toBeInTheDocument();
  });

  it("shows finished label instead of time in calendar view for past exams", () => {
    render(
      <TeacherStudentsTab
        exams={[scheduledExam, staleFinishedExam]}
        onAddSchedule={() => {}}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Удахгүй болох шалгалтууд" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Дууссан шалгалтууд" }));
    fireEvent.click(screen.getByLabelText("Calendar view"));

    expect(screen.getByText("Англи хэл улирлын шалгалт")).toBeInTheDocument();
    expect(screen.getByText(/10А анги/)).toBeInTheDocument();
    expect(screen.getByText("Дууссан")).toBeInTheDocument();
    expect(screen.queryByText("сонгон судлал")).not.toBeInTheDocument();
    expect(screen.queryByText("08:00-08:45")).not.toBeInTheDocument();
  });
});
