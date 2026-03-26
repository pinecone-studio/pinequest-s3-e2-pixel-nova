"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import RoleNavbar from "@/components/RoleNavbar";
import {
  STORAGE_KEYS,
  ensureDemoAccounts,
  getJSON,
  setJSON,
  setSessionUser,
  type User,
} from "@/lib/examGuard";
import type { AuthUser, StudentProfile } from "@/lib/backend-auth";
import { getAuthUsers, getStudentProfileForTeacher } from "@/lib/backend-auth";
import {
  buildSessionUser,
  getStoredSelectedUserId,
  setStoredRole,
  setStoredSelectedUserId,
  type RoleKey,
} from "@/lib/role-session";
import TeacherHeader from "./components/TeacherHeader";
import ExamScheduleCard from "./components/ExamScheduleCard";
import ExamListCard from "./components/ExamListCard";
import TeacherXpOverviewCard from "./components/TeacherXpOverviewCard";
import ResultsTab from "./components/ResultsTab";
import TeacherStudentsTab from "./components/TeacherStudentsTab";
import { useTeacherData } from "./hooks/useTeacherData";
import { useExamManagement } from "./hooks/useExamManagement";
import { useExamStats } from "./hooks/useExamStats";
import { useExamAttendanceStats } from "./hooks/useExamAttendanceStats";
import { contentCanvasClass, pageShellClass } from "./styles";
const teacherTabs = ["Хуваарь", "Шалгалтын сан", "Гүйцэтгэл"] as const;

type TeacherTab = (typeof teacherTabs)[number];

const getLocalAuthUsers = (role: RoleKey): AuthUser[] => {
  ensureDemoAccounts();
  return getJSON<User[]>(STORAGE_KEYS.users, [])
    .filter((user) => user.role === role)
    .map((user) => ({
      id: user.id,
      fullName: user.username,
      role: user.role,
      email: null,
      avatarUrl: null,
    }));
};

