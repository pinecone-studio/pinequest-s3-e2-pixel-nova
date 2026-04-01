import { render, screen } from "@testing-library/react";
import StudentAiInsightsTab from "@/app/student/components/StudentAiInsightsTab";

describe("StudentAiInsightsTab", () => {
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
});
