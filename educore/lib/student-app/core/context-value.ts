import type {
  ActiveExamSession,
  AnswerValue,
  AuthMode,
  AuthUser,
  CheatEventType,
  IntegrityState,
  SessionResultResponse,
  StudentExamHistoryItem,
  StudentProfile,
  StudentProgressSummary,
  StudentUpcomingExam,
} from '@/types/student-app';

export type StudentAppContextValue = {
  hydrated: boolean;
  authMode: AuthMode;
  student: AuthUser | null;
  availableUsers: AuthUser[];
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
  logIntegrityEvent: (
    eventType: CheatEventType,
    metadata?: string,
  ) => Promise<void>;
  setIntegrityWarning: (warningMessage: string | null) => void;
  submitCurrentExam: () => Promise<SessionResultResponse>;
  clearResult: () => void;
};
