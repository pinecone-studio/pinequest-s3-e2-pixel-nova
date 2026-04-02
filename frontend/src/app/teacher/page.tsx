"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { updateExam } from "@/api/exams";
import { DEFAULT_ENABLED_CHEAT_DETECTIONS } from "@/lib/exam-cheat-detections";
import TeacherHeader from "./components/TeacherHeader";
import TeacherPageContent, {
  type TeacherTab,
} from "./components/TeacherPageContent";
import ExamScheduleCard from "./components/ExamScheduleCard";
import TeacherCheatDetectionDialog from "./components/TeacherCheatDetectionDialog";
import { useTeacherData } from "./hooks/useTeacherData";
import { useExamManagement } from "./hooks/useExamManagement";
import { useExamStats } from "./hooks/useExamStats";
import { useExamAttendanceStats } from "./hooks/useExamAttendanceStats";
import { pageShellClass } from "./styles";
import type { Exam } from "./types";

const teacherTabs = ["Хуваарь", "Шалгалтын сан", "Шалгалтын аналитик"] as const;
const TAB_LOADING_MIN_MS = 4000;
const TEACHER_ACTIVE_TAB_STORAGE_KEY = "teacher:active-tab";

function TeacherScheduleModal({
  show,
  onClose,
  onSchedule,
  data,
  management,
}: {
  show: boolean;
  onClose: () => void;
  onSchedule: () => Promise<void>;
  data: ReturnType<typeof useTeacherData>;
  management: ReturnType<typeof useExamManagement>;
}) {
  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-120 overflow-y-auto bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.16),transparent_32%),rgba(8,15,32,0.46)] px-4 py-6 backdrop-blur-[10px] sm:px-6 sm:py-10"
      onClick={() => {
        if (!management.scheduling) onClose();
      }}
    >
      <div className="mx-auto flex min-h-screen w-full max-w-[820px] items-center justify-center py-4 sm:py-8">
        <div
          className="flex w-full justify-center transition-all duration-300 ease-out animate-[pageFadeSlide_220ms_ease_both]"
          onClick={(event) => event.stopPropagation()}
        >
          <ExamScheduleCard
            exams={data.exams}
            selectedScheduleExamId={management.selectedScheduleExamId}
            setSelectedScheduleExamId={management.setSelectedScheduleExamId}
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
            scheduleExpectedStudentsCount={
              management.scheduleExpectedStudentsCount
            }
            setScheduleExpectedStudentsCount={
              management.setScheduleExpectedStudentsCount
            }
            durationMinutes={management.durationMinutes}
            setDurationMinutes={management.setDurationMinutes}
            scheduling={management.scheduling}
            onSchedule={onSchedule}
            onClose={onClose}
          />
        </div>
      </div>
    </div>
  );
}

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
  const [activeTab, setActiveTab] = useState<TeacherTab>("Шалгалтын аналитик");
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [showCheatDetectionDialog, setShowCheatDetectionDialog] =
    useState(false);
  const [cheatDetectionExam, setCheatDetectionExam] = useState<Exam | null>(
    null,
  );
  const [selectedCheatDetections, setSelectedCheatDetections] = useState<
    string[]
  >([]);
  const [selectedRequiresAudioRecording, setSelectedRequiresAudioRecording] =
    useState(false);
  const [savingCheatDetections, setSavingCheatDetections] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);
  const [pendingTabLoading, setPendingTabLoading] = useState<TeacherTab | null>(
    null,
  );
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(
    null,
  );
  const [profileLoading, setProfileLoading] = useState(false);
  const tabLoadingTimerRef = useRef<number | null>(null);

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
  const isExamLibraryTab = activeTab === "Шалгалтын сан";
  const isAnalyticsTab = activeTab === "Шалгалтын аналитик";
  const mainClassName = isExamLibraryTab
    ? "w-full"
    : isAnalyticsTab
      ? "mx-auto w-full max-w-[1380px] px-4 pt-[42.5px] pb-8 sm:px-6 lg:px-8"
      : "mx-auto w-full max-w-[1380px] space-y-5 px-4 py-4 sm:px-6 lg:px-8";

  useEffect(() => {
    document.body.style.overflow =
      showScheduleForm || showCheatDetectionDialog ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [showCheatDetectionDialog, showScheduleForm]);

  useEffect(() => {
    setContentVisible(false);
    const timer = window.setTimeout(() => setContentVisible(true), 24);
    return () => window.clearTimeout(timer);
  }, [activeTab]);

  useEffect(() => {
    return () => {
      if (tabLoadingTimerRef.current !== null) {
        window.clearTimeout(tabLoadingTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setStoredRole(role);
  }, [role]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedTab = window.sessionStorage.getItem(
      TEACHER_ACTIVE_TAB_STORAGE_KEY,
    );
    if (storedTab && teacherTabs.includes(storedTab as TeacherTab)) {
      setActiveTab((current) =>
        current === storedTab ? current : (storedTab as TeacherTab),
      );
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.sessionStorage.setItem(TEACHER_ACTIVE_TAB_STORAGE_KEY, activeTab);
  }, [activeTab]);

  const handleNotificationAction = (notification: {
    type: string;
  }) => {
    const nextTab =
      notification.type === "exam_finished" ||
      notification.type === "result_published"
        ? "Шалгалтын аналитик"
        : "Хуваарь";
    setActiveTab(nextTab);
  };

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

  const closeCheatDetectionDialog = () => {
    setShowCheatDetectionDialog(false);
    setCheatDetectionExam(null);
    setSelectedCheatDetections([]);
    setSelectedRequiresAudioRecording(false);
    setSavingCheatDetections(false);
  };

  const handleTabChange = (nextTab: TeacherTab) => {
    if (nextTab === activeTab) {
      return;
    }

    if (tabLoadingTimerRef.current !== null) {
      window.clearTimeout(tabLoadingTimerRef.current);
      tabLoadingTimerRef.current = null;
    }

    setPendingTabLoading(nextTab);
    tabLoadingTimerRef.current = window.setTimeout(() => {
      setPendingTabLoading((current) => (current === nextTab ? null : current));
      tabLoadingTimerRef.current = null;
    }, TAB_LOADING_MIN_MS);

    setActiveTab(nextTab);
  };

  const handleScheduleAndConfigure = async () => {
    const scheduledExam = await management.handleSchedule();
    if (!scheduledExam) {
      return;
    }

    setShowScheduleForm(false);
  };

  const saveCheatDetectionSettings = async () => {
    if (!data.currentUser || !cheatDetectionExam) {
      return;
    }

    const selectedConfig = DEFAULT_ENABLED_CHEAT_DETECTIONS.filter((value) =>
      selectedCheatDetections.includes(value),
    );
    if (selectedConfig.length === 0) {
      data.showToast("Дор хаяж нэг илрүүлэлт идэвхтэй байх ёстой.");
      return;
    }

    setSavingCheatDetections(true);
    try {
      const updated = await updateExam(
        cheatDetectionExam.id,
        {
          requiresAudioRecording: selectedRequiresAudioRecording,
          enabledCheatDetections: selectedConfig,
        },
        data.currentUser,
      );

      data.setExams(
        data.exams.map((exam) =>
          exam.id === cheatDetectionExam.id
            ? {
                ...exam,
                requiresAudioRecording:
                  updated.requiresAudioRecording ??
                  selectedRequiresAudioRecording,
                enabledCheatDetections:
                  updated.enabledCheatDetections ?? selectedConfig,
              }
            : exam,
        ),
      );
      data.showToast("Луйврын илрүүлэлтийн тохиргоо хадгалагдлаа.");
      closeCheatDetectionDialog();
    } catch (error) {
      data.showToast(
        error instanceof Error && error.message
          ? error.message
          : "Луйврын илрүүлэлтийн тохиргоог хадгалж чадсангүй.",
      );
    } finally {
      setSavingCheatDetections(false);
    }
  };

  if (!data.currentUser) return null;

  return (
    <div
      className={
        isExamLibraryTab
          ? "min-h-screen bg-white text-foreground"
          : pageShellClass
      }
    >
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
        onNotificationAction={handleNotificationAction}
        activeTab={activeTab}
        setActiveTab={(tab) => handleTabChange(tab as TeacherTab)}
        loadingTab={pendingTabLoading}
        tabs={teacherTabs}
        contentWidthClass="max-w-[1260px]"
        outerPaddingClass="px-4 py-2 sm:px-6 lg:px-8"
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
      <main className={mainClassName}>
        <div
          className={`${showScheduleForm ? "" : "transform-gpu"} transition-all duration-500 ease-out ${contentVisible ? "translate-y-0 scale-100 opacity-100" : "translate-y-2 scale-[0.992] opacity-0"}`}
        >
          <TeacherPageContent
            activeTab={activeTab}
            onOpenScheduleForm={() => setShowScheduleForm(true)}
            data={data}
            management={management}
            examStatsState={examStatsState}
            attendance={attendance}
            studentProfile={studentProfile}
            profileLoading={profileLoading}
          />
        </div>
      </main>
      <TeacherScheduleModal
        show={showScheduleForm}
        onClose={() => setShowScheduleForm(false)}
        onSchedule={handleScheduleAndConfigure}
        data={data}
        management={management}
      />
      <TeacherCheatDetectionDialog
        exam={cheatDetectionExam}
        open={showCheatDetectionDialog}
        saving={savingCheatDetections}
        requiresAudioRecording={selectedRequiresAudioRecording}
        selectedDetections={selectedCheatDetections}
        onAudioRequirementChange={setSelectedRequiresAudioRecording}
        onChange={setSelectedCheatDetections}
        onClose={closeCheatDetectionDialog}
        onSave={saveCheatDetectionSettings}
      />
    </div>
  );
}
