import { render, screen } from "@testing-library/react";
import StudentLeaderboardTab from "@/app/student/components/StudentLeaderboardTab";

describe("StudentLeaderboardTab", () => {
  it("shows term rank in the banner and XP leaderboard below", () => {
    render(
      <StudentLeaderboardTab
        currentUserId="current-student"
        currentUserName="Anu Bold"
        currentLevel={3}
        termRankOverview={{
          rank: 4,
          totalStudents: 18,
          termExamCount: 3,
        }}
        leaderboardEntries={[
          { rank: 1, id: "s1", fullName: "Bataa B.", xp: 8400, level: 5 },
          { rank: 2, id: "s2", fullName: "Saraa T.", xp: 7750, level: 5 },
          { rank: 3, id: "s3", fullName: "Temuulen", xp: 7100, level: 4 },
          {
            rank: 4,
            id: "current-student",
            fullName: "Anu Bold",
            xp: 6450,
            level: 3,
          },
        ]}
      />,
    );

    expect(screen.getByText("Тэргүүлэгчид")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Цэнхэр блок нь улирлын шалгалтаар, доорх Top 10 нь жинхэнэ XP leaderboard-оор эрэмбэлэгдэнэ.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Чиний эрэмбэ")).toBeInTheDocument();
    expect(screen.getByText("#4")).toBeInTheDocument();
    expect(screen.getByText("Чи 4-т явж байна.")).toBeInTheDocument();
    expect(screen.getByText("3 шалгалт")).toBeInTheDocument();
    expect(screen.getByText("Anu")).toBeInTheDocument();
    expect(screen.getByText("Bataa")).toBeInTheDocument();
    expect(screen.getByText("6,450 XP")).toBeInTheDocument();
    expect(screen.getByText("8,400 XP")).toBeInTheDocument();
    expect(screen.getByText("you")).toBeInTheDocument();
  });

  it("shows empty states when no leaderboard data is available", () => {
    render(
      <StudentLeaderboardTab
        currentUserId="current-student"
        currentUserName="Anu Bold"
        currentLevel={3}
        termRankOverview={{
          rank: null,
          totalStudents: 0,
          termExamCount: 0,
        }}
        leaderboardEntries={[]}
      />,
    );

    expect(
      screen.getByText("XP leaderboard хараахан бүрдээгүй байна."),
    ).toBeInTheDocument();
    expect(screen.getByText("Эрэмбэ удахгүй харагдана.")).toBeInTheDocument();
    expect(screen.getByText("0 шалгалт")).toBeInTheDocument();
    expect(
      screen.getByText("Одоогоор XP leaderboard хоосон байна."),
    ).toBeInTheDocument();
  });
});
