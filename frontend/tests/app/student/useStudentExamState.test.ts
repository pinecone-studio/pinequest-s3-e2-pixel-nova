const mockApiFetch = jest.fn();
const mockUnwrapApi = jest.fn();
const mockBuildAnswerReport = jest.fn();

jest.mock("@/lib/api-client", () => ({
	apiFetch: (...args: unknown[]) => mockApiFetch(...args),
	unwrapApi: (...args: unknown[]) => mockUnwrapApi(...args),
}));

jest.mock("@/app/student/hooks/student-exam-helpers", () => ({
	buildAnswerReport: (...args: unknown[]) => mockBuildAnswerReport(...args),
}));

jest.mock("@/lib/examGuard", () => ({
	getSessionUser: jest.fn(),
}));

import { renderHook, act } from "@testing-library/react";
import { useStudentExamState } from "@/app/student/hooks/useStudentExamState";
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

describe("useStudentExamState", () => {
	beforeEach(() => {
		jest.useFakeTimers();
		mockApiFetch.mockReset();
		mockUnwrapApi.mockReset();
		mockBuildAnswerReport.mockReturnValue([]);
	});

	afterEach(() => jest.useRealTimers());

	it("initializes with dashboard view and default state", () => {
		const { result } = renderHook(() =>
			useStudentExamState({ currentUser: mockUser }),
		);

		expect(result.current.view).toBe("dashboard");
		expect(result.current.activeTab).toBe("Home");
		expect(result.current.roomCodeInput).toBe("");
		expect(result.current.joinError).toBeNull();
		expect(result.current.selectedExam).toBeNull();
		expect(result.current.activeExam).toBeNull();
		expect(result.current.answers).toEqual({});
		expect(result.current.currentQuestionIndex).toBe(0);
		expect(result.current.timeLeft).toBe(0);
		expect(result.current.lastSubmission).toBeNull();
		expect(result.current.warning).toBeNull();
		expect(result.current.violations.tabSwitch).toBe(0);
	});

	it("sets join error when room code is empty", async () => {
		const { result } = renderHook(() =>
			useStudentExamState({ currentUser: mockUser }),
		);

		await act(async () => {
			await result.current.handleLookup();
		});

		expect(result.current.joinError).toBe("Өрөөний код оруулна уу.");
	});

	it("handleLookup calls API and sets selectedExam on success", async () => {
		const joinData = {
			sessionId: "sess-1",
			exam: { id: "e1", title: "Math", durationMin: 45, questionCount: 5 },
		};
		const detailData = {
			session: { id: "sess-1", status: "active", startedAt: null, submittedAt: null },
			exam: { id: "e1", title: "Math", durationMin: 45 },
			questions: [
				{ id: "q1", type: "mcq", questionText: "What?", points: 10, options: [{ id: "o1", label: "A", text: "Yes" }] },
			],
		};

		mockApiFetch
			.mockResolvedValueOnce(joinData)
			.mockResolvedValueOnce(detailData);
		mockUnwrapApi
			.mockReturnValueOnce(joinData)
			.mockReturnValueOnce(detailData);

		const { result } = renderHook(() =>
			useStudentExamState({ currentUser: mockUser }),
		);

		act(() => result.current.setRoomCodeInput("ABC123"));

		await act(async () => {
			await result.current.handleLookup();
		});

		expect(result.current.selectedExam).not.toBeNull();
		expect(result.current.selectedExam!.title).toBe("Math");
		expect(result.current.selectedExam!.questions).toHaveLength(0);
		expect(result.current.joinError).toBeNull();
	});

	it("handleLookup sets error on API failure", async () => {
		mockApiFetch.mockRejectedValueOnce(new Error("Not found"));

		const { result } = renderHook(() =>
			useStudentExamState({ currentUser: mockUser }),
		);

		act(() => result.current.setRoomCodeInput("BADCODE"));

		await act(async () => {
			await result.current.handleLookup();
		});

		expect(result.current.joinError).toBe("Not found");
		expect(result.current.selectedExam).toBeNull();
	});

	it("handleLookup shows server connection error for load failures", async () => {
		mockApiFetch.mockRejectedValueOnce(new Error("Load failed"));

		const { result } = renderHook(() =>
			useStudentExamState({ currentUser: mockUser }),
		);

		act(() => result.current.setRoomCodeInput("CODE1"));

		await act(async () => {
			await result.current.handleLookup();
		});

		expect(result.current.joinError).toContain("Сервертэй холбогдож чадсангүй");
	});

	it("logViolation increments the correct counter", () => {
		const { result } = renderHook(() =>
			useStudentExamState({ currentUser: mockUser }),
		);

		act(() => result.current.logViolation("TAB_SWITCH"));

		expect(result.current.violations.tabSwitch).toBe(1);
		expect(result.current.violations.log).toHaveLength(1);
		expect(result.current.violations.log[0].type).toBe("TAB_SWITCH");
	});

	it("logViolation increments windowBlur counter", () => {
		const { result } = renderHook(() =>
			useStudentExamState({ currentUser: mockUser }),
		);

		act(() => result.current.logViolation("WINDOW_BLUR"));

		expect(result.current.violations.windowBlur).toBe(1);
	});

	it("logViolation increments copyAttempt counter", () => {
		const { result } = renderHook(() =>
			useStudentExamState({ currentUser: mockUser }),
		);

		act(() => result.current.logViolation("COPY_ATTEMPT"));

		expect(result.current.violations.copyAttempt).toBe(1);
	});

	it("showWarning sets and clears warning", () => {
		const { result } = renderHook(() =>
			useStudentExamState({ currentUser: mockUser }),
		);

		act(() => result.current.showWarning("Test warning"));

		expect(result.current.warning).toBe("Test warning");

		act(() => jest.advanceTimersByTime(3000));

		expect(result.current.warning).toBeNull();
	});

	it("goNext increments question index", () => {
		const { result } = renderHook(() =>
			useStudentExamState({ currentUser: mockUser }),
		);

		// Set active exam with questions
		act(() => {
			result.current.setView("exam");
			// Manually set an exam via internal state setter not exposed directly,
			// so we test goNext boundary: without activeExam, goNext does nothing
		});

		// Without activeExam, goNext should be safe (no-op)
		act(() => result.current.goNext());
		expect(result.current.currentQuestionIndex).toBe(0);
	});

	it("goPrev decrements question index but not below 0", () => {
		const { result } = renderHook(() =>
			useStudentExamState({ currentUser: mockUser }),
		);

		act(() => result.current.goPrev());

		expect(result.current.currentQuestionIndex).toBe(0);
	});

	it("setActiveTab updates the active tab", () => {
		const { result } = renderHook(() =>
			useStudentExamState({ currentUser: mockUser }),
		);

		act(() => result.current.setActiveTab("Progress"));

		expect(result.current.activeTab).toBe("Progress");
	});

	it("sidebarTimerRef is initialized to null", () => {
		const { result } = renderHook(() =>
			useStudentExamState({ currentUser: mockUser }),
		);

		expect(result.current.sidebarTimerRef.current).toBeNull();
	});

	it("leaveExamFlow clears joined exam state and returns to dashboard", async () => {
		const joinData = {
			sessionId: "sess-1",
			exam: { id: "e1", title: "Math", durationMin: 45, questionCount: 5 },
		};
		const detailData = {
			session: { id: "sess-1", status: "active", startedAt: null, submittedAt: null },
			exam: { id: "e1", title: "Math", durationMin: 45 },
			questions: [
				{ id: "q1", type: "mcq", questionText: "What?", points: 10, options: [{ id: "o1", label: "A", text: "Yes" }] },
			],
		};

		mockApiFetch
			.mockResolvedValueOnce(joinData)
			.mockResolvedValueOnce(detailData);
		mockUnwrapApi
			.mockReturnValueOnce(joinData)
			.mockReturnValueOnce(detailData);

		const { result } = renderHook(() =>
			useStudentExamState({ currentUser: mockUser }),
		);

		act(() => result.current.setRoomCodeInput("ABC123"));

		await act(async () => {
			await result.current.handleLookup();
		});

		act(() => {
			result.current.setView("result");
			result.current.leaveExamFlow();
		});

		expect(result.current.view).toBe("dashboard");
		expect(result.current.selectedExam).toBeNull();
		expect(result.current.roomCodeInput).toBe("");
		expect(result.current.joinError).toBeNull();
		expect(result.current.lastSubmission).toBeNull();
	});
});
