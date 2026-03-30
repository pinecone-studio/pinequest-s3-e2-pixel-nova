import { render, screen } from "@testing-library/react";
import StudentLeaderboardTab from "@/app/student/components/StudentLeaderboardTab";

describe("StudentLeaderboardTab", () => {
  it("shows only the current student's term-exam rank summary", () => {
    render(
      <StudentLeaderboardTab
        currentUserName="Anu Bold"
        currentLevel={3}
        termRankOverview={{
          rank: 4,
          totalStudents: 18,
          termExamCount: 3,
        }}
      />,
    );

    expect(screen.getByText("Тэргүүлэгчид")).toBeInTheDocument();
    expect(
      screen.getByText("Улирлын шалгалтын дүнгээр зөвхөн өөрийн байрлалаа харна."),
    ).toBeInTheDocument();
    expect(screen.getByText("Чиний эрэмбэ")).toBeInTheDocument();
    expect(screen.getByText("#4")).toBeInTheDocument();
    expect(screen.getByText("Чи 4-т явж байна.")).toBeInTheDocument();
    expect(screen.getByText("3 шалгалт")).toBeInTheDocument();
    expect(screen.getByText("Anu")).toBeInTheDocument();
    expect(screen.getByText("you")).toBeInTheDocument();
    expect(screen.getAllByText("Сурагч")).toHaveLength(9);
    expect(screen.getByText("8.4k")).toBeInTheDocument();
    expect(screen.getByText("6.5k")).toBeInTheDocument();
  });

  it("shows an empty state when no term exam rank is available", () => {
    render(
      <StudentLeaderboardTab
        currentUserName="Anu Bold"
        currentLevel={3}
        termRankOverview={{
          rank: null,
          totalStudents: 0,
          termExamCount: 0,
        }}
      />,
    );

    expect(
      screen.getByText("Улирлын шалгалтын дүн хараахан бүртгэгдээгүй байна."),
    ).toBeInTheDocument();
    expect(screen.getByText("Эрэмбэ удахгүй харагдана.")).toBeInTheDocument();
    expect(screen.getByText("0 шалгалт")).toBeInTheDocument();
    expect(screen.getAllByText("Сурагч")).toHaveLength(9);
  });
});
