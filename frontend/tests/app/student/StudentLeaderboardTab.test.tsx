import { fireEvent, render, screen, within } from "@testing-library/react";
import StudentLeaderboardTab from "@/app/student/components/StudentLeaderboardTab";

describe("StudentLeaderboardTab", () => {
  it("shows the total XP leaderboard first and switches to the improvement leaderboard", () => {
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
        improvementLeaderboard={[
          {
            rank: 1,
            id: "current-student",
            fullName: "Anu Bold",
            xp: 25,
            level: 1,
            examCount: 3,
            improvementCount: 2,
            missedCount: 0,
          },
          {
            rank: 2,
            id: "s2",
            fullName: "Saraa T.",
            xp: 10,
            level: 1,
            examCount: 2,
            improvementCount: 1,
            missedCount: 0,
          },
        ]}
      />,
    );

    expect(screen.getByText("Тэргүүлэгчид")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Цэнхэр блок нь улирлын шалгалтаар, доорх самбар нь сонгосон XP төрлөөр эрэмбэлэгдэнэ.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Чиний эрэмбэ")).toBeInTheDocument();
    expect(screen.getByText("#4")).toBeInTheDocument();
    expect(screen.getByText("Чи 4-т явж байна.")).toBeInTheDocument();
    expect(screen.getByText("3 шалгалт")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Нийт XP/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText("Нийт XP Leaderboard")).toBeInTheDocument();
    expect(
      screen.getByText("Энэ самбар нь сурагчдыг нийт XP болон level-ээр нь эрэмбэлж харуулна."),
    ).toBeInTheDocument();
    const xpLeaderboard = screen.getByTestId("xp-leaderboard");
    expect(within(xpLeaderboard).getByText("Anu")).toBeInTheDocument();
    expect(screen.getByText("Bataa")).toBeInTheDocument();
    expect(screen.getByText("6,450 XP")).toBeInTheDocument();
    expect(screen.getByText("8,400 XP")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: /Ахицын XP/i }));

    expect(screen.getByText("Ахиц дэвшлийн тэргүүлэгчид")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Ахицын XP/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.queryByTestId("xp-leaderboard")).not.toBeInTheDocument();
    expect(
      screen.getByText(
        "Өмнөх явцын шалгалтаасаа ахисан хувьтай тэнцэх growth XP авна. 100 → 100 бол +10 XP, тасалбал -10 XP хасагдана.",
      ),
    ).toBeInTheDocument();
    const improvementLeaderboard = screen.getByTestId("improvement-leaderboard");
    expect(within(improvementLeaderboard).getByText("25 XP")).toBeInTheDocument();
    expect(within(improvementLeaderboard).getAllByText("2 ахиц").length).toBeGreaterThan(0);
    expect(within(improvementLeaderboard).getByText("Тэмүүлэн")).toBeInTheDocument();
    expect(screen.getAllByText("you")).toHaveLength(1);
    expect(
      within(improvementLeaderboard).getAllByText(/^Lvl \d+$/),
    ).toHaveLength(10);
  });

  it("shows the XP empty state and still lets users switch to the mock improvement leaderboard", () => {
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
        improvementLeaderboard={[]}
      />,
    );

    expect(
      screen.getByText("XP leaderboard хараахан бүрдээгүй байна."),
    ).toBeInTheDocument();
    expect(screen.getByText("Эрэмбэ удахгүй харагдана.")).toBeInTheDocument();
    expect(screen.getByText("0 шалгалт")).toBeInTheDocument();
    expect(screen.getByText("Нийт XP Leaderboard")).toBeInTheDocument();
    expect(
      screen.getByText("Одоогоор XP leaderboard хоосон байна."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: /Ахицын XP/i }));

    expect(screen.queryByText("Одоогоор XP leaderboard хоосон байна.")).not.toBeInTheDocument();
    const improvementLeaderboard = screen.getByTestId("improvement-leaderboard");
    expect(within(improvementLeaderboard).getByText("Anu")).toBeInTheDocument();
    expect(within(improvementLeaderboard).getAllByText("34 XP").length).toBeGreaterThan(0);
    expect(
      within(improvementLeaderboard).getAllByText(/^Lvl \d+$/),
    ).toHaveLength(10);
  });
});
