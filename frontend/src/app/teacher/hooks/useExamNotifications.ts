import { useEffect } from "react";
import type { Exam } from "../types";

type UseExamNotificationsParams = {
  exams: Exam[];
  setExams: (next: Exam[]) => void;
  showToast: (message: string) => void;
};

export const useExamNotifications = ({
  exams,
  setExams,
  showToast,
}: UseExamNotificationsParams) => {
  useEffect(() => {
    const checkNotifications = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      let changed = false;
      const nextExams = exams.map((exam) => {
        if (!exam.scheduledAt || exam.notified) return exam;
        const scheduled = new Date(exam.scheduledAt);
        const isTomorrow =
          scheduled.getFullYear() === tomorrow.getFullYear() &&
          scheduled.getMonth() === tomorrow.getMonth() &&
          scheduled.getDate() === tomorrow.getDate();
        if (!isTomorrow) return exam;
        changed = true;
        showToast(`Маргааш "${exam.title}" шалгалт эхэлнэ.`);
        return { ...exam, notified: true };
      });

      if (changed) setExams(nextExams);
    };

    checkNotifications();
    const interval = setInterval(checkNotifications, 60000);
    return () => clearInterval(interval);
  }, [exams, setExams, showToast]);
};
