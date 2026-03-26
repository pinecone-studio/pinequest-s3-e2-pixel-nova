import React from "react";
import { render } from "@testing-library/react-native";

import ExamScreen from "@/app/(tabs)/exam";
import { useStudentApp } from "@/lib/student-app/context";

jest.mock("@react-navigation/native", () => ({
  useFocusEffect: jest.fn(),
}));

jest.mock("expo-router", () => ({
  Redirect: ({ href }: { href: string }) =>
    require("react").createElement("Text", null, `redirect:${href}`),
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

jest.mock("@/lib/student-app/context", () => ({
  useStudentApp: jest.fn(),
}));

const mockUseStudentApp = useStudentApp as jest.MockedFunction<
  typeof useStudentApp
>;

describe("ExamScreen", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("keeps the tab mounted while session state hydrates", () => {
    mockUseStudentApp.mockReturnValue({
      activeSession: null,
      answerQuestion: jest.fn(),
      availableUsers: [],
      clearResult: jest.fn(),
      hydrated: false,
      joinExam: jest.fn(),
      logIntegrityEvent: jest.fn(),
      logout: jest.fn(),
      profile: null,
      refreshProfile: jest.fn(),
      saveProfile: jest.fn(),
      setCurrentQuestionIndex: jest.fn(),
      signingIn: false,
      startExam: jest.fn(),
      student: { id: "s1", fullName: "Student", role: "student" },
      submittedResult: null,
      submitCurrentExam: jest.fn(),
      switchUser: jest.fn(),
    });

    const screen = render(<ExamScreen />);

    expect(screen.getByText("Шалгалтыг ачаалж байна")).toBeTruthy();
  });

  it("shows an empty state when there is no active exam", () => {
    mockUseStudentApp.mockReturnValue({
      activeSession: null,
      answerQuestion: jest.fn(),
      availableUsers: [],
      clearResult: jest.fn(),
      hydrated: true,
      joinExam: jest.fn(),
      logIntegrityEvent: jest.fn(),
      logout: jest.fn(),
      profile: null,
      refreshProfile: jest.fn(),
      saveProfile: jest.fn(),
      setCurrentQuestionIndex: jest.fn(),
      signingIn: false,
      startExam: jest.fn(),
      student: { id: "s1", fullName: "Student", role: "student" },
      submittedResult: null,
      submitCurrentExam: jest.fn(),
      switchUser: jest.fn(),
    });

    const screen = render(<ExamScreen />);

    expect(screen.getByText("Идэвхтэй шалгалт алга")).toBeTruthy();
    expect(screen.getByText("Шалгалтад нэгдэх")).toBeTruthy();
  });
});
