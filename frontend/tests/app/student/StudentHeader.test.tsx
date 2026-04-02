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
        onOpenHelp={jest.fn()}
      />,
    );

    expect(screen.getByText("Pinecone")).toBeInTheDocument();
    expect(screen.getByText("2.5 мян. XP")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Хиймэл оюуны дүгнэлт" }),
    ).not.toBeInTheDocument();

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
        onOpenHelp={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Мэдэгдэл нээх" }));
    expect(
      screen.getByText("Математик эцсийн шалгалтын дүн шинэчлэгдлээ."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Дансны цэс нээх" }));
    expect(screen.queryByRole("button", { name: "Тохиргоо" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Өнгө солих" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Профайл" }));
    expect(onOpenProfile).toHaveBeenCalledTimes(1);
  });
});
