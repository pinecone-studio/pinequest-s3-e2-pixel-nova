import { render, screen } from "@testing-library/react";
import TeacherStudentsTab from "@/app/teacher/components/TeacherStudentsTab";

describe("TeacherStudentsTab", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-03-27T09:15:00"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders the schedule starting from today and keeps the time column separate from the scroll area", () => {
    render(<TeacherStudentsTab exams={[]} onAddSchedule={() => {}} />);

    expect(screen.getByText("3 сарын 27")).toBeInTheDocument();

    const hourLabel = screen.getByText("08 цаг");
    expect(hourLabel.parentElement).toHaveClass("shrink-0");
    expect(hourLabel.parentElement).toHaveStyle({ width: "88px" });
  });
});
