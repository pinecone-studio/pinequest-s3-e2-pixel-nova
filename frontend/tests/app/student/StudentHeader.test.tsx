import { fireEvent, render, screen } from "@testing-library/react";
import StudentHeader from "@/app/student/components/StudentHeader";
import type { NotificationItem } from "@/app/student/types";

const notifications: NotificationItem[] = [
  {
    id: "notification-1",
    userId: "student-1",
    role: "student",
    type: "result_published",
    severity: "info",
    status: "unread",
    title: "Дүн шинэчлэгдлээ",
    examId: "exam-1",
    message: "Mathematics Final Exam шалгалтын дүн шинэчлэгдлээ.",
    createdAt: "2026-03-26T01:00:00.000Z",
  },
];

describe("StudentHeader", () => {
  it("switches between primary tabs inside the redesigned header", () => {
    const onTabChange = jest.fn();

    render(
      <StudentHeader
        activeTab="Home"
        currentUserName="John Doe"
        currentUserInitials="JD"
        notifications={notifications}
        unreadCount={1}
        onMarkNotificationRead={jest.fn()}
        onMarkAllNotificationsRead={jest.fn()}
        xp={2450}
        onTabChange={onTabChange}
        onOpenProfile={jest.fn()}
        onOpenSettings={jest.fn()}
        onOpenHelp={jest.fn()}
        onToggleTheme={jest.fn()}
      />,
    );

    expect(screen.getByText("EduCore LMS")).toBeInTheDocument();
    expect(screen.getByText("2.5k XP")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Шалгалт" }));
    expect(onTabChange).toHaveBeenCalledWith("Exams");
  });

  it("opens notifications and account menu actions", () => {
    const onOpenProfile = jest.fn();

    render(
      <StudentHeader
        activeTab="Home"
        currentUserName="John Doe"
        currentUserInitials="JD"
        notifications={notifications}
        unreadCount={1}
        onMarkNotificationRead={jest.fn()}
        onMarkAllNotificationsRead={jest.fn()}
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
