import { useState } from "react";
import { apiFetch } from "@/lib/api-client";
import type { Violations } from "../types";
import { EMPTY_VIOLATIONS, EVENT_TYPE_MAP } from "./student-exam-session-helpers";

export function useStudentExamWarnings(sessionId: string | null) {
  const [violations, setViolations] = useState<Violations>({
    ...EMPTY_VIOLATIONS,
  });
  const [warning, setWarning] = useState<string | null>(null);

  const showWarning = (message: string) => {
    setWarning(message);
    setTimeout(() => setWarning(null), 3000);
  };

  const logViolation = (type: string) => {
    setViolations((prev) => ({
      ...prev,
      log: [{ type, timestamp: new Date().toISOString() }, ...prev.log].slice(0, 50),
      tabSwitch: type === "TAB_SWITCH" ? prev.tabSwitch + 1 : prev.tabSwitch,
      windowBlur: type === "WINDOW_BLUR" ? prev.windowBlur + 1 : prev.windowBlur,
      copyAttempt: type === "COPY_ATTEMPT" ? prev.copyAttempt + 1 : prev.copyAttempt,
      pasteAttempt: type === "PASTE_ATTEMPT" ? prev.pasteAttempt + 1 : prev.pasteAttempt,
      fullscreenExit: type === "FULLSCREEN_EXIT" ? prev.fullscreenExit + 1 : prev.fullscreenExit,
      keyboardShortcut:
        type === "KEYBOARD_SHORTCUT"
          ? prev.keyboardShortcut + 1
          : prev.keyboardShortcut,
    }));
    if (!sessionId) return;

    const eventType = EVENT_TYPE_MAP[type] ?? "suspicious_resize";
    void apiFetch("/api/cheat/event", {
      method: "POST",
      body: JSON.stringify({ sessionId, eventType, metadata: type }),
    });
  };

  return { violations, setViolations, warning, showWarning, logViolation };
}
