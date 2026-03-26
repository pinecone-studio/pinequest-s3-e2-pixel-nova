const mockApiFetch = jest.fn();
const mockUnwrapApi = jest.fn();
const mockGetStudentResults = jest.fn();

jest.mock("@/lib/api-client", () => ({
	apiFetch: (...args: unknown[]) => mockApiFetch(...args),
	unwrapApi: (...args: unknown[]) => mockUnwrapApi(...args),
}));

jest.mock("@/lib/backend-auth", () => ({
	getStudentResults: (...args: unknown[]) => mockGetStudentResults(...args),
}));

jest.mock("@/lib/examGuard", () => ({
	getLevel: jest.fn((xp: number) => {
		if (xp >= 500) return { level: 3, name: "Дайчин", minXP: 500, icon: "⚔️" };
		if (xp >= 200) return { level: 2, name: "Суралцагч", minXP: 200, icon: "📖" };
		return { level: 1, name: "Анхдагч", minXP: 0, icon: "🌱" };
	}),
	LEVELS: [
		{ level: 1, name: "Анхдагч", minXP: 0, icon: "🌱" },
		{ level: 2, name: "Суралцагч", minXP: 200, icon: "📖" },
		{ level: 3, name: "Дайчин", minXP: 500, icon: "⚔️" },
		{ level: 4, name: "Мастер", minXP: 1000, icon: "🏆" },
	],
}));

jest.mock("@/app/student/utils", () => ({
	gradeFromPercentage: jest.fn((p: number) =>
		p >= 90 ? "A" : p >= 80 ? "B" : p >= 70 ? "C" : p >= 60 ? "D" : "F",
	),
}));

import { renderHook, waitFor } from "@testing-library/react";
import { useStudentProgress } from "@/app/student/hooks/useStudentProgress";
import type { User } from "@/lib/examGuard";

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

const mockUser: User = {
	id: "s1",
	username: "Бат",
	password: "",
	role: "student",
	createdAt: "2024-01-01",
};

const mockResults = [
	{ examId: "e1", title: "Math", score: 90, totalPoints: 100, submittedAt: "2024-06-02" },
	{ examId: "e2", title: "Science", score: 75, totalPoints: 100, submittedAt: "2024-06-01" },
];

describe("useStudentProgress", () => {
	beforeEach(() => {
		mockApiFetch.mockResolvedValue({ xp: 250, level: 2 });
		mockUnwrapApi.mockImplementation((data: Record<string, unknown>) => data);
		mockGetStudentResults.mockResolvedValue(mockResults);
	});

	afterEach(() => jest.restoreAllMocks());

	it("returns default values when no user", () => {
		const { result } = renderHook(() => useStudentProgress(null));

		expect(result.current.studentProgress).toEqual({ xp: 0, level: 1, history: [] });
		expect(result.current.studentHistory).toEqual([]);
	});

	it("loads XP profile and student results", async () => {
		const { result } = renderHook(() => useStudentProgress(mockUser));

		await waitFor(() => expect(result.current.studentProgress.xp).toBe(250));

		expect(result.current.studentProgress.level).toBe(2);
		expect(result.current.studentHistory).toHaveLength(2);
	});

	it("sorts history by date descending", async () => {
		const { result } = renderHook(() => useStudentProgress(mockUser));

		await waitFor(() => expect(result.current.studentHistory).toHaveLength(2));

		expect(result.current.studentHistory[0].examId).toBe("e1");
		expect(result.current.studentHistory[1].examId).toBe("e2");
	});

	it("computes levelInfo from XP", async () => {
		const { result } = renderHook(() => useStudentProgress(mockUser));

		await waitFor(() => expect(result.current.studentProgress.xp).toBe(250));

		expect(result.current.levelInfo.level).toBe(2);
		expect(result.current.levelInfo.name).toBe("Суралцагч");
	});

	it("computes nextLevel", async () => {
		const { result } = renderHook(() => useStudentProgress(mockUser));

		await waitFor(() => expect(result.current.studentProgress.xp).toBe(250));

		expect(result.current.nextLevel.level).toBe(3);
	});

	it("computes progressSegments (0-10)", async () => {
		const { result } = renderHook(() => useStudentProgress(mockUser));

		await waitFor(() => expect(result.current.studentProgress.xp).toBe(250));

		// 250 xp, level 2 (minXP=200), next level 3 (minXP=500)
		// current = 250 - 200 = 50, total = 500 - 200 = 300
		// segments = round(50/300 * 10) = round(1.67) = 2
		expect(result.current.progressSegments).toBe(2);
	});

	it("handles XP API error gracefully", async () => {
		mockApiFetch.mockRejectedValue(new Error("fail"));

		const { result } = renderHook(() => useStudentProgress(mockUser));

		await waitFor(() => expect(result.current.studentHistory).toHaveLength(2));

		expect(result.current.studentProgress.xp).toBe(0);
		expect(result.current.studentProgress.level).toBe(1);
	});

	it("handles results API error gracefully", async () => {
		mockGetStudentResults.mockRejectedValue(new Error("fail"));

		const { result } = renderHook(() => useStudentProgress(mockUser));

		await waitFor(() => expect(result.current.studentProgress.xp).toBe(250));

		expect(result.current.studentHistory).toEqual([]);
	});

	it("handles level as object from API", async () => {
		mockApiFetch.mockResolvedValue({ xp: 500, level: { level: 3 } });
		mockUnwrapApi.mockImplementation((data: Record<string, unknown>) => data);

		const { result } = renderHook(() => useStudentProgress(mockUser));

		await waitFor(() => expect(result.current.studentProgress.xp).toBe(500));

		expect(result.current.studentProgress.level).toBe(3);
	});
});
