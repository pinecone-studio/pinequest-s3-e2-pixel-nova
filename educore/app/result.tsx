import { Ionicons } from "@expo/vector-icons";
import { Redirect, useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import ResultCelebrationIllustration from "@/components/student-app/ResultCelebrationIllustration";
import { useStudentApp } from "@/lib/student-app/context";
import { resultStyles as styles } from "@/styles/screens/result";

export default function ResultScreen() {
  const router = useRouter();
  const { clearResult, submittedResult, student } = useStudentApp();

  if (!student) {
    return <Redirect href="/" />;
  }

  if (!submittedResult) {
    return <Redirect href="/home" />;
  }

  const xpValue = submittedResult.xpEarned ?? submittedResult.score;

  const handleClose = () => {
    clearResult();
    router.replace("/home");
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <View style={styles.screenContent}>
        <View style={styles.resultCard}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={24} color="#111827" />
          </TouchableOpacity>

          <View style={styles.heroWrap}>
            <View style={styles.heroCheck}>
              <Ionicons name="checkmark" size={34} color="#3568F5" />
            </View>
            <View style={styles.illustrationWrap}>
              <ResultCelebrationIllustration />
            </View>
          </View>

          <Text style={styles.title}>Та шалгалтаа амжилттай дуусгалаа!</Text>

          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, styles.summaryCardBlue]}>
              <Text style={styles.summaryLabel}>Нийт XP</Text>
              <View style={styles.summaryInner}>
                <Ionicons name="flash" size={20} color="#3568F5" />
                <Text style={[styles.summaryValue, styles.summaryValueBlue]}>
                  {xpValue}
                </Text>
              </View>
            </View>

            <View style={[styles.summaryCard, styles.summaryCardGreen]}>
              <Text style={styles.summaryLabel}>Дүн</Text>
              <View style={styles.summaryInner}>
                <Ionicons name="speedometer-outline" size={20} color="#84CC16" />
                <Text style={[styles.summaryValue, styles.summaryValueGreen]}>
                  {submittedResult.score}%
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.collectButton} onPress={handleClose}>
            <Text style={styles.collectButtonText}>XP цуглуулах</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
