import { StyleSheet } from "react-native";

export const homeStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F2F4F7",
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 8,
  },
  greeting: {
    fontSize: 13,
    color: "#888",
    fontWeight: "500",
  },
  name: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111",
    marginTop: 2,
  },
  bell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  bellDot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF3B30",
    borderWidth: 1.5,
    borderColor: "#fff",
  },

  // Section
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111",
    marginBottom: 10,
    marginTop: 4,
  },
  viewAll: {
    fontSize: 14,
    color: "#5B67F8",
    fontWeight: "600",
  },

  // Card
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    overflow: "hidden",
  },
  cardTopBar: {
    height: 6,
    backgroundColor: "#5B67F8",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  cardBody: {
    padding: 16,
    gap: 10,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  examTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A2E",
    flex: 1,
    marginRight: 8,
  },
  examMeta: {
    fontSize: 13,
    color: "#888",
  },

  // Status pill
  statusPill: {
    backgroundColor: "#E8F5E9",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusPillText: {
    color: "#2E7D32",
    fontSize: 12,
    fontWeight: "700",
  },

  // Buttons
  primaryBtn: {
    backgroundColor: "#5B67F8",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 4,
  },
  primaryBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },

  // Achievements
  badgeRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  badge: {
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  badgeIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeEmoji: {
    fontSize: 26,
  },
  badgeLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111",
  },
  statLabel: {
    fontSize: 11,
    color: "#888",
    marginTop: 2,
    fontWeight: "500",
  },

  // Result
  bigScore: {
    fontSize: 42,
    fontWeight: "900",
    color: "#5B67F8",
  },

  errorText: {
    color: "#FF3B30",
    fontSize: 13,
    textAlign: "center",
    marginTop: 8,
  },
});
