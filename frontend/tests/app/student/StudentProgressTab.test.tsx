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
        subjectInsights={{
          Математик: {
            subject: "Математик",
            average: 88,
            concerns: [
              { label: "Алгебр", score: 42 },
              { label: "Тэгшитгэл", score: 55 },
            ],
            strengths: [
              { label: "Геометр", score: 93 },
              { label: "Функц", score: 87 },
            ],
            recommendations: [
              "Алгебрийн алдаатай бодлогуудыг дахин ажиллаарай.",
              "Тэгшитгэлийн алхамуудаа тайлбарлаж бичээрэй.",
              "Геометр дээрх арга барилаа бусад сэдэвт ашиглаарай.",
            ],
            examCount: 2,
            questionCount: 14,
            accuracy: 88,
            latestExamTitle: "Mathematics Final Exam",
            latestSubmittedAt: "2026-01-14T09:00:00.000Z",
            recentMistakes: [
              {
                topic: "Алгебр",
                questionText: "2x + 5 = 17 тэгшитгэлийг бод.",
                selectedAnswer: "x = 5",
                correctAnswer: "x = 6",
                examTitle: "Mathematics Final Exam",
                submittedAt: "2026-01-14T09:00:00.000Z",
              },
            ],
          },
        }}
        studentHistory={studentHistory}
      />,
    );

    expect(screen.getByText("Миний ахиц")).toBeInTheDocument();
    expect(screen.getByText("Шалгалтын дүн")).toBeInTheDocument();
    expect(screen.getByText("Дүгнэлт")).toBeInTheDocument();
    expect(screen.getByText("Хиймэл оюуны ерөнхий дүгнэлт")).toBeInTheDocument();
    expect(screen.getByText("English Reading Quiz")).toBeInTheDocument();
    expect(screen.getByText("Mathematics Final Exam")).toBeInTheDocument();
    expect(screen.getByText("Physics Midterm")).toBeInTheDocument();
    expect(screen.getByText("ТА")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Mathematics Final Exam/i }));

    expect(screen.getByRole("dialog", { name: "Mathematics Final Exam" })).toBeInTheDocument();
    expect(screen.getByText("Хувийн дүн")).toBeInTheDocument();
    expect(screen.getByText("Оноо")).toBeInTheDocument();
    expect(screen.getByText("Үнэлгээ")).toBeInTheDocument();
    expect(screen.getByText("Анхаарах хэрэгтэй")).toBeInTheDocument();
    expect(screen.getByText("Гүйцэтгэл өндөр сэдэв")).toBeInTheDocument();
    expect(screen.getByText("Зөвлөгөө")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /Хиймэл оюуны ерөнхий дүгнэлт/i }),
    );

    expect(
      screen.getByRole("dialog", { name: "Хиймэл оюуны ерөнхий дүгнэлт" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Сайн байгаа хэсэг")).toBeInTheDocument();
    expect(screen.getByText("Анхаарах хэсэг")).toBeInTheDocument();
    expect(screen.getByText("Өнөөдрийн урам")).toBeInTheDocument();
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
