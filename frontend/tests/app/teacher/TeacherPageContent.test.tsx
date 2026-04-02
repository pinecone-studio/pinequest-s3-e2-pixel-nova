jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
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

import { fireEvent, render, screen } from "@testing-library/react";
import TeacherPageContent from "@/app/teacher/components/TeacherPageContent";

describe("TeacherPageContent", () => {
  it("shows the custom page skeleton while non-results tabs are loading", () => {
    render(
      <TeacherPageContent
        activeTab="Хуваарь"
        onOpenScheduleForm={() => {}}
        data={{ loading: true } as never}
        management={{} as never}
        examStatsState={{} as never}
        attendance={{} as never}
        studentProfile={null}
        profileLoading={false}
      />,
    );

    expect(screen.getByLabelText("Teacher page loading")).toBeInTheDocument();
  });

  it("opens the create exam modal from the exam library tab", () => {
    render(
      <TeacherPageContent
        activeTab="Шалгалтын сан"
        onOpenScheduleForm={() => {}}
        data={{
          loading: false,
          exams: [
            {
              id: "exam-1",
              title: "Математик",
              description: "10 асуулт",
              className: "9-р анги",
              roomCode: "ROOM1",
              createdAt: "2026-03-30T10:00:00.000Z",
              scheduledAt: null,
              questions: [],
            },
          ],
          showToast: jest.fn(),
          currentUser: {
            id: "teacher-1",
            username: "Teacher",
            role: "teacher",
          },
        } as never}
        management={{
          copyCode: jest.fn(),
          setQuestions: jest.fn(),
          examTitle: "",
          setExamTitle: jest.fn(),
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
          addQuestion: jest.fn(),
          removeQuestion: jest.fn(),
          updateQuestion: jest.fn(),
          updateQuestionOption: jest.fn(),
          addQuestionOption: jest.fn(),
          removeQuestionOption: jest.fn(),
          saveExam: jest.fn().mockResolvedValue(false),
          saving: false,
          hasCurrentUser: true,
        } as never}
        examStatsState={{ setSelectedExamId: jest.fn() } as never}
        attendance={{} as never}
        studentProfile={null}
        profileLoading={false}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Шалгалт үүсгэх" }));

    expect(
      screen.getByRole("heading", { name: "Шалгалт үүсгэх" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Close create exam modal" }),
    ).toBeInTheDocument();
  });

  it("opens an exam preview from the exam library instead of switching to results", () => {
    render(
      <TeacherPageContent
        activeTab="Шалгалтын сан"
        onOpenScheduleForm={() => {}}
        data={{
          loading: false,
          exams: [
            {
              id: "exam-1",
              title: "Математик",
              description: "10 асуулт",
              className: "9-р анги",
              roomCode: "ROOM1",
              createdAt: "2026-03-30T10:00:00.000Z",
              scheduledAt: null,
              questions: [
                {
                  id: "q-1",
                  text: "2 + 2 хэд вэ?",
                  type: "mcq",
                  options: ["3", "4", "5", "6"],
                  correctAnswer: "4",
                  points: 1,
                },
              ],
            },
          ],
          showToast: jest.fn(),
          currentUser: {
            id: "teacher-1",
            username: "Teacher",
            role: "teacher",
          },
        } as never}
        management={{
          copyCode: jest.fn(),
          setQuestions: jest.fn(),
          examTitle: "",
          setExamTitle: jest.fn(),
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
          addQuestion: jest.fn(),
          removeQuestion: jest.fn(),
          updateQuestion: jest.fn(),
          updateQuestionOption: jest.fn(),
          addQuestionOption: jest.fn(),
          removeQuestionOption: jest.fn(),
          saveExam: jest.fn().mockResolvedValue(false),
          saving: false,
          hasCurrentUser: true,
        } as never}
        examStatsState={{ setSelectedExamId: jest.fn() } as never}
        attendance={{} as never}
        studentProfile={null}
        profileLoading={false}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Математик харах" }));

    expect(screen.getByText("2 + 2 хэд вэ?")).toBeInTheDocument();
  });
});
