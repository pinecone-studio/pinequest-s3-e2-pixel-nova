import { fireEvent, render, screen } from "@testing-library/react";
import StudentExamsTab from "@/app/student/components/StudentExamsTab";
import type { Exam } from "@/app/student/types";

const selectedExam: Exam = {
  id: "exam-1",
  title: "Англи хэлний авцын шалгалт",
  description: "Англи хэл",
  scheduledAt: "2024-04-28T09:00:00.000Z",
  roomCode: "AX7K2P",
  createdAt: "2024-04-28T09:00:00.000Z",
  duration: 40,
  questions: [
    {
      id: "q-1",
      text: "Question 1",
      type: "mcq",
      options: ["A", "B"],
      correctAnswer: "",
      points: 1,
    },
  ],
};

describe("StudentExamsTab", () => {
  it("renders the selected exam detail layout and actions", () => {
    const onStartExam = jest.fn();
    const onClearSelection = jest.fn();

    render(
      <StudentExamsTab
        loading={false}
        joinLoading={false}
        roomCodeInput="AX7K2P"
        setRoomCodeInput={jest.fn()}
        joinError={null}
        onLookup={jest.fn()}
        selectedExam={selectedExam}
        onStartExam={onStartExam}
        onClearSelection={onClearSelection}
        teacherName="Г. Сарантуяа"
        studentHistory={[]}
      />,
    );

    expect(screen.getByText("Англи хэлний авцын шалгалт")).toBeInTheDocument();
    expect(screen.getByText("Г. Сарантуяа")).toBeInTheDocument();
    expect(screen.getByText("AX7K2P")).toBeInTheDocument();
    expect(screen.getByText("Шалгалт эхлүүлэх")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Шалгалт эхлүүлэх" }));
    expect(onStartExam).toHaveBeenCalledTimes(1);

    fireEvent.click(
      screen.getByRole("button", { name: "Go back to exam list" }),
    );
    expect(onClearSelection).toHaveBeenCalledTimes(1);
  });

  it("shows the join panel when no exam is selected", () => {
    render(
      <StudentExamsTab
        loading={false}
        joinLoading={false}
        roomCodeInput=""
        setRoomCodeInput={jest.fn()}
        joinError={null}
        onLookup={jest.fn()}
        selectedExam={null}
        onStartExam={jest.fn()}
        onClearSelection={jest.fn()}
        teacherName={null}
        studentHistory={[]}
      />,
    );

    expect(screen.getByText("Дараагийн шалгалтад нэвтрэх")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("AX7K2P")).toBeInTheDocument();
  });
});
