import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useStudentApp } from "@/lib/student-app/context";
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

type SubjectInsight = {
  attention: SubjectBreakdownRow[];
  strengths: SubjectBreakdownRow[];
  tips: string[];
};

const SUBJECT_SCORES: SubjectScore[] = [
  { name: "Англи хэл", score: 92, color: "#10B981" },
  { name: "Математик", score: 88, color: "#6366F1" },
  { name: "Хими", score: 79, color: "#EC4899" },
  { name: "Физик", score: 74, color: "#3B82F6" },
];

const SUBJECT_INSIGHTS: Record<string, SubjectInsight> = {
  "Математик": {
    attention: [
      { label: "Алгебр", score: 45 },
      { label: "Матриц", score: 52 },
    ],
    strengths: [
      { label: "Геометр", score: 92 },
      { label: "Тригонометр", score: 88 },
    ],
    tips: [
      "Алгебрын бодлогуудыг өдөр бүр бага багаар бодоорой",
      "Тэгшитгэлийн 5 нэмэлт дасгал хийж үзээрэй",
      "4-р бүлгийн квадрат тэгшитгэлийн томьёог давтаарай",
    ],
  },
  "Англи хэл": {
    attention: [
      { label: "Writing", score: 58 },
      { label: "Grammar", score: 64 },
    ],
    strengths: [
      { label: "Reading", score: 92 },
      { label: "Listening", score: 90 },
    ],
    tips: [
      "Өдөр бүр 10 шинэ үг цээжлээрэй",
      "Grammar exercise-ээ тогтмол ажиллаарай",
      "Богино эх уншаад дүгнэлт бичиж хэвшээрэй",
    ],
  },
  "Хими": {
    attention: [
      { label: "Органик", score: 55 },
      { label: "Тооцоотой бодлого", score: 61 },
    ],
    strengths: [
      { label: "Элемент", score: 84 },
      { label: "Лаборатори", score: 79 },
    ],
    tips: [
      "Томьёонуудын карт бэлдэж давтаарай",
      "Жишээ бодлогуудыг шаталж бодоорой",
      "Урвалын тэнцвэржүүлэлтийг дахин давтаарай",
    ],
  },
  "Физик": {
    attention: [
      { label: "Кинематик", score: 57 },
      { label: "Цахилгаан", score: 63 },
    ],
    strengths: [
      { label: "Оптик", score: 82 },
      { label: "Долгион", score: 78 },
    ],
    tips: [
      "Томьёо бүрийг жишээтэй цээжлээрэй",
      "Нэгж хувиргалтыг алгасалгүй шалгаарай",
      "Өмнөх шалгалтын бодлогуудыг дахин бодоорой",
    ],
  },
};

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
  const insight = subject ? SUBJECT_INSIGHTS[subject.name] : null;

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
            <View style={styles.modalSectionDanger}>
              <View style={styles.modalSectionTitleRow}>
                <Ionicons name="alert-circle-outline" size={22} color="#EF4444" />
                <Text style={styles.modalSectionTitle}>Анхаарах хэрэгтэй</Text>
              </View>
              {insight?.attention.map((row) => (
                <TopicRow key={row.label} row={row} color="#EF4444" />
              ))}
            </View>

            <View style={styles.modalSectionSuccess}>
              <View style={styles.modalSectionTitleRow}>
                <Ionicons name="checkmark-circle-outline" size={22} color="#10B981" />
                <Text style={styles.modalSectionTitle}>Гүйцэтгэл өндөр сэдэв</Text>
              </View>
              {insight?.strengths.map((row) => (
                <TopicRow key={row.label} row={row} color="#10B981" />
              ))}
            </View>

            <View style={styles.modalSectionTips}>
              <View style={styles.modalSectionTitleRow}>
                <Ionicons name="bulb-outline" size={22} color="#F59E0B" />
                <Text style={styles.modalSectionTitle}>Зөвлөгөө</Text>
              </View>
              <View style={styles.tipList}>
                {insight?.tips.map((tip) => (
                  <View key={tip} style={styles.tipRow}>
                    <Text style={styles.tipBullet}>•</Text>
                    <Text style={styles.tipText}>{tip}</Text>
                  </View>
                ))}
              </View>
            </View>
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
  const { availableUsers, progressSummary, student } = useStudentApp();
  const [selectedSubject, setSelectedSubject] = useState<SubjectScore | null>(null);

  const rankedUsers = useMemo(
    () =>
      [...availableUsers].sort((left, right) => {
        const xpDiff = (right.xp ?? 0) - (left.xp ?? 0);
        if (xpDiff !== 0) return xpDiff;
        return left.fullName.localeCompare(right.fullName);
      }),
    [availableUsers],
  );

  const currentIndex = rankedUsers.findIndex((entry) => entry.id === student?.id);
  const safeIndex = currentIndex >= 0 ? currentIndex : 0;
  const currentUser = rankedUsers[safeIndex] ?? student ?? null;
  const currentRank = safeIndex + 1 || 1;
  const xpGain =
    progressSummary.latestScore !== null
      ? `↑ ${Math.max(5, Math.round(progressSummary.latestScore / 2))}xp`
      : "↑ 50xp";

  const rankItems: RankCardItem[] = [
    rankedUsers[safeIndex - 1]
      ? {
          rank: safeIndex,
          name: rankedUsers[safeIndex - 1].fullName.split(" ")[0] || "Сурагч",
          level: rankedUsers[safeIndex - 1].level ?? 11,
          xpLabel: formatXpLabel(rankedUsers[safeIndex - 1].xp),
          isCurrent: false,
        }
      : {
          rank: Math.max(1, currentRank - 1),
          name: "Сурагч",
          level: 11,
          xpLabel: "2.1k",
          isCurrent: false,
        },
    {
      rank: currentRank,
      name: currentUser?.fullName.split(" ")[0] || "Золбаяр",
      level: currentUser?.level ?? 12,
      xpLabel: formatXpLabel(currentUser?.xp),
      isCurrent: true,
    },
    rankedUsers[safeIndex + 1]
      ? {
          rank: safeIndex + 2,
          name: rankedUsers[safeIndex + 1].fullName.split(" ")[0] || "Сурагч",
          level: rankedUsers[safeIndex + 1].level ?? 11,
          xpLabel: formatXpLabel(rankedUsers[safeIndex + 1].xp),
          isCurrent: false,
        }
      : {
          rank: currentRank + 1,
          name: "Сурагч",
          level: 11,
          xpLabel: "2.1k",
          isCurrent: false,
        },
  ];

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
      <Text style={styles.sectionTitle}>Таны эрэмбэ</Text>

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

      <View style={styles.subjectList}>
        {SUBJECT_SCORES.map((subject) => (
          <SubjectCard
            key={subject.name}
            subject={subject}
            onPress={() => setSelectedSubject(subject)}
          />
        ))}
      </View>

      <SubjectDetailModal
        subject={selectedSubject}
        onClose={() => setSelectedSubject(null)}
      />
      </ScrollView>
    </SafeAreaView>
  );
}
