import { render, screen } from "@testing-library/react";
import StudentLeaderboardTab from "@/app/student/components/StudentLeaderboardTab";

const entries = [
  { id: "student-1", fullName: "Anu Bold", xp: 8400, level: 12, rank: 1 },
  { id: "student-2", fullName: "Bat Erdene", xp: 7900, level: 12, rank: 2 },
  { id: "student-3", fullName: "Sara Ochir", xp: 7200, level: 11, rank: 3 },
  { id: "student-4", fullName: "Zoloo Enkh", xp: 2300, level: 12, rank: 4 },
  { id: "student-5", fullName: "Namuun Bat", xp: 2100, level: 11, rank: 5 },
];

describe("StudentLeaderboardTab", () => {
  it("renders the redesigned leaderboard banner, podium, and ranked list", () => {
    render(<StudentLeaderboardTab currentUserId="student-4" entries={entries} />);

    expect(screen.getByText("Тэргүүлэгчид")).toBeInTheDocument();
    expect(screen.getByText("Чиний эрэмбэ")).toBeInTheDocument();
    expect(screen.getByText("#4")).toBeInTheDocument();
    expect(screen.getByText("Anu")).toBeInTheDocument();
    expect(screen.getByText("Bat")).toBeInTheDocument();
    expect(screen.getByText("Sara")).toBeInTheDocument();
    expect(screen.getByText("Zoloo")).toBeInTheDocument();
    expect(screen.getByText("YOU")).toBeInTheDocument();
  });
});
