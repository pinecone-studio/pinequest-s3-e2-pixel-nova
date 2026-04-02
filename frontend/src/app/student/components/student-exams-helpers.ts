import type { Exam } from "../types";
import { toSubjectLabel } from "./student-progress-insights";
import { hasLatinLetters, localizeStudentText } from "./student-ui-text";

export const subjectFromExam = (exam: Exam) => {
  if (exam.description?.trim()) {
    return localizeStudentText(toSubjectLabel(exam.description.trim()));
  }

  const localizedSubject = localizeStudentText(toSubjectLabel(exam.title));
  if (!hasLatinLetters(localizedSubject)) {
    return localizedSubject;
  }

  return localizeExamTitle(exam.title);
};

export const localizeExamTitle = (
  title?: string | null,
  fallbackSubject?: string | null,
) => {
  const cleanedTitle = title?.trim() ?? "";
  if (!cleanedTitle && fallbackSubject?.trim()) {
    return localizeStudentText(toSubjectLabel(fallbackSubject));
  }

  const localizedTitle = localizeStudentText(cleanedTitle);
  if (!hasLatinLetters(localizedTitle)) {
    return localizedTitle;
  }

  const localizedSubject = localizeStudentText(
    toSubjectLabel(fallbackSubject?.trim() || cleanedTitle),
  );
  if (!hasLatinLetters(localizedSubject)) {
    return localizedSubject;
  }

  return "Шалгалт";
};

export const formatClock = (value: Date) =>
  value.toLocaleTimeString("mn-MN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: false,
  });
