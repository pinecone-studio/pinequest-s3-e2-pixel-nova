import { useCallback, useEffect, useRef } from 'react';

import {
  getSessionDetail,
  getSessionResult,
  joinSession,
  reportCheatEvent,
  startSession,
  submitSession,
  submitSessionAnswer,
} from '../services/api';
import {
  buildEmptyIntegrityState,
  buildSyncMessage,
  toActiveSession,
} from '../core/context-helpers';
import type { AnswerValue, CheatEventType } from '@/types/student-app';
import type { StudentAppSetState, StudentAppState } from '../core/state';
import { mergeSessionResult, normalizeApiError } from '../core/utils';

type UseStudentSessionArgs = {
  state: StudentAppState;
  setState: StudentAppSetState;
  refreshDashboard: () => Promise<void>;
};

export const useStudentSession = ({
  state,
  setState,
  refreshDashboard,
}: UseStudentSessionArgs) => {
  const { hydrated, student, activeSession } = state;
  const submitLockRef = useRef(false);

  const recoverActiveSession = useCallback(async () => {
    if (!student || !activeSession?.sessionId) return;

    const { sessionId, roomCode, entryStatus } = activeSession;

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
      setState((current) => ({
        ...current,
        activeSession: current.activeSession
          ? {
              ...current.activeSession,
              ...toActiveSession(
                sessionId,
                roomCode,
                detail,
                detail.session.status,
                entryStatus,
              ),
              answers: current.activeSession.answers,
              currentQuestionIndex: Math.min(
                current.activeSession.currentQuestionIndex,
                Math.max(detail.questions.length - 1, 0),
              ),
              syncStatus: 'ready',
              syncMessage: buildSyncMessage('ready'),
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
              syncMessage: buildSyncMessage(
                'error',
                normalizeApiError(error, 'Could not recover the active exam.'),
              ),
            }
          : current.activeSession,
      }));
    }
  }, [activeSession, setState, student]);

  useEffect(() => {
    if (!hydrated || !student || !activeSession?.sessionId) return;
    void recoverActiveSession();
  }, [activeSession?.sessionId, hydrated, recoverActiveSession, student]);

  const joinExam = useCallback(
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

      setState((current) => ({
        ...current,
        activeSession: nextSession,
        submittedResult: null,
      }));
      return nextSession;
    },
    [setState, student],
  );

  const startExam = useCallback(async () => {
    if (!student || !activeSession) {
      throw new Error('No active exam session found.');
    }

    const started = await startSession(student, activeSession.sessionId);

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
  }, [activeSession, setState, student]);

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
      const timestamp = new Date().toISOString();

      setState((current) => ({
        ...current,
        integrity: {
          ...current.integrity,
          lastEventType: eventType,
          lastEventAt: timestamp,
          warningMessage:
            current.integrity.warningMessage ??
            'Integrity monitoring detected an exam-related event. Stay inside the app until you submit.',
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
      if (!student || !activeSession) {
        throw new Error('No active exam session found.');
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
              syncMessage: 'Saving your answer...',
            }
          : current.activeSession,
      }));

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
                  'Could not save the answer. Try again before submitting.',
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

  const submitCurrentExam = useCallback(async () => {
    if (!student || !activeSession) {
      throw new Error('No active exam session found.');
    }

    if (submitLockRef.current || activeSession.status === 'submitting') {
      throw new Error(
        '{"error":{"message":"The exam is already being submitted."}}',
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
            syncMessage: 'Submitting your exam...',
          }
        : current.activeSession,
    }));

    try {
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
                'Failed to submit the exam.',
              ),
            }
          : current.activeSession,
      }));
      throw new Error(normalizeApiError(error, 'Failed to submit the exam.'));
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
