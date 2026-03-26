import { useFocusEffect } from "@react-navigation/native";
import { Redirect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  AppState,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  AppScreen,
  Card,
  ErrorText,
  PrimaryButton,
  SecondaryButton,
  SectionTitle,
} from "@/components/student-app/ui";
import { useStudentApp } from "@/lib/student-app/context";
import {
  computeRemainingSeconds,
  formatCountdown,
  normalizeApiError,
} from "@/lib/student-app/utils";

export default function ExamScreen() {
  const router = useRouter();
  const {
    activeSession,
    answerQuestion,
    hydrated,
    logIntegrityEvent,
    setCurrentQuestionIndex,
    startExam,
    student,
    submitCurrentExam,
  } = useStudentApp();
  const [remainingSeconds, setRemainingSeconds] = useState(
    computeRemainingSeconds(activeSession?.timerEndsAt ?? null),
  );
  const [submitting, setSubmitting] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const submitRequestedRef = useRef(false);

  const handleSubmit = useCallback(
    async (forced = false) => {
      if (!forced) {
        const confirmed = await new Promise<boolean>((resolve) => {
          Alert.alert(
            "Шалгалт илгээх",
            "Илгээсний дараа дахин өөрчлөх боломжгүй. Үргэлжлүүлэх үү?",
            [
              { text: "Болих", style: "cancel", onPress: () => resolve(false) },
              { text: "Илгээх", style: "default", onPress: () => resolve(true) },
            ],
          );
        });

        if (!confirmed) return;
      }

      setSubmitting(true);
      setSyncError(null);

      try {
        await submitCurrentExam();
        router.replace("/result");
      } catch (error) {
        submitRequestedRef.current = false;
        setSyncError(
          normalizeApiError(error, "Шалгалтыг илгээж чадсангүй."),
        );
      } finally {
        setSubmitting(false);
      }
    },
    [router, submitCurrentExam],
  );

  useEffect(() => {
    setRemainingSeconds(
      computeRemainingSeconds(activeSession?.timerEndsAt ?? null),
    );
  }, [activeSession?.timerEndsAt]);

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
        void logIntegrityEvent("tab_hidden", `app-state:${nextState}`);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [activeSession?.status, logIntegrityEvent]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        if (
          activeSession &&
          activeSession.status === "in_progress" &&
          !submitRequestedRef.current
        ) {
          void logIntegrityEvent("window_blur", "screen-blur");
        }
      };
    }, [activeSession, logIntegrityEvent]),
  );

  const progressLabel = useMemo(() => {
    if (!activeSession) {
      return "0/0";
    }

    if (activeSession.questions.length === 0) {
      return "0/0";
    }

    return `${activeSession.currentQuestionIndex + 1}/${activeSession.questions.length}`;
  }, [activeSession]);

  if (!student) {
    return <Redirect href="/" />;
  }

  if (!hydrated) {
    return (
      <AppScreen scroll>
        <Card>
          <SectionTitle
            title="Шалгалтыг ачаалж байна"
            subtitle="Таны идэвхтэй шалгалтын мэдээллийг сэргээж байна."
          />
        </Card>
      </AppScreen>
    );
  }

  if (!activeSession) {
    return (
      <AppScreen scroll>
        <Card>
          <SectionTitle
            title="Идэвхтэй шалгалт алга"
            subtitle="Join дэлгэцээс код оруулаад шалгалтад нэгдсэний дараа эндээс үргэлжлүүлнэ."
          />
          <PrimaryButton
            label="Шалгалтад нэгдэх"
            onPress={() => {
              router.push("/join");
            }}
          />
          <SecondaryButton
            label="Нүүр хуудас"
            onPress={() => {
              router.push("/home");
            }}
          />
        </Card>
      </AppScreen>
    );
  }

  const currentQuestion =
    activeSession.questions[activeSession.currentQuestionIndex];
  const currentAnswer = activeSession.answers[currentQuestion?.id] ?? {};
  const isJoined = activeSession.status === "joined";

  const handleStart = async () => {
    try {
      await startExam();
      setRemainingSeconds(computeRemainingSeconds(activeSession.timerEndsAt));
    } catch (error) {
      setSyncError(
        normalizeApiError(error, "Шалгалтыг эхлүүлэхэд алдаа гарлаа."),
      );
    }
  };

  const saveMcqAnswer = async (optionId: string) => {
    setSyncError(null);
    try {
      await answerQuestion(currentQuestion.id, {
        selectedOptionId: optionId,
        textAnswer: null,
      });
    } catch (error) {
      setSyncError(
        normalizeApiError(error, "Хариултыг хадгалах үед алдаа гарлаа."),
      );
    }
  };

  const saveTextAnswer = async (value: string) => {
    setSyncError(null);
    try {
      await answerQuestion(currentQuestion.id, {
        selectedOptionId: null,
        textAnswer: value,
      });
    } catch (error) {
      setSyncError(
        normalizeApiError(error, "Хариултыг хадгалах үед алдаа гарлаа."),
      );
    }
  };

  return (
    <AppScreen scroll>
      <Card>
        <SectionTitle
          title={activeSession.exam.title}
          subtitle={
            isJoined
              ? "Шалгалт эхлэхэд бэлэн байна."
              : "Анхаарлаа төвлөрүүлж, асуултуудад дарааллаар нь хариулна уу."
          }
        />
        <View style={styles.topMeta}>
          <View style={styles.metaChip}>
            <Text style={styles.metaChipLabel}>Хугацаа</Text>
            <Text style={styles.metaChipValue}>
              {formatCountdown(remainingSeconds)}
            </Text>
          </View>
          <View style={styles.metaChip}>
            <Text style={styles.metaChipLabel}>Явц</Text>
            <Text style={styles.metaChipValue}>{progressLabel}</Text>
          </View>
        </View>
        <ErrorText message={syncError} />

        {isJoined ? (
          <PrimaryButton
            label="Шалгалтыг эхлүүлэх"
            onPress={() => void handleStart()}
          />
        ) : null}
      </Card>

      {!isJoined && currentQuestion ? (
        <Card>
          <Text style={styles.questionCounter}>
            Асуулт {activeSession.currentQuestionIndex + 1}
          </Text>
          <Text style={styles.questionText}>{currentQuestion.questionText}</Text>
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
                    onPress={() => {
                      void saveMcqAnswer(option.id);
                    }}
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
              placeholder="Хариултаа энд бичнэ үү"
              placeholderTextColor="#7A7A72"
              style={styles.answerInput}
              value={currentAnswer.textAnswer ?? ""}
              onChangeText={(value) => {
                void saveTextAnswer(value);
              }}
            />
          )}
        </Card>
      ) : null}

      {!isJoined ? (
        <View style={styles.footerActions}>
          <SecondaryButton
            label="Өмнөх"
            onPress={() =>
              setCurrentQuestionIndex(activeSession.currentQuestionIndex - 1)
            }
          />
          <SecondaryButton
            label="Дараах"
            onPress={() =>
              setCurrentQuestionIndex(activeSession.currentQuestionIndex + 1)
            }
          />
          <PrimaryButton
            label="Илгээх"
            loading={submitting}
            onPress={() => {
              void handleSubmit(false);
            }}
          />
        </View>
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  topMeta: {
    flexDirection: "row",
    gap: 12,
  },
  metaChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E7DDCB",
    borderRadius: 18,
    padding: 14,
    backgroundColor: "#FFF7E7",
  },
  metaChipLabel: {
    fontSize: 12,
    color: "#6A6A63",
    marginBottom: 6,
  },
  metaChipValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#23412F",
  },
  questionCounter: {
    fontSize: 13,
    fontWeight: "700",
    color: "#5D6B57",
  },
  questionText: {
    fontSize: 20,
    lineHeight: 30,
    color: "#19271E",
    fontWeight: "700",
  },
  questionImage: {
    width: "100%",
    height: 180,
    borderRadius: 20,
    backgroundColor: "#F0E9DC",
  },
  optionList: {
    gap: 10,
  },
  optionButton: {
    borderWidth: 1,
    borderColor: "#D9CCB4",
    borderRadius: 18,
    padding: 16,
    backgroundColor: "#FFF8ED",
  },
  optionButtonSelected: {
    borderColor: "#2D6A4F",
    backgroundColor: "#E7F2EA",
  },
  optionLabel: {
    fontSize: 16,
    lineHeight: 24,
    color: "#314135",
  },
  optionLabelSelected: {
    color: "#1D4F38",
    fontWeight: "700",
  },
  answerInput: {
    minHeight: 160,
    borderWidth: 1,
    borderColor: "#DCCFB6",
    borderRadius: 20,
    backgroundColor: "#FFF9ED",
    padding: 16,
    textAlignVertical: "top",
    fontSize: 16,
    color: "#1F2A1F",
  },
  footerActions: {
    gap: 12,
    paddingBottom: 24,
  },
});
