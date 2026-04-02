import { StyleSheet } from "react-native";

export const homeStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F4F6FB",
  },
  content: {
    paddingHorizontal: 14,
    paddingTop: 14,
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
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
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
    borderRadius: 24,
    marginBottom: 16,
    minHeight: 198,
    borderWidth: 1,
    borderColor: "#DCE4FF",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  mockCard: {
    backgroundColor: "#F8F5FF",
    borderColor: "#D7CCFF",
  },
  cardBody: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    gap: 18,
  },
  emptyStateCardBody: {
    padding: 16,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  listCardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardBadgeGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginLeft: 8,
  },
  examTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    lineHeight: 24,
    flex: 1,
    marginRight: 10,
  },
  mockPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    backgroundColor: "#E9E0FF",
  },
  mockPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6D4AFF",
  },

  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: "500",
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
  statusPillBlue: {
    backgroundColor: "#DBEAFE",
  },
  statusPillTextBlue: {
    color: "#2563EB",
  },

  upcomingCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    minHeight: 198,
    gap: 18,
    borderWidth: 1,
    borderColor: "#DCE4FF",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
  },
  upcomingCardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
    marginRight: 10,
    lineHeight: 24,
  },
  upcomingMetaGroup: {
    gap: 16,
  },
  upcomingMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  upcomingMetaLabel: {
    fontSize: 16,
    color: "#A3A3A3",
    flex: 1,
  },
  upcomingMetaValue: {
    fontSize: 16,
    fontWeight: "400",
    color: "#111827",
  },
  upcomingPrimaryButton: {
    marginTop: 4,
    marginLeft: "auto",
    minWidth: 172,
    backgroundColor: "#4F46E5",
    borderRadius: 22,
    paddingVertical: 15,
    paddingHorizontal: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#4F46E5",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 3,
  },
  upcomingButtonRow: {
    marginTop: "auto",
    gap: 12,
    width: "100%",
  },
  upcomingDivider: {
    height: 1,
    backgroundColor: "#E6ECFF",
  },
  upcomingDetailButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 6,
    minHeight: 36,
  },
  upcomingDetailText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#111827",
    lineHeight: 20,
  },
  upcomingDetailArrow: {
    marginRight: -4,
  },

  metaTable: {
    gap: 16,
  },
  metaRow: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    alignItems: "center",
  },
  metaLabel: {
    fontSize: 16,
    color: "#A3A3A3",
    flex: 1,
  },
  metaValue: {
    fontSize: 16,
    color: "#111827",
    fontWeight: "400",
  },
  actionRow: {
    marginTop: "auto",
    gap: 12,
    width: "100%",
  },

  primaryBtn: {
    backgroundColor: "#4F46E5",
    borderRadius: 22,
    paddingVertical: 15,
    paddingHorizontal: 28,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    marginLeft: "auto",
    minWidth: 172,
    shadowColor: "#4F46E5",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 3,
  },
  primaryBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
  emptyStateButton: {
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 58,
  },
  emptyStateButtonText: {
    color: "#4F5FCF",
    fontWeight: "600",
    fontSize: 14,
    textAlign: "center",
  },

  nextList: {
    gap: 18,
    paddingBottom: 6,
  },
  nextCard: {
    width: 178,
    minHeight: 154,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#D9E2FF",
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  nextCardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
    marginRight: 8,
  },
  nextMetaTable: {
    gap: 12,
    marginTop: 14,
    marginBottom: 12,
  },
  nextMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  nextMetaLabel: {
    fontSize: 14,
    color: "#A3A3A3",
    fontWeight: "400",
  },
  nextMetaValue: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "400",
  },
  nextDivider: {
    height: 1,
    backgroundColor: "#E6ECFF",
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
    gap: 6,
    paddingTop: 14,
  },
  detailLink: {
    fontSize: 15,
    color: "#111827",
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
