import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCameraPermissions } from "expo-camera";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import {
  Alert,
  AppState,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import MathText from "@/components/MathText";
import MongolianText from "@/components/MongolianText";
import MobileProctorCamera from "@/components/student-app/MobileProctorCamera";
import { hasTraditionalMongolian } from "@/lib/mongolian-script";
import { useStudentApp } from "@/lib/student-app/context";
import { useExamAudioRecorder } from "@/lib/student-app/hooks/use-exam-audio-recorder";
import {
  computeRemainingSeconds,
  formatCountdown,
  normalizeApiError,
} from "@/lib/student-app/utils";
import { examStyles } from "@/styles/screens/exam";

const styles = examStyles as typeof examStyles & Record<string, any>;

// Types

type TabKey = "active" | "history";

type ActiveListItem = {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: number;
  status: "active" | "waiting" | "late";
  badgeText: string;
  roomCode?: string | null;
  canJoin: boolean;
  className?: string | null;
  groupName?: string | null;
  teacherName?: string | null;
  sortTime: number;
};

type HistoryListItem = {
  id: string;
  examId: string;
  title: string;
  date: string;
  time: string;
  duration: number;
  score: number | null;
  status: "graded" | "missed" | "late";
  statusText: string;
  sortTime: number;
};

function getRequestedTab(tab?: string | string[]): TabKey {
  const resolved = Array.isArray(tab) ? tab[0] : tab;
  return resolved === "history" ? "history" : "active";
}

function formatListDate(value?: string | null) {
  if (!value) return "----/--/--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "----/--/--";
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}/${month}/${day}`;
}

function formatListTime(value?: string | null) {
  if (!value) return "--:--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--";
  const hour = `${date.getHours()}`.padStart(2, "0");
  const minute = `${date.getMinutes()}`.padStart(2, "0");
  return `${hour}:${minute}`;
}

function parseListDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isSameCalendarDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function getExamStartDate(value?: string | null) {
  return parseListDate(value);
}

function getExamEndDate(value: string | null | undefined, durationMin: number) {
  const start = getExamStartDate(value);
  if (!start) return null;
  return new Date(start.getTime() + durationMin * 60 * 1000);
}

function getDaysUntilExam(value: string | null | undefined, now: Date) {
  const start = getExamStartDate(value);
  if (!start) return null;
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const startOfTarget = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate(),
  );

  return Math.round(
    (startOfTarget.getTime() - startOfToday.getTime()) / (24 * 60 * 60 * 1000),
  );
}

function getActiveExamStatus(
  scheduledAt: string | null | undefined,
  rawStatus: string | null | undefined,
  now: Date,
): ActiveListItem["status"] | null {
  const start = getExamStartDate(scheduledAt);

  if (!start) {
    return rawStatus === "active" ? "active" : "waiting";
  }

  const lateThreshold = start.getTime() + 5 * 60 * 1000;
  const nowTime = now.getTime();

  if (nowTime >= lateThreshold) {
    return "late";
  }

  if (nowTime >= start.getTime()) {
    return "active";
  }

  return "waiting";
}

function canJoinExam(
  scheduledAt: string | null | undefined,
  rawStatus: string | null | undefined,
  now: Date,
) {
  const start = getExamStartDate(scheduledAt);

  if (!start) {
    return rawStatus === "active";
  }

  const nowTime = now.getTime();
  const startTime = start.getTime();

  return (
    nowTime >= startTime - 5 * 60 * 1000 &&
    nowTime <= startTime + 10 * 60 * 1000
  );
}

function getActiveBadgeText(
  status: ActiveListItem["status"],
  daysUntilExam: number | null,
) {
  if (status === "active") return "Эхэлсэн";
  if (status === "late") return "Хоцорсон";
  if (daysUntilExam === null) return "Товлогдсон";
  if (daysUntilExam <= 0) return "Өнөөдөр";
  return `${daysUntilExam} хоног`;
}

function getHistoryDurationMinutes(
  startedAt?: string | null,
  submittedAt?: string | null,
) {
  if (!startedAt || !submittedAt) return 0;

  const start = new Date(startedAt).getTime();
  const end = new Date(submittedAt).getTime();

  if (Number.isNaN(start) || Number.isNaN(end) || end < start) {
    return 0;
  }

  return Math.max(1, Math.round((end - start) / (60 * 1000)));
}

function wasLateSubmission(
  scheduledAt?: string | null,
  startedAt?: string | null,
) {
  const scheduled = parseListDate(scheduledAt);
  const started = parseListDate(startedAt);

  if (!scheduled || !started) return false;

  return started.getTime() >= scheduled.getTime() + 5 * 60 * 1000;
}

function getMockTeacherName(title: string) {
  if (title.toLowerCase().includes("english")) return "Г. Сарантуяа";
  if (title.toLowerCase().includes("мат")) return "Б. Нарантуяа";
  if (title.toLowerCase().includes("монгол")) return "Д. Оюун";
  return "Г. Сарантуяа";
}

function ExamDetailModal({
  exam,
  visible,
  onClose,
}: {
  exam: ActiveListItem | null;
  visible: boolean;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  if (!exam) return null;

  const classLabel = [exam.className, exam.groupName]
    .filter(Boolean)
    .join(" · ");

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.detailOverlay}>
        <View
          style={[styles.detailSheet, { paddingTop: Math.max(insets.top, 12) }]}
        >
          <View style={styles.detailTopBar}>
            <Pressable
              style={styles.detailBackButton}
              onPress={onClose}
              hitSlop={12}
            >
              <Ionicons name="chevron-back" size={22} color="#111827" />
            </Pressable>
            <Text style={styles.detailHeaderTitle}>Дэлгэрэнгүй</Text>
            <View style={styles.detailHeaderSpacer} />
          </View>

          <ScrollView
            contentContainerStyle={styles.detailContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.detailHeroCard}>
              <View style={styles.listCardRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.detailExamTitle}>{exam.title}</Text>
                  <Text style={styles.detailExamSub}>Шалгалтын мэдээлэл</Text>
                </View>
                <View style={styles.statusPill}>
                  <Text style={styles.statusPillText}>{exam.badgeText}</Text>
                </View>
              </View>

              <View style={styles.detailInfoRow}>
                <View style={styles.detailInfoChip}>
                  <View style={styles.detailInfoIcon}>
                    <Ionicons name="person-outline" size={18} color="#7C8798" />
                  </View>
                  <View>
                    <Text style={styles.detailInfoLabel}>Багш</Text>
                    <Text style={styles.detailInfoValue}>
                      {exam.teacherName ?? getMockTeacherName(exam.title)}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailInfoChip}>
                  <View style={styles.detailInfoIcon}>
                    <Ionicons name="school-outline" size={18} color="#7C8798" />
                  </View>
                  <View>
                    <Text style={styles.detailInfoLabel}>Анги</Text>
                    <Text style={styles.detailInfoValue}>
                      {classLabel || "10а анги"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.detailSectionCard}>
              <View style={styles.detailSectionHeader}>
                <Ionicons name="time-outline" size={20} color="#111827" />
                <Text style={styles.detailSectionTitle}>Хугацаа</Text>
              </View>

              <View style={styles.durationHighlight}>
                <Ionicons name="timer-outline" size={18} color="#3568F5" />
                <Text style={styles.durationLabel}>Үргэлжлэх хугацаа</Text>
                <Text style={styles.durationValue}>{exam.duration} минут</Text>
              </View>

              <View style={styles.scheduleRow}>
                <View style={[styles.scheduleCard, styles.scheduleCardGreen]}>
                  <Ionicons name="play-outline" size={18} color="#22C55E" />
                  <Text style={styles.scheduleLabel}>Эхлэх цаг</Text>
                  <Text style={styles.scheduleValue}>{exam.time}</Text>
                </View>

                <View style={styles.scheduleCard}>
                  <Ionicons name="calendar-outline" size={18} color="#111827" />
                  <Text style={styles.scheduleLabel}>Огноо</Text>
                  <Text style={styles.scheduleValue}>{exam.date}</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// Exam list screen (tab = "active" | "history")

function ExamListScreen() {
  const { tab } = useLocalSearchParams<{ tab?: string | string[] }>();
  const { dashboardLoading, history, upcomingExams, refreshDashboard } =
    useStudentApp();
  const [activeTab, setActiveTab] = useState<TabKey>(getRequestedTab(tab));
  const [search, setSearch] = useState("");
  const [now, setNow] = useState(() => new Date());
  const attemptedExamIds = new Set(history.map((item) => item.examId));
  const completedExamIds = new Set(
    history
      .filter((item) => item.status === "graded" || item.status === "submitted")
      .map((item) => item.examId),
  );

  useEffect(() => {
    setActiveTab(getRequestedTab(tab));
  }, [tab]);

  useFocusEffect(
    useCallback(() => {
      void refreshDashboard();
    }, [refreshDashboard]),
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 30000);

    return () => clearInterval(timer);
  }, []);

  const activeItems: ActiveListItem[] = upcomingExams
    .flatMap((exam) => {
      const scheduledAt = exam.scheduledAt ?? exam.startedAt;
      const scheduledDate = parseListDate(scheduledAt);
      const end = getExamEndDate(scheduledAt, exam.durationMin);
      const status =
        getActiveExamStatus(scheduledAt, exam.status, now) ?? "waiting";
      const daysUntilExam = getDaysUntilExam(scheduledAt, now);

      if (!scheduledDate || completedExamIds.has(exam.examId)) {
        return [];
      }

      if (end && now.getTime() >= end.getTime()) {
        return [];
      }

      return [
        {
          id: exam.examId,
          title: exam.title,
          date: formatListDate(scheduledAt),
          time: formatListTime(scheduledAt),
          duration: exam.durationMin,
          status,
          badgeText: getActiveBadgeText(status, daysUntilExam),
          roomCode: exam.roomCode,
          canJoin:
            Boolean(exam.roomCode) &&
            canJoinExam(scheduledAt, exam.status, now),
          className: exam.className ?? null,
          groupName: exam.groupName ?? null,
          teacherName: getMockTeacherName(exam.title),
          sortTime: scheduledDate.getTime(),
        },
      ];
    })
    .sort((left, right) => left.sortTime - right.sortTime);

  const realHistoryItems: HistoryListItem[] = history.flatMap((item) => {
    const scheduledDate = parseListDate(item.scheduledAt ?? item.startedAt);
    const completedAt = item.submittedAt ?? item.startedAt ?? item.scheduledAt;
    const completedDate = parseListDate(completedAt);
    const isPastDay =
      scheduledDate !== null &&
      scheduledDate.getTime() < now.getTime() &&
      !isSameCalendarDay(scheduledDate, now);

    if (item.status !== "graded" && item.status !== "submitted" && !isPastDay) {
      return [];
    }

    const derivedStatus: HistoryListItem["status"] = wasLateSubmission(
      item.scheduledAt,
      item.startedAt,
    )
      ? "late"
      : item.status === "graded" || item.status === "submitted"
        ? "graded"
        : item.status === "late"
          ? "late"
          : "missed";

    return [
      {
        id: item.sessionId,
        examId: item.examId,
        title: item.title,
        date: formatListDate(completedAt),
        time: formatListTime(completedAt),
        duration: getHistoryDurationMinutes(item.startedAt, item.submittedAt),
        score: item.score,
        status: derivedStatus,
        statusText:
          derivedStatus === "missed"
            ? "Өгөөгүй"
            : derivedStatus === "late"
              ? "Хоцорсон"
              : "Өгсөн",
        sortTime: completedDate?.getTime() ?? 0,
      },
    ];
  });

  const lateHistoryItems: HistoryListItem[] = upcomingExams.flatMap((exam) => {
    if (attemptedExamIds.has(exam.examId)) {
      return [];
    }

    const scheduledAt = exam.scheduledAt ?? exam.startedAt;
    const status = getActiveExamStatus(scheduledAt, exam.status, now);
    const end = getExamEndDate(scheduledAt, exam.durationMin);

    if (status !== "late" || (end && now.getTime() >= end.getTime())) {
      return [];
    }

    const sortBase = parseListDate(scheduledAt)?.getTime() ?? now.getTime();

    return [
      {
        id: `late:${exam.examId}`,
        examId: exam.examId,
        title: exam.title,
        date: formatListDate(scheduledAt),
        time: formatListTime(scheduledAt),
        duration: exam.durationMin,
        score: null,
        status: "late",
        statusText: "Хоцорсон",
        sortTime: sortBase,
      },
    ];
  });

  const missedHistoryItems: HistoryListItem[] = upcomingExams.flatMap(
    (exam) => {
      if (attemptedExamIds.has(exam.examId)) {
        return [];
      }

      const scheduledAt = exam.scheduledAt ?? exam.startedAt;
      const end = getExamEndDate(scheduledAt, exam.durationMin);

      if (!end || now.getTime() < end.getTime()) {
        return [];
      }

      return [
        {
          id: `missed:${exam.examId}`,
          examId: exam.examId,
          title: exam.title,
          date: formatListDate(scheduledAt),
          time: formatListTime(end.toISOString()),
          duration: exam.durationMin,
          score: null,
          status: "missed",
          statusText: "Өгөөгүй",
          sortTime: end.getTime(),
        },
      ];
    },
  );

  const historyItems: HistoryListItem[] =
    realHistoryItems.length > 0 ||
    lateHistoryItems.length > 0 ||
    missedHistoryItems.length > 0
      ? [...lateHistoryItems, ...missedHistoryItems, ...realHistoryItems].sort(
          (left, right) => right.sortTime - left.sortTime,
        )
      : [];

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Шалгалтууд</Text>

        {dashboardLoading ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>⏳</Text>
            <Text style={styles.emptyTitle}>
              Шалгалтуудыг шинэчилж байна...
            </Text>
            <Text style={styles.emptyText}>
              Одоогийн шалгалт, дараагийн шалгалт, түүхийн мэдээллийг шинэчилж
              байна.
            </Text>
          </View>
        ) : null}

        {/* Tab switcher */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "active" && styles.tabActive]}
            onPress={() => setActiveTab("active")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "active" && styles.tabTextActive,
              ]}
            >
              Шалгалтууд
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "history" && styles.tabActive]}
            onPress={() => setActiveTab("history")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "history" && styles.tabTextActive,
              ]}
            >
              Шалгалтын түүх
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color="#98A2B3" />
          <TextInput
            style={styles.searchInput}
            placeholder="Шалгалт хайх..."
            placeholderTextColor="#AAB0C0"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* List */}
        {activeTab === "active" ? (
          <ActiveExamList search={search} items={activeItems} />
        ) : (
          <HistoryList search={search} items={historyItems} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ActiveExamList({
  search,
  items,
}: {
  search: string;
  items: ActiveListItem[];
}) {
  const router = useRouter();
  const [selectedExam, setSelectedExam] = useState<ActiveListItem | null>(null);
  const filtered = items.filter((e) =>
    e.title.toLowerCase().includes(search.toLowerCase()),
  );

  if (filtered.length === 0) {
    return (
      <View style={styles.emptyCard}>
        <Text style={styles.emptyEmoji}>📭</Text>
        <Text style={styles.emptyTitle}>Товлогдсон шалгалт алга</Text>
        <Text style={styles.emptyText}>
          Багшийн товлосон бүх шалгалт энд харагдана.
        </Text>
      </View>
    );
  }

  return (
    <>
      {filtered.map((exam) => {
        const pillStyle =
          exam.status === "active"
            ? styles.statusPill
            : exam.status === "late"
              ? [styles.statusPill, styles.statusPillWarning]
              : [styles.statusPill, styles.statusPillNeutral];
        const pillTextStyle =
          exam.status === "active"
            ? styles.statusPillText
            : exam.status === "late"
              ? [styles.statusPillText, styles.statusPillTextWarning]
              : [styles.statusPillText, styles.statusPillTextNeutral];

        return (
          <View key={exam.id} style={styles.upcomingCard}>
            <View style={styles.listCardRow}>
              <Text style={styles.upcomingCardTitle}>{exam.title}</Text>
              <View style={pillStyle}>
                <Text style={pillTextStyle}>{exam.badgeText}</Text>
              </View>
            </View>
            <View style={styles.upcomingMetaGroup}>
              <View style={styles.upcomingMetaRow}>
                <Text style={styles.upcomingMetaLabel}>Өдөр:</Text>
                <Text style={styles.upcomingMetaValue}>{exam.date}</Text>
              </View>
              <View style={styles.upcomingMetaRow}>
                <Text style={styles.upcomingMetaLabel}>Эхэлсэн цаг:</Text>
                <Text style={styles.upcomingMetaValue}>{exam.time}</Text>
              </View>
              <View style={styles.upcomingMetaRow}>
                <Text style={styles.upcomingMetaLabel}>
                  Үргэлжилсэн хугацаа:
                </Text>
                <Text style={styles.upcomingMetaValue}>
                  {exam.duration} минут
                </Text>
              </View>
            </View>
            {exam.canJoin ? (
              <TouchableOpacity
                style={styles.upcomingPrimaryButton}
                onPress={() =>
                  router.push({
                    pathname: "/join",
                    params: exam.roomCode ? { roomCode: exam.roomCode } : {},
                  })
                }
              >
                <Text style={styles.primaryBtnText}>Шалгалтанд орох</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.upcomingButtonRow}>
                <View style={styles.upcomingDivider} />
                <TouchableOpacity
                  style={styles.upcomingDetailButton}
                  onPress={() => setSelectedExam(exam)}
                >
                  <Text style={styles.upcomingDetailText}>Дэлгэрэнгүй</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={24}
                    color="#111827"
                    style={styles.upcomingDetailArrow}
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>
        );
      })}
      <ExamDetailModal
        exam={selectedExam}
        visible={!!selectedExam}
        onClose={() => setSelectedExam(null)}
      />
    </>
  );
}

function HistoryList({
  search,
  items,
}: {
  search: string;
  items: HistoryListItem[];
}) {
  const filtered = items.filter((e) =>
    e.title.toLowerCase().includes(search.toLowerCase()),
  );

  if (filtered.length === 0) {
    return (
      <View style={styles.emptyCard}>
        <Text style={styles.emptyEmoji}>📋</Text>
        <Text style={styles.emptyTitle}>Түүх байхгүй</Text>
        <Text style={styles.emptyText}>Дууссан шалгалтууд энд харагдана.</Text>
      </View>
    );
  }

  return (
    <>
      {filtered.map((exam) => (
        <View key={exam.id} style={styles.listCard}>
          <View style={styles.listCardRow}>
            <Text style={styles.listCardTitle}>{exam.title}</Text>
            <View
              style={[
                styles.statusPill,
                exam.status === "missed"
                  ? styles.statusPillDanger
                  : exam.status === "late"
                    ? styles.statusPillDanger
                    : undefined,
              ]}
            >
              <Text
                style={[
                  styles.statusPillText,
                  exam.status === "missed"
                    ? styles.statusPillTextDanger
                    : exam.status === "late"
                      ? styles.statusPillTextDanger
                      : undefined,
                ]}
              >
                {exam.statusText}
              </Text>
            </View>
          </View>
          <Text style={styles.listCardMeta}>
            Өдөр: {exam.date}
            {"\n"}
            Эхэлсэн цаг: {exam.time}
            {"\n"}
            Үргэлжилсэн хугацаа: {exam.duration} минут
          </Text>
        </View>
      ))}
    </>
  );
}
export default function ExamScreen() {
  const router = useRouter();
  const {
    activeSession,
    answerQuestion,
    hydrated,
    integrity,
    logIntegrityEvent,
    recoverActiveSession,
    setCurrentQuestionIndex,
    setIntegrityWarning,
    startExam,
    student,
    submitCurrentExam,
  } = useStudentApp();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [remainingSeconds, setRemainingSeconds] = useState(
    computeRemainingSeconds(activeSession?.timerEndsAt ?? null),
  );
  const [appIsActive, setAppIsActive] = useState(
    AppState.currentState !== "background" &&
      AppState.currentState !== "inactive",
  );
  const [startingExam, setStartingExam] = useState(false);
  const [refreshingSession, setRefreshingSession] = useState(false);
  const [recoveringProctoring, setRecoveringProctoring] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [textDraft, setTextDraft] = useState("");
  const [cameraReady, setCameraReady] = useState(false);
  const [proctoringBlockedMessage, setProctoringBlockedMessage] = useState<
    string | null
  >(null);
  const submitRequestedRef = useRef(false);
  const autoStartAttemptedRef = useRef(false);
  const autoStartPermissionRequestedRef = useRef(false);

  const currentQuestion =
    activeSession?.questions[activeSession.currentQuestionIndex] ?? null;
  const currentAnswer = currentQuestion
    ? (activeSession?.answers[currentQuestion.id] ?? {})
    : {};
  const isJoined =
    activeSession?.status === "joined" || activeSession?.status === "late";
  const shouldAutoStart = isJoined;
  const isExamInProgress = activeSession?.status === "in_progress";
  const audioRecorder = useExamAudioRecorder({
    required: Boolean(activeSession?.exam.requiresAudioRecording),
    session: activeSession,
    student,
  });
  const isSyncBlocked =
    activeSession?.syncStatus === "syncing" ||
    submitting ||
    Boolean(proctoringBlockedMessage) ||
    audioRecorder.status === "blocked";
  const isObjectiveQuestion =
    currentQuestion?.type === "multiple_choice" ||
    currentQuestion?.type === "true_false";
  const isTextEntryQuestion =
    currentQuestion?.type === "short_answer" ||
    currentQuestion?.type === "essay" ||
    currentQuestion?.type === "text";
  const hasCurrentAnswer = currentQuestion
    ? isObjectiveQuestion
      ? Boolean(currentAnswer.selectedOptionId)
      : isTextEntryQuestion
        ? Boolean(
            (textDraft || currentAnswer.textAnswer || "").trim().length > 0,
          )
        : true
    : false;
  const isLastQuestion = activeSession
    ? activeSession.currentQuestionIndex >= activeSession.questions.length - 1
    : false;
  const displayedRemainingSeconds = isExamInProgress
    ? remainingSeconds
    : (activeSession?.exam.durationMin ?? 0) * 60;
  const primaryActionLabel = submitting
    ? "Илгээж байна..."
    : isLastQuestion
      ? "Илгээх"
      : "Үргэлжлүүлэх";
  const primaryActionDisabled =
    isSyncBlocked || !currentQuestion || !hasCurrentAnswer || isJoined;

  const persistTextAnswer = useCallback(async () => {
    if (!currentQuestion || !activeSession) return;
    if (
      currentQuestion.type !== "short_answer" &&
      currentQuestion.type !== "essay" &&
      currentQuestion.type !== "text"
    )
      return;
    const currentValue = currentAnswer.textAnswer ?? "";
    if (textDraft === currentValue) return;
    setSyncError(null);
    try {
      await answerQuestion(currentQuestion.id, {
        selectedOptionId: null,
        textAnswer: textDraft,
      });
    } catch (error) {
      setSyncError(
        normalizeApiError(error, "Бичсэн хариултыг хадгалж чадсангүй."),
      );
    }
  }, [
    activeSession,
    answerQuestion,
    currentAnswer.textAnswer,
    currentQuestion,
    textDraft,
  ]);

  const handleSubmit = useCallback(
    async (forced = false) => {
      if (!forced) {
        const confirmed = await new Promise<boolean>((resolve) => {
          Alert.alert(
            "Шалгалт илгээх",
            "Илгээсний дараа хариултуудыг засах боломжгүй.",
            [
              { text: "Болих", style: "cancel", onPress: () => resolve(false) },
              {
                text: "Илгээх",
                style: "default",
                onPress: () => resolve(true),
              },
            ],
          );
        });
        if (!confirmed) return;
      }
      await persistTextAnswer();
      setSubmitting(true);
      setSyncError(null);
      try {
        await submitCurrentExam({
          beforeSubmit: async () => {
            await audioRecorder.stop();
          },
        });
        router.replace("/result");
      } catch (error) {
        submitRequestedRef.current = false;
        setSyncError(normalizeApiError(error, "Шалгалтыг илгээж чадсангүй."));
      } finally {
        setSubmitting(false);
      }
    },
    [audioRecorder, persistTextAnswer, router, submitCurrentExam],
  );

  const handleRecoverProctoring = useCallback(async () => {
    if (!activeSession || activeSession.status !== "in_progress") {
      return;
    }

    setRecoveringProctoring(true);
    setSyncError(null);

    try {
      const permissionResult = cameraPermission?.granted
        ? cameraPermission
        : await requestCameraPermission();

      if (!permissionResult?.granted) {
        setSyncError(
          "Шалгалтыг үргэлжлүүлэхийн өмнө камерын зөвшөөрөл шаардлагатай.",
        );
        return;
      }

      if (!cameraReady) {
        setSyncError(
          "Шалгалтын камер бэлдэж байна. Камер бэлэн болтол түр хүлээнэ үү.",
        );
        return;
      }

      if (activeSession.exam.requiresAudioRecording) {
        const prepared = await audioRecorder.prepare();
        if (!prepared) {
          setSyncError(
            audioRecorder.error ??
              "Шалгалтыг үргэлжлүүлэхийн өмнө микрофоны бичлэг бэлэн байх шаардлагатай.",
          );
          return;
        }

        const started = await audioRecorder.start();
        if (!started) {
          setSyncError(
            audioRecorder.error ??
              "Шалгалтыг үргэлжлүүлэхийн өмнө микрофоны бичлэг ажиллаж байх шаардлагатай.",
          );
          return;
        }
      }

      setProctoringBlockedMessage(null);
      setIntegrityWarning(null);
    } catch (error) {
      setSyncError(
        normalizeApiError(error, "Шалгалтын хяналтыг сэргээж чадсангүй."),
      );
    } finally {
      setRecoveringProctoring(false);
    }
  }, [
    activeSession,
    audioRecorder,
    cameraPermission,
    cameraReady,
    requestCameraPermission,
    setIntegrityWarning,
  ]);

  const handleRefreshSession = useCallback(async () => {
    setRefreshingSession(true);
    try {
      await recoverActiveSession();
    } finally {
      setRefreshingSession(false);
    }
  }, [recoverActiveSession]);

  const moveQuestion = async (direction: -1 | 1) => {
    await persistTextAnswer();
    if (!activeSession) return;
    setCurrentQuestionIndex(activeSession.currentQuestionIndex + direction);
  };

  const handlePrimaryAction = useCallback(async () => {
    if (!currentQuestion || primaryActionDisabled) return;

    if (isLastQuestion) {
      await handleSubmit(false);
      return;
    }

    await moveQuestion(1);
  }, [
    currentQuestion,
    handleSubmit,
    isLastQuestion,
    moveQuestion,
    primaryActionDisabled,
  ]);

  useEffect(() => {
    setRemainingSeconds(
      computeRemainingSeconds(activeSession?.timerEndsAt ?? null),
    );
  }, [activeSession?.timerEndsAt]);

  useEffect(() => {
    setTextDraft(currentAnswer.textAnswer ?? "");
  }, [currentAnswer.textAnswer, currentQuestion?.id]);

  useEffect(() => {
    if (!activeSession || activeSession.status !== "in_progress") return;
    const interval = setInterval(() => {
      setRemainingSeconds(computeRemainingSeconds(activeSession.timerEndsAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  useEffect(() => {
    if (!activeSession || activeSession.status !== "in_progress") return;
    if (remainingSeconds > 0 || submitRequestedRef.current) return;
    submitRequestedRef.current = true;
    void handleSubmit(true);
  }, [activeSession, handleSubmit, remainingSeconds]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      setAppIsActive(nextState === "active");
      if (nextState !== "active" && activeSession?.status === "in_progress") {
        setProctoringBlockedMessage(
          "Апп арын төлөв рүү шилжсэн тул шалгалтыг түр зогсоолоо. Буцаж орж, хяналтыг сэргээсний дараа үргэлжлүүлнэ үү.",
        );
        setIntegrityWarning("Шалгалтын үед апп дэлгэцнээс гарсан байна.");
        void logIntegrityEvent("tab_hidden", `app-state:${nextState}`);
      }
    });
    return () => subscription.remove();
  }, [activeSession?.status, logIntegrityEvent, setIntegrityWarning]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        if (
          activeSession &&
          activeSession.status === "in_progress" &&
          !submitRequestedRef.current
        ) {
          setProctoringBlockedMessage(
            "Та шалгалтын дэлгэцээс гарсан тул шалгалтыг түр зогсоолоо.",
          );
          setIntegrityWarning(
            "Та шалгалтын дэлгэцээс гарсан байна. Илгээх хүртлээ шалгалтын дэлгэц дээрээ байна уу.",
          );
          void logIntegrityEvent("window_blur", "screen-blur");
        }
      };
    }, [activeSession, logIntegrityEvent, setIntegrityWarning]),
  );

  useEffect(() => {
    if (
      audioRecorder.status === "blocked" ||
      audioRecorder.status === "error"
    ) {
      setProctoringBlockedMessage(
        audioRecorder.error ??
          "Аудио бичлэг санаандгүй зогссон байна. Үргэлжлүүлэхийн өмнө хяналтыг сэргээнэ үү.",
      );
    }
  }, [audioRecorder.error, audioRecorder.status]);

  useEffect(() => {
    return () => {
      void audioRecorder.stop();
    };
  }, [audioRecorder]);
  const handleStart = useCallback(async () => {
    if (!activeSession) return;

    setStartingExam(true);
    setSyncError(null);
    try {
      const permissionResult = cameraPermission?.granted
        ? cameraPermission
        : await requestCameraPermission();
      if (!permissionResult?.granted) {
        setSyncError(
          "Шалгалтыг эхлүүлэхийн өмнө камерын зөвшөөрөл шаардлагатай.",
        );
        return;
      }
      if (!cameraReady) {
        setSyncError(
          "Шалгалтын камер бэлдэж байна. Камер бэлэн болтол түр хүлээнэ үү.",
        );
        return;
      }

      const requiresAudioRecording = Boolean(
        activeSession.exam.requiresAudioRecording,
      );
      let audioReady = false;

      if (requiresAudioRecording) {
        const prepared = await audioRecorder.prepare();
        if (!prepared) {
          setSyncError(
            audioRecorder.error ??
              "Шалгалтыг эхлүүлэхийн өмнө микрофоны бичлэг бэлэн байх шаардлагатай.",
          );
          return;
        }

        const started = await audioRecorder.start();
        if (!started) {
          setSyncError(
            audioRecorder.error ??
              "Шалгалтыг эхлүүлэхийн өмнө микрофоны бичлэг ажиллаж байх шаардлагатай.",
          );
          return;
        }
        audioReady = true;
      }

      setProctoringBlockedMessage(null);
      setSyncError(null);
      await startExam({
        audioReady: requiresAudioRecording ? audioReady : undefined,
      });
      setRemainingSeconds(computeRemainingSeconds(activeSession.timerEndsAt));
    } catch (error) {
      await audioRecorder.stop();
      setSyncError(normalizeApiError(error, "Шалгалтыг эхлүүлж чадсангүй."));
    } finally {
      setStartingExam(false);
    }
  }, [
    activeSession,
    audioRecorder,
    cameraPermission,
    cameraReady,
    requestCameraPermission,
    startExam,
  ]);

  useEffect(() => {
    if (!shouldAutoStart || !activeSession || !isJoined) {
      autoStartAttemptedRef.current = false;
      autoStartPermissionRequestedRef.current = false;
      return;
    }

    if (
      cameraPermission?.granted ||
      startingExam ||
      autoStartPermissionRequestedRef.current
    ) {
      return;
    }

    autoStartPermissionRequestedRef.current = true;

    void (async () => {
      try {
        const permissionResult = await requestCameraPermission();
        if (!permissionResult?.granted) {
          setSyncError(
            "Шалгалтыг эхлүүлэхийн өмнө камерын зөвшөөрөл шаардлагатай.",
          );
        }
      } catch (error) {
        setSyncError(
          normalizeApiError(error, "Камерын зөвшөөрөл шалгаж чадсангүй."),
        );
      }
    })();
  }, [
    activeSession,
    shouldAutoStart,
    cameraPermission?.granted,
    isJoined,
    requestCameraPermission,
    startingExam,
  ]);

  useEffect(() => {
    if (!shouldAutoStart || !activeSession || !isJoined) {
      autoStartAttemptedRef.current = false;
      return;
    }

    if (
      !cameraPermission?.granted ||
      !cameraReady ||
      startingExam ||
      autoStartAttemptedRef.current
    ) {
      return;
    }

    autoStartAttemptedRef.current = true;
    void handleStart();
  }, [
    activeSession,
    shouldAutoStart,
    cameraPermission?.granted,
    cameraReady,
    handleStart,
    isJoined,
    startingExam,
  ]);

  if (!student) return <Redirect href="/" />;

  // No active session → show exam list with tabs
  if (!hydrated) {
    return (
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <ScrollView
          style={styles.screen}
          contentContainerStyle={styles.content}
        >
          <Text style={styles.pageTitle}>Шалгалт</Text>
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>⏳</Text>
            <Text style={styles.emptyTitle}>Ачааллаж байна...</Text>
            <Text style={styles.emptyText}>
              Сүүлийн шалгалтын төлөвийг сэргээж байна.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!activeSession) {
    return <ExamListScreen />;
  }

  // ── Active / joined session ────────────────────────────────────────────────

  const saveMcqAnswer = async (optionId: string) => {
    if (!currentQuestion) return;
    setSyncError(null);
    try {
      await answerQuestion(currentQuestion.id, {
        selectedOptionId: optionId,
        textAnswer: null,
      });
    } catch (error) {
      setSyncError(normalizeApiError(error, "Хариултыг хадгалж чадсангүй."));
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.activeExamLayout}>
          <View style={styles.activeExamHeader}>
            <View style={styles.activeExamHeading}>
              <Text style={styles.activeExamTitle}>{activeSession.exam.title}</Text>
              <Text style={styles.activeExamSubtitle}>
                Асуултуудаа сайн уншиж танилцаад тайван бөглөөрэй.
              </Text>
            </View>
            <View style={styles.examTimerBadge}>
              <Ionicons name="time-outline" size={18} color="#111827" />
              <Text style={styles.examTimerBadgeText}>
                {formatCountdown(displayedRemainingSeconds)}
              </Text>
            </View>
          </View>

          {!isJoined && activeSession.syncMessage ? (
            <Text style={styles.subtleStatusText}>{activeSession.syncMessage}</Text>
          ) : null}

          {integrity.warningMessage ? (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>{integrity.warningMessage}</Text>
            </View>
          ) : null}

          {proctoringBlockedMessage ? (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>{proctoringBlockedMessage}</Text>
            </View>
          ) : null}

          {syncError ? <Text style={styles.errorText}>{syncError}</Text> : null}

          {isJoined && (syncError || proctoringBlockedMessage) && !startingExam ? (
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => void handleStart()}
            >
              <Text style={styles.secondaryBtnText}>Дахин оролдох</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <MobileProctorCamera
          captureEnabled={isExamInProgress && appIsActive}
          headless
          isEnabled={isJoined || (isExamInProgress && appIsActive)}
          permissionGranted={!!cameraPermission?.granted}
          sessionId={activeSession.sessionId}
          student={student}
          onCameraReadyChange={setCameraReady}
          onViolation={logIntegrityEvent}
        />

        {!isJoined && proctoringBlockedMessage ? (
          <TouchableOpacity
            style={[
              styles.secondaryBtn,
              recoveringProctoring && styles.navBtnDisabled,
            ]}
            disabled={recoveringProctoring}
            onPress={() => void handleRecoverProctoring()}
          >
            <Text style={styles.secondaryBtnText}>
              {recoveringProctoring
                ? "Хяналтыг сэргээж байна..."
                : "Хяналтыг сэргээх"}
            </Text>
          </TouchableOpacity>
        ) : null}

        {currentQuestion ? (
          <View style={styles.questionCard}>
            <Text style={styles.questionCounter}>
              Асуулт {activeSession.currentQuestionIndex + 1}
            </Text>
            {hasTraditionalMongolian(currentQuestion.questionText) ? (
              <MongolianText
                text={currentQuestion.questionText}
                style={styles.questionText}
              />
            ) : (
              <MathText
                text={currentQuestion.questionText}
                style={styles.questionText}
              />
            )}

            {currentQuestion.imageUrl ? (
              <Image
                source={{ uri: currentQuestion.imageUrl }}
                style={styles.questionImage}
              />
            ) : null}

            {(currentQuestion.type === "multiple_choice" ||
              currentQuestion.type === "true_false") &&
            currentQuestion.options.length > 0 ? (
              <View style={styles.optionList}>
                {currentQuestion.options.map((option) => {
                  const selected = currentAnswer.selectedOptionId === option.id;
                  return (
                    <Pressable
                      key={option.id}
                      disabled={!isExamInProgress}
                      onPress={() => void saveMcqAnswer(option.id)}
                      style={[
                        styles.optionButton,
                        !isExamInProgress && styles.navBtnDisabled,
                        selected && styles.optionButtonSelected,
                      ]}
                    >
                      <View style={styles.optionContent}>
                        <Text
                          style={[
                            styles.optionLabel,
                            selected && styles.optionLabelSelected,
                          ]}
                        >
                          {option.label}.
                        </Text>
                        {hasTraditionalMongolian(option.text) ? (
                          <MongolianText
                            text={option.text}
                            style={[
                              styles.optionLabel,
                              selected && styles.optionLabelSelected,
                            ]}
                          />
                        ) : (
                          <MathText
                            text={option.text}
                            style={[
                              styles.optionLabel,
                              selected && styles.optionLabelSelected,
                            ]}
                          />
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <TextInput
                key={currentQuestion.id}
                multiline
                contextMenuHidden={integrity.capabilities.copyPasteRestricted}
                placeholder="Хариултаа энд бичнэ үү"
                placeholderTextColor="#BBBFC9"
                style={styles.answerInput}
                value={textDraft}
                editable={isExamInProgress}
                onChangeText={setTextDraft}
                onBlur={() => void persistTextAnswer()}
              />
            )}
          </View>
        ) : null}

        {currentQuestion ? (
          <View style={styles.footerActions}>
            <View style={styles.questionFooterRow}>
              {activeSession.currentQuestionIndex > 0 ? (
                <TouchableOpacity
                  style={[
                    styles.navIconBtn,
                    isSyncBlocked && styles.navBtnDisabled,
                  ]}
                  disabled={isSyncBlocked}
                  onPress={() => void moveQuestion(-1)}
                >
                  <Ionicons name="arrow-back" size={18} color="#3568F5" />
                </TouchableOpacity>
              ) : (
                <View style={styles.footerSpacer} />
              )}

              <TouchableOpacity
                style={[
                  styles.questionPrimaryBtn,
                  primaryActionDisabled && styles.questionPrimaryBtnDisabled,
                ]}
                disabled={primaryActionDisabled}
                onPress={() => void handlePrimaryAction()}
              >
                <Text style={styles.questionPrimaryBtnText}>
                  {primaryActionLabel}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
