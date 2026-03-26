export type AuthRole = 'teacher' | 'student';

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
};

export type JoinSessionResponse = {
  sessionId: string;
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

export type AnswerValue = {
  selectedOptionId?: string | null;
  textAnswer?: string | null;
  answeredAt?: string;
};

export type ActiveExamSession = {
  sessionId: string;
  roomCode: string;
  status: 'joined' | 'in_progress' | 'submitting' | 'submitted';
  exam: SessionExam;
  questions: SessionQuestion[];
  answers: Record<string, AnswerValue>;
  currentQuestionIndex: number;
  timerEndsAt: number | null;
  startedAt: string | null;
  lastAnswerAt: number | null;
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
  | 'disqualification';

export type PersistedStudentAppState = {
  student: AuthUser | null;
  profile: StudentProfile | null;
  activeSession: ActiveExamSession | null;
  submittedResult: SessionResultResponse | null;
};
