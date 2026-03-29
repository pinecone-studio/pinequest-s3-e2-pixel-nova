import { useCallback } from 'react';

import type { AuthUser, StudentProfile } from '@/types/student-app';
import {
  getStudentExamHistory,
  getStudentProfile,
  updateStudentProfile as updateProfileRequest,
} from '../services/api';
import { buildFallbackProfile } from '../core/context-helpers';
import type { StudentAppSetState } from '../core/state';
import { buildProgressSummary, normalizeApiError } from '../core/utils';

export const useStudentDashboard = (
  student: AuthUser | null,
  setState: StudentAppSetState,
) => {
  const refreshDashboard = useCallback(async () => {
    if (!student) return;

    setState((current) => ({
      ...current,
      dashboardLoading: true,
      dashboardError: null,
    }));

    try {
      const [remoteProfile, nextHistory] = await Promise.all([
        getStudentProfile(student),
        getStudentExamHistory(student),
      ]);

      setState((current) => ({
        ...current,
        profile: remoteProfile,
        history: nextHistory,
        progressSummary: buildProgressSummary(nextHistory),
      }));
    } catch (error) {
      setState((current) => ({
        ...current,
        dashboardError: normalizeApiError(
          error,
          'Could not load the latest student dashboard.',
        ),
      }));
    } finally {
      setState((current) => ({ ...current, dashboardLoading: false }));
    }
  }, [setState, student]);

  const refreshProfile = useCallback(async () => {
    if (!student) return;

    try {
      const remoteProfile = await getStudentProfile(student);
      setState((current) => ({ ...current, profile: remoteProfile }));
    } catch {
      setState((current) => ({
        ...current,
        profile: current.profile ?? buildFallbackProfile(student),
      }));
    }
  }, [setState, student]);

  const saveProfile = useCallback(
    async (payload: StudentProfile) => {
      if (!student) {
        throw new Error('No active student selected.');
      }

      try {
        const updated = await updateProfileRequest(student, payload);
        setState((current) => ({ ...current, profile: updated }));
      } catch {
        setState((current) => ({ ...current, profile: payload }));
      }
    },
    [setState, student],
  );

  return {
    refreshDashboard,
    refreshProfile,
    saveProfile,
  };
};
