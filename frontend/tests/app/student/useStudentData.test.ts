const mockGetSessionUser = jest.fn();
const mockGetStudentResults = jest.fn();

jest.mock("@/lib/examGuard", () => ({
	getSessionUser: (...args: unknown[]) => mockGetSessionUser(...args),
}));

jest.mock("@/lib/backend-auth", () => ({
	getStudentResults: (...args: unknown[]) => mockGetStudentResults(...args),
}));

import { renderHook, act, waitFor } from "@testing-library/react";
import { useStudentData } from "@/app/student/hooks/useStudentData";
import type { User } from "@/lib/examGuard";

const mockUser: User = {
	id: "s1",
	username: "Бат",
	password: "",
	role: "student",
	createdAt: "2024-01-01",
};

const mockResults = [
	{ examId: "e1", title: "Math", submittedAt: "2024-06-01", percentage: 90, score: 9, totalPoints: 10 },
	{ examId: "e2", title: "Science", submittedAt: "2024-06-02", percentage: 80, score: 8, totalPoints: 10 },
];

// Suppress act() warnings from async state updates in intervals
const originalError = console.error;
beforeAll(() => {
	console.error = (...args: unknown[]) => {
		if (typeof args[0] === "string" && args[0].includes("not wrapped in act")) return;
		originalError(...args);
	};
});
afterAll(() => {
	console.error = originalError;
});

describe("useStudentData", () => {
	beforeEach(() => {
		jest.useFakeTimers();
		mockGetSessionUser.mockReturnValue(mockUser);
		mockGetStudentResults.mockResolvedValue(mockResults);
	});

	afterEach(() => {
		jest.useRealTimers();
		jest.restoreAllMocks();
	});

	it("loads exams from backend when overrideUser is provided", async () => {
		const { result } = renderHook(() => useStudentData(mockUser));

		await waitFor(() => expect(result.current.loading).toBe(false));

		expect(result.current.currentUser).toEqual(mockUser);
		expect(result.current.exams).toHaveLength(2);
		expect(result.current.exams[0].title).toBe("Math");
	});

	it("builds notifications from results", async () => {
		const { result } = renderHook(() => useStudentData(mockUser));

		await waitFor(() => expect(result.current.loading).toBe(false));

		expect(result.current.notifications).toHaveLength(2);
		expect(result.current.notifications[0].message).toContain("Math");
		expect(result.current.notifications[0].read).toBe(false);
	});

	it("falls back to getSessionUser when no override", async () => {
		const { result } = renderHook(() => useStudentData());

		await waitFor(() => expect(result.current.loading).toBe(false));

		expect(mockGetSessionUser).toHaveBeenCalled();
		expect(result.current.currentUser).toEqual(mockUser);
	});

	it("sets empty state when no user", async () => {
		mockGetSessionUser.mockReturnValue(null);

		const { result } = renderHook(() => useStudentData());

		await waitFor(() => expect(result.current.loading).toBe(false));

		expect(result.current.exams).toEqual([]);
		expect(result.current.notifications).toEqual([]);
	});

	it("handles API error gracefully", async () => {
		mockGetStudentResults.mockRejectedValue(new Error("Network error"));

		const { result } = renderHook(() => useStudentData(mockUser));

		await waitFor(() => expect(result.current.loading).toBe(false));

		expect(result.current.exams).toEqual([]);
		expect(result.current.notifications).toEqual([]);
	});

	it("defaults theme to light", () => {
		const { result } = renderHook(() => useStudentData(mockUser));
		expect(result.current.theme).toBe("light");
	});

	it("allows setting theme to dark", () => {
		const { result } = renderHook(() => useStudentData(mockUser));

		act(() => result.current.setTheme("dark"));

		expect(result.current.theme).toBe("dark");
	});

	it("syncs data every 5 seconds", async () => {
		const { result } = renderHook(() => useStudentData(mockUser));

		await waitFor(() => expect(result.current.loading).toBe(false));

		const callsBefore = mockGetStudentResults.mock.calls.length;

		await act(async () => {
			jest.advanceTimersByTime(5000);
		});

		expect(mockGetStudentResults.mock.calls.length).toBeGreaterThan(callsBefore);
	});
});
