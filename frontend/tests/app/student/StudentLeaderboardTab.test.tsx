import { fireEvent, render, screen, within } from "@testing-library/react";
import StudentLeaderboardTab from "@/app/student/components/StudentLeaderboardTab";

describe("StudentLeaderboardTab", () => {
  it("shows the progress rank card while keeping the term leaderboard first", () => {
    render(
      <StudentLeaderboardTab
        currentUserId="current-student"
        currentUserName="Anu Bold"
        termRankOverview={{
          rank: 4,
          totalStudents: 18,
          termExamCount: 3,
          xp: 140,
          level: 2,
        }}
        progressRankOverview={{
          rank: 2,
          totalStudents: 12,
          progressExamCount: 4,
          xp: 90,
          level: 3,
          isPrivate: true,
        }}
        termLeaderboardEntries={[
          { rank: 1, id: "s1", fullName: "Bataa B.", xp: 260, level: 3 },
          { rank: 2, id: "s2", fullName: "Saraa T.", xp: 220, level: 3 },
          { rank: 3, id: "s3", fullName: "Temuulen", xp: 180, level: 2 },
          {
            rank: 4,
            id: "current-student",
            fullName: "Anu Bold",
            xp: 140,
            level: 2,
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
        "Цэнхэр блок дээр зөвхөн явцын нууц rank харагдана. Доорх хэсэг нь XP жагсаалтыг тусдаа сольж харуулна.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Нууц явцын эрэмбэ")).toBeInTheDocument();
    expect(screen.getByText("Чи 2-т явж байна.")).toBeInTheDocument();
    expect(screen.queryByText("Улирлын rank")).not.toBeInTheDocument();
    expect(screen.queryByText("Явцын rank")).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Улирлын XP/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText("Улирлын XP жагсаалт")).toBeInTheDocument();

    const termLeaderboard = screen.getByTestId("term-leaderboard");
    expect(within(termLeaderboard).getByText("Anu")).toBeInTheDocument();
    expect(within(termLeaderboard).getByText("Bataa")).toBeInTheDocument();
    expect(within(termLeaderboard).getByText("260 XP")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: /Ахицын XP/i }));

    expect(screen.getByText("Нууц явцын эрэмбэ")).toBeInTheDocument();
    expect(screen.getByText("Чи 2-т явж байна.")).toBeInTheDocument();
    expect(screen.queryByTestId("term-leaderboard")).not.toBeInTheDocument();
    expect(screen.getByText("Ахицын XP жагсаалт")).toBeInTheDocument();

    const improvementLeaderboard = screen.getByTestId("improvement-leaderboard");
    expect(within(improvementLeaderboard).getByText("25 XP")).toBeInTheDocument();
    expect(within(improvementLeaderboard).getAllByText("2 ахиц").length).toBeGreaterThan(0);
    expect(within(improvementLeaderboard).getByText("Тэмүүлэн")).toBeInTheDocument();
    expect(within(improvementLeaderboard).getAllByText("би")).toHaveLength(1);
    expect(within(improvementLeaderboard).getAllByText((_, element) => {
      return (element?.textContent ?? "").startsWith("Түв. ");
    }).length).toBeGreaterThan(0);
  });

  it("shows empty term state and still fills the improvement leaderboard with mock data", () => {
    render(
      <StudentLeaderboardTab
        currentUserId="current-student"
        currentUserName="Anu Bold"
        termRankOverview={{
          rank: null,
          totalStudents: 0,
          termExamCount: 0,
          xp: 0,
          level: 1,
        }}
        progressRankOverview={{
          rank: null,
          totalStudents: 0,
          progressExamCount: 0,
          xp: 0,
          level: 1,
          isPrivate: true,
        }}
        termLeaderboardEntries={[]}
        improvementLeaderboard={[]}
      />,
    );

    expect(screen.getByText("Явцын XP хараахан бүрдээгүй байна.")).toBeInTheDocument();
    expect(
      screen.getByText("Одоогоор улирлын XP жагсаалт хоосон байна."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: /Ахицын XP/i }));

    expect(screen.getByText("Явцын XP хараахан бүрдээгүй байна.")).toBeInTheDocument();
    const improvementLeaderboard = screen.getByTestId("improvement-leaderboard");
    expect(within(improvementLeaderboard).getByText("Anu")).toBeInTheDocument();
    expect(within(improvementLeaderboard).getAllByText("34 XP").length).toBeGreaterThan(0);
    expect(within(improvementLeaderboard).getAllByText((_, element) => {
      return (element?.textContent ?? "").startsWith("Түв. ");
    }).length).toBeGreaterThan(0);
  });
});
