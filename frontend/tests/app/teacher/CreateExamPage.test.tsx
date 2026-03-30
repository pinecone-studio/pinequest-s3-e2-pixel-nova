import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import CreateExamPage from "@/app/teacher/createExam/page";

type MockAuthUser = {
  id: string;
  fullName: string;
  role: string;
};

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
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

const setExamTitle = jest.fn();
const setQuestions = jest.fn();
const acceptDraft = jest
  .fn()
  .mockResolvedValue({ id: "run-1", status: "accepted" });

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
    generateDraft: jest.fn(),
    acceptDraft,
  }),
}));

describe("CreateExamPage", () => {
  beforeEach(() => {
    setExamTitle.mockReset();
    setQuestions.mockReset();
    acceptDraft.mockClear();
  });

  it("hydrates the existing exam editor from an accepted AI draft", async () => {
    render(<CreateExamPage />);

    fireEvent.click(await screen.findByRole("button", { name: "Use Draft" }));

    await waitFor(() => {
      expect(acceptDraft).toHaveBeenCalled();
      expect(setExamTitle).toHaveBeenCalledWith("Generated Biology Test");
      expect(setQuestions).toHaveBeenCalledWith([
        {
          id: "q1",
          text: "What is a cell?",
          type: "text",
          correctAnswer: "Basic unit of life",
          points: 1,
        },
      ]);
    });
  });
});
