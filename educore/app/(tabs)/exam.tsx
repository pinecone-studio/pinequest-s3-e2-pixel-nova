import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCameraPermissions } from "expo-camera";
import { Redirect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
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

import MobileProctorCamera from "@/components/student-app/MobileProctorCamera";
import { useStudentApp } from "@/lib/student-app/context";
import { useExamAudioRecorder } from "@/lib/student-app/hooks/use-exam-audio-recorder";
import {
  computeRemainingSeconds,
  formatCountdown,
  formatDateTime,
  getEntryStatusLabel,
  normalizeApiError,
} from "@/lib/student-app/utils";
import { examStyles as styles } from "@/styles/screens/exam";

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
  className?: string | null;
  groupName?: string | null;
  teacherName?: string | null;
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
  sortTime: number;
};

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
  if (!exam) return null;

  const classLabel = [exam.className, exam.groupName]
    .filter(Boolean)
    .join(" · ");

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.detailOverlay}>
        <SafeAreaView style={styles.detailSheet} edges={["top"]}>
          <View style={styles.detailTopBar}>
            <Pressable style={styles.detailBackButton} onPress={onClose}>
              <Ionicons name="chevron-back" size={22} color="#111827" />
            </Pressable>
            <Text style={styles.detailHeaderTitle}>Дэлгэрэнгүй</Text>
            <View style={styles.detailHeaderSpacer} />
          </View>

          <ScrollView
            contentContainerStyle={styles.detailContent}
            showsVerticalScrollIndicator={false}>
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
                <Ionicons
                  name="information-circle-outline"
                  size={20}
                  color="#111827"
                />
                <Text style={styles.detailSectionTitle}>
                  Шалгалтын дүрэм ба мэдээлэл
                </Text>
              </View>

              <View style={styles.ruleGrid}>
                <View style={[styles.ruleCard, styles.ruleCardWarning]}>
                  <Ionicons
                    name="swap-horizontal-outline"
                    size={18}
                    color="#F59E0B"
                  />
                  <Text style={styles.ruleTitle}>Change tab</Text>
                  <Text style={styles.ruleSubtitle}>Cannot change tab.</Text>
                </View>

                <View style={[styles.ruleCard, styles.ruleCardWarning]}>
                  <Ionicons name="timer-outline" size={18} color="#F59E0B" />
                  <Text style={styles.ruleTitle}>Auto Submit</Text>
                  <Text style={styles.ruleSubtitle}>
                    Submits when time ends
                  </Text>
                </View>

                <View style={[styles.ruleCard, styles.ruleCardDanger]}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color="#EF4444"
                  />
                  <Text style={styles.ruleTitle}>Copy/Paste</Text>
                  <Text style={styles.ruleSubtitle}>Disabled</Text>
                </View>

                <View style={[styles.ruleCard, styles.ruleCardDanger]}>
                  <Ionicons name="camera-outline" size={18} color="#EF4444" />
                  <Text style={styles.ruleTitle}>Camera</Text>
                  <Text style={styles.ruleSubtitle}>Required</Text>
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
        </SafeAreaView>
      </View>
    </Modal>
  );
}

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Exam list screen (tab = "active" | "history") Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

