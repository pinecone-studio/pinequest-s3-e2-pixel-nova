import { renderHook, act } from "@testing-library/react";
import { useExamCheatDetection } from "@/app/student/hooks/useExamCheatDetection";

const zeroViolations = () => ({
	tabSwitch: 0,
	windowBlur: 0,
	fullscreenExit: 0,
	keyboardShortcut: 0,
});

const makeParams = (overrides: Record<string, unknown> = {}) => ({
	view: "exam" as const,
	violations: zeroViolations(),
	logViolation: jest.fn(),
	showWarning: jest.fn(),
	terminateExam: jest.fn(),
	...overrides,
});

describe("useExamCheatDetection", () => {
	it("does not attach listeners when view is not exam", () => {
		const params = makeParams({ view: "dashboard" });
		renderHook(() => useExamCheatDetection(params));

		act(() => {
			document.dispatchEvent(new Event("copy"));
		});

		expect(params.logViolation).not.toHaveBeenCalled();
	});

	it("detects copy attempt", () => {
		const params = makeParams();
		renderHook(() => useExamCheatDetection(params));

		act(() => {
			document.dispatchEvent(new Event("copy", { cancelable: true }));
		});

		expect(params.logViolation).toHaveBeenCalledWith("COPY_ATTEMPT");
		expect(params.showWarning).toHaveBeenCalledWith("🚫 Хуулах хориглогдсон!");
	});

	it("detects paste attempt", () => {
		const params = makeParams();
		renderHook(() => useExamCheatDetection(params));

		act(() => {
			document.dispatchEvent(new Event("paste", { cancelable: true }));
		});

		expect(params.logViolation).toHaveBeenCalledWith("PASTE_ATTEMPT");
		expect(params.showWarning).toHaveBeenCalledWith("🚫 Буулгах хориглогдсон!");
	});

	it("detects cut attempt", () => {
		const params = makeParams();
		renderHook(() => useExamCheatDetection(params));

		act(() => {
			document.dispatchEvent(new Event("cut", { cancelable: true }));
		});

		expect(params.logViolation).toHaveBeenCalledWith("CUT_ATTEMPT");
		expect(params.showWarning).toHaveBeenCalledWith("🚫 Огтлох хориглогдсон!");
	});

	it("detects context menu", () => {
		const params = makeParams();
		renderHook(() => useExamCheatDetection(params));

		act(() => {
			document.dispatchEvent(new Event("contextmenu", { cancelable: true }));
		});

		expect(params.logViolation).toHaveBeenCalledWith("CONTEXT_MENU");
		expect(params.showWarning).toHaveBeenCalledWith("🚫 Баруун товч хориглогдсон!");
	});

	it("detects visibility change (tab switch)", () => {
		const params = makeParams();
		renderHook(() => useExamCheatDetection(params));

		Object.defineProperty(document, "hidden", { value: true, writable: true });
		act(() => {
			document.dispatchEvent(new Event("visibilitychange"));
		});
		Object.defineProperty(document, "hidden", { value: false, writable: true });

		expect(params.logViolation).toHaveBeenCalledWith("TAB_SWITCH");
		expect(params.showWarning).toHaveBeenCalledWith(
			"⚠️ Таб солисон илэрлээ! 2 оролдлого үлдлээ",
		);
	});

	it("terminates after 3 tab switches", () => {
		const params = makeParams({
			violations: { ...zeroViolations(), tabSwitch: 2 },
		});
		renderHook(() => useExamCheatDetection(params));

		Object.defineProperty(document, "hidden", { value: true, writable: true });
		act(() => {
			document.dispatchEvent(new Event("visibilitychange"));
		});
		Object.defineProperty(document, "hidden", { value: false, writable: true });

		expect(params.terminateExam).toHaveBeenCalledWith("TAB_SWITCH_LIMIT");
	});

	it("detects window blur", () => {
		const params = makeParams();
		renderHook(() => useExamCheatDetection(params));

		act(() => {
			window.dispatchEvent(new Event("blur"));
		});

		expect(params.logViolation).toHaveBeenCalledWith("WINDOW_BLUR");
	});

	it("terminates after 3 window blurs", () => {
		const params = makeParams({
			violations: { ...zeroViolations(), windowBlur: 2 },
		});
		renderHook(() => useExamCheatDetection(params));

		act(() => {
			window.dispatchEvent(new Event("blur"));
		});

		expect(params.terminateExam).toHaveBeenCalledWith("WINDOW_BLUR_LIMIT");
	});

	it("blocks F12 key", () => {
		const params = makeParams();
		renderHook(() => useExamCheatDetection(params));

		act(() => {
			document.dispatchEvent(
				new KeyboardEvent("keydown", { key: "F12", cancelable: true }),
			);
		});

		expect(params.logViolation).toHaveBeenCalledWith("KEYBOARD_SHORTCUT");
	});

	it("blocks Ctrl+C", () => {
		const params = makeParams();
		renderHook(() => useExamCheatDetection(params));

		act(() => {
			document.dispatchEvent(
				new KeyboardEvent("keydown", { key: "c", ctrlKey: true, cancelable: true }),
			);
		});

		expect(params.logViolation).toHaveBeenCalledWith("KEYBOARD_SHORTCUT");
	});

	it("blocks Ctrl+Shift+I (DevTools)", () => {
		const params = makeParams();
		renderHook(() => useExamCheatDetection(params));

		act(() => {
			document.dispatchEvent(
				new KeyboardEvent("keydown", {
					key: "i",
					ctrlKey: true,
					shiftKey: true,
					cancelable: true,
				}),
			);
		});

		expect(params.logViolation).toHaveBeenCalledWith("KEYBOARD_SHORTCUT");
	});

	it("terminates after 3 keyboard shortcuts", () => {
		const params = makeParams({
			violations: { ...zeroViolations(), keyboardShortcut: 2 },
		});
		renderHook(() => useExamCheatDetection(params));

		act(() => {
			document.dispatchEvent(
				new KeyboardEvent("keydown", { key: "F12", cancelable: true }),
			);
		});

		expect(params.terminateExam).toHaveBeenCalledWith("KEYBOARD_LIMIT");
	});

	it("does not block non-restricted keys", () => {
		const params = makeParams();
		renderHook(() => useExamCheatDetection(params));

		act(() => {
			document.dispatchEvent(
				new KeyboardEvent("keydown", { key: "a", cancelable: true }),
			);
		});

		expect(params.logViolation).not.toHaveBeenCalled();
	});

	it("detects fullscreen exit", () => {
		const params = makeParams();
		renderHook(() => useExamCheatDetection(params));

		// Simulate exiting fullscreen (fullscreenElement is null)
		Object.defineProperty(document, "fullscreenElement", {
			value: null,
			writable: true,
		});
		act(() => {
			document.dispatchEvent(new Event("fullscreenchange"));
		});

		expect(params.logViolation).toHaveBeenCalledWith("FULLSCREEN_EXIT");
	});

	it("terminates after 3 fullscreen exits", () => {
		const params = makeParams({
			violations: { ...zeroViolations(), fullscreenExit: 2 },
		});
		renderHook(() => useExamCheatDetection(params));

		Object.defineProperty(document, "fullscreenElement", {
			value: null,
			writable: true,
		});
		act(() => {
			document.dispatchEvent(new Event("fullscreenchange"));
		});

		expect(params.terminateExam).toHaveBeenCalledWith("FULLSCREEN_EXIT_LIMIT");
	});

	it("cleans up event listeners on unmount", () => {
		const params = makeParams();
		const { unmount } = renderHook(() => useExamCheatDetection(params));

		unmount();

		act(() => {
			document.dispatchEvent(new Event("copy", { cancelable: true }));
		});

		expect(params.logViolation).not.toHaveBeenCalled();
	});
});
