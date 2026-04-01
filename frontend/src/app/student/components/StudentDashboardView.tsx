import { useState, type Dispatch, type SetStateAction } from "react";
import RoleNavbar from "@/components/RoleNavbar";
import type { AuthUser } from "@/lib/backend-auth";
import type { XpLeaderboardEntry } from "@/api/xp";
import type { RoleKey } from "@/lib/role-session";
import StudentHeader from "./StudentHeader";
import StudentAiInsightsTab from "./StudentAiInsightsTab";
import StudentDashboardTab from "./StudentDashboardTab";
import StudentExamsTab from "./StudentExamsTab";
import StudentHelpTab from "./StudentHelpTab";
import StudentPreferencesTab from "./StudentPreferencesTab";
import StudentProgressTab from "./StudentProgressTab";
import StudentSettingsTab from "./StudentSettingsTab";
import type { Exam, Grade, NotificationItem, StudentTab } from "../types";

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
  termLeaderboardEntries: XpLeaderboardEntry[];
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
  const activeTeacherName =
    teacherUsers.find(
      (teacher) =>
        typeof teacher.fullName === "string" &&
        teacher.fullName.trim().length > 0,
    )?.fullName ?? null;
  const [homeSelectedExam, setHomeSelectedExam] = useState<Exam | null>(null);

  const handleTabChange = (value: StudentTab) => {
    if (value !== "Home") {
      setHomeSelectedExam(null);
    }
    exam.setActiveTab(value);
  };

  return (
    <main
      key={`student-${exam.activeTab}`}
      className="page-transition px-4 pb-10 pt-6 sm:px-6 lg:px-8"
    >
      <div className="mx-auto w-full max-w-[1272px] space-y-7">
        <StudentHeader
          activeTab={exam.activeTab}
          currentUserName={currentUserName}
          currentUserInitials={getInitials(currentUserName)}
          notifications={data.notifications}
          unreadCount={data.unreadNotificationCount}
          onMarkNotificationRead={data.markNotificationRead}
          onMarkAllNotificationsRead={data.markAllNotificationsRead}
          xp={currentXp}
          onTabChange={handleTabChange}
          onOpenProfile={() => handleTabChange("Profile")}
          onOpenSettings={() => handleTabChange("Settings")}
          onOpenHelp={() => handleTabChange("Help")}
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
            currentUserId={data.currentUser?.id ?? null}
            currentUserName={currentUserName}
            exams={data.exams}
            selectedExam={homeSelectedExam}
            levelInfo={progress.levelInfo}
            studentProgress={progress.studentProgress}
            nextLevel={resolvedNextLevel}
            currentRank={currentRank}
            studentCount={totalStudents}
            studentHistory={studentHistory}
            termLeaderboardEntries={progress.termLeaderboardEntries}
            teacherName={activeTeacherName}
            onOpenExamDetail={setHomeSelectedExam}
            onCloseExamDetail={() => setHomeSelectedExam(null)}
            onOpenExams={() => {
              setHomeSelectedExam(null);
              exam.setActiveTab("Exams");
            }}
            onOpenProgress={() => {
              setHomeSelectedExam(null);
              exam.setActiveTab("Progress");
            }}
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
            teacherName={activeTeacherName}
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

        {exam.activeTab === "AIInsights" && (
          <StudentAiInsightsTab
            currentUserId={data.currentUser?.id ?? null}
            currentUserName={currentUserName}
            currentXp={currentXp}
            currentRank={currentRank}
            totalStudents={totalStudents}
            levelInfo={{
              level: progress.levelInfo.level,
              name: progress.levelInfo.name,
              minXP: progress.levelInfo.minXP,
            }}
            studentHistory={studentHistory.map((item) => ({
              examId: item.examId,
              title: item.title,
              percentage: item.percentage,
              date: item.date,
            }))}
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
