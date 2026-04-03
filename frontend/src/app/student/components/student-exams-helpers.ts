import type { Exam } from "../types";
import { toSubjectLabel } from "./student-progress-insights";
import { hasLatinLetters, localizeStudentText } from "./student-ui-text";

const isGenericExamName = (value: string) => {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return true;

  return /^(exam|test|quiz|шалгалт|сорил)\s*[-_#]?\s*\d*$/i.test(normalized);
};

export const subjectFromExam = (exam: Exam) => {
  const title = exam.title?.trim() ?? "";
  if (isGenericExamName(title)) {
    if (exam.description?.trim()) {
      return localizeStudentText(toSubjectLabel(exam.description.trim()));
    }

    return "Хуваарьт шалгалт";
  }

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
  if (isGenericExamName(cleanedTitle)) {
    const fallback = fallbackSubject?.trim();
    if (fallback) {
      const localizedFallback = localizeStudentText(toSubjectLabel(fallback));
      if (!hasLatinLetters(localizedFallback)) {
        return localizedFallback;
      }
    }

    return "Хуваарьт шалгалт";
  }

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