export default function TeacherPage() {
  const router = useRouter();
  const role: RoleKey = "teacher";
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<AuthUser | null>(null);
  const [activeTab, setActiveTab] = useState<TeacherTab>("Шалгалтын сан");
  const [showScheduleForm, setShowScheduleForm] = useState(false);

  const sessionUser = useMemo(
    () => (selectedUser ? buildSessionUser(selectedUser) : null),
    [selectedUser],
  );

  const data = useTeacherData(sessionUser);

  const management = useExamManagement({
    exams: data.exams,
    setExams: data.setExams,
    showToast: data.showToast,
    currentUser: data.currentUser,
  });

  const examStatsState = useExamStats({
    exams: data.exams,
    submissions: data.submissions,
    studentProgress: data.studentProgress,
    users: data.users,
  });
  const attendance = useExamAttendanceStats(examStatsState.activeExamId);

  useEffect(() => {
    document.body.style.overflow = showScheduleForm ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [showScheduleForm]);

  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(
    null,
  );
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    setStoredRole(role);
  }, [role]);

  useEffect(() => {
    let cancelled = false;
    const loadUsers = async () => {
      setUsersLoading(true);
      try {
        const authUsers = await getAuthUsers().catch(() =>
          getLocalAuthUsers(role),
        );
        if (cancelled) return;
        const nextUsers = authUsers.filter((user) => user.role === role);
        const storedUserId = getStoredSelectedUserId(role);
        const nextUser =
          nextUsers.find((user) => user.id === storedUserId) ??
          nextUsers[0] ??
          null;
        setUsers(nextUsers);
        setSelectedUser(nextUser);
        setJSON(
          STORAGE_KEYS.users,
          nextUsers.map((user) => buildSessionUser(user)),
        );
        if (nextUser) {
          setStoredSelectedUserId(role, nextUser.id);
          setSessionUser(buildSessionUser(nextUser));
        }
      } catch {
        if (cancelled) return;
        setUsers([]);
        setSelectedUser(null);
      } finally {
        if (!cancelled) setUsersLoading(false);
      }
    };
    loadUsers();
    return () => {
      cancelled = true;
    };
  }, [role]);

  const handleRoleChange = (nextRole: RoleKey) => {
    setStoredRole(nextRole);
    router.push(`/${nextRole}`);
  };

  const handleUserChange = (userId: string) => {
    const nextUser = users.find((user) => user.id === userId) ?? null;
    if (!nextUser) return;
    setSelectedUser(nextUser);
    setStoredSelectedUserId(role, nextUser.id);
    setSessionUser(buildSessionUser(nextUser));
  };

  useEffect(() => {
    const studentId = examStatsState.selectedSubmission?.studentId;
    if (!studentId) {
      setStudentProfile(null);
      return;
    }
    setProfileLoading(true);
    let active = true;
    const loadProfile = async () => {
      try {
        const profile = await getStudentProfileForTeacher(studentId);
        if (!active) return;
        setStudentProfile(profile);
      } catch {
        if (!active) return;
        setStudentProfile(null);
      } finally {
        if (active) setProfileLoading(false);
      }
    };
    void loadProfile();
    return () => {
      active = false;
    };
  }, [examStatsState.selectedSubmission?.studentId]);

  if (!data.currentUser) return null;
  const currentUser = data.currentUser;

  const renderActiveTab = () => {
    if (activeTab === "Шалгалтын сан") {
      return (
        <ExamListCard
          exams={data.exams}
          onCopyCode={management.copyCode}
          onCreateExam={() => router.push(`/teacher/createExam`)}
        />
      );
    }

    if (activeTab === "Гүйцэтгэл") {
      return (
        <div className="space-y-6">
          <TeacherXpOverviewCard students={examStatsState.xpLeaderboard} />
          <ResultsTab
            loading={data.loading}
            examOptions={examStatsState.examOptions}
            activeExamId={examStatsState.activeExamId}
            onSelectExam={examStatsState.setSelectedExamId}
            examStats={examStatsState.examStats}
            submissions={examStatsState.activeSubmissions}
            onSelectSubmission={examStatsState.setSelectedSubmissionId}
            selectedSubmissionId={examStatsState.selectedSubmissionId}
            selectedSubmission={examStatsState.selectedSubmission}
            selectedExam={examStatsState.selectedExam}
            attendanceStats={attendance.stats}
            attendanceLoading={attendance.loading}
            studentProfile={studentProfile}
            profileLoading={profileLoading}
          />
        </div>
      );
    }

    if (activeTab === "Хуваарь") {
      return (
        <div className="space-y-6">
          <TeacherStudentsTab
            exams={data.exams}
            onAddSchedule={() => setShowScheduleForm((prev) => !prev)}
          />
          {showScheduleForm && (
            <div
              className="fixed inset-0 z-50 flex justify-center bg-black/10"
              onClick={() => setShowScheduleForm(false)}
            >
              <div
                className="mt-10 h-[820px] w-full max-w-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <ExamScheduleCard
                  exams={data.exams}
                  selectedScheduleExamId={management.selectedScheduleExamId}
                  setSelectedScheduleExamId={
                    management.setSelectedScheduleExamId
                  }
                  scheduleDate={management.scheduleDate}
                  setScheduleDate={management.setScheduleDate}
                  scheduleExamType={management.scheduleExamType}
                  setScheduleExamType={management.setScheduleExamType}
                  scheduleClassName={management.scheduleClassName}
                  setScheduleClassName={management.setScheduleClassName}
                  scheduleGroupName={management.scheduleGroupName}
                  setScheduleGroupName={management.setScheduleGroupName}
                  scheduleSubjectName={management.scheduleSubjectName}
                  setScheduleSubjectName={management.setScheduleSubjectName}
                  scheduleDescription={management.scheduleDescription}
                  setScheduleDescription={management.setScheduleDescription}
                  durationMinutes={management.durationMinutes}
                  setDurationMinutes={management.setDurationMinutes}
                  onSchedule={management.handleSchedule}
                  onClose={() => setShowScheduleForm(false)}
                />
              </div>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className={pageShellClass}>
      {data.toast && (
        <div className="fixed right-6 top-6 z-50 rounded-2xl border border-[#d5dfeb] bg-white px-4 py-3 text-sm shadow-[0_20px_45px_-32px_rgba(15,23,42,0.28)]">
          {data.toast}
        </div>
      )}
      <TeacherHeader
        notifications={data.notifications}
        onMarkRead={data.markNotificationRead}
        activeTab={activeTab}
        setActiveTab={(tab) => setActiveTab(tab as TeacherTab)}
        tabs={teacherTabs}
        roleControl={
          <RoleNavbar
            activeRole={role}
            activeUserId={selectedUser?.id ?? null}
            users={users}
            loading={usersLoading}
            onChangeRole={handleRoleChange}
            onChangeUser={handleUserChange}
          />
        }
      />
      <main className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-[1480px] space-y-6">
          {activeTab === "Шалгалтын сан" || activeTab === "Хуваарь" ? (
            <div>{renderActiveTab()}</div>
          ) : (
            <section className={contentCanvasClass}>
              {renderActiveTab()}
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
