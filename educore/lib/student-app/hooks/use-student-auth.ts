import { useCallback, useEffect } from 'react';

import {
  getAuthUsers,
  getMe,
  getStudentExamHistory,
  getStudentProfile,
  loginWithCode,
} from '../services/api';
import { clearPersistedState, loadPersistedState, persistState } from '../services/storage';
import {
  buildEmptyIntegrityState,
  buildFallbackProfile,
  emptyProgressSummary,
} from '../core/context-helpers';
import type { StudentAppSetState, StudentAppState } from '../core/state';
import { buildProgressSummary } from '../core/utils';

type UseStudentAuthArgs = {
  state: StudentAppState;
  setState: StudentAppSetState;
  refreshDashboard: () => Promise<void>;
};

export const useStudentAuth = ({
  state,
  setState,
  refreshDashboard,
}: UseStudentAuthArgs) => {
  const {
    hydrated,
    authMode,
    student,
    profile,
    activeSession,
    submittedResult,
    availableUsers,
  } = state;

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      const persisted = await loadPersistedState();
      if (cancelled) return;

      const nextStudent = persisted.student ?? null;
      setState((current) => ({
        ...current,
        hydrated: true,
        authMode: persisted.authMode ?? 'user_switcher',
        student: nextStudent,
        profile: nextStudent
          ? persisted.profile ?? buildFallbackProfile(nextStudent)
          : null,
        activeSession: persisted.activeSession,
        submittedResult: persisted.submittedResult,
      }));
    };

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [setState]);

  useEffect(() => {
    if (!hydrated) return;

    void persistState({
      authMode,
      student,
      profile,
      activeSession,
      submittedResult,
    });
  }, [activeSession, authMode, hydrated, profile, student, submittedResult]);

  const loadAvailableUsers = useCallback(async () => {
    try {
      const remoteUsers = await getAuthUsers();
      const nextUsers = remoteUsers.filter(
        (candidate) => candidate.role === 'student',
      );
      setState((current) => ({ ...current, availableUsers: nextUsers }));
      return nextUsers;
    } catch {
      setState((current) => ({ ...current, availableUsers: [] }));
      return [];
    }
  }, [setState]);

  useEffect(() => {
    if (!hydrated) return;

    let cancelled = false;

    const syncUsers = async () => {
      const nextUsers = await loadAvailableUsers();
      if (cancelled || nextUsers.length === 0) return;

      setState((current) => {
        const currentStudentId = current.student?.id ?? null;
        const nextStudent =
          (currentStudentId
            ? nextUsers.find((candidate) => candidate.id === currentStudentId)
            : null) ?? current.student;

        if (!nextStudent) {
          return current;
        }

        return {
          ...current,
          student: nextStudent,
          profile:
            current.profile &&
            nextStudent.id === current.student?.id &&
            current.profile.fullName
              ? current.profile
              : buildFallbackProfile(nextStudent),
        };
      });
    };

    void syncUsers();

    return () => {
      cancelled = true;
    };
  }, [hydrated, loadAvailableUsers, setState]);

  useEffect(() => {
    if (!hydrated || !student) return;

    let cancelled = false;

    const validate = async () => {
      try {
        const me = await getMe(student);
        if (!cancelled && me.role === 'student') {
          setState((current) => ({ ...current, student: me }));
        }
      } catch {
        if (cancelled) return;
      }

      if (!cancelled) {
        await refreshDashboard();
      }
    };

    void validate();

    return () => {
      cancelled = true;
    };
  }, [hydrated, refreshDashboard, setState, student]);

  const signInWithCode = useCallback(async (code: string) => {
    setState((current) => ({ ...current, signingIn: true }));

    try {
      const nextStudent = await loginWithCode(code.trim());
      if (nextStudent.role !== 'student') {
        throw new Error(
          '{"error":{"message":"Only student accounts can use this app."}}',
        );
      }

      setState((current) => {
        const withoutCurrent = current.availableUsers.filter(
          (candidate) => candidate.id !== nextStudent.id,
        );

        return {
          ...current,
          authMode: 'student_code',
          availableUsers: [nextStudent, ...withoutCurrent].sort((left, right) =>
            left.fullName.localeCompare(right.fullName),
          ),
          student: nextStudent,
          profile: buildFallbackProfile(nextStudent),
          submittedResult: null,
          activeSession: null,
          integrity: buildEmptyIntegrityState(),
        };
      });
    } finally {
      setState((current) => ({ ...current, signingIn: false }));
    }
  }, [setState]);

  const switchUser = useCallback(
    async (userId: string) => {
      setState((current) => ({ ...current, signingIn: true }));

      try {
        let nextUser =
          availableUsers.find((candidate) => candidate.id === userId) ?? null;

        if (!nextUser) {
          const remoteUsers = await loadAvailableUsers();
          nextUser =
            remoteUsers.find(
              (candidate) =>
                candidate.role === 'student' && candidate.id === userId,
            ) ?? null;
        }

        if (!nextUser) {
          throw new Error('{"error":{"message":"Student account not found."}}');
        }

        setState((current) => ({
          ...current,
          authMode: 'user_switcher',
          student: nextUser,
          profile: buildFallbackProfile(nextUser),
          activeSession: null,
          submittedResult: null,
          integrity: buildEmptyIntegrityState(),
        }));

        try {
          const [remoteProfile, nextHistory] = await Promise.all([
            getStudentProfile(nextUser),
            getStudentExamHistory(nextUser),
          ]);
          setState((current) => ({
            ...current,
            profile: remoteProfile,
            history: nextHistory,
            progressSummary: buildProgressSummary(nextHistory),
          }));
        } catch {
          setState((current) => ({
            ...current,
            profile: buildFallbackProfile(nextUser),
            history: [],
            progressSummary: emptyProgressSummary,
          }));
        }
      } catch {
        throw new Error('{"error":{"message":"Student account not found."}}');
      } finally {
        setState((current) => ({ ...current, signingIn: false }));
      }
    },
    [availableUsers, loadAvailableUsers, refreshDashboard, setState],
  );

  const logout = useCallback(async () => {
    setState((current) => ({
      ...current,
      authMode: 'user_switcher',
      student: null,
      profile: null,
      activeSession: null,
      submittedResult: null,
      history: [],
      progressSummary: emptyProgressSummary,
      integrity: buildEmptyIntegrityState(),
    }));
    await clearPersistedState();
  }, [setState]);

  return {
    signInWithCode,
    switchUser,
    logout,
  };
};
