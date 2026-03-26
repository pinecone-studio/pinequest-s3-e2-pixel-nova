import { fireEvent, render, screen } from "@testing-library/react";
import StudentHeader from "@/app/student/components/StudentHeader";
import type { NotificationItem } from "@/app/student/types";

const notifications: NotificationItem[] = [
  {
    examId: "exam-1",
    message: "Mathematics Final Exam шалгалтын дүн шинэчлэгдлээ.",
    read: false,
    createdAt: "2026-03-26T01:00:00.000Z",
  },
];

describe("StudentHeader", () => {
  it("switches between primary tabs", () => {
    const onTabChange = jest.fn();

    render(
      <StudentHeader
        activeTab="Home"
        currentUserName="John Doe"
        currentUserInitials="JD"
        notifications={notifications}
        xp={2450}
        onTabChange={onTabChange}
        onOpenProfile={jest.fn()}
        onOpenSettings={jest.fn()}
        onOpenHelp={jest.fn()}
        onToggleTheme={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Шалгалт" }));
    expect(onTabChange).toHaveBeenCalledWith("Exams");
    expect(screen.getByText("2,450 XP")).toBeInTheDocument();
  });

  it("opens notifications and account menu actions", () => {
    const onOpenProfile = jest.fn();

    render(
      <StudentHeader
        activeTab="Home"
        currentUserName="John Doe"
        currentUserInitials="JD"
        notifications={notifications}
        xp={2450}
        onTabChange={jest.fn()}
        onOpenProfile={onOpenProfile}
        onOpenSettings={jest.fn()}
        onOpenHelp={jest.fn()}
        onToggleTheme={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Мэдэгдэл нээх" }));
    expect(
      screen.getByText("Mathematics Final Exam шалгалтын дүн шинэчлэгдлээ."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Дансны цэс нээх" }));
    fireEvent.click(screen.getByRole("button", { name: "Профайл" }));
    expect(onOpenProfile).toHaveBeenCalledTimes(1);
  });
});
