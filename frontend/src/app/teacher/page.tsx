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
import TeacherPageContent, {
  type TeacherTab,
} from "./components/TeacherPageContent";
import { useTeacherData } from "./hooks/useTeacherData";
import { useExamManagement } from "./hooks/useExamManagement";
import { useExamStats } from "./hooks/useExamStats";
import { useExamAttendanceStats } from "./hooks/useExamAttendanceStats";
import { pageShellClass } from "./styles";

const teacherTabs = ["Хуваарь", "Шалгалтын сан", "Гүйцэтгэл"] as const;

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
  const [contentVisible, setContentVisible] = useState(false);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(
    null,
  );
  const [profileLoading, setProfileLoading] = useState(false);

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
    teacherId: sessionUser?.id ?? null,
  });
  const attendance = useExamAttendanceStats(examStatsState.activeExamId);

  useEffect(() => {
    document.body.style.overflow = showScheduleForm ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [showScheduleForm]);

  useEffect(() => {
    setContentVisible(false);
    const timer = window.setTimeout(() => setContentVisible(true), 24);
    return () => window.clearTimeout(timer);
  }, [activeTab]);

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
        if (!cancelled) {
          setUsers([]);
          setSelectedUser(null);
        }
      } finally {
        if (!cancelled) setUsersLoading(false);
      }
    };
    void loadUsers();
    return () => {
      cancelled = true;
    };
  }, [role]);

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
        if (active) setStudentProfile(profile);
      } catch {
        if (active) setStudentProfile(null);
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

  return (
    <div className={pageShellClass}>
      {data.toast && (
        <div className="fixed right-6 top-6 z-50 rounded-2xl border border-[#d5dfeb] bg-white px-4 py-3 text-sm shadow-[0_20px_45px_-32px_rgba(15,23,42,0.28)]">
          {data.toast}  
        </div>
      )}
      <TeacherHeader
        notifications={data.notifications}
        unreadCount={data.unreadNotificationCount}
        onMarkRead={data.markNotificationRead}
        onMarkAllRead={data.markAllNotificationsRead}
        activeTab={activeTab}
        setActiveTab={(tab) => setActiveTab(tab as TeacherTab)}
        tabs={teacherTabs}
        roleControl={
          <RoleNavbar
            activeRole={role}
            activeUserId={selectedUser?.id ?? null}
            users={users}
            loading={usersLoading}
            onChangeRole={(nextRole) => {
              setStoredRole(nextRole);
              router.push(`/${nextRole}`);
            }}
            onChangeUser={(userId) => {
              const nextUser = users.find((user) => user.id === userId) ?? null;
              if (!nextUser) return;
              setSelectedUser(nextUser);
              setStoredSelectedUserId(role, nextUser.id);
              setSessionUser(buildSessionUser(nextUser));
            }}
          />
        }
      />
      <main className="mx-auto w-full max-w-[1380px] space-y-5 px-4 py-4 sm:px-6 lg:px-8">
        <div
          className={`${showScheduleForm ? "" : "transform-gpu"} transition-all duration-500 ease-out ${contentVisible ? "translate-y-0 scale-100 opacity-100" : "translate-y-2 scale-[0.992] opacity-0"}`}>
          <TeacherPageContent
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            showScheduleForm={showScheduleForm}
            setShowScheduleForm={setShowScheduleForm}
            data={data}
            management={management}
            examStatsState={examStatsState}
            attendance={attendance}
            studentProfile={studentProfile}
            profileLoading={profileLoading}
          />
        </div>
      </main>
    </div>
  );
}
