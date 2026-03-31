import { useEffect, useState } from "react";
import { apiRequest } from "@/api/client";
import { openTeacherExamLiveStream } from "./teacher-api";
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
    let streamFailed = false;
    let fallbackTimer: number | null = null;

    const fetchStats = async () => {
      setLoading(true);
      try {
        const data = await apiRequest<ExamAttendanceStats>(`/api/exams/${examId}/stats`, {
          roleOverride: "teacher",
        });
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

    if (shouldPoll) {
      const stopStream = openTeacherExamLiveStream(examId, {
        onMessage: (payload) => {
          if (!active) return;
          setStats({
            expected: Number(payload.stats.expected ?? 0),
            joined: Number(payload.stats.joined ?? 0),
            submitted: Number(payload.stats.submitted ?? 0),
            attendance_rate: Number(payload.stats.attendance_rate ?? 0),
            submission_rate: Number(payload.stats.submission_rate ?? 0),
          });
          setError(null);
          setLoading(false);
        },
        onError: () => {
          if (!active || streamFailed) return;
          streamFailed = true;
          void fetchStats();
          fallbackTimer = window.setInterval(() => {
            void fetchStats();
          }, ACTIVE_POLL_MS);
        },
      });

      return () => {
        active = false;
        stopStream();
        if (fallbackTimer !== null) {
          window.clearInterval(fallbackTimer);
        }
      };
    }

    return () => {
      active = false;
      if (fallbackTimer !== null) {
        window.clearInterval(fallbackTimer);
      }
    };
  }, [examId, shouldPoll]);

  return { stats, loading, error };
};
