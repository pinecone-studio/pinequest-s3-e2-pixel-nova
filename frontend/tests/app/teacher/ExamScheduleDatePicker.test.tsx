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
      screen.getByText("Өнөөдрөөс 1 сар хүртэл хуваарьлана."),
    ).toBeInTheDocument();

    expect(lastFromDate).toBeDefined();
    expect(lastFromDate?.getFullYear()).toBe(2026);
    expect(lastFromDate?.getMonth()).toBe(2);
    expect(lastFromDate?.getDate()).toBe(27);

    fireEvent.click(screen.getByRole("button", { name: "today" }));

    expect(setScheduleDate).toHaveBeenCalledWith(
      new Date("2026-03-27T09:00:00+08:00").toISOString(),
    );
  });
});
