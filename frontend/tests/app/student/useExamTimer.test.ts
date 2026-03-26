import { renderHook, act } from "@testing-library/react";
import { useExamTimer } from "@/app/student/hooks/useExamTimer";
import type { Exam } from "@/app/student/types";
import type { User } from "@/lib/examGuard";

const mockUser: User = {
	id: "u1",
	username: "student",
	password: "",
	role: "student",
	createdAt: "2024-01-01",
};

const mockExam: Exam = {
	id: "e1",
	title: "Test",
	roomCode: "ABC123",
	scheduledAt: null,
	questions: [],
	createdAt: "2024-01-01",
};

describe("useExamTimer", () => {
	beforeEach(() => jest.useFakeTimers());
	afterEach(() => jest.useRealTimers());

	it("does nothing when view is not exam", () => {
		const setTimeLeft = jest.fn();
		const submitExam = jest.fn();

		renderHook(() =>
			useExamTimer({
				view: "dashboard",
				currentUser: mockUser,
				activeExam: mockExam,
				setTimeLeft,
				submitExam,
			}),
		);

		act(() => jest.advanceTimersByTime(3000));

		expect(setTimeLeft).not.toHaveBeenCalled();
	});

	it("does nothing when currentUser is null", () => {
		const setTimeLeft = jest.fn();
		const submitExam = jest.fn();

		renderHook(() =>
			useExamTimer({
				view: "exam",
				currentUser: null,
				activeExam: mockExam,
				setTimeLeft,
				submitExam,
			}),
		);

		act(() => jest.advanceTimersByTime(3000));

		expect(setTimeLeft).not.toHaveBeenCalled();
	});

	it("does nothing when activeExam is null", () => {
		const setTimeLeft = jest.fn();
		const submitExam = jest.fn();

		renderHook(() =>
			useExamTimer({
				view: "exam",
				currentUser: mockUser,
				activeExam: null,
				setTimeLeft,
				submitExam,
			}),
		);

		act(() => jest.advanceTimersByTime(3000));

		expect(setTimeLeft).not.toHaveBeenCalled();
	});

	it("decrements timeLeft every second during exam", () => {
		const setTimeLeft = jest.fn();
		const submitExam = jest.fn();

		renderHook(() =>
			useExamTimer({
				view: "exam",
				currentUser: mockUser,
				activeExam: mockExam,
				setTimeLeft,
				submitExam,
			}),
		);

		act(() => jest.advanceTimersByTime(3000));

		expect(setTimeLeft).toHaveBeenCalledTimes(3);
		// Each call receives an updater function
		const updater = setTimeLeft.mock.calls[0][0];
		expect(typeof updater).toBe("function");
		// Decrement: 10 -> 9
		expect(updater(10)).toBe(9);
	});

	it("auto-submits when time reaches 0", () => {
		const setTimeLeft = jest.fn();
		const submitExam = jest.fn();

		renderHook(() =>
			useExamTimer({
				view: "exam",
				currentUser: mockUser,
				activeExam: mockExam,
				setTimeLeft,
				submitExam,
			}),
		);

		act(() => jest.advanceTimersByTime(1000));

		const updater = setTimeLeft.mock.calls[0][0];
		// When prev is 1, should submit and return 0
		const result = updater(1);
		expect(result).toBe(0);
		expect(submitExam).toHaveBeenCalledWith(true);
	});

	it("clears interval on unmount", () => {
		const setTimeLeft = jest.fn();
		const submitExam = jest.fn();

		const { unmount } = renderHook(() =>
			useExamTimer({
				view: "exam",
				currentUser: mockUser,
				activeExam: mockExam,
				setTimeLeft,
				submitExam,
			}),
		);

		act(() => jest.advanceTimersByTime(1000));
		const callsBefore = setTimeLeft.mock.calls.length;

		unmount();
		act(() => jest.advanceTimersByTime(3000));

		expect(setTimeLeft.mock.calls.length).toBe(callsBefore);
	});
});
