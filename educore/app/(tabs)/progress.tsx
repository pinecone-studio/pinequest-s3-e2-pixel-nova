import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useStudentApp } from "@/lib/student-app/context";
import {
  getStudentSubjectProgress,
  getStudentAiTips,
  getXpLeaderboard,
} from "@/lib/student-app/services/api";
import type { SubjectAiTips, SubjectProgressItem, XpLeaderboardEntry } from "@/types/student-app";
import { progressStyles as styles } from "@/styles/screens/progress";

type RankCardItem = {
  rank: number;
  name: string;
  level: number;
  xpLabel: string;
  isCurrent: boolean;
};

type SubjectScore = {
  name: string;
  score: number;
  color: string;
};

type SubjectBreakdownRow = {
  label: string;
  score: number;
};

const SUBJECT_COLORS = ["#10B981", "#6366F1", "#EC4899", "#3B82F6", "#F59E0B", "#8B5CF6"];

function formatXpLabel(xp?: number) {
  return `${((xp ?? 0) / 1000).toFixed(1)}k`;
}

function getAvatar(rank: number, isCurrent: boolean) {
  if (isCurrent) return "🧑‍🎓";
  if (rank % 3 === 0) return "👱";
  if (rank % 3 === 1) return "👨";
  return "👩";
}

