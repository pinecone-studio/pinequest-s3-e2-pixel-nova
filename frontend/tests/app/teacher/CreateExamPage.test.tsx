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
const consumePendingCreateExamFile = jest.fn();
const setExamTitle = jest.fn();
const setQuestions = jest.fn();
const handlePdfUpload = jest.fn();
const handleImageUpload = jest.fn();
const handleDocxUpload = jest.fn();
const setImportTextCount = jest.fn();
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
  consumePendingCreateExamFile: (...args: unknown[]) =>
    consumePendingCreateExamFile(...args),
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
    setImportTextCount,
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
    handlePdfUpload,
    handleImageUpload,
    handleDocxUpload,
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
    consumePendingCreateExamFile.mockReset();
    consumePendingCreateExamDraft.mockReturnValue(null);
    setExamTitle.mockReset();
    setQuestions.mockReset();
    handlePdfUpload.mockReset();
    handleImageUpload.mockReset();
    handleDocxUpload.mockReset();
    setImportTextCount.mockReset();
    acceptDraft.mockClear();
    generateDraft.mockClear();
  });

  it("renders the current create exam shell without inline AI draft actions", async () => {
    render(<CreateExamPage />);

    expect(
      screen.getByRole("heading", { name: "Шалгалт үүсгэх" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Үргэлжлүүлэх" }),
    ).toBeInTheDocument();
    expect(acceptDraft).not.toHaveBeenCalled();
    expect(setExamTitle).not.toHaveBeenCalled();
    expect(setQuestions).not.toHaveBeenCalled();
  });

  it("prefills the manual exam title from a pending dialog payload", async () => {
    consumePendingCreateExamDraft.mockReturnValue({
      mode: "manual",
      examTitle: "Dialog exam title",
      questions: [
        {
          text: "What is 2 + 2?",
          type: "open",
          correctAnswer: "4",
          points: 1,
        },
      ],
    });

    render(<CreateExamPage />);

    await waitFor(() => {
      expect(setExamTitle).toHaveBeenCalledWith("Dialog exam title");
      expect(setQuestions).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            text: "What is 2 + 2?",
            correctAnswer: "4",
            points: 1,
          }),
        ]),
      );
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

  it("rehydrates a pending pdf file and passes it to the import flow", async () => {
    const pendingFile = new File(["fake pdf content"], "chapter-1.pdf", {
      type: "application/pdf",
    });
    consumePendingCreateExamFile.mockResolvedValue(pendingFile);
    consumePendingCreateExamDraft.mockReturnValue({
      mode: "pdf",
      examTitle: "",
      importMcqCount: 2,
      importTextCount: 3,
      importOpenCount: 1,
      fileId: "pending-file-1",
    });

    render(<CreateExamPage />);

    await waitFor(() => {
      expect(consumePendingCreateExamFile).toHaveBeenCalledWith("pending-file-1");
      expect(handlePdfUpload).toHaveBeenCalledWith(
        expect.objectContaining({ name: "chapter-1.pdf" }),
        { preserveTitle: true },
      );
      expect(setImportTextCount).toHaveBeenCalledWith(3);
    });
  });
});
