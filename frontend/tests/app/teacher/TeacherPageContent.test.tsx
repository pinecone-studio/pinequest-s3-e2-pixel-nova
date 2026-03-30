jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

import { render, screen } from "@testing-library/react";
import TeacherPageContent from "@/app/teacher/components/TeacherPageContent";

describe("TeacherPageContent", () => {
  it("shows the custom page skeleton while non-results tabs are loading", () => {
    render(
      <TeacherPageContent
        activeTab="Хуваарь"
        setActiveTab={() => {}}
        showScheduleForm={false}
        setShowScheduleForm={() => {}}
        data={{ loading: true } as never}
        management={{} as never}
        examStatsState={{} as never}
        attendance={{} as never}
        studentProfile={null}
        profileLoading={false}
      />,
    );

    expect(screen.getByLabelText("Teacher page loading")).toBeInTheDocument();
  });
});
