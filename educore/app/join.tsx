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
      "Камер асаалттай байх ёстой. Нүүр тань бүтэн харагдаж байх шаардлагатай.",
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
      "Цонх солих, өөр апп руу гарах, дэлгэц хуваах үйлдэл зөвшөөрөгдөхгүй.",
    icon: "swap-horizontal-outline",
    tone: "warning",
  },
  {
    key: "copy",
    title: "Copy Paste хийх",
    description:
      "Шалгалтын үеэр текст copy болон paste хийхийг систем хориглоно.",
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
        normalizeApiError(error, "Шалгалтанд нэгдэж чадсангүй."),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGuideNext = () => {
    if (guideStepIndex === null) return;
    if (guideStepIndex >= JOIN_GUIDE_STEPS.length - 1) {
      router.replace({
        pathname: "/exam/[id]",
        params: {
          id: joinedRoomCode ?? roomCode.trim().toUpperCase(),
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
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => {
            if (guideStepIndex !== null) {
              setGuideStepIndex(null);
              return;
            }
            router.back();
          }}
        >
          <Text style={styles.closeText}>x</Text>
        </TouchableOpacity>

        {currentGuideStep ? (
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
                  size={48}
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

            <Text style={styles.guideTitle}>{currentGuideStep.title}</Text>
            <Text style={styles.guideDescription}>
              {currentGuideStep.description}
            </Text>

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
        ) : (
          <>
            <Text style={styles.title}>Enter your exam access code.</Text>

            <TextInput
              style={styles.input}
              placeholder="Enter code"
              placeholderTextColor="#BBBFC9"
              autoCapitalize="characters"
              autoCorrect={false}
              value={roomCode}
              onChangeText={setRoomCode}
            />

            <Text style={styles.helperText}>
              Enter the code your teacher shared with you.
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
                {loading ? "Joining..." : "Join exam"}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F2F4F7",
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    minHeight: 320,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  closeBtn: {
    position: "absolute",
    top: 12,
    right: 16,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    fontSize: 18,
    color: "#98A2B3",
    fontWeight: "600",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 24,
    lineHeight: 30,
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#D9E0EE",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#111827",
    marginBottom: 12,
  },
  helperText: {
    fontSize: 13,
    color: "#667085",
    textAlign: "center",
    marginBottom: 10,
  },
  errorText: {
    color: "#DC2626",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 8,
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
    justifyContent: "center",
    gap: 18,
    paddingTop: 20,
  },
  guideVisualWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 10,
  },
  guideIconBubble: {
    width: 132,
    height: 132,
    borderRadius: 32,
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
    paddingHorizontal: 8,
  },
  guideDots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingTop: 2,
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
