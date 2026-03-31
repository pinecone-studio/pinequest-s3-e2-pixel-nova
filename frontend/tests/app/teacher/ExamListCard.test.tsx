import { fireEvent, render, screen } from "@testing-library/react";
import ExamListCard from "@/app/teacher/components/ExamListCard";
import type { Exam } from "@/app/teacher/types";

describe("ExamListCard", () => {
  const exams: Exam[] = [
    {
      id: "exam-1",
      title: "9-р ангийн явцын шалгалт",
      description: "01_employment_contract.pdf",
      className: "9А",
      roomCode: "ROOM-9",
      createdAt: "2024-02-24T08:00:00.000Z",
      scheduledAt: null,
      questions: [],
    },
    {
      id: "exam-2",
      title: "10-р ангийн улирлын шалгалт",
      description: "02_contract.pdf",
      className: "10А",
      roomCode: "ROOM-10",
      createdAt: "2024-02-25T08:00:00.000Z",
      scheduledAt: null,
      questions: [],
    },
  ];

  it("shows folders in numeric order and filters exams by selected folder", () => {
    render(<ExamListCard exams={exams} onCopyCode={jest.fn()} />);

    expect(screen.getByText("9-р ангийн явцын шалгалт")).toBeInTheDocument();
    expect(
      screen.queryByText("10-р ангийн улирлын шалгалт"),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /10-р анги/i }));

    expect(screen.getByText("10-р ангийн улирлын шалгалт")).toBeInTheDocument();
    expect(
      screen.queryByText("9-р ангийн явцын шалгалт"),
    ).not.toBeInTheDocument();
  });

  it("calls create and open actions from the figma-style list", () => {
    const onCreateExam = jest.fn();
    const onOpenExam = jest.fn();
    const onDownloadExam = jest.fn();

    render(
      <ExamListCard
        exams={exams}
        onCopyCode={jest.fn()}
        onCreateExam={onCreateExam}
        onOpenExam={onOpenExam}
        onDownloadExam={onDownloadExam}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Шалгалт үүсгэх" }));
    fireEvent.click(
      screen.getByRole("button", { name: "9-р ангийн явцын шалгалт харах" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "9-р ангийн явцын шалгалт татах" }),
    );

    expect(onCreateExam).toHaveBeenCalledTimes(1);
    expect(onOpenExam).toHaveBeenCalledWith("exam-1");
    expect(onDownloadExam).toHaveBeenCalledWith("exam-1");
  });
});
