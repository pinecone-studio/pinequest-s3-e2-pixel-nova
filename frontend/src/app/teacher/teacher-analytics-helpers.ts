import type { Submission } from "./types";

export const violationKeys = [
  "tabSwitch",
  "windowBlur",
  "copyAttempt",
  "pasteAttempt",
  "fullscreenExit",
  "keyboardShortcut",
] as const;

export const violationLabels: Record<(typeof violationKeys)[number], string> = {
  tabSwitch: "Tab солисон",
  windowBlur: "Window blur",
  copyAttempt: "Copy оролдлого",
  pasteAttempt: "Paste оролдлого",
  fullscreenExit: "Fullscreen гарсан",
  keyboardShortcut: "Shortcut дарсан",
};

export const buildPerformanceBands = (submissions: Submission[]) => [
  {
    label: "90-100%",
    count: submissions.filter((submission) => submission.percentage >= 90).length,
    color: "#4f46e5",
  },
  {
    label: "75-89%",
    count: submissions.filter(
      (submission) => submission.percentage >= 75 && submission.percentage < 90,
    ).length,
    color: "#0f766e",
  },
  {
    label: "60-74%",
    count: submissions.filter(
      (submission) => submission.percentage >= 60 && submission.percentage < 75,
    ).length,
    color: "#d97706",
  },
  {
    label: "0-59%",
    count: submissions.filter((submission) => submission.percentage < 60).length,
    color: "#dc2626",
  },
];
