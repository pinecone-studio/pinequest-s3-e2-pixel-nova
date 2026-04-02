import { fireEvent, render, screen } from "@testing-library/react";
import ExamScheduleDatePicker from "@/app/teacher/components/ExamScheduleDatePicker";

let lastFromDate: Date | undefined;
jest.mock("@/components/ui/calendar", () => ({
  Calendar: ({
    onSelect,
    fromDate,
    toDate,
  }: {
    onSelect: (date: Date) => void;
    fromDate?: Date;
    toDate?: Date;
  }) => {
    lastFromDate = fromDate;

    return (
      <div>
        <button type="button" onClick={() => onSelect(new Date(2026, 2, 27))}>
        today
        </button>
      </div>
    );
  },
}));

describe("ExamScheduleDatePicker", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 2, 27, 9, 15, 0));
    lastFromDate = undefined;
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
      screen.getByRole("button", { name: "today" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("schedule-calendar-content")).toHaveClass(
      "justify-center",
    );

    expect(lastFromDate).toBeDefined();
    expect(lastFromDate?.getFullYear()).toBe(2026);
    expect(lastFromDate?.getMonth()).toBe(2);
    expect(lastFromDate?.getDate()).toBe(27);

    fireEvent.click(screen.getByRole("button", { name: "today" }));

    expect(setScheduleDate).toHaveBeenCalledWith(
      new Date(2026, 2, 27, 9, 0, 0, 0).toISOString(),
    );
  });
});
