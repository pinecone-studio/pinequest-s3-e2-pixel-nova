import { render, screen } from "@testing-library/react";
import TeacherAnalyticsDashboardTab from "@/app/teacher/components/TeacherAnalyticsDashboardTab";

describe("TeacherAnalyticsDashboardTab", () => {
  it("renders safely when analytics payload is missing optional arrays", () => {
    render(
      <TeacherAnalyticsDashboardTab
        loading={false}
        analytics={
          {
            totalClasses: 2,
            totalExams: 3,
            totalStudents: 20,
            totalSubmissions: 50,
            lastSevenDaysSubmissions: 8,
          } as never
        }
      />,
    );

    expect(screen.getByText("Шалгалтын аналитик")).toBeInTheDocument();
    expect(
      screen.getByText("Хангалттай submission цуглармагц график энд харагдана."),
    ).toBeInTheDocument();
    expect(screen.getByText("AI дүгнэлт одоогоор бэлэн биш байна.")).toBeInTheDocument();
  });
});
