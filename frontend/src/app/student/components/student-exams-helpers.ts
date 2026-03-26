import type { Exam } from "../types";

export const subjectFromExam = (exam: Exam) => {
  if (exam.description?.trim()) return exam.description.trim();
  return exam.title.split(/\s+/).slice(0, 2).join(" ");
};

export const formatClock = (value: Date) =>
  value.toLocaleTimeString("mn-MN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: false,
  });
