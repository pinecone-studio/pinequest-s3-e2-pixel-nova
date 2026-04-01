import { fireEvent, render, screen } from "@testing-library/react";
import StudentProgressTab from "@/app/student/components/StudentProgressTab";

const studentHistory = [
  {
    examId: "math-1",
    title: "Mathematics Final Exam",
    percentage: 88,
    score: 44,
    totalPoints: 50,
    date: "2026-01-14T09:00:00.000Z",
  },
  {
    examId: "physics-1",
    title: "Physics Midterm",
    percentage: 74,
    score: 37,
    totalPoints: 50,
    date: "2026-02-10T09:00:00.000Z",
  },
  {
    examId: "english-1",
    title: "English Reading Quiz",
    percentage: 92,
    score: 46,
    totalPoints: 50,
    date: "2026-03-04T09:00:00.000Z",
  },
];

describe("StudentProgressTab", () => {
  it("renders the screenshot-style progress overview", () => {
    const onOpenAiInsights = jest.fn();

    render(
      <StudentProgressTab
        loading={false}
        currentUserName="Золбоо Бат"
        currentRank={4}
        currentXp={2100}
        currentLevel={12}
        levelInfo={{ level: 4, minXP: 1200 }}
        studentProgress={{ xp: 1480 }}
        nextLevel={{ minXP: 1600 }}
        progressSegments={7}
        onOpenAiInsights={onOpenAiInsights}
        studentHistory={studentHistory}
      />,
    );

    expect(screen.getByText("Миний ахиц")).toBeInTheDocument();
    expect(screen.getByText("Хичээлийн дүн")).toBeInTheDocument();
    expect(screen.getByText("Дүгнэлт")).toBeInTheDocument();
    expect(screen.getByText("AI-ийн ерөнхий дүгнэлт")).toBeInTheDocument();
    expect(screen.getByText("English")).toBeInTheDocument();
    expect(screen.getByText("Mathematics")).toBeInTheDocument();
    expect(screen.getByText("Physics")).toBeInTheDocument();
    expect(screen.getByText("YOU")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Mathematics/i }));

    expect(screen.getByText("Анхаарах хэрэгтэй")).toBeInTheDocument();
    expect(screen.getByText("Гүйцэтгэл өндөр сэдэв")).toBeInTheDocument();
    expect(screen.getByText("Зөвлөгөө")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /AI-ийн ерөнхий дүгнэлт/i }));

    expect(onOpenAiInsights).toHaveBeenCalledTimes(1);
  });

  it("renders progress loading skeletons", () => {
    render(
      <StudentProgressTab
        loading={true}
        currentUserName="Золбоо Бат"
        currentRank={4}
        currentXp={2100}
        currentLevel={12}
        levelInfo={{ level: 4, minXP: 1200 }}
        studentProgress={{ xp: 1480 }}
        nextLevel={{ minXP: 1600 }}
        progressSegments={7}
        studentHistory={studentHistory}
      />,
    );

    expect(screen.getByLabelText("student-progress-loading")).toBeInTheDocument();
  });
});
