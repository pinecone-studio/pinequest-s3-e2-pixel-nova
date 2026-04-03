import { act, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import StudentDashboardView from "@/app/student/components/StudentDashboardView";
import type { StudentTab } from "@/app/student/types";

jest.mock(
  "@/components/RoleNavbar",
  () =>
    function RoleNavbarMock() {
      return <div data-testid="role-navbar" />;
    },
);

jest.mock(
  "@/app/student/components/StudentHeader",
  () =>
    function StudentHeaderMock(props: {
      onTabChange: (value: StudentTab) => void;
    }) {
      return (
        <div data-testid="student-header">
          <button type="button" onClick={() => props.onTabChange("Home")}>
            Home
          </button>
          <button type="button" onClick={() => props.onTabChange("Exams")}>
            Exams
          </button>
          <button type="button" onClick={() => props.onTabChange("Progress")}>
            Progress
          </button>
          <button type="button" onClick={() => props.onTabChange("AIInsights")}>
            AI
          </button>
        </div>
      );
    },
);

jest.mock(
  "@/app/student/components/StudentDashboardTab",
  () =>
    function StudentDashboardTabMock(props: { loading: boolean }) {
      return (
        <div data-testid="dashboard-tab">
          {props.loading ? "home-loading" : "home-ready"}
        </div>
      );
    },
);

jest.mock(
  "@/app/student/components/StudentExamsTab",
  () =>
    function StudentExamsTabMock(props: { loading: boolean }) {
      return (
        <div data-testid="exams-tab">
          {props.loading ? "exams-loading" : "exams-ready"}
        </div>
      );
    },
);

jest.mock(
  "@/app/student/components/StudentProgressTab",
  () =>
    function StudentProgressTabMock(props: {
      loading?: boolean;
      currentRank?: number | null;
      currentXp?: number;
      currentLevel?: number;
    }) {
      return (
        <div data-testid="progress-tab">
          {props.loading ? "progress-loading" : "progress-ready"}|rank:
          {props.currentRank ?? "-"}|xp:{props.currentXp ?? "-"}|lvl:
          {props.currentLevel ?? "-"}
        </div>
      );
    },
);
jest.mock(
  "@/app/student/components/StudentAiInsightsTab",
  () =>
    function StudentAiInsightsTabMock(props: { loading?: boolean }) {
      return (
        <div data-testid="ai-insights-tab">
          {props.loading ? "ai-loading" : "ai-ready"}
        </div>
      );
    },
);
jest.mock(
  "@/app/student/components/StudentSettingsTab",
  () =>
    function StudentSettingsTabMock() {
      return null;
    },
);
jest.mock(
  "@/app/student/components/StudentHelpTab",
  () =>
    function StudentHelpTabMock() {
      return null;
    },
);

const createProps = () => ({
  role: "student" as const,
  users: [],
  usersLoading: false,
  selectedUser: {
    id: "student-1",
    fullName: "Золбоо Бат",
    role: "student" as const,
  },
  teacherUsers: [],
  currentUserName: "Золбоо Бат",
  currentRank: 4,
  totalStudents: 20,
  studentHistory: [],
  currentXp: 45,
  data: {
    loading: false,
    notifications: [],
    unreadNotificationCount: 0,
    markNotificationRead: jest.fn(),
    markAllNotificationsRead: jest.fn(),
    currentUser: {
      id: "student-1",
      username: "zolboo",
    },
    exams: [],
  },
  progress: {
    levelInfo: {
      level: 12,
      name: "Silver",
      minXP: 1200,
      icon: "star",
    },
    studentProgress: {
      xp: 45,
      level: 12,
      history: [],
    },
    subjectInsights: {},
    nextLevel: {
      level: 13,
      name: "Gold",
      minXP: 100,
    },
    progressSegments: 3,
    xpNeighborEntries: [],
    termLeaderboardEntries: [],
    rankOverview: {
      rank: 4,
      totalStudents: 20,
    },
    termRankOverview: {
      rank: 4,
      totalStudents: 20,
      xp: 45,
      level: 12,
    },
  },
  onRoleChange: jest.fn(),
  onUserChange: jest.fn(),
  getInitials: jest.fn(() => "ЗБ"),
});

function StudentDashboardViewHarness() {
  const [activeTab, setActiveTab] = useState<StudentTab>("Home");
  const props = createProps();

  return (
    <StudentDashboardView
      {...props}
      exam={{
        activeTab,
        setActiveTab: setActiveTab,
        roomCodeInput: "",
        setRoomCodeInput: jest.fn(),
        joinLoading: false,
        joinError: null,
        handleLookup: jest.fn(),
        selectedExam: null,
        startExam: jest.fn(),
        setSelectedExam: jest.fn(),
        setJoinError: jest.fn(),
      }}
    />
  );
}

describe("StudentDashboardView", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it("shows home immediately on first render", () => {
    render(<StudentDashboardViewHarness />);

    expect(screen.getByTestId("dashboard-tab")).toHaveTextContent("home-ready");
  });

  it("shows exams loading for one second after the tab button is clicked", () => {
    render(<StudentDashboardViewHarness />);

    fireEvent.click(screen.getByRole("button", { name: "Exams" }));

    expect(screen.getByTestId("exams-tab")).toHaveTextContent("exams-loading");

    act(() => {
      jest.advanceTimersByTime(999);
    });

    expect(screen.getByTestId("exams-tab")).toHaveTextContent("exams-loading");

    act(() => {
      jest.advanceTimersByTime(1);
    });

    expect(screen.getByTestId("exams-tab")).toHaveTextContent("exams-ready");
  });

  it("shows home loading for one second after returning to the home tab", () => {
    render(<StudentDashboardViewHarness />);

    fireEvent.click(screen.getByRole("button", { name: "Exams" }));
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    fireEvent.click(screen.getByRole("button", { name: "Home" }));

    expect(screen.getByTestId("dashboard-tab")).toHaveTextContent("home-loading");

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(screen.getByTestId("dashboard-tab")).toHaveTextContent("home-ready");
  });

  it("shows progress loading for one second after the progress tab is clicked", () => {
    render(<StudentDashboardViewHarness />);

    fireEvent.click(screen.getByRole("button", { name: "Progress" }));

    expect(screen.getByTestId("progress-tab")).toHaveTextContent(
      "progress-loading",
    );

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(screen.getByTestId("progress-tab")).toHaveTextContent(
      "progress-ready",
    );
    expect(screen.getByTestId("progress-tab")).toHaveTextContent("rank:4");
    expect(screen.getByTestId("progress-tab")).toHaveTextContent("xp:45");
  });

  it("falls back to overall rank data when the term rank is unavailable", () => {
    const props = createProps();
    props.progress.termRankOverview = {
      rank: null,
      totalStudents: 0,
      xp: 0,
      level: 1,
    };

    function FallbackHarness() {
      const [activeTab, setActiveTab] = useState<StudentTab>("Progress");

      return (
        <StudentDashboardView
          {...props}
          exam={{
            activeTab,
            setActiveTab,
            roomCodeInput: "",
            setRoomCodeInput: jest.fn(),
            joinLoading: false,
            joinError: null,
            handleLookup: jest.fn(),
            selectedExam: null,
            startExam: jest.fn(),
            setSelectedExam: jest.fn(),
            setJoinError: jest.fn(),
          }}
        />
      );
    }

    render(<FallbackHarness />);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(screen.getByTestId("progress-tab")).toHaveTextContent("rank:4");
    expect(screen.getByTestId("progress-tab")).toHaveTextContent("xp:45");
    expect(screen.getByTestId("progress-tab")).toHaveTextContent("lvl:12");
  });

  it("shows ai insights loading for one second after the ai tab is clicked", () => {
    render(<StudentDashboardViewHarness />);

    fireEvent.click(screen.getByRole("button", { name: "AI" }));

    expect(screen.getByTestId("ai-insights-tab")).toHaveTextContent(
      "ai-loading",
    );

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(screen.getByTestId("ai-insights-tab")).toHaveTextContent(
      "ai-ready",
    );
  });
});
