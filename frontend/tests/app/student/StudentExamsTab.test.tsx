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

const upcomingExam: Exam = {
  id: "exam-2",
  title: "Math Progress Quiz",
  description: "Математик",
  scheduledAt: "2099-04-29T09:30:00.000Z",
  roomCode: "ROOM02",
  createdAt: "2099-04-28T09:00:00.000Z",
  duration: 45,
  questions: [],
};

describe("StudentExamsTab", () => {
  it("renders the selected exam detail layout and actions", () => {
    const onStartExam = jest.fn();
    const onClearSelection = jest.fn();

    render(
      <StudentExamsTab
        loading={false}
        exams={[]}
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

    expect(screen.getByText("Шалгалт эхлүүлэх")).toBeInTheDocument();
    expect(
      screen.getByText("Англи хэлний авцын шалгалт"),
    ).toBeInTheDocument();
    expect(screen.getByText("Англи хэл")).toBeInTheDocument();
    expect(screen.getByText("Г. Сарантуяа")).toBeInTheDocument();
    expect(screen.getByText("AX7K2P")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Шалгалт эхлүүлэх" }));
    expect(screen.getByText("Камер нээх")).toBeInTheDocument();
    expect(onStartExam).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Цааш" }));
    expect(screen.getByText("Шалгалт илгээгдэх")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Цааш" }));
    expect(screen.getByText("Дэлгэц солих")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Цааш" }));
    expect(screen.getByText("Copy Paste хийх")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Эхлүүлэх" }));
    expect(onStartExam).toHaveBeenCalledTimes(1);

    fireEvent.click(
      screen.getByRole("button", { name: "Шалгалтын жагсаалт руу буцах" }),
    );
    expect(onClearSelection).toHaveBeenCalledTimes(1);
  });

  it("allows the student to close the onboarding modal before starting", () => {
    render(
      <StudentExamsTab
        loading={false}
        exams={[]}
        joinLoading={false}
        roomCodeInput="AX7K2P"
        setRoomCodeInput={jest.fn()}
        joinError={null}
        onLookup={jest.fn()}
        selectedExam={selectedExam}
        onStartExam={jest.fn()}
        onClearSelection={jest.fn()}
        teacherName="Г. Сарантуяа"
        studentHistory={[]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Шалгалт эхлүүлэх" }));
    expect(screen.getByText("Камер нээх")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Болих" }));
    expect(screen.queryByText("Камер нээх")).not.toBeInTheDocument();
  });

  it("shows the join panel when no exam is selected", () => {
    const onLookup = jest.fn();
    const onSelectExam = jest.fn();

    render(
      <StudentExamsTab
        loading={false}
        exams={[upcomingExam]}
        joinLoading={false}
        roomCodeInput=""
        setRoomCodeInput={jest.fn()}
        joinError={null}
        onLookup={onLookup}
        selectedExam={null}
        onStartExam={jest.fn()}
        onClearSelection={jest.fn()}
        onSelectExam={onSelectExam}
        teacherName={null}
        studentHistory={[]}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Шалгалтад нэвтрэх" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Шалгалтын дүрэм ба мэдээлэл")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Өрөөний код")).toBeInTheDocument();
    expect(screen.getByText("Буцах")).toBeInTheDocument();
    expect(screen.getByText("Автоматаар илгээх")).toBeInTheDocument();
    expect(screen.getByText("Хуулах")).toBeInTheDocument();
    expect(screen.getByText("Камер")).toBeInTheDocument();
    expect(screen.getByText("Удахгүй болох шалгалтууд")).toBeInTheDocument();
    expect(screen.getByText("Математик")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Шалгалтад нэвтрэх" }));
    expect(onLookup).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: /Математик/i }));
    expect(onSelectExam).toHaveBeenCalledWith(
      expect.objectContaining({ id: "exam-2" }),
    );
  });

  it("renders the screenshot-style loading block for exams tab", () => {
    render(
      <StudentExamsTab
        loading={true}
        exams={[]}
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

    expect(screen.getByLabelText("student-exams-loading")).toBeInTheDocument();
  });
});
