import { fireEvent, render, screen } from "@testing-library/react";
import ExamScheduleDatePicker from "@/app/teacher/components/ExamScheduleDatePicker";

jest.mock("@/components/ui/calendar", () => ({
  Calendar: ({
    onSelect,
    fromDate,
    toDate,
  }: {
    onSelect: (date: Date) => void;
    fromDate?: Date;
    toDate?: Date;
  }) => (
    <div>
      <button type="button" onClick={() => onSelect(new Date("2026-03-27T00:00:00"))}>
        today
      </button>
      <span data-testid="from-date">{fromDate?.toISOString()}</span>
      <span data-testid="to-date">{toDate?.toISOString()}</span>
    </div>
  ),
}));

describe("ExamScheduleDatePicker", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-03-27T09:15:00"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("allows scheduling starting from today", () => {
    const setScheduleDate = jest.fn();

    render(
      <ExamScheduleDatePicker
        scheduleDate=""
        setScheduleDate={setScheduleDate}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Он, сар, өдрөө оруулна уу/i }),
    );

    expect(
      screen.getByText("Өнөөдрөөс 1 сар хүртэл хуваарьлана."),
    ).toBeInTheDocument();

    const fromDate = new Date(
      screen.getByTestId("from-date").textContent ?? "",
    );
    expect(fromDate.getFullYear()).toBe(2026);
    expect(fromDate.getMonth()).toBe(2);
    expect(fromDate.getDate()).toBe(27);

    fireEvent.click(screen.getByRole("button", { name: "today" }));

    expect(setScheduleDate).toHaveBeenCalledWith("2026-03-27T09:00");
  });
});
