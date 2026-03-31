import { StyleSheet } from "react-native";

export const homeStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F5F6FA",
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },

  // ── Greeting header ──
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    marginBottom: 20,
  },
  greetingIcon: {
    // slight offset so icon aligns with text baseline
    marginTop: 1,
  },
  brandWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexShrink: 1,
  },
  brandIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
  },
  brandTextWrap: {
    flexShrink: 1,
  },
  brandName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1D4ED8",
    marginBottom: 2,
  },
  greeting: {
    fontSize: 14,
    color: "#888",
    fontWeight: "500",
  },

  // ── Section row (title + "Бүгд ›") ──
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
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

  // ── Exam card ──
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardBody: {
    padding: 16,
    gap: 12,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  examTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
    flex: 1,
    marginRight: 10,
  },

  // ── Status pills ──
  statusPill: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: "700",
  },
  statusPillGreen: {
    backgroundColor: "#E6F9F1",
  },
  statusPillTextGreen: {
    color: "#1D9E75",
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

  // ── Meta table (Өдөр / Эхэлсэн цаг / Үргэлжилсэн хугацаа) ──
  metaTable: {
    gap: 0,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 5,
  },
  metaDivider: {
    height: 0.5,
    backgroundColor: "#F0F1F5",
  },
  metaLabel: {
    fontSize: 13,
    color: "#AAB0C0",
    fontWeight: "400",
  },
  metaValue: {
    fontSize: 13,
    color: "#333",
    fontWeight: "500",
  },

  // ── Primary button ──
  primaryBtn: {
    backgroundColor: "#5B67F8",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 2,
  },
  primaryBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },

  // ── "Дэлгэрэнгүй ›" link ──
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
    color: "#888",
  },
  statusPillWarning: { backgroundColor: "#FEF3C7" },
  statusPillTextWarning: { color: "#B45309" },
  statusPillDanger: { backgroundColor: "#FEE2E2" },
  statusPillTextDanger: { color: "#DC2626" },
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
