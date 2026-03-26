import { render, screen } from "@testing-library/react";
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
  it("renders the redesigned progress overview cards and chart sections", () => {
    render(
      <StudentProgressTab
        levelInfo={{ level: 4, minXP: 1200 }}
        studentProgress={{ xp: 1480 }}
        nextLevel={{ minXP: 1600 }}
        progressSegments={7}
        studentHistory={studentHistory}
      />,
    );

    expect(screen.getByText("Миний ахиц")).toBeInTheDocument();
    expect(screen.getByText("Энэ долоо хоног")).toBeInTheDocument();
    expect(screen.getByText("Одоогийн түвшин")).toBeInTheDocument();
    expect(screen.getByText("Дундаж оноо")).toBeInTheDocument();
    expect(screen.getByText("Сүүлийн дүн")).toBeInTheDocument();
  });
});
