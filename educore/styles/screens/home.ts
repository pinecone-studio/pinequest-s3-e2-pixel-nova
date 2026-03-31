import { StyleSheet } from "react-native";

export const homeStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F4F6FB",
  },
  content: {
    padding: 14,
    paddingBottom: 40,
  },
  greetingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
    marginTop: 4,
  },
  greetingText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },

  calendarCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  calendarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  calendarTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#111827",
  },
  calendarWeekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  calendarDay: {
    alignItems: "center",
    gap: 6,
    width: 34,
  },
  calendarDayLabel: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "500",
  },
  calendarDayCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarDayCircleActive: {
    backgroundColor: "#3D6BDB",
  },
  calendarDayNumber: {
    fontSize: 15,
    color: "#111827",
    fontWeight: "500",
  },
  calendarDayNumberActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  sectionLinkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  sectionLink: {
    fontSize: 14,
    color: "#5B67F8",
    fontWeight: "500",
  },
  sectionLinkMuted: {
    fontSize: 13,
    color: "#9CA3AF",
    fontWeight: "500",
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#DCE5FF",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  cardBody: {
    padding: 16,
    gap: 14,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  examTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
    marginRight: 10,
  },

  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: "600",
  },
  statusPillGreen: {
    backgroundColor: "#E7FAEE",
  },
  statusPillTextGreen: {
    color: "#22C55E",
  },
  statusPillAmber: {
    backgroundColor: "#FEF3C7",
  },
  statusPillTextAmber: {
    color: "#B45309",
  },
  statusPillRed: {
    backgroundColor: "#FEE2E2",
  },
  statusPillTextRed: {
    color: "#DC2626",
  },

  metaTable: {
    gap: 10,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metaLabel: {
    fontSize: 13,
    color: "#A1A1AA",
    fontWeight: "400",
  },
  metaValue: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "400",
  },

  primaryBtn: {
    backgroundColor: "#5B67F8",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: "center",
    marginTop: 2,
    marginLeft: "auto",
    minWidth: 138,
  },
  primaryBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },

  nextList: {
    gap: 12,
    paddingBottom: 6,
  },
  nextCard: {
    width: 178,
    minHeight: 159,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#DCE5FF",
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  nextCardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
    marginRight: 8,
  },
  nextMetaTable: {
    gap: 8,
    marginTop: 14,
    marginBottom: 16,
  },
  nextMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  nextMetaLabel: {
    fontSize: 12,
    color: "#A1A1AA",
    fontWeight: "400",
  },
  nextMetaValue: {
    fontSize: 12,
    color: "#111827",
    fontWeight: "400",
  },
  nextPrimaryBtn: {
    backgroundColor: "#4F6AF2",
    borderRadius: 14,
    paddingVertical: 11,
    alignItems: "center",
    marginTop: "auto",
  },
  nextPrimaryBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "500",
  },
  detailLinkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 3,
    paddingTop: 4,
  },
  detailLink: {
    fontSize: 14,
    color: "#5B67F8",
    fontWeight: "500",
  },

  // ── Kept for compatibility with other parts of the app ──
  name: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111",
    marginTop: 2,
  },
  cardTopBar: {
    height: 6,
    backgroundColor: "#5B67F8",
  },
  examMeta: {
    fontSize: 13,
    color: "#6B7280",
  },
  metaDivider: {
    height: 0.5,
    backgroundColor: "#F0F1F5",
  },
  statusPillWarning: { backgroundColor: "#FEF3C7" },
  statusPillTextWarning: { color: "#B45309" },
  statusPillDanger: { backgroundColor: "#FEE2E2" },
  statusPillTextDanger: { color: "#DC2626" },
  header: {
    display: "none",
  },
  greetingIcon: {
    display: "none",
  },
  greeting: {
    display: "none",
  },
  badgeScroll: {
    marginHorizontal: -20,
    marginBottom: 16,
  },
  badgeScrollContent: {
    paddingHorizontal: 20,
    gap: 12,
    flexDirection: "row",
  },
  badge: {
    alignItems: "center",
    gap: 6,
    width: 80,
  },
  badgeIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeEmoji: { fontSize: 26 },
  badgeLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },
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
