import { useEffect } from "react";

type Params = {
  view: "dashboard" | "exam" | "result";
  violations: {
    tabSwitch: number;
    windowBlur: number;
    fullscreenExit: number;
    keyboardShortcut: number;
  };
  logViolation: (type: string) => void;
  showWarning: (message: string) => void;
  terminateExam: (reason: string) => void;
};

export const useExamCheatDetection = ({
  view,
  violations,
  logViolation,
  showWarning,
  terminateExam,
}: Params) => {
  useEffect(() => {
    if (view !== "exam") return;

    const handleVisibility = () => {
      if (!document.hidden) return;
      const nextCount = violations.tabSwitch + 1;
      logViolation("TAB_SWITCH");
      showWarning(`⚠️ Tab солисон илэрлээ! ${3 - nextCount} оролдлого үлдлээ`);
      if (nextCount >= 3) terminateExam("TAB_SWITCH_LIMIT");
    };

    const handleBlur = () => {
      const nextCount = violations.windowBlur + 1;
      logViolation("WINDOW_BLUR");
      showWarning(
        `⚠️ Window focus алдагдлаа! ${3 - nextCount} оролдлого үлдлээ`,
      );
      if (nextCount >= 3) terminateExam("WINDOW_BLUR_LIMIT");
    };

    const handleCopy = (event: ClipboardEvent) => {
      event.preventDefault();
      logViolation("COPY_ATTEMPT");
      showWarning("🚫 Хуулах хориглогдсон!");
    };

    const handlePaste = (event: ClipboardEvent) => {
      event.preventDefault();
      logViolation("PASTE_ATTEMPT");
      showWarning("🚫 Буулгах хориглогдсон!");
    };

    const handleCut = (event: ClipboardEvent) => {
      event.preventDefault();
      logViolation("CUT_ATTEMPT");
      showWarning("🚫 Огтлох хориглогдсон!");
    };

    const handleContextMenu = (event: MouseEvent) => {
      event.preventDefault();
      logViolation("CONTEXT_MENU");
      showWarning("🚫 Баруун товч хориглогдсон!");
    };

    const handleKeydown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const blocked =
        (event.ctrlKey && ["c", "v", "x", "a", "p", "u", "s"].includes(key)) ||
        key === "f12" ||
        (event.ctrlKey && event.shiftKey && ["i", "j", "c"].includes(key)) ||
        key === "printscreen";
      if (blocked) {
        event.preventDefault();
        const nextCount = violations.keyboardShortcut + 1;
        logViolation("KEYBOARD_SHORTCUT");
        showWarning("⌨️ Энэ товч хориглогдсон!");
        if (nextCount >= 3) terminateExam("KEYBOARD_LIMIT");
      }
    };

    const handleFullscreen = () => {
      if (document.fullscreenElement) return;
      const nextCount = violations.fullscreenExit + 1;
      logViolation("FULLSCREEN_EXIT");
      showWarning(`⚠️ Fullscreen‑с гарлаа! ${3 - nextCount} оролдлого үлдлээ`);
      if (nextCount >= 3) terminateExam("FULLSCREEN_EXIT_LIMIT");
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);
    document.addEventListener("cut", handleCut);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeydown);
    document.addEventListener("fullscreenchange", handleFullscreen);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("cut", handleCut);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeydown);
      document.removeEventListener("fullscreenchange", handleFullscreen);
    };
  }, [
    view,
    terminateExam,
    violations.tabSwitch,
    violations.windowBlur,
    violations.fullscreenExit,
    violations.keyboardShortcut,
    logViolation,
    showWarning,
  ]);
};
