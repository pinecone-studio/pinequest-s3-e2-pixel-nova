import { Ionicons } from "@expo/vector-icons";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useStudentApp } from "@/lib/student-app/context";
import { normalizeApiError } from "@/lib/student-app/utils";

type JoinGuideStep = {
  key: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone: "primary" | "warning" | "danger";
};

const JOIN_GUIDE_STEPS: JoinGuideStep[] = [
  {
    key: "camera",
    title: "Камер нээх",
    description:
      "Камер асаалттай байх ёстой. Нүүр тань тод, бүтэн харагдаж байх шаардлагатай.",
    icon: "camera-outline",
    tone: "primary",
  },
  {
    key: "submit",
    title: "Шалгалт илгээгдэх",
    description:
      "Хугацаа дуусах үед таны оруулсан хариулт системд автоматаар илгээгдэнэ.",
    icon: "paper-plane-outline",
    tone: "primary",
  },
  {
    key: "switch",
    title: "Дэлгэц солих",
    description:
      "Цонх солих болон өөр апп руу гарах үйлдлийг зөрчил гэж тооцно.",
    icon: "swap-horizontal-outline",
    tone: "warning",
  },
  {
    key: "copy",
    title: "Copy Paste хийх",
    description:
      "Шалгалтын үед текстийг copy эсвэл paste хийх боломжгүй.",
    icon: "copy-outline",
    tone: "danger",
  },
];

export default function JoinExamScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ roomCode?: string | string[] }>();
  const { activeSession, joinExam, student } = useStudentApp();
  const prefilledRoomCode = Array.isArray(params.roomCode)
    ? (params.roomCode[0] ?? "")
    : (params.roomCode ?? activeSession?.roomCode ?? "");
  const [roomCode, setRoomCode] = useState(prefilledRoomCode);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [guideStepIndex, setGuideStepIndex] = useState<number | null>(null);
  const [joinedRoomCode, setJoinedRoomCode] = useState<string | null>(null);

  useEffect(() => {
    if (!prefilledRoomCode) return;
    setRoomCode(prefilledRoomCode);
  }, [prefilledRoomCode]);

  if (!student) {
    return <Redirect href="/" />;
  }

  const currentGuideStep =
    guideStepIndex !== null ? JOIN_GUIDE_STEPS[guideStepIndex] : null;
  const activeGuideIndex = guideStepIndex ?? 0;

  const handleJoin = async () => {
    const normalizedCode = roomCode.trim().toUpperCase();
    if (!normalizedCode || loading) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      await joinExam(normalizedCode);
      setJoinedRoomCode(normalizedCode);
      setGuideStepIndex(0);
    } catch (error) {
      setErrorMessage(
        normalizeApiError(error, "Шалгалтад нэгдэж чадсангүй."),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGuideNext = () => {
    if (guideStepIndex === null) return;

    if (guideStepIndex >= JOIN_GUIDE_STEPS.length - 1) {
      router.replace({
        pathname: "/exam",
        params: {
          roomCode: joinedRoomCode ?? roomCode.trim().toUpperCase(),
          autoStart: "1",
        },
      });
      return;
    }

    setGuideStepIndex((current) =>
      current === null ? 0 : Math.min(current + 1, JOIN_GUIDE_STEPS.length - 1),
    );
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={
        currentGuideStep ? styles.guideScreenContent : styles.formScreenContent
      }
    >
      {currentGuideStep ? (
        <View style={styles.guideScreen}>
          <View style={styles.guideContent}>
            <View style={styles.guideVisualWrap}>
              <View
                style={[
                  styles.guideIconBubble,
                  currentGuideStep.tone === "warning" &&
                    styles.guideIconBubbleWarning,
                  currentGuideStep.tone === "danger" &&
                    styles.guideIconBubbleDanger,
                ]}
              >
                <Ionicons
                  name={currentGuideStep.icon}
                  size={72}
                  color={
                    currentGuideStep.tone === "warning"
                      ? "#B45309"
                      : currentGuideStep.tone === "danger"
                        ? "#DC2626"
                        : "#3568F5"
                  }
                />
              </View>
            </View>

            <View style={styles.guideTextBlock}>
              <Text style={styles.guideTitle}>{currentGuideStep.title}</Text>
              <Text style={styles.guideDescription}>
                {currentGuideStep.description}
              </Text>
            </View>

            <View style={styles.guideFooter}>
              <View style={styles.guideDots}>
                {JOIN_GUIDE_STEPS.map((step, index) => (
                  <View
                    key={step.key}
                    style={[
                      styles.guideDot,
                      index === activeGuideIndex && styles.guideDotActive,
                    ]}
                  />
                ))}
              </View>

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleGuideNext}
              >
                <Text style={styles.primaryBtnText}>
                  {activeGuideIndex >= JOIN_GUIDE_STEPS.length - 1
                    ? "Start"
                    : "Цааш"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.formScreen}>
          <Text style={styles.title}>Шалгалтын кодоо оруулна уу.</Text>

          <TextInput
            style={styles.input}
            placeholder="Код оруулах"
            placeholderTextColor="#BBBFC9"
            autoCapitalize="characters"
            autoCorrect={false}
            value={roomCode}
            onChangeText={setRoomCode}
          />

          <Text style={styles.helperText}>
            Багшийн өгсөн кодыг оруулаад шалгалтдаа орно уу.
          </Text>

          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}

          <TouchableOpacity
            style={[
              styles.primaryBtn,
              (!roomCode.trim() || loading) && styles.btnDisabled,
            ]}
            disabled={!roomCode.trim() || loading}
            onPress={() => void handleJoin()}
          >
            <Text style={styles.primaryBtnText}>
              {loading ? "Нэвтэрч байна..." : "Шалгалтад нэгдэх"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  formScreenContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  guideScreenContent: {
    flexGrow: 1,
  },
  formScreen: {
    flex: 1,
    justifyContent: "center",
    gap: 14,
  },
  guideScreen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
    lineHeight: 32,
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#D9E0EE",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#111827",
    backgroundColor: "#FFFFFF",
  },
  helperText: {
    fontSize: 13,
    color: "#667085",
    textAlign: "center",
    lineHeight: 20,
  },
  errorText: {
    color: "#DC2626",
    fontSize: 13,
    textAlign: "center",
  },
  primaryBtn: {
    backgroundColor: "#3568F5",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  btnDisabled: {
    opacity: 0.45,
  },
  guideContent: {
    flex: 1,
    justifyContent: "space-between",
    gap: 24,
    minHeight: 640,
  },
  guideVisualWrap: {
    flex: 1,
    minHeight: 300,
    alignItems: "center",
    justifyContent: "center",
  },
  guideIconBubble: {
    width: 200,
    height: 200,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF4FF",
    borderWidth: 1,
    borderColor: "#C7D8FF",
  },
  guideIconBubbleWarning: {
    backgroundColor: "#FFF7ED",
    borderColor: "#FCD9A8",
  },
  guideIconBubbleDanger: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  guideTextBlock: {
    gap: 12,
  },
  guideTitle: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "800",
    color: "#3568F5",
    textAlign: "center",
  },
  guideDescription: {
    fontSize: 15,
    lineHeight: 23,
    color: "#374151",
    textAlign: "center",
    paddingHorizontal: 12,
  },
  guideFooter: {
    gap: 18,
  },
  guideDots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  guideDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: "#D6D9E4",
  },
  guideDotActive: {
    width: 22,
    backgroundColor: "#3568F5",
  },
});
