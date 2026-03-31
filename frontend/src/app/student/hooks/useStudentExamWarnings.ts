import { useState } from "react";
import { apiRequest } from "@/api/client";
import { isCheatDetectionEnabled } from "@/lib/exam-cheat-detections";
import type { Violations } from "../types";
import { EMPTY_VIOLATIONS, EVENT_TYPE_MAP } from "./student-exam-session-helpers";

type ViolationInput = {
  confidence?: number;
  details?: Record<string, string | number | boolean | null>;
  source?: string;
  type: string;
};

export function useStudentExamWarnings(
  sessionId: string | null,
  enabledCheatDetections?: string[] | null,
) {
  const [violations, setViolations] = useState<Violations>({
    ...EMPTY_VIOLATIONS,
  });
  const [warning, setWarning] = useState<string | null>(null);

  const showWarning = (message: string) => {
    setWarning(message);
    setTimeout(() => setWarning(null), 3000);
  };

  const logViolation = (input: string | ViolationInput) => {
    const { confidence, details, source = "browser", type } =
      typeof input === "string" ? { type: input } : input;
    const eventType = EVENT_TYPE_MAP[type] ?? "suspicious_resize";

    if (!isCheatDetectionEnabled(eventType, enabledCheatDetections)) {
      return;
    }

    setViolations((prev) => ({
      ...prev,
      eventCount: (prev.eventCount ?? 0) + 1,
      log: [
        { type, timestamp: new Date().toISOString(), source },
        ...prev.log,
      ].slice(0, 50),
      tabSwitch: type === "TAB_SWITCH" ? prev.tabSwitch + 1 : prev.tabSwitch,
      windowBlur: type === "WINDOW_BLUR" ? prev.windowBlur + 1 : prev.windowBlur,
      copyAttempt: type === "COPY_ATTEMPT" ? prev.copyAttempt + 1 : prev.copyAttempt,
      pasteAttempt: type === "PASTE_ATTEMPT" ? prev.pasteAttempt + 1 : prev.pasteAttempt,
      fullscreenExit: type === "FULLSCREEN_EXIT" ? prev.fullscreenExit + 1 : prev.fullscreenExit,
      idleTooLong:
        type === "NO_MOUSE_MOVEMENT"
          ? (prev.idleTooLong ?? 0) + 1
          : prev.idleTooLong,
      rightClick:
        type === "RIGHT_CLICK" ? (prev.rightClick ?? 0) + 1 : prev.rightClick,
      suspiciousResize:
        type === "SUSPICIOUS_RESIZE"
          ? (prev.suspiciousResize ?? 0) + 1
          : prev.suspiciousResize,
      keyboardShortcut:
        type === "KEYBOARD_SHORTCUT"
          ? prev.keyboardShortcut + 1
          : prev.keyboardShortcut,
    }));
    if (!sessionId) return;

    void apiRequest<{
      deduped?: boolean;
      riskLevel?: Violations["riskLevel"];
    }>("/api/cheat/event", {
      method: "POST",
      body: JSON.stringify({
        sessionId,
        eventType,
        source,
        confidence,
        details: {
          originalType: type,
          ...(details ?? {}),
        },
        metadata: JSON.stringify({
          source,
          confidence,
          ...(details ?? {}),
          originalType: type,
        }),
      }),
    })
      .then((response) => {
        if (response?.riskLevel) {
          setViolations((prev) => ({
            ...prev,
            riskLevel: response.riskLevel ?? prev.riskLevel,
          }));
        }
      })
      .catch(() => null);
  };

  return { violations, setViolations, warning, showWarning, logViolation };
}
