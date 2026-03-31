export type AuthRole = 'teacher' | 'student';

export type AuthMode = 'user_switcher' | 'student_code';

export type AuthUser = {
  id: string;
  code?: string;
  fullName: string;
  email?: string | null;
  avatarUrl?: string | null;
  role: AuthRole;
  xp?: number;
  level?: number;
};

export type StudentProfile = {
  id?: string;
  code?: string;
  fullName: string;
  email?: string | null;
  avatarUrl?: string | null;
  phone?: string | null;
  school?: string | null;
  grade?: string | null;
  bio?: string | null;
  xp?: number;
  level?: number;
  groupName?: string | null;
};

export type SessionQuestionOption = {
  id: string;
  label: string;
  text: string;
  imageUrl?: string | null;
  orderIndex?: number;
};

export type SessionQuestion = {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer' | string;
  questionText: string;
  imageUrl?: string | null;
  audioUrl?: string | null;
  points: number;
  difficulty?: string;
  topic?: string | null;
  options: SessionQuestionOption[];
};

export type SessionExam = {
  id: string;
  title: string;
  description?: string | null;
  durationMin: number;
  questionCount?: number;
  status?: string | null;
  scheduledAt?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
};

export type JoinSessionResponse = {
  sessionId: string;
  status?: string;
  sessionStatus?: string;
  entryStatus?: 'late' | 'on_time' | string;
  scheduledAt?: string | null;
  startedAt?: string | null;
  exam: SessionExam;
};

export type SessionDetailResponse = {
  session: {
    id: string;
    status: string;
    startedAt: string | null;
    submittedAt: string | null;
  };
  exam: SessionExam;
  questions: SessionQuestion[];
};

export type SessionSyncStatus = 'idle' | 'syncing' | 'ready' | 'error';

export type AnswerValue = {
  selectedOptionId?: string | null;
  textAnswer?: string | null;
  answeredAt?: string;
};

export type ActiveExamSession = {
  sessionId: string;
  roomCode: string;
  status: 'joined' | 'late' | 'in_progress' | 'submitting' | 'submitted';
  exam: SessionExam;
  questions: SessionQuestion[];
  answers: Record<string, AnswerValue>;
  currentQuestionIndex: number;
  timerEndsAt: number | null;
  startedAt: string | null;
  lastAnswerAt: number | null;
  syncStatus: SessionSyncStatus;
  syncMessage: string | null;
  entryStatus: 'late' | 'on_time';
};

export type SessionResultAnswer = {
  questionId: string;
  questionText: string;
  questionType: string;
  points: number;
  correctAnswerText: string | null;
  selectedOptionId: string | null;
  textAnswer: string | null;
  isCorrect: boolean | null;
  pointsEarned: number | null;
  options: SessionQuestionOption[];
};

export type SessionResultResponse = {
  sessionId: string;
  status: string;
  score: number;
  earnedPoints: number;
  totalPoints: number;
  submittedAt: string | null;
  answers: SessionResultAnswer[];
  xpEarned?: number | null;
};

export type CheatEventType =
  | 'tab_switch'
  | 'tab_hidden'
  | 'window_blur'
  | 'copy_paste'
  | 'right_click'
  | 'screen_capture'
  | 'devtools_open'
  | 'multiple_monitors'
  | 'suspicious_resize'
  | 'rapid_answers'
  | 'idle_too_long'
  | 'face_missing'
  | 'multiple_faces'
  | 'looking_away'
  | 'looking_down'
  | 'camera_blocked'
  | 'disqualification';

export type IntegrityCapability = {
  screenshotProtectionSupported: boolean;
  screenshotDetectionSupported: boolean;
  copyPasteRestricted: boolean;
  backgroundDetectionSupported: boolean;
  notes: string[];
};

export type IntegrityState = {
  lastEventType: CheatEventType | null;
  lastEventAt: string | null;
  warningMessage: string | null;
  eventCount: number;
  capabilities: IntegrityCapability;
};

export type StudentExamHistoryItem = {
  sessionId: string;
  examId: string;
  title: string;
  status: string;
  score: number | null;
  earnedPoints: number | null;
  totalPoints: number | null;
  startedAt: string | null;
  submittedAt: string | null;
};

export type StudentUpcomingExam = {
  examId: string;
  title: string;
  description?: string | null;
  status: string | null;
  className?: string | null;
  groupName?: string | null;
  scheduledAt: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  durationMin: number;
  roomCode: string | null;
};

export type StudentProgressSummary = {
  totalSessions: number;
  gradedSessions: number;
  averageScore: number | null;
  bestScore: number | null;
  latestScore: number | null;
  latestCompletedAt: string | null;
};

export type PersistedStudentAppState = {
  authMode: AuthMode;
  student: AuthUser | null;
  profile: StudentProfile | null;
  activeSession: ActiveExamSession | null;
  submittedResult: SessionResultResponse | null;
};
