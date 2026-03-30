import { useFocusEffect } from "@react-navigation/native";
import { Redirect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  AppState,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useStudentApp } from "@/lib/student-app/context";
import {
  computeRemainingSeconds,
  formatCountdown,
  formatDateTime,
  getEntryStatusLabel,
  normalizeApiError,
} from "@/lib/student-app/utils";
import { examStyles as styles } from "@/styles/screens/exam";

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

  const [remainingSeconds, setRemainingSeconds] = useState(
    computeRemainingSeconds(activeSession?.timerEndsAt ?? null),
  );
  const [submitting, setSubmitting] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [textDraft, setTextDraft] = useState("");
  const submitRequestedRef = useRef(false);

  const currentQuestion =
    activeSession?.questions[activeSession.currentQuestionIndex] ?? null;
  const currentAnswer = currentQuestion
    ? (activeSession?.answers[currentQuestion.id] ?? {})
    : {};
  const isJoined =
    activeSession?.status === "joined" || activeSession?.status === "late";
  const isSyncBlocked = activeSession?.syncStatus === "syncing" || submitting;

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
        await submitCurrentExam();
        router.replace("/result");
      } catch (error) {
        submitRequestedRef.current = false;
        setSyncError(normalizeApiError(error, "Could not submit the exam."));
      } finally {
        setSubmitting(false);
      }
    },
    [persistTextAnswer, router, submitCurrentExam],
  );

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
      if (nextState !== "active" && activeSession?.status === "in_progress") {
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
          setIntegrityWarning(
            "You left the exam screen. Stay inside the exam until you submit.",
          );
          void logIntegrityEvent("window_blur", "screen-blur");
        }
      };
    }, [activeSession, logIntegrityEvent, setIntegrityWarning]),
  );

  const progressLabel = useMemo(() => {
    if (!activeSession || activeSession.questions.length === 0) return "0/0";
    return `${activeSession.currentQuestionIndex + 1}/${activeSession.questions.length}`;
  }, [activeSession]);

  if (!student) return <Redirect href="/" />;

  // Loading
  if (!hydrated) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Text style={styles.pageTitle}>Шалгалт</Text>
        <View style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>⏳</Text>
          <Text style={styles.emptyTitle}>Уншиж байна...</Text>
          <Text style={styles.emptyText}>
            Шалгалтын мэдээлэл сэргээж байна.
          </Text>
        </View>
      </ScrollView>
    );
  }

  // No active session
  if (!activeSession) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Text style={styles.pageTitle}>Шалгалт</Text>
        <View style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>📭</Text>
          <Text style={styles.emptyTitle}>
            Өнөөдөр товлогдсон шалгалт байхгүй байна
          </Text>
          <Text style={styles.emptyText}>
            Багш шалгалт нээхэд room code-оор нэгдэнэ үү.
          </Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.push("/join")}
          >
            <Text style={styles.primaryBtnText}>Шалгалтанд нэгдэх</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => router.push("/home")}
          >
            <Text style={styles.secondaryBtnText}>Нүүр хуудас руу буцах</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  const handleStart = async () => {
    try {
      await startExam();
      setRemainingSeconds(computeRemainingSeconds(activeSession.timerEndsAt));
    } catch (error) {
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
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.pageTitle}>Шалгалт</Text>

      {/* Exam info card */}
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
                📅{" "}
                {formatDateTime(
                  activeSession.exam.scheduledAt ?? activeSession.startedAt,
                )}{" "}
                · {activeSession.exam.durationMin} мин
              </Text>
            </View>
            <View
              style={[
                styles.statusPill,
                activeSession.entryStatus === "late" &&
                  styles.statusPillWarning,
              ]}
            >
              <Text
                style={[
                  styles.statusPillText,
                  activeSession.entryStatus === "late" &&
                    styles.statusPillTextWarning,
                ]}
              >
                {activeSession.entryStatus === "late"
                  ? "Хоцорсон"
                  : getEntryStatusLabel(activeSession.entryStatus)}
              </Text>
            </View>
          </View>

          {!isJoined && (
            <View style={styles.metaRow}>
              <View style={styles.metaChip}>
                <Text style={styles.metaChipLabel}>Үлдсэн хугацаа</Text>
                <Text style={styles.metaChipValue}>
                  {formatCountdown(remainingSeconds)}
                </Text>
              </View>
              <View style={styles.metaChip}>
                <Text style={styles.metaChipLabel}>Явц</Text>
                <Text style={styles.metaChipValue}>{progressLabel}</Text>
              </View>
            </View>
          )}

          {activeSession.syncMessage ? (
            <Text style={styles.warningText}>{activeSession.syncMessage}</Text>
          ) : null}

          {integrity.warningMessage ? (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                ⚠️ {integrity.warningMessage}
              </Text>
            </View>
          ) : null}

          {syncError ? <Text style={styles.errorText}>{syncError}</Text> : null}

          {isJoined ? (
            <>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => void handleStart()}
              >
                <Text style={styles.primaryBtnText}>Шалгалт эхлүүлэх</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => void recoverActiveSession()}
              >
                <Text style={styles.secondaryBtnText}>Шинэчлэх</Text>
              </TouchableOpacity>
            </>
          ) : null}
        </View>
      </View>

      {/* Question card */}
      {!isJoined && currentQuestion ? (
        <View style={styles.questionCard}>
          <Text style={styles.questionCounter}>
            {activeSession.currentQuestionIndex + 1}-р асуулт
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
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionLabel,
                        selected && styles.optionLabelSelected,
                      ]}
                    >
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
              placeholder="Хариултаа энд бичнэ үү"
              placeholderTextColor="#BBBFC9"
              style={styles.answerInput}
              value={textDraft}
              onChangeText={setTextDraft}
              onBlur={() => void persistTextAnswer()}
            />
          )}
        </View>
      ) : null}

      {/* Footer nav */}
      {!isJoined ? (
        <View style={styles.footerActions}>
          <TouchableOpacity
            style={[
              styles.navBtn,
              (activeSession.currentQuestionIndex === 0 || isSyncBlocked) &&
                styles.navBtnDisabled,
            ]}
            disabled={activeSession.currentQuestionIndex === 0 || isSyncBlocked}
            onPress={() => void moveQuestion(-1)}
          >
            <Text style={styles.navBtnText}>← Өмнөх</Text>
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
            onPress={() => void moveQuestion(1)}
          >
            <Text style={styles.navBtnText}>Дараах →</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryBtn, isSyncBlocked && styles.navBtnDisabled]}
            disabled={isSyncBlocked}
            onPress={() => void handleSubmit(false)}
          >
            <Text style={styles.primaryBtnText}>
              {submitting ? "Илгээж байна..." : "Шалгалт илгээх"}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </ScrollView>
  );
}
