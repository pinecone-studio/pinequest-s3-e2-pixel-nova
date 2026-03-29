import { getSessionDetail } from '../services/api';
import type {
  ActiveExamSession,
  AuthUser,
  IntegrityState,
  SessionSyncStatus,
  StudentProfile,
  StudentProgressSummary,
} from '@/types/student-app';
import { deriveTimerEndsAt, getIntegrityCapabilities } from './utils';

export const emptyProgressSummary: StudentProgressSummary = {
  totalSessions: 0,
  gradedSessions: 0,
  averageScore: null,
  bestScore: null,
  latestScore: null,
  latestCompletedAt: null,
};

export const buildFallbackProfile = (student: AuthUser): StudentProfile => ({
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

export const buildEmptyIntegrityState = (): IntegrityState => ({
  lastEventType: null,
  lastEventAt: null,
  warningMessage: null,
  eventCount: 0,
  capabilities: getIntegrityCapabilities(),
});

export const normalizeSessionStatus = (
  status: string,
): ActiveExamSession['status'] => {
  if (status === 'late') return 'late';
  if (status === 'in_progress') return 'in_progress';
  if (status === 'submitting') return 'submitting';
  if (status === 'submitted') return 'submitted';
  return 'joined';
};

export const buildSyncMessage = (
  status: SessionSyncStatus,
  error?: string | null,
) => {
  if (status === 'syncing') return 'Syncing exam state with the server...';
  if (status === 'error') return error ?? 'Could not refresh the active exam.';
  if (status === 'ready') return 'Active exam recovered.';
  return null;
};

export const toActiveSession = (
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
