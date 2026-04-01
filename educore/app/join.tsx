import { Redirect, useRouter } from "expo-router";
import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";

import { useStudentApp } from "@/lib/student-app/context";
import {
  formatDateTime,
  getEntryStatusLabel,
  normalizeApiError,
} from "@/lib/student-app/utils";

export default function JoinExamScreen() {
  const router = useRouter();
  const { activeSession, joinExam, student } = useStudentApp();
  const [roomCode, setRoomCode] = useState(activeSession?.roomCode ?? "");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!student) {
    return <Redirect href="/" />;
  }

  const handleJoin = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      await joinExam(roomCode);
    } catch (error) {
      setErrorMessage(
        normalizeApiError(error, "Could not join an exam with this code."),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Join card */}
      <View style={styles.card}>
        {/* Close button */}
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Text style={styles.closeText}>×</Text>
        </TouchableOpacity>

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

        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}

        <TouchableOpacity
          style={[
            styles.gradientBtn,
            (!roomCode.trim() || loading) && styles.btnDisabled,
          ]}
          disabled={!roomCode.trim() || loading}
          onPress={() => {
            void handleJoin();
          }}
        >
          <Text style={styles.gradientBtnText}>
            {loading ? "Joining..." : "Join exam"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Active session card */}
      {activeSession ? (
        <View style={styles.card}>
          <View style={styles.cardTopBar} />
          <View style={styles.cardBody}>
            <Text style={styles.examTitle}>{activeSession.exam.title}</Text>

            <View style={styles.statusPill}>
              <Text style={styles.statusPillText}>
                {getEntryStatusLabel(activeSession.entryStatus)}
              </Text>
            </View>

            <Text style={styles.metaText}>
              {activeSession.exam.durationMin} min ·{" "}
              {activeSession.questions.length} questions
            </Text>
            <Text style={styles.metaText}>
              {formatDateTime(
                activeSession.exam.scheduledAt ?? activeSession.startedAt,
              )}
            </Text>

            {activeSession.entryStatus === "late" ? (
              <Text style={styles.warningText}>
                You joined late. Start as soon as possible to preserve your
                remaining time.
              </Text>
            ) : null}

            <TouchableOpacity
              style={styles.gradientBtn}
              onPress={() => router.push("/exam")}
            >
              <Text style={styles.gradientBtnText}>Open exam</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => router.replace("/home")}
            >
              <Text style={styles.secondaryBtnText}>Back to home</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F2F4F7",
  },
  content: {
    padding: 20,
    paddingTop: 40,
    paddingBottom: 40,
    gap: 16,
  },

  // Card
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 4,
    marginTop: 190,
  },
  cardTopBar: {
    height: 6,
    backgroundColor: "#5B67F8",
    borderRadius: 4,
    marginBottom: 16,
  },
  cardBody: {
    gap: 10,
  },

  // Close
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
    color: "#999",
    fontWeight: "600",
  },

  // Title
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 24,
    lineHeight: 30,
  },

  // Input
  input: {
    borderWidth: 1.5,
    borderColor: "#DDE1EF",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#111",
    marginBottom: 12,
  },

  // Gradient button (solid fallback)
  gradientBtn: {
    backgroundColor: "#5B67F8",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 4,
  },
  btnDisabled: {
    opacity: 0.4,
  },
  gradientBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },

  // Secondary button
  secondaryBtn: {
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
    backgroundColor: "#F2F4F7",
    marginTop: 4,
  },
  secondaryBtnText: {
    color: "#5B67F8",
    fontWeight: "600",
    fontSize: 15,
  },

  // Exam info
  examTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1A1A2E",
  },
  statusPill: {
    alignSelf: "flex-start",
    backgroundColor: "#E8F5E9",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  statusPillText: {
    color: "#2E7D32",
    fontSize: 12,
    fontWeight: "700",
  },
  metaText: {
    fontSize: 13,
    color: "#888",
  },
  warningText: {
    fontSize: 13,
    color: "#B45309",
    backgroundColor: "#FEF3C7",
    padding: 10,
    borderRadius: 10,
  },
  errorText: {
    color: "#DC2626",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 4,
  },
});
