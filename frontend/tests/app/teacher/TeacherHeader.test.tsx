import { fireEvent, render, screen } from "@testing-library/react";
import TeacherHeader from "@/app/teacher/components/TeacherHeader";

/* eslint-disable @next/next/no-img-element */
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => <img alt={String(props.alt ?? "")} />,
}));

describe("TeacherHeader", () => {
  it("fires a contextual notification action", () => {
    const onMarkRead = jest.fn();
    const onNotificationAction = jest.fn();

    render(
      <TeacherHeader
        notifications={[
          {
            id: "notification-1",
            userId: "teacher-1",
            role: "teacher",
            type: "exam_finished",
            severity: "info",
            status: "unread",
            title: "Шалгалт дууслаа",
            message: "Math Final шалгалтын дүн бэлэн боллоо.",
            createdAt: "2026-04-03T10:00:00.000Z",
          },
        ]}
        unreadCount={1}
        onMarkRead={onMarkRead}
        onNotificationAction={onNotificationAction}
        activeTab="Хуваарь"
        setActiveTab={jest.fn()}
        tabs={["Хуваарь", "Шалгалтын сан", "Шалгалтын аналитик"]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Notifications" }));
    fireEvent.click(screen.getByRole("button", { name: "Аналитик руу очих" }));

    expect(onMarkRead).toHaveBeenCalledWith("notification-1");
    expect(onNotificationAction).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "notification-1",
        type: "exam_finished",
      }),
    );
  });
});
