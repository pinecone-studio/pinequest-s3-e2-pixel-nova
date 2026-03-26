import { useEffect, useState } from "react";
import { apiFetch, unwrapApi } from "@/lib/api-client";

export type ExamAttendanceStats = {
  expected: number;
  joined: number;
  submitted: number;
  attendance_rate: number;
  submission_rate: number;
};

export const useExamAttendanceStats = (examId: string | null) => {
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
    let timer: number | null = null;

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
    timer = window.setInterval(fetchStats, 3000);

    return () => {
      active = false;
      if (timer) window.clearInterval(timer);
    };
  }, [examId]);

  return { stats, loading, error };
};
