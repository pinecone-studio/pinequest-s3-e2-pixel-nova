import type { Dispatch, SetStateAction } from "react";
import RoleNavbar from "@/components/RoleNavbar";
import type { AuthUser } from "@/lib/backend-auth";
import type { RoleKey } from "@/lib/role-session";
import StudentHeader from "./StudentHeader";
import StudentDashboardTab from "./StudentDashboardTab";
import StudentExamsTab from "./StudentExamsTab";
import StudentHelpTab from "./StudentHelpTab";
import StudentLeaderboardTab from "./StudentLeaderboardTab";
import StudentPreferencesTab from "./StudentPreferencesTab";
import StudentProgressTab from "./StudentProgressTab";
import StudentSettingsTab from "./StudentSettingsTab";
import type { Exam, Grade, StudentTab } from "../types";

type StudentHistoryItem = {
  examId: string;
  title: string;
  percentage: number;
  score?: number;
  totalPoints?: number;
  grade?: Grade;
  date: string;
};

type LeaderboardEntry = {
  id: string;
  fullName: string;
  xp: number;
  level: number;
  rank: number;
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
  notifications: { examId: string; message: string; createdAt: string; read?: boolean }[];
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
};

type StudentDashboardViewProps = {
  role: RoleKey;
  users: AuthUser[];
  usersLoading: boolean;
  selectedUser: AuthUser | null;
  teacherUsers: AuthUser[];
  currentUserName: string;
  currentUserId: string;
  currentRank: number | null;
  leaderboardEntries: LeaderboardEntry[];
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
  currentUserId,
  currentRank,
  leaderboardEntries,
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
          notifications={data.notifications.map((item) => ({
            ...item,
            read: item.read ?? false,
          }))}
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
              studentCount={leaderboardEntries.length}
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
            currentUserId={currentUserId}
            entries={leaderboardEntries}
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
