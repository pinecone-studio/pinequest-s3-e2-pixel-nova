import { useCallback, useEffect, useRef } from 'react';

import {
  getSessionDetail,
  getSessionResult,
  joinSession,
  reportCheatEvent,
  startSessionWithOptions,
  submitSession,
  submitSessionAnswer,
} from '@/lib/student-app/services/api';
import {
  buildSyncMessage,
  toActiveSession,
} from '../core/context-helpers';
import { isCheatDetectionEnabled } from '../core/cheat-detection';
import type { AnswerValue, CheatEventType } from '@/types/student-app';
import type { ActiveExamSession } from '@/types/student-app';
import type { StudentAppSetState, StudentAppState } from '../core/state';
import {
  mergeSessionResult,
  normalizeApiError,
} from '../core/utils';

type UseStudentSessionArgs = {
  state: StudentAppState;
  setState: StudentAppSetState;
  refreshDashboard: () => Promise<void>;
};

const parseApiErrorPayload = (error: unknown) => {
  if (!(error instanceof Error) || !error.message) {
    return null;
  }

  try {
    const parsed = JSON.parse(error.message) as {
      code?: string;
      message?: string;
      error?: {
        code?: string;
        message?: string;
      };
    };

    return {
      code:
        typeof parsed.error?.code === 'string'
          ? parsed.error.code
          : typeof parsed.code === 'string'
            ? parsed.code
            : null,
      message:
        typeof parsed.error?.message === 'string'
          ? parsed.error.message
          : typeof parsed.message === 'string'
            ? parsed.message
            : null,
    };
  } catch {
    return null;
  }
};

const isRecoverableStartStatusError = (error: unknown) => {
  const payload = parseApiErrorPayload(error);

  return (
    payload?.code === 'INVALID_STATUS' &&
    payload.message === "Session must be in 'joined' or 'late' status to start"
  );
};

const SESSION_STATUS_PRIORITY: Record<ActiveExamSession['status'], number> = {
  joined: 0,
  late: 0,
  in_progress: 1,
  submitting: 2,
  submitted: 3,
};

const getMostAdvancedSessionStatus = (
  currentStatus: ActiveExamSession['status'],
  nextStatus: ActiveExamSession['status'],
) =>
  SESSION_STATUS_PRIORITY[currentStatus] > SESSION_STATUS_PRIORITY[nextStatus]
    ? currentStatus
    : nextStatus;

