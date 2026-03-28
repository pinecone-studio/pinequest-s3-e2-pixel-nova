import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  getAuthUsers,
  getMe,
  getSessionDetail,
  getSessionResult,
  getStudentExamHistory,
  getStudentProfile,
  joinSession,
  loginWithCode,
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
  AuthMode,
  AuthUser,
  CheatEventType,
  IntegrityState,
  SessionResultResponse,
  SessionSyncStatus,
  StudentExamHistoryItem,
  StudentProfile,
  StudentProgressSummary,
} from './types';
import { availableStudentUsers, defaultStudentUser } from './users';
import {
  buildProgressSummary,
  deriveTimerEndsAt,
  getIntegrityCapabilities,
  mergeSessionResult,
  normalizeApiError,
} from './utils';

type StudentAppContextValue = {
  hydrated: boolean;
  authMode: AuthMode;
  student: AuthUser | null;
  availableUsers: AuthUser[];
  profile: StudentProfile | null;
  activeSession: ActiveExamSession | null;
  submittedResult: SessionResultResponse | null;
  history: StudentExamHistoryItem[];
  progressSummary: StudentProgressSummary;
  integrity: IntegrityState;
  signingIn: boolean;
  dashboardLoading: boolean;
  dashboardError: string | null;
  refreshDashboard: () => Promise<void>;
  signInWithCode: (code: string) => Promise<void>;
  switchUser: (userId: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  saveProfile: (payload: StudentProfile) => Promise<void>;
  joinExam: (roomCode: string) => Promise<ActiveExamSession>;
  recoverActiveSession: () => Promise<void>;
  startExam: () => Promise<void>;
  answerQuestion: (questionId: string, answer: AnswerValue) => Promise<void>;
  setCurrentQuestionIndex: (index: number) => void;
  logIntegrityEvent: (eventType: CheatEventType, metadata?: string) => Promise<void>;
  setIntegrityWarning: (warningMessage: string | null) => void;
  submitCurrentExam: () => Promise<SessionResultResponse>;
  clearResult: () => void;
};

const StudentAppContext = createContext<StudentAppContextValue | null>(null);

const emptyProgressSummary: StudentProgressSummary = {
  totalSessions: 0,
  gradedSessions: 0,
  averageScore: null,
  bestScore: null,
  latestScore: null,
  latestCompletedAt: null,
};

const buildFallbackProfile = (student: AuthUser): StudentProfile => ({
  fullName: student.fullName,
  code: student.code,
  email: student.email ?? null,
  avatarUrl: student.avatarUrl ?? null,
  phone: null,
  school: null,
  grade: null,
  groupName: null,
  bio: null,
  xp: student.xp ?? 0,
  level: student.level ?? 1,
});

const buildEmptyIntegrityState = (): IntegrityState => ({
  lastEventType: null,
  lastEventAt: null,
  warningMessage: null,
  eventCount: 0,
  capabilities: getIntegrityCapabilities(),
});

const normalizeSessionStatus = (status: string): ActiveExamSession['status'] => {
  if (status === 'late') return 'late';
  if (status === 'in_progress') return 'in_progress';
  if (status === 'submitting') return 'submitting';
  if (status === 'submitted') return 'submitted';
  return 'joined';
};

const buildSyncMessage = (status: SessionSyncStatus, error?: string | null) => {
  if (status === 'syncing') return 'Syncing exam state with the server...';
  if (status === 'error') return error ?? 'Could not refresh the active exam.';
  if (status === 'ready') return 'Active exam recovered.';
  return null;
};

const toActiveSession = (
  sessionId: string,
  roomCode: string,
  detail: Awaited<ReturnType<typeof getSessionDetail>>,
  sessionStatus?: string | null,
  entryStatus?: string | null,
): ActiveExamSession => ({
  sessionId,
  roomCode,
  status: normalizeSessionStatus(sessionStatus ?? detail.session.status),
  exam: {
    ...detail.exam,
    questionCount: detail.questions.length,
  },
  questions: detail.questions,
  answers: {},
  currentQuestionIndex: 0,
  timerEndsAt: deriveTimerEndsAt(detail),
  startedAt: detail.session.startedAt,
  lastAnswerAt: null,
  syncStatus: 'ready',
  syncMessage: buildSyncMessage('ready'),
  entryStatus: entryStatus === 'late' ? 'late' : 'on_time',
});

export function StudentAppProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [hydrated, setHydrated] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('dev_switcher');
  const [student, setStudent] = useState<AuthUser | null>(defaultStudentUser);
  const [profile, setProfile] = useState<StudentProfile | null>(
    buildFallbackProfile(defaultStudentUser),
  );
  const [activeSession, setActiveSession] = useState<ActiveExamSession | null>(null);
  const [submittedResult, setSubmittedResult] =
    useState<SessionResultResponse | null>(null);
  const [history, setHistory] = useState<StudentExamHistoryItem[]>([]);
  const [progressSummary, setProgressSummary] =
    useState<StudentProgressSummary>(emptyProgressSummary);
  const [integrity, setIntegrity] = useState<IntegrityState>(buildEmptyIntegrityState);
  const [signingIn, setSigningIn] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const submitLockRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      const state = await loadPersistedState();
      if (cancelled) return;

      const nextStudent = state.student ?? defaultStudentUser;
      setAuthMode(state.authMode ?? 'dev_switcher');
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
      authMode,
      student,
      profile,
      activeSession,
      submittedResult,
    });
  }, [activeSession, authMode, hydrated, profile, student, submittedResult]);

  const refreshDashboard = useCallback(async () => {
    if (!student) return;

    setDashboardLoading(true);
    setDashboardError(null);

    try {
      const [remoteProfile, nextHistory] = await Promise.all([
        getStudentProfile(student),
        getStudentExamHistory(student),
      ]);

      setProfile(remoteProfile);
      setHistory(nextHistory);
      setProgressSummary(buildProgressSummary(nextHistory));
    } catch (error) {
      setDashboardError(
        normalizeApiError(error, 'Could not load the latest student dashboard.'),
      );
    } finally {
      setDashboardLoading(false);
    }
  }, [student]);

  const recoverActiveSession = useCallback(async () => {
    if (!student || !activeSession?.sessionId) return;

    const sessionId = activeSession.sessionId;
    const roomCode = activeSession.roomCode;
    const entryStatus = activeSession.entryStatus;

    setActiveSession((prev) =>
      prev
        ? {
            ...prev,
            syncStatus: 'syncing',
            syncMessage: buildSyncMessage('syncing'),
          }
        : prev,
    );

    try {
      const detail = await getSessionDetail(student, sessionId);
      setActiveSession((prev) =>
        prev
          ? {
              ...prev,
              ...toActiveSession(
                sessionId,
                roomCode,
                detail,
                detail.session.status,
                entryStatus,
              ),
              answers: prev.answers,
              currentQuestionIndex: Math.min(
                prev.currentQuestionIndex,
                Math.max(detail.questions.length - 1, 0),
              ),
              syncStatus: 'ready',
              syncMessage: buildSyncMessage('ready'),
            }
          : prev,
      );
    } catch (error) {
      setActiveSession((prev) =>
        prev
          ? {
              ...prev,
              syncStatus: 'error',
              syncMessage: buildSyncMessage(
                'error',
                normalizeApiError(error, 'Could not recover the active exam.'),
              ),
            }
          : prev,
      );
    }
  }, [
    activeSession?.entryStatus,
    activeSession?.roomCode,
    activeSession?.sessionId,
    student,
  ]);

  useEffect(() => {
    if (!hydrated || !student) return;

    let cancelled = false;

    const validate = async () => {
      try {
        const me = await getMe(student);
        if (cancelled || me.role !== 'student') return;

        setStudent(me);
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
  }, [hydrated, refreshDashboard, student]);

  useEffect(() => {
    if (!hydrated || !student || !activeSession?.sessionId) return;
    void recoverActiveSession();
  }, [activeSession?.sessionId, hydrated, recoverActiveSession, student]);

  const signInWithCode = useCallback(async (code: string) => {
    setSigningIn(true);

    try {
      const nextStudent = await loginWithCode(code.trim());
      if (nextStudent.role !== 'student') {
        throw new Error('{"error":{"message":"Only student accounts can use this app."}}');
      }

      setAuthMode('student_code');
      setStudent(nextStudent);
      setSubmittedResult(null);
      setActiveSession(null);
      setIntegrity(buildEmptyIntegrityState());
    } finally {
      setSigningIn(false);
    }
  }, []);

  const switchUser = useCallback(async (userId: string) => {
    setSigningIn(true);
    try {
      let nextUser =
        availableStudentUsers.find((candidate) => candidate.id === userId) ?? null;

      if (!nextUser) {
        const remoteUsers = await getAuthUsers();
        nextUser =
          remoteUsers.find(
            (candidate) => candidate.role === 'student' && candidate.id === userId,
          ) ?? defaultStudentUser;
      }

      setAuthMode('dev_switcher');
      setStudent(nextUser);
      setActiveSession(null);
      setSubmittedResult(null);
      setIntegrity(buildEmptyIntegrityState());

      try {
        const [remoteProfile, nextHistory] = await Promise.all([
          getStudentProfile(nextUser),
          getStudentExamHistory(nextUser),
        ]);
        setProfile(remoteProfile);
        setHistory(nextHistory);
        setProgressSummary(buildProgressSummary(nextHistory));
      } catch {
        setProfile(buildFallbackProfile(nextUser));
        setHistory([]);
        setProgressSummary(emptyProgressSummary);
      }
    } finally {
      setSigningIn(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setAuthMode('dev_switcher');
    setStudent(defaultStudentUser);
    setProfile(buildFallbackProfile(defaultStudentUser));
    setActiveSession(null);
    setSubmittedResult(null);
    setHistory([]);
    setProgressSummary(emptyProgressSummary);
    setIntegrity(buildEmptyIntegrityState());
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
    [student],
  );

  const joinExamAction = useCallback(
    async (roomCode: string) => {
      if (!student) {
        throw new Error('No active student selected.');
      }

      const normalizedCode = roomCode.trim().toUpperCase();
      const joined = await joinSession(student, normalizedCode);
      const detail = await getSessionDetail(student, joined.sessionId);
      const nextSession = toActiveSession(
        joined.sessionId,
        normalizedCode,
        detail,
        joined.sessionStatus,
        joined.entryStatus,
      );

      setActiveSession(nextSession);
      setSubmittedResult(null);
      return nextSession;
    },
    [student],
  );

  const startExamAction = useCallback(async () => {
    if (!student || !activeSession) {
      throw new Error('No active exam session found.');
    }

    const started = await startSession(student, activeSession.sessionId);

    setActiveSession((prev) =>
      prev
        ? {
            ...prev,
            status: 'in_progress',
            startedAt: started.startedAt,
            timerEndsAt:
              new Date(started.startedAt).getTime() +
              prev.exam.durationMin * 60 * 1000,
            syncStatus: 'ready',
            syncMessage: null,
          }
        : prev,
    );
  }, [activeSession, student]);

  const setCurrentQuestionIndex = useCallback((index: number) => {
    setActiveSession((prev) =>
      prev
        ? {
            ...prev,
            currentQuestionIndex: Math.max(
              0,
              Math.min(index, prev.questions.length - 1),
            ),
          }
        : prev,
    );
  }, []);

  const setIntegrityWarning = useCallback((warningMessage: string | null) => {
    setIntegrity((prev) => ({
      ...prev,
      warningMessage,
    }));
  }, []);

  const logIntegrityEvent = useCallback(
    async (eventType: CheatEventType, metadata?: string) => {
      const timestamp = new Date().toISOString();

      setIntegrity((prev) => ({
        ...prev,
        lastEventType: eventType,
        lastEventAt: timestamp,
        warningMessage:
          prev.warningMessage ??
          'Integrity monitoring detected an exam-related event. Stay inside the app until you submit.',
        eventCount: prev.eventCount + 1,
      }));

      if (!student || !activeSession) return;

      try {
        await reportCheatEvent(student, activeSession, eventType, metadata);
      } catch {
        return;
      }
    },
    [activeSession, student],
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
              syncStatus: 'syncing',
              syncMessage: 'Saving your answer...',
            }
          : prev,
      );

      try {
        await submitSessionAnswer(student, activeSession.sessionId, questionId, answer);

        setActiveSession((prev) =>
          prev
            ? {
                ...prev,
                syncStatus: 'ready',
                syncMessage: null,
              }
            : prev,
        );
      } catch (error) {
        setActiveSession((prev) =>
          prev
            ? {
                ...prev,
                syncStatus: 'error',
                syncMessage: normalizeApiError(
                  error,
                  'Could not save the answer. Try again before submitting.',
                ),
              }
            : prev,
        );
        throw error;
      }

      if (previousAnswerAt && now - previousAnswerAt < 1500) {
        void logIntegrityEvent('rapid_answers', 'rapid-local-answer-interval');
      }
    },
    [activeSession, logIntegrityEvent, student],
  );

  const submitCurrentExam = useCallback(async () => {
    if (!student || !activeSession) {
      throw new Error('No active exam session found.');
    }

    if (submitLockRef.current || activeSession.status === 'submitting') {
      throw new Error('{"error":{"message":"The exam is already being submitted."}}');
    }

    submitLockRef.current = true;
    setActiveSession((prev) =>
      prev
        ? {
            ...prev,
            status: 'submitting',
            syncStatus: 'syncing',
            syncMessage: 'Submitting your exam...',
          }
        : prev,
    );

    try {
      const submission = await submitSession(student, activeSession.sessionId);
      const result = await getSessionResult(student, activeSession.sessionId);
      const mergedResult = mergeSessionResult(result, submission.xpEarned);

      setSubmittedResult(mergedResult);
      setActiveSession((prev) =>
        prev
          ? {
              ...prev,
              status: 'submitted',
              syncStatus: 'ready',
              syncMessage: null,
            }
          : prev,
      );
      await refreshDashboard();
      return mergedResult;
    } catch (error) {
      setActiveSession((prev) =>
        prev
          ? {
              ...prev,
              status: 'in_progress',
              syncStatus: 'error',
              syncMessage: normalizeApiError(
                error,
                'Failed to submit the exam.',
              ),
            }
          : prev,
      );
      throw new Error(normalizeApiError(error, 'Failed to submit the exam.'));
    } finally {
      submitLockRef.current = false;
    }
  }, [activeSession, refreshDashboard, student]);

  const clearResult = useCallback(() => {
    setSubmittedResult(null);
    setActiveSession(null);
  }, []);

  const value = useMemo<StudentAppContextValue>(
    () => ({
      hydrated,
      authMode,
      student,
      availableUsers: availableStudentUsers,
      profile,
      activeSession,
      submittedResult,
      history,
      progressSummary,
      integrity,
      signingIn,
      dashboardLoading,
      dashboardError,
      refreshDashboard,
      signInWithCode,
      switchUser,
      logout,
      refreshProfile,
      saveProfile,
      joinExam: joinExamAction,
      recoverActiveSession,
      startExam: startExamAction,
      answerQuestion,
      setCurrentQuestionIndex,
      logIntegrityEvent,
      setIntegrityWarning,
      submitCurrentExam,
      clearResult,
    }),
    [
      activeSession,
      answerQuestion,
      authMode,
      clearResult,
      dashboardError,
      dashboardLoading,
      history,
      hydrated,
      integrity,
      joinExamAction,
      logIntegrityEvent,
      logout,
      profile,
      progressSummary,
      recoverActiveSession,
      refreshDashboard,
      refreshProfile,
      saveProfile,
      setCurrentQuestionIndex,
      setIntegrityWarning,
      signInWithCode,
      signingIn,
      startExamAction,
      student,
      submittedResult,
      submitCurrentExam,
      switchUser,
    ],
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