function RankCard({
  item,
  gainLabel,
}: {
  item: RankCardItem;
  gainLabel?: string;
}) {
  return (
    <View style={[styles.rankCard, item.isCurrent && styles.rankCardActive]}>
      <View style={styles.rankLeft}>
        <View
          style={[
            styles.rankCircle,
            item.isCurrent && styles.rankCircleActive,
          ]}
        >
          <Text
            style={[
              styles.rankCircleText,
              item.isCurrent && styles.rankCircleTextActive,
            ]}
          >
            {item.rank}
          </Text>
        </View>

        <View
          style={[
            styles.avatarWrap,
            item.isCurrent && styles.avatarWrapActive,
          ]}
        >
          <Text style={styles.avatarText}>
            {getAvatar(item.rank, item.isCurrent)}
          </Text>
        </View>

        <View style={styles.rankMeta}>
          <View style={styles.rankNameRow}>
            <Text
              style={[
                styles.rankName,
                item.isCurrent && styles.rankNameActive,
              ]}
            >
              {item.name}
            </Text>
            {item.isCurrent ? (
              <View style={styles.youBadge}>
                <Text style={styles.youBadgeText}>YOU</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.rankLevel}>Lvl {item.level}</Text>
        </View>
      </View>

      <View style={styles.rankRight}>
        {item.isCurrent && gainLabel ? (
          <Text style={styles.rankGain}>{gainLabel}</Text>
        ) : null}
        <View style={styles.rankXpRow}>
          <Ionicons
            name="flash-outline"
            size={14}
            color={item.isCurrent ? "#3B82F6" : "#C7CDD8"}
          />
          <Text
            style={[
              styles.rankXp,
              item.isCurrent && styles.rankXpActive,
            ]}
          >
            {item.xpLabel}
          </Text>
        </View>
      </View>
    </View>
  );
}

function TopicRow({
  row,
  color,
}: {
  row: SubjectBreakdownRow;
  color: string;
}) {
  return (
    <View style={styles.topicRow}>
      <Text style={styles.topicLabel}>{row.label}</Text>
      <View style={styles.topicRight}>
        <View style={styles.topicTrack}>
          <View
            style={[
              styles.topicFill,
              { width: `${row.score}%`, backgroundColor: color },
            ]}
          />
        </View>
        <Text style={[styles.topicScore, { color }]}>{row.score}%</Text>
      </View>
    </View>
  );
}

function SubjectDetailModal({
  subject,
  onClose,
}: {
  subject: SubjectScore | null;
  onClose: () => void;
}) {
  const { student } = useStudentApp();
  const [tips, setTips] = useState<SubjectAiTips | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!subject || !student) return;
    setTips(null);
    setLoading(true);
    getStudentAiTips(student, subject.name, subject.score)
      .then(setTips)
      .catch(() => setTips(null))
      .finally(() => setLoading(false));
  }, [subject?.name, student]);

  return (
    <Modal
      visible={!!subject}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{subject?.name}</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <ActivityIndicator color="#3B82F6" style={{ marginVertical: 32 }} />
            ) : (
              <>
                <View style={styles.modalSectionDanger}>
                  <View style={styles.modalSectionTitleRow}>
                    <Ionicons name="alert-circle-outline" size={22} color="#EF4444" />
                    <Text style={styles.modalSectionTitle}>Анхаарах хэрэгтэй</Text>
                  </View>
                  {(tips?.attention ?? []).map((row) => (
                    <TopicRow key={row.label} row={row} color="#EF4444" />
                  ))}
                </View>

                <View style={styles.modalSectionSuccess}>
                  <View style={styles.modalSectionTitleRow}>
                    <Ionicons name="checkmark-circle-outline" size={22} color="#10B981" />
                    <Text style={styles.modalSectionTitle}>Гүйцэтгэл өндөр сэдэв</Text>
                  </View>
                  {(tips?.strengths ?? []).map((row) => (
                    <TopicRow key={row.label} row={row} color="#10B981" />
                  ))}
                </View>

                <View style={styles.modalSectionTips}>
                  <View style={styles.modalSectionTitleRow}>
                    <Ionicons name="bulb-outline" size={22} color="#F59E0B" />
                    <Text style={styles.modalSectionTitle}>Зөвлөгөө</Text>
                  </View>
                  <View style={styles.tipList}>
                    {(tips?.tips ?? []).map((tip) => (
                      <View key={tip} style={styles.tipRow}>
                        <Text style={styles.tipBullet}>•</Text>
                        <Text style={styles.tipText}>{tip}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function SubjectCard({
  subject,
  onPress,
}: {
  subject: SubjectScore;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.subjectCard} onPress={onPress}>
      <View style={styles.subjectHeader}>
        <Text style={styles.subjectName}>{subject.name}</Text>
        <View style={styles.subjectRight}>
          <Text style={styles.subjectScore}>{subject.score}%</Text>
          <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </View>
      </View>

      <View style={styles.subjectBarTrack}>
        <View
          style={[
            styles.subjectBarFill,
            { width: `${subject.score}%`, backgroundColor: subject.color },
          ]}
        />
      </View>
    </Pressable>
  );
}

export default function ProgressScreen() {
  const { dashboardLoading, progressSummary, student } = useStudentApp();
  const [selectedSubject, setSelectedSubject] = useState<SubjectScore | null>(null);

  const [subjectProgress, setSubjectProgress] = useState<SubjectProgressItem[]>([]);
  const [subjectLoading, setSubjectLoading] = useState(false);
  const [leaderboard, setLeaderboard] = useState<XpLeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  useEffect(() => {
    if (!student) return;
    setSubjectLoading(true);
    getStudentSubjectProgress(student)
      .then(setSubjectProgress)
      .catch(() => setSubjectProgress([]))
      .finally(() => setSubjectLoading(false));

    setLeaderboardLoading(true);
    getXpLeaderboard(student)
      .then(setLeaderboard)
      .catch(() => setLeaderboard([]))
      .finally(() => setLeaderboardLoading(false));
  }, [student]);

  const subjectScores: SubjectScore[] = useMemo(
    () =>
      subjectProgress.map((item, index) => ({
        name: item.name,
        score: item.averageScore,
        color: SUBJECT_COLORS[index % SUBJECT_COLORS.length],
      })),
    [subjectProgress],
  );

  const currentIndex = leaderboard.findIndex((entry) => entry.id === student?.id);
  const safeIndex = currentIndex >= 0 ? currentIndex : leaderboard.length;

  const currentEntry = leaderboard[currentIndex] ?? {
    id: student?.id ?? "",
    fullName: student?.fullName ?? "Та",
    xp: student?.xp ?? 0,
    level: student?.level ?? 1,
    rank: safeIndex + 1,
  };

  const currentRank = currentIndex >= 0 ? currentIndex + 1 : safeIndex + 1;

  const xpGain =
    progressSummary.latestScore !== null
      ? `↑ ${Math.max(5, Math.round(progressSummary.latestScore / 2))}xp`
      : "↑ 50xp";

  const rankItems: RankCardItem[] = useMemo(() => {
    return leaderboard.slice(0, 3).map((entry, index) => {
      const isCurrent = entry.id === student?.id;
      return {
        rank: index + 1,
        name: isCurrent ? (currentEntry.fullName.split(" ")[0] || "Та") : "Сурагч",
        level: entry.level,
        xpLabel: formatXpLabel(entry.xp),
        isCurrent,
      };
    });
  }, [leaderboard, student?.id, currentEntry]);

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
      <Text style={styles.sectionTitle}>Таны эрэмбэ</Text>

      {dashboardLoading || leaderboardLoading ? (
        <View style={styles.rankCard}>
          <Text style={styles.rankName}>Refreshing progress...</Text>
          <Text style={styles.rankLevel}>
            Updating leaderboard and latest performance details.
          </Text>
        </View>
      ) : null}

      <View style={styles.rankList}>
        {rankItems.map((item) => (
          <RankCard
            key={`${item.rank}-${item.name}-${item.isCurrent ? "me" : "peer"}`}
            item={item}
            gainLabel={item.isCurrent ? xpGain : undefined}
          />
        ))}
      </View>

      <Text style={styles.sectionTitle}>Хичээлийн дүн</Text>

      {subjectLoading ? (
        <ActivityIndicator color="#3B82F6" style={{ marginVertical: 16 }} />
      ) : subjectScores.length === 0 ? null : (
        <View style={styles.subjectList}>
          {subjectScores.map((subject) => (
            <SubjectCard
              key={subject.name}
              subject={subject}
              onPress={() => setSelectedSubject(subject)}
            />
          ))}
        </View>
      )}

      <SubjectDetailModal
        subject={selectedSubject}
        onClose={() => setSelectedSubject(null)}
      />
      </ScrollView>
    </SafeAreaView>
  );
}
