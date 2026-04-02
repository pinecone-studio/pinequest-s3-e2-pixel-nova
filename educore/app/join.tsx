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

export default function JoinExamScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ roomCode?: string | string[] }>();
  const { activeSession, joinExam, student } = useStudentApp();
  const prefilledRoomCode = Array.isArray(params.roomCode)
    ? params.roomCode[0] ?? ""
    : params.roomCode ?? activeSession?.roomCode ?? "";
  const [roomCode, setRoomCode] = useState(prefilledRoomCode);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!prefilledRoomCode) return;
    setRoomCode(prefilledRoomCode);
  }, [prefilledRoomCode]);

  if (!student) {
    return <Redirect href="/" />;
  }

  const handleJoin = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      await joinExam(roomCode);
      router.replace("/exam");
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
      <View style={styles.card}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Text style={styles.closeText}>x</Text>
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
          onPress={() => {
            void handleJoin();
          }}
        >
          <Text style={styles.primaryBtnText}>
            {loading ? "Joining..." : "Join exam"}
          </Text>
        </TouchableOpacity>
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
});
