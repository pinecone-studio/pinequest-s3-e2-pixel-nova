import type { Dispatch, SetStateAction } from 'react';

import { buildEmptyIntegrityState, emptyProgressSummary } from './context-helpers';
import type {
  ActiveExamSession,
  AuthMode,
  AuthUser,
  IntegrityState,
  SessionResultResponse,
  StudentExamHistoryItem,
  StudentProfile,
  StudentProgressSummary,
  StudentUpcomingExam,
} from '@/types/student-app';

export type StudentAppState = {
  hydrated: boolean;
  authMode: AuthMode;
  availableUsers: AuthUser[];
  student: AuthUser | null;
  profile: StudentProfile | null;
  activeSession: ActiveExamSession | null;
  upcomingExams: StudentUpcomingExam[];
  submittedResult: SessionResultResponse | null;
  history: StudentExamHistoryItem[];
  progressSummary: StudentProgressSummary;
  integrity: IntegrityState;
  signingIn: boolean;
  dashboardLoading: boolean;
  dashboardError: string | null;
};

export type StudentAppSetState = Dispatch<SetStateAction<StudentAppState>>;

export const initialStudentAppState: StudentAppState = {
  hydrated: false,
  authMode: 'user_switcher',
  availableUsers: [],
  student: null,
  profile: null,
  activeSession: null,
  upcomingExams: [],
  submittedResult: null,
  history: [],
  progressSummary: emptyProgressSummary,
  integrity: buildEmptyIntegrityState(),
  signingIn: false,
  dashboardLoading: false,
  dashboardError: null,
};
