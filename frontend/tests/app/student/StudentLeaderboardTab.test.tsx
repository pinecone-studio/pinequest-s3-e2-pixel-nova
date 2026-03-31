import { render, screen } from "@testing-library/react";
import StudentLeaderboardTab from "@/app/student/components/StudentLeaderboardTab";

describe("StudentLeaderboardTab", () => {
  it("shows term rank in the banner and progress leaderboard below", () => {
    render(
      <StudentLeaderboardTab
        currentUserId="student-1"
        termRankOverview={{
          rank: 4,
          totalStudents: 18,
          termExamCount: 3,
        }}
        progressLeaderboard={[
          {
            id: "student-2",
            fullName: "Anu Bold",
            level: 4,
            rank: 1,
            averageScore: 96.5,
            examCount: 5,
          },
          {
            id: "student-1",
            fullName: "Bataa Dorj",
            level: 3,
            rank: 2,
            averageScore: 91,
            examCount: 4,
          },
        ]}
      />,
    );

    expect(screen.getByText("Тэргүүлэгчид")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Цэнхэр блок нь улирлын шалгалтаар, доорх Top 10 нь явцын шалгалтын дундаж оноогоор эрэмбэлэгдэнэ.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Чиний эрэмбэ")).toBeInTheDocument();
    expect(screen.getByText("#4")).toBeInTheDocument();
    expect(screen.getByText("Чи 4-т явж байна.")).toBeInTheDocument();
    expect(screen.getByText("3 шалгалт")).toBeInTheDocument();
    expect(screen.getByText("Anu")).toBeInTheDocument();
    expect(screen.getByText("Bataa")).toBeInTheDocument();
    expect(screen.getByText("96.5%")).toBeInTheDocument();
    expect(screen.getByText("91%")).toBeInTheDocument();
    expect(screen.getByText("you")).toBeInTheDocument();
  });

  it("shows empty states when no leaderboard data is available", () => {
    render(
      <StudentLeaderboardTab
        currentUserId="student-1"
        termRankOverview={{
          rank: null,
          totalStudents: 0,
          termExamCount: 0,
        }}
        progressLeaderboard={[]}
      />,
    );

    expect(
      screen.getByText("Явцын шалгалтын Top 10 хараахан бүрдээгүй байна."),
    ).toBeInTheDocument();
    expect(screen.getByText("Эрэмбэ удахгүй харагдана.")).toBeInTheDocument();
    expect(screen.getByText("0 шалгалт")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Явцын шалгалтын дүн орж ирмэгц энэ хэсэгт топ 10 жагсаалт харагдана.",
      ),
    ).toBeInTheDocument();
  });
});