export const useStudentSession = ({
  state,
  setState,
  refreshDashboard,
}: UseStudentSessionArgs) => {
  const { hydrated, student, activeSession } = state;
  const submitLockRef = useRef(false);
  const activeSessionId = activeSession?.sessionId ?? null;
  const activeSessionRoomCode = activeSession?.roomCode ?? null;
  const activeSessionEntryStatus = activeSession?.entryStatus ?? null;

  const syncActiveSessionFromDetail = useCallback(
    (
      sessionId: string,
      roomCode: string,
      entryStatus: string,
      detail: Awaited<ReturnType<typeof getSessionDetail>>,
    ) => {
      const nextSession = toActiveSession(
        sessionId,
        roomCode,
        detail,
        detail.session.status,
        entryStatus,
      );

      setState((current) => ({
        ...current,
        activeSession:
          current.activeSession &&
          current.activeSession.sessionId === sessionId
            ? (() => {
                const currentSession = current.activeSession;
                const resolvedStatus = getMostAdvancedSessionStatus(
                  currentSession.status,
                  nextSession.status,
                );
                const keepCurrentProgress =
                  resolvedStatus !== nextSession.status;

                return {
                  ...currentSession,
                  ...nextSession,
                  status: resolvedStatus,
                  startedAt: keepCurrentProgress
                    ? currentSession.startedAt ?? nextSession.startedAt
                    : nextSession.startedAt ?? currentSession.startedAt,
                  timerEndsAt: keepCurrentProgress
                    ? currentSession.timerEndsAt ?? nextSession.timerEndsAt
                    : nextSession.timerEndsAt ?? currentSession.timerEndsAt,
                  answers: currentSession.answers,
                  currentQuestionIndex: Math.min(
                    currentSession.currentQuestionIndex,
                    Math.max(detail.questions.length - 1, 0),
                  ),
                  lastAnswerAt: currentSession.lastAnswerAt,
                  entryStatus:
                    currentSession.entryStatus === 'late' ||
                    nextSession.entryStatus === 'late'
                      ? 'late'
                      : 'on_time',
                  syncStatus: 'ready',
                  syncMessage: buildSyncMessage('ready'),
                };
              })()
            : current.activeSession,
      }));
    },
    [setState],
  );

  const recoverActiveSession = useCallback(async () => {
    if (!student || !activeSessionId) return;

    const sessionId = activeSessionId;
    const roomCode = activeSessionRoomCode ?? '';
    const entryStatus = activeSessionEntryStatus ?? 'on_time';

    setState((current) => ({
      ...current,
      activeSession: current.activeSession
        ? {
            ...current.activeSession,
            syncStatus: 'syncing',
            syncMessage: buildSyncMessage('syncing'),
          }
        : current.activeSession,
    }));

    try {
      const detail = await getSessionDetail(student, sessionId);
      syncActiveSessionFromDetail(sessionId, roomCode, entryStatus, detail);
    } catch (error) {
      setState((current) => ({
        ...current,
        activeSession: current.activeSession
          ? {
              ...current.activeSession,
              syncStatus: 'error',
              syncMessage: buildSyncMessage(
                'error',
                normalizeApiError(error, 'Идэвхтэй шалгалтыг сэргээж чадсангүй.'),
              ),
            }
          : current.activeSession,
      }));
    }
  }, [
    activeSessionEntryStatus,
    activeSessionId,
    activeSessionRoomCode,
    setState,
    syncActiveSessionFromDetail,
    student,
  ]);

  useEffect(() => {
    if (!hydrated || !student || !activeSessionId) return;
    void recoverActiveSession();
  }, [activeSessionId, hydrated, recoverActiveSession, student]);

  const joinExam = useCallback(
    async (roomCode: string) => {
      if (!student) {
        throw new Error('Сонгосон суралцагч алга.');
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

      setState((current) => ({
        ...current,
        activeSession: nextSession,
        submittedResult: null,
      }));
      return nextSession;
    },
    [setState, student],
  );

  const startExam = useCallback(async (options?: { audioReady?: boolean }) => {
    if (!activeSession) {
      throw new Error('Идэвхтэй шалгалтын session олдсонгүй.');
    }

    if (!student) {
      throw new Error('Сонгосон суралцагч алга.');
    }

    if (
      activeSession.status === 'in_progress' ||
      activeSession.status === 'submitting' ||
      activeSession.status === 'submitted'
    ) {
      return;
    }

    let started: Awaited<ReturnType<typeof startSessionWithOptions>>;

    try {
      started = await startSessionWithOptions(
        student,
        activeSession.sessionId,
        options,
      );
    } catch (error) {
      if (isRecoverableStartStatusError(error)) {
        try {
          const detail = await getSessionDetail(student, activeSession.sessionId);

          if (
            detail.session.status === 'in_progress' ||
            detail.session.status === 'submitting' ||
            detail.session.status === 'submitted'
          ) {
            syncActiveSessionFromDetail(
              activeSession.sessionId,
              activeSession.roomCode,
              activeSession.entryStatus,
              detail,
            );
            return;
          }
        } catch {
          // Fall through to the original start error below.
        }
      }

      throw error;
    }

    setState((current) => ({
      ...current,
      activeSession: current.activeSession
        ? {
            ...current.activeSession,
            status: 'in_progress',
            startedAt: started.startedAt,
            timerEndsAt:
              new Date(started.startedAt).getTime() +
              current.activeSession.exam.durationMin * 60 * 1000,
            syncStatus: 'ready',
            syncMessage: null,
          }
        : current.activeSession,
    }));
  }, [activeSession, setState, student, syncActiveSessionFromDetail]);

  const setCurrentQuestionIndex = useCallback(
    (index: number) => {
      setState((current) => ({
        ...current,
        activeSession: current.activeSession
          ? {
              ...current.activeSession,
              currentQuestionIndex: Math.max(
                0,
                Math.min(index, current.activeSession.questions.length - 1),
              ),
            }
          : current.activeSession,
      }));
    },
    [setState],
  );

  const setIntegrityWarning = useCallback(
    (warningMessage: string | null) => {
      setState((current) => ({
        ...current,
        integrity: {
          ...current.integrity,
          warningMessage,
        },
      }));
    },
    [setState],
  );

  const logIntegrityEvent = useCallback(
    async (eventType: CheatEventType, metadata?: string) => {
      if (
        activeSession &&
        !isCheatDetectionEnabled(
          eventType,
          activeSession.exam.enabledCheatDetections,
        )
      ) {
        return;
      }

      const timestamp = new Date().toISOString();

      setState((current) => ({
        ...current,
        integrity: {
          ...current.integrity,
          lastEventType: eventType,
          lastEventAt: timestamp,
          warningMessage:
            current.integrity.warningMessage ??
            'Шалгалтын үеийн хяналт сэжигтэй үйлдэл илрүүллээ. Илгээх хүртлээ апп дотроо байна уу.',
          eventCount: current.integrity.eventCount + 1,
        },
      }));

      if (!student || !activeSession) return;

      try {
        await reportCheatEvent(student, activeSession, eventType, metadata);
      } catch {
        return;
      }
    },
    [activeSession, setState, student],
  );

  const answerQuestion = useCallback(
    async (questionId: string, answer: AnswerValue) => {
      if (!activeSession) {
        throw new Error('Идэвхтэй шалгалтын session олдсонгүй.');
      }

      const now = Date.now();
      const previousAnswerAt = activeSession.lastAnswerAt;

      setState((current) => ({
        ...current,
        activeSession: current.activeSession
          ? {
              ...current.activeSession,
              answers: {
                ...current.activeSession.answers,
                [questionId]: {
                  ...answer,
                  answeredAt: new Date(now).toISOString(),
                },
              },
              lastAnswerAt: now,
              syncStatus: 'syncing',
              syncMessage: 'Хариултыг хадгалж байна...',
            }
          : current.activeSession,
      }));

      if (!student) {
        throw new Error('Сонгосон суралцагч алга.');
      }

      try {
        await submitSessionAnswer(
          student,
          activeSession.sessionId,
          questionId,
          answer,
        );

        setState((current) => ({
          ...current,
          activeSession: current.activeSession
            ? {
                ...current.activeSession,
                syncStatus: 'ready',
                syncMessage: null,
              }
            : current.activeSession,
        }));
      } catch (error) {
        setState((current) => ({
          ...current,
          activeSession: current.activeSession
            ? {
                ...current.activeSession,
                syncStatus: 'error',
                syncMessage: normalizeApiError(
                  error,
                  'Хариултыг хадгалж чадсангүй. Илгээхээс өмнө дахин оролдоно уу.',
                ),
              }
            : current.activeSession,
        }));
        throw error;
      }

      if (previousAnswerAt && now - previousAnswerAt < 1500) {
        void logIntegrityEvent('rapid_answers', 'rapid-local-answer-interval');
      }
    },
    [activeSession, logIntegrityEvent, setState, student],
  );

  const submitCurrentExam = useCallback(async (options?: { beforeSubmit?: () => Promise<void> }) => {
    if (!activeSession) {
      throw new Error('Идэвхтэй шалгалтын session олдсонгүй.');
    }

    if (submitLockRef.current || activeSession.status === 'submitting') {
      throw new Error(
        '{"error":{"message":"Шалгалтыг аль хэдийн илгээж байна."}}',
      );
    }

    submitLockRef.current = true;
    setState((current) => ({
      ...current,
      activeSession: current.activeSession
        ? {
            ...current.activeSession,
            status: 'submitting',
            syncStatus: 'syncing',
            syncMessage: 'Шалгалтыг илгээж байна...',
          }
        : current.activeSession,
    }));

    try {
      if (options?.beforeSubmit) {
        await options.beforeSubmit();
      }

      if (!student) {
        throw new Error('Сонгосон суралцагч алга.');
      }

      const submission = await submitSession(student, activeSession.sessionId);
      const result = await getSessionResult(student, activeSession.sessionId);
      const mergedResult = mergeSessionResult(result, submission.xpEarned);

      setState((current) => ({
        ...current,
        submittedResult: mergedResult,
        activeSession: current.activeSession
          ? {
              ...current.activeSession,
              status: 'submitted',
              syncStatus: 'ready',
              syncMessage: null,
            }
          : current.activeSession,
      }));
      await refreshDashboard();
      return mergedResult;
    } catch (error) {
      setState((current) => ({
        ...current,
        activeSession: current.activeSession
          ? {
              ...current.activeSession,
              status: 'in_progress',
              syncStatus: 'error',
              syncMessage: normalizeApiError(
                error,
                'Шалгалтыг илгээж чадсангүй.',
              ),
            }
          : current.activeSession,
      }));
      throw new Error(normalizeApiError(error, 'Шалгалтыг илгээж чадсангүй.'));
    } finally {
      submitLockRef.current = false;
    }
  }, [activeSession, refreshDashboard, setState, student]);

  const clearResult = useCallback(() => {
    setState((current) => ({
      ...current,
      submittedResult: null,
      activeSession: null,
    }));
  }, [setState]);

  return {
    joinExam,
    recoverActiveSession,
    startExam,
    answerQuestion,
    setCurrentQuestionIndex,
    logIntegrityEvent,
    setIntegrityWarning,
    submitCurrentExam,
    clearResult,
  };
};
