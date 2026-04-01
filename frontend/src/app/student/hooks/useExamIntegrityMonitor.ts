"use client";

import { useEffect, useRef } from "react";

type MonitorParams = {
  logViolation: (input: {
    confidence?: number;
    details?: Record<string, string | number | boolean | null>;
    source?: string;
    type: string;
  }) => void;
  showWarning: (message: string) => void;
  view: "dashboard" | "exam" | "result";
};

const IDLE_TIMEOUT_MS = 60_000;
const CLIENT_THROTTLE_MS: Partial<Record<string, number>> = {
  COPY_ATTEMPT: 2_000,
  FULLSCREEN_EXIT: 4_000,
  KEYBOARD_SHORTCUT: 4_000,
  PASTE_ATTEMPT: 2_000,
  RIGHT_CLICK: 2_000,
  TAB_SWITCH: 4_000,
  WINDOW_BLUR: 4_000,
};

const WARNING_LABELS: Partial<Record<string, string>> = {
  COPY_ATTEMPT: "Хуулах товчлол илэрлээ",
  FULLSCREEN_EXIT: "Бүтэн дэлгэцийн горимоос гарлаа",
  KEYBOARD_SHORTCUT: "Сэжигтэй гарын товчлол илэрлээ",
  PASTE_ATTEMPT: "Буулгах оролдлого илэрлээ",
  RIGHT_CLICK: "Шалгалтын үеэр баруун товшилт идэвхгүй",
  TAB_SWITCH: "Таб сольсон үйлдэл илэрлээ",
  WINDOW_BLUR: "Шалгалтын цонх focus-оо алдлаа",
};

export const useExamIntegrityMonitor = ({
  logViolation,
  showWarning,
  view,
}: MonitorParams) => {
  const lastTriggeredAtRef = useRef<Record<string, number>>({});
  const idleTimerRef = useRef<number | null>(null);
  const lastActivityAtRef = useRef<number>(Date.now());

  useEffect(() => {
    if (view !== "exam" || typeof window === "undefined") {
      return;
    }

    const trigger = (
      type: string,
      details?: Record<string, string | number | boolean | null>,
    ) => {
      const now = Date.now();
      const throttleMs = CLIENT_THROTTLE_MS[type] ?? 0;
      const lastTriggeredAt = lastTriggeredAtRef.current[type] ?? 0;
      if (throttleMs > 0 && now - lastTriggeredAt < throttleMs) {
        return;
      }

      lastTriggeredAtRef.current[type] = now;
      logViolation({ type, source: "browser", confidence: 0.9, details });
      const warningLabel = WARNING_LABELS[type];
      if (warningLabel) {
        showWarning(warningLabel);
      }
    };

    const markActivity = () => {
      lastActivityAtRef.current = Date.now();
    };

    const resetIdleTimer = () => {
      if (idleTimerRef.current !== null) {
        window.clearTimeout(idleTimerRef.current);
      }
      idleTimerRef.current = window.setTimeout(() => {
        const idleMs = Date.now() - lastActivityAtRef.current;
        trigger("NO_MOUSE_MOVEMENT", { idleMs });
      }, IDLE_TIMEOUT_MS);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        trigger("TAB_SWITCH", { visibilityState: document.visibilityState });
      }
    };

    const onWindowBlur = () => {
      trigger("WINDOW_BLUR", { visibilityState: document.visibilityState });
    };

    const onCopy = () => {
      trigger("COPY_ATTEMPT");
    };

    const onPaste = () => {
      trigger("PASTE_ATTEMPT");
    };

    const onContextMenu = (event: MouseEvent) => {
      event.preventDefault();
      trigger("RIGHT_CLICK");
    };

    const onFullscreenChange = () => {
      if (!document.fullscreenElement) {
        trigger("FULLSCREEN_EXIT");
      }
    };

    const onResize = () => {
      trigger("SUSPICIOUS_RESIZE", {
        innerHeight: window.innerHeight,
        innerWidth: window.innerWidth,
      });
    };

    const onKeyDown = (event: KeyboardEvent) => {
      markActivity();
      resetIdleTimer();

      const key = event.key.toLowerCase();
      const isDevtoolsShortcut =
        key === "f12" ||
        ((event.ctrlKey || event.metaKey) &&
          event.shiftKey &&
          ["c", "i", "j"].includes(key)) ||
        ((event.ctrlKey || event.metaKey) && key === "u");
      const isCopyPasteShortcut =
        (event.ctrlKey || event.metaKey) && ["c", "v", "x", "a"].includes(key);

      if (isDevtoolsShortcut) {
        trigger("KEYBOARD_SHORTCUT", { key: event.key });
        return;
      }

      if (isCopyPasteShortcut) {
        trigger(key === "v" ? "PASTE_ATTEMPT" : "COPY_ATTEMPT", {
          key: event.key,
        });
      }
    };

    markActivity();
    resetIdleTimer();

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onWindowBlur);
    document.addEventListener("copy", onCopy);
    document.addEventListener("paste", onPaste);
    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("mousemove", markActivity);
    window.addEventListener("mousedown", markActivity);
    window.addEventListener("scroll", markActivity, { passive: true });
    window.addEventListener("touchstart", markActivity, { passive: true });

    return () => {
      if (idleTimerRef.current !== null) {
        window.clearTimeout(idleTimerRef.current);
      }
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onWindowBlur);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("paste", onPaste);
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("mousemove", markActivity);
      window.removeEventListener("mousedown", markActivity);
      window.removeEventListener("scroll", markActivity);
      window.removeEventListener("touchstart", markActivity);
    };
  }, [logViolation, showWarning, view]);
};
