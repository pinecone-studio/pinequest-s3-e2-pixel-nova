import { render, screen, waitFor } from "@testing-library/react";
import CreateExamPage from "@/app/teacher/createExam/page";
import type { PendingCreateExamDraft } from "@/app/teacher/create-exam-dialog-state";

type MockAuthUser = {
  id: string;
  fullName: string;
  role: string;
};

const push = jest.fn();
const consumePendingCreateExamDraft = jest.fn<
  PendingCreateExamDraft | null,
  []
>(() => null);
const setExamTitle = jest.fn();
const setQuestions = jest.fn();
const acceptDraft = jest
  .fn()
  .mockResolvedValue({ id: "run-1", status: "accepted" });
const generateDraft = jest.fn().mockResolvedValue({
  title: "Generated Biology Test",
  description: null,
  questions: [
    {
      id: "q1",
      text: "What is a cell?",
      type: "text",
      correctAnswer: "Basic unit of life",
      points: 1,
    },
  ],
});

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

jest.mock("@/lib/backend-auth", () => ({
  getAuthUsers: jest.fn().mockResolvedValue([
    {
      id: "teacher-1",
      fullName: "Ada Teacher",
      role: "teacher",
      email: null,
      avatarUrl: null,
    },
  ]),
}));

jest.mock("@/lib/role-session", () => ({
  buildSessionUser: (user: MockAuthUser) => ({
    id: user.id,
    username: user.fullName,
    password: "",
    role: user.role,
    createdAt: "",
  }),
  getStoredSelectedUserId: () => "teacher-1",
}));

jest.mock("@/lib/examGuard", () => ({
  STORAGE_KEYS: { users: "users" },
  ensureDemoAccounts: jest.fn(),
  getJSON: jest.fn(() => []),
  setJSON: jest.fn(),
  setSessionUser: jest.fn(),
  type: {},
}));

jest.mock("@/app/teacher/create-exam-dialog-state", () => ({
  consumePendingCreateExamDraft: () => consumePendingCreateExamDraft(),
}));

jest.mock("@/app/teacher/hooks/useTeacherData", () => ({
  useTeacherData: () => ({
    exams: [],
    setExams: jest.fn(),
    showToast: jest.fn(),
    currentUser: { id: "teacher-1", username: "Ada Teacher", role: "teacher" },
    toast: null,
  }),
}));

jest.mock("@/app/teacher/hooks/useExamManagement", () => ({
  useExamManagement: () => ({
    examTitle: "",
    setExamTitle,
    questionText: "",
    setQuestionText: jest.fn(),
    questionType: "mcq",
    setQuestionType: jest.fn(),
    mcqOptions: ["", "", "", ""],
    setMcqOptions: jest.fn(),
    questionAnswer: "",
    setQuestionAnswer: jest.fn(),
    questionImageUrl: undefined,
    setQuestionImageUrl: jest.fn(),
    questionPoints: 1,
    setQuestionPoints: jest.fn(),
    questionCorrectIndex: 0,
    setQuestionCorrectIndex: jest.fn(),
    questions: [],
    setQuestions,
    addQuestion: jest.fn(),
    removeQuestion: jest.fn(),
    updateQuestion: jest.fn(),
    updateQuestionOption: jest.fn(),
    addQuestionOption: jest.fn(),
    removeQuestionOption: jest.fn(),
    saveExam: jest.fn().mockResolvedValue(false),
    saving: false,
    hasCurrentUser: true,
  }),
}));

jest.mock("@/app/teacher/hooks/useExamImport", () => ({
  useExamImport: () => ({
    pdfUseOcr: false,
    setPdfUseOcr: jest.fn(),
    answerKeyPage: "last",
    setAnswerKeyPage: jest.fn(),
    importMcqCount: 0,
    setImportMcqCount: jest.fn(),
    importTextCount: 5,
    setImportTextCount: jest.fn(),
    importOpenCount: 0,
    setImportOpenCount: jest.fn(),
    shuffleImportedQuestions: false,
    setShuffleImportedQuestions: jest.fn(),
    plannedQuestionCount: 5,
    pdfLoading: false,
    pdfError: null,
    importError: null,
    importLoading: false,
    importLoadingLabel: null,
    handlePdfUpload: jest.fn(),
    handleImageUpload: jest.fn(),
    handleDocxUpload: jest.fn(),
  }),
}));

jest.mock("@/app/teacher/hooks/useAiExamGenerator", () => ({
  useAiExamGenerator: () => ({
    input: {
      topic: "Biology",
      subject: "Science",
      gradeOrClass: "10A",
      difficulty: "medium",
      questionCount: 10,
      instructions: "",
    },
    setInput: jest.fn(),
    updateInput: jest.fn(),
    draft: {
      title: "Generated Biology Test",
      description: null,
      questions: [
        {
          id: "q1",
          text: "What is a cell?",
          type: "text",
          correctAnswer: "Basic unit of life",
          points: 1,
        },
      ],
    },
    setDraft: jest.fn(),
    generating: false,
    savingAccepted: false,
    error: null,
    generateDraft,
    acceptDraft,
  }),
}));

describe("CreateExamPage", () => {
  beforeEach(() => {
    push.mockReset();
    consumePendingCreateExamDraft.mockReset();
    consumePendingCreateExamDraft.mockReturnValue(null);
    setExamTitle.mockReset();
    setQuestions.mockReset();
    acceptDraft.mockClear();
    generateDraft.mockClear();
  });

  it("renders the current create exam shell without inline AI draft actions", async () => {
    render(<CreateExamPage />);

    expect(
      screen.getByRole("button", { name: "AI ашиглан үүсгэх" }),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: "Use Draft" }),
      ).not.toBeInTheDocument();
    });
    expect(acceptDraft).not.toHaveBeenCalled();
    expect(setExamTitle).not.toHaveBeenCalled();
    expect(setQuestions).not.toHaveBeenCalled();
  });

  it("prefills the manual exam title from a pending dialog payload", async () => {
    consumePendingCreateExamDraft.mockReturnValue({
      mode: "manual",
      examTitle: "Dialog exam title",
    });

    render(<CreateExamPage />);

    await waitFor(() => {
      expect(setExamTitle).toHaveBeenCalledWith("Dialog exam title");
    });
  });

  it("generates and loads AI draft content from a pending dialog payload", async () => {
    consumePendingCreateExamDraft.mockReturnValue({
      mode: "ai",
      input: {
        topic: "Present simple tense",
        subject: "English",
        gradeOrClass: "9-р анги",
        difficulty: "medium",
        questionCount: 8,
        instructions: "Mix short and open questions",
      },
    });

    render(<CreateExamPage />);

    await waitFor(() => {
      expect(generateDraft).toHaveBeenCalledWith({
        topic: "Present simple tense",
        subject: "English",
        gradeOrClass: "9-р анги",
        difficulty: "medium",
        questionCount: 8,
        instructions: "Mix short and open questions",
      });
    });

    await waitFor(() => {
      expect(setExamTitle).toHaveBeenCalledWith("Generated Biology Test");
      expect(setQuestions).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: "q1", text: "What is a cell?" }),
        ]),
      );
    });
  });
});
