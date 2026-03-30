import { useEffect, useState } from "react";
import { apiFetch, unwrapApi } from "@/lib/api-client";
import type { ExamAttendanceStats } from "../types";

const ACTIVE_POLL_MS = 5000;

export const useExamAttendanceStats = (
  examId: string | null,
  shouldPoll = true,
) => {
  const [stats, setStats] = useState<ExamAttendanceStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!examId) {
      setStats(null);
      setLoading(false);
      setError(null);
      return;
    }

    let active = true;

    const fetchStats = async () => {
      setLoading(true);
      try {
        const payload = await apiFetch<
          { data?: ExamAttendanceStats } | ExamAttendanceStats
        >(`/api/exams/${examId}/stats`, {}, "teacher");
        const data = unwrapApi(payload);
        if (!active) return;
        setStats({
          expected: Number(data.expected ?? 0),
          joined: Number(data.joined ?? 0),
          submitted: Number(data.submitted ?? 0),
          attendance_rate: Number(data.attendance_rate ?? 0),
          submission_rate: Number(data.submission_rate ?? 0),
        });
        setError(null);
      } catch (err) {
        if (!active) return;
        setError(
          err instanceof Error && err.message
            ? err.message
            : "Ирцийн мэдээлэл авахад алдаа гарлаа.",
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    void fetchStats();
    const timer = shouldPoll
      ? window.setInterval(() => {
          void fetchStats();
        }, ACTIVE_POLL_MS)
      : null;

    return () => {
      active = false;
      if (timer !== null) {
        window.clearInterval(timer);
      }
    };
  }, [examId, shouldPoll]);

  return { stats, loading, error };
};
