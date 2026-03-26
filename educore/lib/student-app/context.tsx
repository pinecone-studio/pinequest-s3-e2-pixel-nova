import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  getMe,
  getSessionDetail,
  getSessionResult,
  getStudentProfile,
  joinSession,
  reportCheatEvent,
  startSession,
  submitSession,
  submitSessionAnswer,
  updateStudentProfile as updateProfileRequest,
} from './api';
import {
  clearPersistedState,
  loadPersistedState,
  persistState,
} from './storage';
import type {
  ActiveExamSession,
  AnswerValue,
  AuthUser,
  CheatEventType,
  SessionResultResponse,
  StudentProfile,
} from './types';
import { availableStudentUsers, defaultStudentUser } from './users';
import { normalizeApiError } from './utils';

type StudentAppContextValue = {
  hydrated: boolean;
  student: AuthUser | null;
  availableUsers: AuthUser[];
  profile: StudentProfile | null;
  activeSession: ActiveExamSession | null;
  submittedResult: SessionResultResponse | null;
  signingIn: boolean;
  switchUser: (userId: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  saveProfile: (payload: StudentProfile) => Promise<void>;
  joinExam: (roomCode: string) => Promise<ActiveExamSession>;
  startExam: () => Promise<void>;
  answerQuestion: (questionId: string, answer: AnswerValue) => Promise<void>;
  setCurrentQuestionIndex: (index: number) => void;
  logIntegrityEvent: (eventType: CheatEventType, metadata?: string) => Promise<void>;
  submitCurrentExam: () => Promise<SessionResultResponse>;
  clearResult: () => void;
};

const StudentAppContext = createContext<StudentAppContextValue | null>(null);

const buildFallbackProfile = (student: AuthUser): StudentProfile => ({
  fullName: student.fullName,
  code: student.code,
  email: student.email ?? null,
  avatarUrl: student.avatarUrl ?? null,
  phone: null,
  school: null,
  grade: null,
  bio: null,
  xp: student.xp ?? 0,
  level: student.level ?? 1,
});

const toActiveSession = (
  sessionId: string,
  roomCode: string,
  detail: Awaited<ReturnType<typeof getSessionDetail>>
): ActiveExamSession => ({
  sessionId,
  roomCode,
  status: detail.session.status === 'in_progress' ? 'in_progress' : 'joined',
  exam: {
    ...detail.exam,
    questionCount: detail.questions.length,
  },
  questions: detail.questions,
  answers: {},
  currentQuestionIndex: 0,
  timerEndsAt: detail.session.startedAt
    ? new Date(detail.session.startedAt).getTime() +
      detail.exam.durationMin * 60 * 1000
    : null,
  startedAt: detail.session.startedAt,
  lastAnswerAt: null,
});

export function StudentAppProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [hydrated, setHydrated] = useState(false);
  const [student, setStudent] = useState<AuthUser | null>(defaultStudentUser);
  const [profile, setProfile] = useState<StudentProfile | null>(
    buildFallbackProfile(defaultStudentUser)
  );
  const [activeSession, setActiveSession] = useState<ActiveExamSession | null>(
    null
  );
  const [submittedResult, setSubmittedResult] =
    useState<SessionResultResponse | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      const state = await loadPersistedState();
      if (cancelled) return;

      const nextStudent = state.student ?? defaultStudentUser;
      setStudent(nextStudent);
      setProfile(state.profile ?? buildFallbackProfile(nextStudent));
      setActiveSession(state.activeSession);
      setSubmittedResult(state.submittedResult);
      setHydrated(true);
    };

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    void persistState({
      student,
      profile,
      activeSession,
      submittedResult,
    });
  }, [activeSession, hydrated, profile, student, submittedResult]);

  useEffect(() => {
    if (!hydrated || !student) return;

    let cancelled = false;

    const validate = async () => {
      try {
        const me = await getMe(student);
        if (cancelled || me.role !== 'student') return;

        setStudent(me);

        const remoteProfile = await getStudentProfile(me);
        if (!cancelled) {
          setProfile(remoteProfile);
        }
      } catch {
        if (cancelled) return;
        setProfile((prev) => prev ?? buildFallbackProfile(student));
      }
    };

    void validate();

    return () => {
      cancelled = true;
    };
  }, [hydrated, student]);

  const switchUser = useCallback(async (userId: string) => {
    setSigningIn(true);
    try {
      const nextUser =
        availableStudentUsers.find((candidate) => candidate.id === userId) ??
        defaultStudentUser;

      setStudent(nextUser);
      setActiveSession(null);
      setSubmittedResult(null);

      try {
        const remoteProfile = await getStudentProfile(nextUser);
        setProfile(remoteProfile);
      } catch {
        setProfile(buildFallbackProfile(nextUser));
      }
    } finally {
      setSigningIn(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setStudent(defaultStudentUser);
    setProfile(buildFallbackProfile(defaultStudentUser));
    setActiveSession(null);
    setSubmittedResult(null);
    await clearPersistedState();
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!student) return;

    try {
      const remoteProfile = await getStudentProfile(student);
      setProfile(remoteProfile);
    } catch {
      setProfile((prev) => prev ?? buildFallbackProfile(student));
    }
  }, [student]);

  const saveProfile = useCallback(
    async (payload: StudentProfile) => {
      if (!student) {
        throw new Error('No active student selected.');
      }

      try {
        const updated = await updateProfileRequest(student, payload);
        setProfile(updated);
      } catch {
        setProfile(payload);
      }
    },
    [student]
  );

  const joinExamAction = useCallback(
    async (roomCode: string) => {
      if (!student) {
        throw new Error('No active student selected.');
      }

      const normalizedCode = roomCode.trim().toUpperCase();
      const joined = await joinSession(student, normalizedCode);
      const detail = await getSessionDetail(student, joined.sessionId);
      const nextSession = toActiveSession(joined.sessionId, normalizedCode, detail);

      setActiveSession(nextSession);
      setSubmittedResult(null);
      return nextSession;
    },
    [student]
  );

  const startExamAction = useCallback(async () => {
    if (!student || !activeSession) {
      throw new Error('No active exam session found.');
    }

    await startSession(student, activeSession.sessionId);
    const now = Date.now();

    setActiveSession((prev) =>
      prev
        ? {
            ...prev,
            status: 'in_progress',
            startedAt: new Date(now).toISOString(),
            timerEndsAt:
              prev.timerEndsAt ?? now + prev.exam.durationMin * 60 * 1000,
          }
        : prev
    );
  }, [activeSession, student]);

  const setCurrentQuestionIndex = useCallback((index: number) => {
    setActiveSession((prev) =>
      prev
        ? {
            ...prev,
            currentQuestionIndex: Math.max(
              0,
              Math.min(index, prev.questions.length - 1)
            ),
          }
        : prev
    );
  }, []);

  const logIntegrityEvent = useCallback(
    async (eventType: CheatEventType, metadata?: string) => {
      if (!student || !activeSession) return;

      try {
        await reportCheatEvent(student, activeSession, eventType, metadata);
      } catch {
        return;
      }
    },
    [activeSession, student]
  );

  const answerQuestion = useCallback(
    async (questionId: string, answer: AnswerValue) => {
      if (!student || !activeSession) {
        throw new Error('No active exam session found.');
      }

      const now = Date.now();
      const previousAnswerAt = activeSession.lastAnswerAt;

      setActiveSession((prev) =>
        prev
          ? {
              ...prev,
              answers: {
                ...prev.answers,
                [questionId]: {
                  ...answer,
                  answeredAt: new Date(now).toISOString(),
                },
              },
              lastAnswerAt: now,
            }
          : prev
      );

      await submitSessionAnswer(student, activeSession.sessionId, questionId, answer);

      if (previousAnswerAt && now - previousAnswerAt < 1500) {
        void logIntegrityEvent('rapid_answers', 'rapid-local-answer-interval');
      }
    },
    [activeSession, logIntegrityEvent, student]
  );

  const submitCurrentExam = useCallback(async () => {
    if (!student || !activeSession) {
      throw new Error('No active exam session found.');
    }

    setActiveSession((prev) => (prev ? { ...prev, status: 'submitting' } : prev));

    try {
      await submitSession(student, activeSession.sessionId);
      const result = await getSessionResult(student, activeSession.sessionId);
      setSubmittedResult(result);
      setActiveSession((prev) =>
        prev
          ? {
              ...prev,
              status: 'submitted',
            }
          : prev
      );
      return result;
    } catch (error) {
      setActiveSession((prev) =>
        prev
          ? {
              ...prev,
              status: 'in_progress',
            }
          : prev
      );
      throw new Error(
        normalizeApiError(error, 'Failed to submit the exam.')
      );
    }
  }, [activeSession, student]);

  const clearResult = useCallback(() => {
    setSubmittedResult(null);
    setActiveSession(null);
  }, []);

  const value = useMemo<StudentAppContextValue>(
    () => ({
      hydrated,
      student,
      availableUsers: availableStudentUsers,
      profile,
      activeSession,
      submittedResult,
      signingIn,
      switchUser,
      logout,
      refreshProfile,
      saveProfile,
      joinExam: joinExamAction,
      startExam: startExamAction,
      answerQuestion,
      setCurrentQuestionIndex,
      logIntegrityEvent,
      submitCurrentExam,
      clearResult,
    }),
    [
      activeSession,
      answerQuestion,
      clearResult,
      hydrated,
      joinExamAction,
      logIntegrityEvent,
      logout,
      profile,
      refreshProfile,
      saveProfile,
      setCurrentQuestionIndex,
      signingIn,
      startExamAction,
      student,
      submittedResult,
      submitCurrentExam,
      switchUser,
    ]
  );

  return (
    <StudentAppContext.Provider value={value}>
      {children}
    </StudentAppContext.Provider>
  );
}

export const useStudentApp = () => {
  const context = useContext(StudentAppContext);

  if (!context) {
    throw new Error('StudentAppProvider is missing.');
  }

  return context;
};

export const useStudentAppError = (error: unknown, fallback: string) =>
  normalizeApiError(error, fallback);
