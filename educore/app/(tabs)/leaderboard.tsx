import { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

import { Pill } from "@/components/student-app/ui";
import { useStudentApp } from "@/lib/student-app/context";
import {
  leaderboardStyles as styles,
  podStyles,
} from "@/styles/screens/leaderboard";

function PodiumPlace({
  rank,
  name,
  xp,
  isYou,
}: {
  rank: number;
  name: string;
  xp: number;
  isYou: boolean;
  size: "large" | "small";
}) {
  const isFirst = rank === 1;
  const podiumColors: Record<number, string> = {
    1: "#F5A623",
    2: "#9BA3B8",
    3: "#CD7F32",
  };
  const podiumColor = podiumColors[rank] ?? "#888";
  const avatarEmojis = ["👩‍🎓", "🧑‍💻", "👩‍💼"];
  const podiumHeights: Record<number, number> = { 1: 80, 2: 60, 3: 50 };

  return (
    <View style={podStyles.wrap}>
      {isFirst && <Text style={podStyles.crown}>👑</Text>}
      <View
        style={[
          podStyles.avatar,
          isFirst && podStyles.avatarLarge,
          { borderColor: podiumColor },
        ]}
      >
        <Text style={podStyles.avatarEmoji}>
          {avatarEmojis[(rank - 1) % 3]}
        </Text>
      </View>
      <View
        style={[
          podStyles.podium,
          { backgroundColor: podiumColor, height: podiumHeights[rank] },
        ]}
      >
        <Text style={podStyles.podiumRank}>{rank}</Text>
      </View>
      <Text style={podStyles.podiumName}>{name.split(" ")[0]}</Text>
      <Text style={podStyles.podiumXp}>{(xp / 1000).toFixed(1)}k XP</Text>
    </View>
  );
}

export default function LeaderboardScreen() {
  const { availableUsers, authMode, student } = useStudentApp();
  const [tab, setTab] = useState<"class" | "subject">("class");

  // Богино кодын sort логик
  const rankedUsers = [...availableUsers].sort((left, right) => {
    const xpDiff = (right.xp ?? 0) - (left.xp ?? 0);
    if (xpDiff !== 0) return xpDiff;
    return left.fullName.localeCompare(right.fullName);
  });

  const myRank = rankedUsers.findIndex((u) => u.id === student?.id) + 1;
  const myEntry = rankedUsers.find((u) => u.id === student?.id);
  const top3 = rankedUsers.slice(0, 3);
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);
  const podiumRanks = [2, 1, 3];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Text style={styles.pageTitle}>Тэргүүлэгчид</Text>
      <Text style={styles.pageSubtitle}>XP цуглуулж тэргүүлэгчидтэй нэгд</Text>

      {/* Tab switcher */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, tab === "class" && styles.tabActive]}
          onPress={() => setTab("class")}
        >
          <Text
            style={[styles.tabText, tab === "class" && styles.tabTextActive]}
          >
            10-р анги
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === "subject" && styles.tabActive]}
          onPress={() => setTab("subject")}
        >
          <Text
            style={[styles.tabText, tab === "subject" && styles.tabTextActive]}
          >
            Хичээл
          </Text>
        </TouchableOpacity>
      </View>

      {/* My rank banner */}
      {myEntry && (
        <View style={styles.myRankBanner}>
          <View style={styles.myRankLeft}>
            <Text style={styles.myRankTrophy}>🏆</Text>
            <View>
              <Text style={styles.myRankTitle}>Чиний эрэмбэ</Text>
              <Text style={styles.myRankSub}>Чи {myRank}-т орж байна.</Text>
            </View>
          </View>
          <View style={styles.myRankRight}>
            <Text style={styles.myRankNumber}>#{myRank}</Text>
            <Text style={styles.myRankDelta}>+2 Энэ сар</Text>
          </View>
        </View>
      )}

      {/* Podium */}
      {top3.length >= 2 && (
        <View style={styles.podiumRow}>
          {podiumOrder.map((user, i) => (
            <PodiumPlace
              key={user.id}
              rank={podiumRanks[i]}
              name={user.fullName}
              xp={user.xp ?? 0}
              isYou={user.id === student?.id}
              size={podiumRanks[i] === 1 ? "large" : "small"}
            />
          ))}
        </View>
      )}

      {/* List — богино кодын row логик + Document 13-ийн design */}
      <View style={styles.listCard}>
        {rankedUsers.slice(3).map((entry, index) => {
          const rank = index + 4;
          const isYou = entry.id === student?.id;
          const avgScore = 70 + (Math.floor((entry.xp ?? 0) / 100) % 30);

          return (
            <View
              key={entry.id}
              style={[styles.listRow, isYou && styles.listRowActive]}
            >
              <View style={[styles.rankBadge, isYou && styles.rankBadgeActive]}>
                <Text style={[styles.rankText, isYou && styles.rankTextActive]}>
                  {rank}
                </Text>
              </View>
              <View
                style={[
                  styles.listAvatar,
                  { backgroundColor: isYou ? "#DDD6FE" : "#F2F4F7" },
                ]}
              >
                <Text style={styles.listAvatarEmoji}>
                  {["👩‍🎓", "🧑‍💻", "👩‍💼", "🧑‍🎓", "👨‍💼"][index % 5]}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.nameRow}>
                  <Text style={styles.listName}>
                    {entry.fullName.split(" ")[0]}
                  </Text>
                  {isYou && (
                    <View style={styles.youBadge}>
                      <Text style={styles.youBadgeText}>YOU</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.listLevel}>Lvl {entry.level ?? 1}</Text>
              </View>
              <View style={styles.listRight}>
                <Text style={styles.listXp}>
                  ⚡ {((entry.xp ?? 0) / 1000).toFixed(1)}k
                </Text>
                <View
                  style={[
                    styles.scoreBadge,
                    { backgroundColor: avgScore >= 80 ? "#DCFCE7" : "#FEF3C7" },
                  ]}
                >
                  <Text
                    style={[
                      styles.scoreText,
                      { color: avgScore >= 80 ? "#16A34A" : "#B45309" },
                    ]}
                  >
                    {avgScore}%
                  </Text>
                </View>
              </View>
            </View>
          );
        })}

        {rankedUsers.length === 0 && (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyEmoji}>🏅</Text>
            <Text style={styles.emptyText}>
              Одоохондоо өгөгдөл байхгүй байна
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