function ExamListScreen() {
  const { history, upcomingExams } = useStudentApp();
  const [activeTab, setActiveTab] = useState<TabKey>("active");
  const [search, setSearch] = useState("");
  const [now, setNow] = useState(() => new Date());
  const attemptedExamIds = new Set(history.map((item) => item.examId));

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 30000);

    return () => clearInterval(timer);
  }, []);

  const activeItemsFromBackend: ActiveListItem[] = upcomingExams.flatMap(
    (exam) => {
      const scheduledAt = exam.scheduledAt ?? exam.startedAt;
      const scheduledDate = parseListDate(scheduledAt);
      const end = getExamEndDate(scheduledAt, exam.durationMin);
      const status =
        getActiveExamStatus(scheduledAt, exam.status, now) ?? "waiting";
      const daysUntilExam = getDaysUntilExam(scheduledAt, now);

      if (status === "late" || !scheduledDate) {
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
          className: exam.className ?? null,
          groupName: exam.groupName ?? null,
          teacherName: getMockTeacherName(exam.title),
          badgeText:
            status === "active"
              ? "Өнөөдөр"
              : daysUntilExam === null
                ? "Товлогдсон"
                : daysUntilExam <= 0
                  ? "Өнөөдөр"
                  : `${daysUntilExam} хоног`,
        },
      ];
    },
  );

  const activeItems = activeItemsFromBackend;

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
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      <Text style={styles.pageTitle}>Exams</Text>

      {/* Tab switcher */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "active" && styles.tabActive]}
          onPress={() => setActiveTab("active")}>
          <Text
            style={[
              styles.tabText,
              activeTab === "active" && styles.tabTextActive,
            ]}>
            Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "history" && styles.tabActive]}
          onPress={() => setActiveTab("history")}>
          <Text
            style={[
              styles.tabText,
              activeTab === "history" && styles.tabTextActive,
            ]}>
            History
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color="#98A2B3" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search exams..."
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
            : exam.status === "waiting"
              ? [styles.statusPill, styles.statusPillWarning]
              : [styles.statusPill, styles.statusPillDanger];
        const pillTextStyle =
          exam.status === "active"
            ? styles.statusPillText
            : exam.status === "waiting"
              ? [styles.statusPillText, styles.statusPillTextWarning]
              : [styles.statusPillText, styles.statusPillTextDanger];

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
            {exam.status === "active" ? (
              <TouchableOpacity
                style={styles.upcomingPrimaryButton}
                onPress={() => router.push("/exam")}>
                <Text style={styles.primaryBtnText}>Шалгалтанд орох</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.upcomingButtonRow}>
                <TouchableOpacity
                  style={styles.upcomingDetailButton}
                  onPress={() => setSelectedExam(exam)}>
                  <Text style={styles.upcomingDetailText}>Дэлгэрэнгүй</Text>
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
              ]}>
              <Text
                style={[
                  styles.statusPillText,
                  exam.status === "missed"
                    ? styles.statusPillTextDanger
                    : exam.status === "late"
                      ? styles.statusPillTextDanger
                      : undefined,
                ]}>
                {exam.status === "missed"
                  ? "Өгөөгүй"
                  : exam.status === "late"
                    ? "Хоцорсон"
                    : "Өгсөн"}
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
  const [submitting, setSubmitting] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [textDraft, setTextDraft] = useState("");
  const [cameraReady, setCameraReady] = useState(false);
  const [proctoringBlockedMessage, setProctoringBlockedMessage] = useState<
    string | null
  >(null);
  const submitRequestedRef = useRef(false);

  const currentQuestion =
    activeSession?.questions[activeSession.currentQuestionIndex] ?? null;
  const currentAnswer = currentQuestion
    ? (activeSession?.answers[currentQuestion.id] ?? {})
    : {};
  const isJoined =
    activeSession?.status === "joined" || activeSession?.status === "late";
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
        normalizeApiError(error, "Could not save your typed answer."),
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
        setSyncError(normalizeApiError(error, "Could not submit the exam."));
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

    setSyncError(null);

    try {
      const permissionResult = cameraPermission?.granted
        ? cameraPermission
        : await requestCameraPermission();

      if (!permissionResult?.granted) {
        setSyncError(
          "Camera permission is required before the exam can continue.",
        );
        return;
      }

      if (!cameraReady) {
        setSyncError(
          "The exam camera is still preparing. Wait for the camera card to show Ready.",
        );
        return;
      }

      if (activeSession.exam.requiresAudioRecording) {
        const prepared = await audioRecorder.prepare();
        if (!prepared) {
          setSyncError(
            audioRecorder.error ??
              "Microphone recording must be ready before the exam can continue.",
          );
          return;
        }

        const started = await audioRecorder.start();
        if (!started) {
          setSyncError(
            audioRecorder.error ??
              "Microphone recording must be running before the exam can continue.",
          );
          return;
        }
      }

      setProctoringBlockedMessage(null);
      setIntegrityWarning(null);
    } catch (error) {
      setSyncError(
        normalizeApiError(error, "Could not recover exam proctoring."),
      );
    }
  }, [
    activeSession,
    audioRecorder,
    cameraPermission,
    cameraReady,
    requestCameraPermission,
    setIntegrityWarning,
  ]);

  const moveQuestion = async (direction: -1 | 1) => {
    await persistTextAnswer();
    if (!activeSession) return;
    setCurrentQuestionIndex(activeSession.currentQuestionIndex + direction);
  };

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
          "The exam was paused because the app left the foreground. Return to the exam and recover proctoring before continuing.",
        );
        setIntegrityWarning(
          "The app moved out of the foreground during an active exam.",
        );
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
            "The exam was paused because you left the exam screen.",
          );
          setIntegrityWarning(
            "You left the exam screen. Stay inside the exam until you submit.",
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
          "Audio recording stopped unexpectedly. Recover proctoring before continuing.",
      );
    }
  }, [audioRecorder.error, audioRecorder.status]);

  useEffect(() => {
    return () => {
      void audioRecorder.stop();
    };
  }, [audioRecorder]);

  const progressLabel = useMemo(() => {
    if (!activeSession || activeSession.questions.length === 0) return "0/0";
    return `${activeSession.currentQuestionIndex + 1}/${activeSession.questions.length}`;
  }, [activeSession]);

  if (!student) return <Redirect href="/" />;

  // No active session → show exam list with tabs
  if (!hydrated) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Text style={styles.pageTitle}>Exam</Text>
        <View style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>Loading</Text>
          <Text style={styles.emptyTitle}>Loading...</Text>
          <Text style={styles.emptyText}>Restoring the latest exam state.</Text>
        </View>
      </ScrollView>
    );
  }

  if (!activeSession) {
    return <ExamListScreen />;
  }

  // ── Active / joined session ────────────────────────────────────────────────

  const handleStart = async () => {
    try {
      const permissionResult = cameraPermission?.granted
        ? cameraPermission
        : await requestCameraPermission();
      if (!permissionResult?.granted) {
        setSyncError(
          "Camera permission is required before the exam can start.",
        );
        return;
      }
      if (!cameraReady) {
        setSyncError(
          "The exam camera is still preparing. Wait for the camera card to show Ready.",
        );
        return;
      }

      const requiresAudioRecording = Boolean(
        activeSession?.exam.requiresAudioRecording,
      );
      let audioReady = false;

      if (requiresAudioRecording) {
        const prepared = await audioRecorder.prepare();
        if (!prepared) {
          setSyncError(
            audioRecorder.error ??
              "Microphone recording must be ready before the exam can start.",
          );
          return;
        }

        const started = await audioRecorder.start();
        if (!started) {
          setSyncError(
            audioRecorder.error ??
              "Microphone recording must be running before the exam can start.",
          );
          return;
        }
        audioReady = true;
      }

      setProctoringBlockedMessage(null);
      await startExam({
        audioReady: requiresAudioRecording ? audioReady : undefined,
      });
      setRemainingSeconds(computeRemainingSeconds(activeSession.timerEndsAt));
    } catch (error) {
      await audioRecorder.stop();
      setSyncError(normalizeApiError(error, "Could not start the exam."));
    }
  };

  const saveMcqAnswer = async (optionId: string) => {
    if (!currentQuestion) return;
    setSyncError(null);
    try {
      await answerQuestion(currentQuestion.id, {
        selectedOptionId: optionId,
        textAnswer: null,
      });
    } catch (error) {
      setSyncError(normalizeApiError(error, "Could not save your answer."));
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      <Text style={styles.pageTitle}>Exam</Text>

      <View style={styles.examCard}>
        <View style={styles.examCardTop} />
        <View style={styles.examCardBody}>
          <View style={styles.examCardRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {activeSession.exam.title.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.examTitle}>{activeSession.exam.title}</Text>
              <Text style={styles.examMeta}>
                {"Scheduled: "}
                {formatDateTime(
                  activeSession.exam.scheduledAt ?? activeSession.startedAt,
                )}{" "}
                · {activeSession.exam.durationMin} min
              </Text>
            </View>
            <View
              style={[
                styles.statusPill,
                activeSession.entryStatus === "late" &&
                  styles.statusPillWarning,
              ]}>
              <Text
                style={[
                  styles.statusPillText,
                  activeSession.entryStatus === "late" &&
                    styles.statusPillTextWarning,
                ]}>
                {activeSession.entryStatus === "late"
                  ? "Late"
                  : getEntryStatusLabel(activeSession.entryStatus)}
              </Text>
            </View>
          </View>

          {!isJoined && (
            <View style={styles.metaRow}>
              <View style={styles.metaChip}>
                <Text style={styles.metaChipLabel}>Time left</Text>
                <Text style={styles.metaChipValue}>
                  {formatCountdown(remainingSeconds)}
                </Text>
              </View>
              <View style={styles.metaChip}>
                <Text style={styles.metaChipLabel}>Progress</Text>
                <Text style={styles.metaChipValue}>{progressLabel}</Text>
              </View>
            </View>
          )}

          {activeSession.syncMessage ? (
            <Text style={styles.warningText}>{activeSession.syncMessage}</Text>
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

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Camera preflight, periodic snapshot evidence, and rolling audio
              recording are managed from this screen. Proctoring must stay
              active for the whole exam.
            </Text>
          </View>

          {syncError ? <Text style={styles.errorText}>{syncError}</Text> : null}

          <Text style={styles.infoText}>
            Audio status: {audioRecorder.status}
            {audioRecorder.lastUploadedAt
              ? ` · Last upload ${formatDateTime(audioRecorder.lastUploadedAt)}`
              : ""}
          </Text>

          {isJoined ? (
            <>
              <MobileProctorCamera
                captureEnabled={false}
                isEnabled
                permissionGranted={!!cameraPermission?.granted}
                sessionId={activeSession.sessionId}
                student={student}
                onCameraReadyChange={setCameraReady}
                onViolation={logIntegrityEvent}
              />
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => void handleStart()}>
                <Text style={styles.primaryBtnText}>Start exam</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => void recoverActiveSession()}>
                <Text style={styles.secondaryBtnText}>Refresh session</Text>
              </TouchableOpacity>
            </>
          ) : null}
        </View>
      </View>

      {!isJoined ? (
        <>
          <MobileProctorCamera
            captureEnabled={
              activeSession.status === "in_progress" && appIsActive
            }
            isEnabled={activeSession.status === "in_progress" && appIsActive}
            permissionGranted={!!cameraPermission?.granted}
            sessionId={activeSession.sessionId}
            student={student}
            onCameraReadyChange={setCameraReady}
            onViolation={logIntegrityEvent}
          />
          {proctoringBlockedMessage ? (
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => void handleRecoverProctoring()}>
              <Text style={styles.secondaryBtnText}>Recover proctoring</Text>
            </TouchableOpacity>
          ) : null}
        </>
      ) : null}

      {!isJoined && currentQuestion ? (
        <View style={styles.questionCard}>
          <Text style={styles.questionCounter}>
            Question {activeSession.currentQuestionIndex + 1}
          </Text>
          <Text style={styles.questionText}>
            {currentQuestion.questionText}
          </Text>

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
                    onPress={() => void saveMcqAnswer(option.id)}
                    style={[
                      styles.optionButton,
                      selected && styles.optionButtonSelected,
                    ]}>
                    <Text
                      style={[
                        styles.optionLabel,
                        selected && styles.optionLabelSelected,
                      ]}>
                      {option.label}. {option.text}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <TextInput
              key={currentQuestion.id}
              multiline
              contextMenuHidden={integrity.capabilities.copyPasteRestricted}
              placeholder="Write your answer here"
              placeholderTextColor="#BBBFC9"
              style={styles.answerInput}
              value={textDraft}
              onChangeText={setTextDraft}
              onBlur={() => void persistTextAnswer()}
            />
          )}
        </View>
      ) : null}

      {!isJoined ? (
        <View style={styles.footerActions}>
          <TouchableOpacity
            style={[
              styles.navBtn,
              (activeSession.currentQuestionIndex === 0 || isSyncBlocked) &&
                styles.navBtnDisabled,
            ]}
            disabled={activeSession.currentQuestionIndex === 0 || isSyncBlocked}
            onPress={() => void moveQuestion(-1)}>
            <Text style={styles.navBtnText}>Previous</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.navBtn,
              (activeSession.currentQuestionIndex >=
                activeSession.questions.length - 1 ||
                isSyncBlocked) &&
                styles.navBtnDisabled,
            ]}
            disabled={
              activeSession.currentQuestionIndex >=
                activeSession.questions.length - 1 || isSyncBlocked
            }
            onPress={() => void moveQuestion(1)}>
            <Text style={styles.navBtnText}>Next</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryBtn, isSyncBlocked && styles.navBtnDisabled]}
            disabled={isSyncBlocked}
            onPress={() => void handleSubmit(false)}>
            <Text style={styles.primaryBtnText}>
              {submitting ? "Submitting..." : "Submit exam"}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </ScrollView>
  );
}
