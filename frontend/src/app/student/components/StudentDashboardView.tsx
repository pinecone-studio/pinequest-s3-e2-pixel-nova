import type { Dispatch, SetStateAction } from "react";
import RoleNavbar from "@/components/RoleNavbar";
import type { AuthUser } from "@/lib/backend-auth";
import type { XpLeaderboardEntry } from "@/api/xp";
import type { RoleKey } from "@/lib/role-session";
import StudentHeader from "./StudentHeader";
import StudentDashboardTab from "./StudentDashboardTab";
import StudentExamsTab from "./StudentExamsTab";
import StudentHelpTab from "./StudentHelpTab";
import StudentLeaderboardTab from "./StudentLeaderboardTab";
import StudentPreferencesTab from "./StudentPreferencesTab";
import StudentProgressTab from "./StudentProgressTab";
import StudentSettingsTab from "./StudentSettingsTab";
import type { Exam, Grade, NotificationItem, StudentTab } from "../types";
import type { StudentTermRankOverview } from "@/lib/backend-auth";

type StudentHistoryItem = {
  examId: string;
  title: string;
  percentage: number;
  score?: number;
  totalPoints?: number;
  grade?: Grade;
  date: string;
};

type StudentExamState = {
  activeTab: StudentTab;
  setActiveTab: (value: StudentTab) => void;
  roomCodeInput: string;
  setRoomCodeInput: (value: string) => void;
  joinLoading: boolean;
  joinError: string | null;
  handleLookup: () => void;
  selectedExam: Exam | null;
  startExam: () => void;
  setSelectedExam: (value: Exam | null) => void;
  setJoinError: Dispatch<SetStateAction<string | null>>;
};

type StudentDataState = {
  loading: boolean;
  notifications: NotificationItem[];
  unreadNotificationCount: number;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  setTheme: Dispatch<SetStateAction<"light" | "dark">>;
  currentUser: { id: string; username: string } | null;
  exams: Exam[];
};

type StudentProgressState = {
  levelInfo: {
    level: number;
    name: string;
    minXP: number;
    icon: string;
  };
  studentProgress: {
    xp: number;
    level: number;
    history: StudentHistoryItem[];
  };
  nextLevel: { level: number; name: string; minXP: number } | null;
  progressSegments: number;
  termRankOverview: StudentTermRankOverview;
  leaderboardEntries: XpLeaderboardEntry[];
};

type StudentDashboardViewProps = {
  role: RoleKey;
  users: AuthUser[];
  usersLoading: boolean;
  selectedUser: AuthUser | null;
  teacherUsers: AuthUser[];
  currentUserName: string;
  currentRank: number | null;
  totalStudents: number;
  studentHistory: StudentHistoryItem[];
  currentXp: number;
  data: StudentDataState;
  exam: StudentExamState;
  progress: StudentProgressState;
  onRoleChange: (role: RoleKey) => void;
  onUserChange: (userId: string) => void;
  getInitials: (value: string) => string;
};

export default function StudentDashboardView({
  role,
  users,
  usersLoading,
  selectedUser,
  teacherUsers,
  currentUserName,
  currentRank,
  totalStudents,
  studentHistory,
  currentXp,
  data,
  exam,
  progress,
  onRoleChange,
  onUserChange,
  getInitials,
}: StudentDashboardViewProps) {
  const resolvedNextLevel = progress.nextLevel ?? progress.levelInfo;
  const currentUser = data.currentUser;
  return (
    <main
      key={`student-${exam.activeTab}`}
      className="px-4 py-6 sm:px-6 lg:px-8 page-transition"
    >
      <div className="mx-auto w-full max-w-[1280px] space-y-5">
        <StudentHeader
          activeTab={exam.activeTab}
          currentUserName={currentUserName}
          currentUserInitials={getInitials(currentUserName)}
          notifications={data.notifications}
          unreadCount={data.unreadNotificationCount}
          onMarkNotificationRead={data.markNotificationRead}
          onMarkAllNotificationsRead={data.markAllNotificationsRead}
          xp={currentXp}
          onTabChange={exam.setActiveTab}
          onOpenProfile={() => exam.setActiveTab("Profile")}
          onOpenSettings={() => exam.setActiveTab("Settings")}
          onOpenHelp={() => exam.setActiveTab("Help")}
          onToggleTheme={() =>
            data.setTheme((prev) => (prev === "dark" ? "light" : "dark"))
          }
          roleControl={
            <RoleNavbar
              activeRole={role}
              activeUserId={selectedUser?.id ?? null}
              users={users}
              loading={usersLoading}
              onChangeRole={onRoleChange}
              onChangeUser={onUserChange}
            />
          }
        />

        {exam.activeTab === "Home" && (
            <StudentDashboardTab
              loading={data.loading}
              currentUserName={currentUserName}
              selectedExam={exam.selectedExam}
              levelInfo={progress.levelInfo}
              studentProgress={progress.studentProgress}
              nextLevel={resolvedNextLevel}
              currentRank={currentRank}
              studentCount={totalStudents}
              studentHistory={studentHistory}
              onOpenExams={() => exam.setActiveTab("Exams")}
              onOpenProgress={() => exam.setActiveTab("Progress")}
            />
        )}

        {exam.activeTab === "Exams" && (
          <StudentExamsTab
            loading={data.loading}
            roomCodeInput={exam.roomCodeInput}
            setRoomCodeInput={exam.setRoomCodeInput}
            joinLoading={exam.joinLoading}
            joinError={exam.joinError}
            onLookup={exam.handleLookup}
            selectedExam={exam.selectedExam}
            onStartExam={exam.startExam}
            onClearSelection={() => {
              exam.setSelectedExam(null);
              exam.setJoinError(null);
            }}
            teacherName={
              typeof teacherUsers[0]?.fullName === "string"
                ? (teacherUsers[0]?.fullName ?? null)
                : null
            }
            studentHistory={studentHistory}
          />
        )}

        {exam.activeTab === "Progress" && (
            <StudentProgressTab
              levelInfo={progress.levelInfo}
              studentProgress={progress.studentProgress}
              nextLevel={resolvedNextLevel}
              progressSegments={progress.progressSegments}
              studentHistory={studentHistory}
            />
        )}

        {exam.activeTab === "Leaderboard" && (
          <StudentLeaderboardTab
            currentUserId={data.currentUser?.id ?? null}
            currentUserName={currentUserName}
            currentLevel={progress.levelInfo.level}
            termRankOverview={progress.termRankOverview}
            leaderboardEntries={progress.leaderboardEntries}
          />
        )}

        {exam.activeTab === "Profile" && currentUser && (
          <StudentSettingsTab
            userId={currentUser.id}
            username={currentUser.username}
          />
        )}

        {exam.activeTab === "Settings" && <StudentPreferencesTab />}

        {exam.activeTab === "Help" && <StudentHelpTab />}
      </div>
    </main>
  );
}
