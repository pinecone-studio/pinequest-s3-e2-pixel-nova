import { render, screen } from "@testing-library/react";
import StudentAiInsightsTab from "@/app/student/components/StudentAiInsightsTab";

describe("StudentAiInsightsTab", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders ai insights loading skeletons", () => {
    render(
      <StudentAiInsightsTab
        loading={true}
        currentUserId="student-1"
        currentUserName="Золбоо Бат"
        currentXp={45}
        currentRank={4}
        totalStudents={20}
        levelInfo={{
          level: 12,
          name: "Silver",
          minXP: 1200,
        }}
        studentHistory={[]}
      />,
    );

    expect(
      screen.getByLabelText("student-ai-insights-loading"),
    ).toBeInTheDocument();
  });

  it("renders the summary insight card after opening the ai insights view", async () => {
    render(
      <StudentAiInsightsTab
        currentUserId="student-1"
        currentUserName="Золбоо Бат"
        currentXp={45}
        currentRank={4}
        totalStudents={20}
        levelInfo={{
          level: 12,
          name: "Анхдагч",
          minXP: 1200,
        }}
        studentHistory={[
          {
            examId: "exam-1",
            title: "Vocabulary Practice",
            percentage: 8,
            date: "2026-03-28T10:00:00.000Z",
          },
          {
            examId: "exam-2",
            title: "English 9 Final",
            percentage: 25,
            date: "2026-03-20T10:00:00.000Z",
          },
          {
            examId: "exam-3",
            title: "Vocabulary 5 Quiz",
            percentage: 12,
            date: "2026-03-15T10:00:00.000Z",
          },
        ]}
      />,
    );

    expect(
      await screen.findByText("Хиймэл оюуны ерөнхий дүгнэлт"),
    ).toBeInTheDocument();
    expect(screen.getByText("Дундаж оноо")).toBeInTheDocument();
    expect(screen.getByText("Хамгийн өндөр")).toBeInTheDocument();
    expect(screen.getByText("Шалгалтын тоо")).toBeInTheDocument();
    expect(screen.getByText("Онооны эрэмбэ")).toBeInTheDocument();
    expect(screen.getByText("Явцын төлөв")).toBeInTheDocument();
    expect(screen.getByText("Өнөөдрийн урам")).toBeInTheDocument();
  });
});
