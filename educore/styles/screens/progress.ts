import { StyleSheet } from "react-native";

export const progressStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8FAFC" },
  content: { padding: 16, paddingBottom: 32, gap: 14 },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    marginTop: 2,
  },

  rankList: {
    gap: 8,
  },
  rankCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: "#E8EDF5",
  },
  rankCardActive: {
    borderColor: "#C7D2FE",
    shadowColor: "#2563EB",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  rankLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  rankCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#EEF2F7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  rankCircleActive: {
    backgroundColor: "#2563EB",
  },
  rankCircleText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#B3BDC9",
  },
  rankCircleTextActive: {
    color: "#FFFFFF",
  },
  avatarWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFF7D6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarWrapActive: {
    backgroundColor: "#E8F0FF",
  },
  avatarText: {
    fontSize: 20,
  },
  rankMeta: {
    flex: 1,
  },
  rankNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rankName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#C0C8D4",
  },
  rankNameActive: {
    color: "#2563EB",
  },
  youBadge: {
    backgroundColor: "#3B82F6",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  youBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  rankLevel: {
    fontSize: 13,
    color: "#A3ACB9",
    marginTop: 2,
  },
  rankRight: {
    alignItems: "flex-end",
    gap: 4,
    marginLeft: 12,
  },
  rankGain: {
    fontSize: 12,
    fontWeight: "700",
    color: "#22C55E",
  },
  rankXpRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  rankXp: {
    fontSize: 16,
    fontWeight: "700",
    color: "#C0C8D4",
  },
  rankXpActive: {
    color: "#2563EB",
  },

  subjectList: {
    gap: 10,
  },
  subjectCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 14,
    borderWidth: 1,
    borderColor: "#CFE0FF",
  },
  subjectHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  subjectRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  subjectScore: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  subjectBarTrack: {
    height: 7,
    borderRadius: 999,
    backgroundColor: "#E8EEF7",
    overflow: "hidden",
  },
  subjectBarFill: {
    height: "100%",
    borderRadius: 999,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    overflow: "hidden",
    maxHeight: "86%",
  },
  modalHeader: {
    backgroundColor: "#3467E8",
    paddingHorizontal: 16,
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  modalContent: {
    padding: 14,
    gap: 16,
  },
  modalSectionDanger: {
    backgroundColor: "#FFF1F1",
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  modalSectionSuccess: {
    backgroundColor: "#ECFDF5",
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  modalSectionTips: {
    backgroundColor: "#FFF7ED",
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  modalSectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  modalSectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1F2937",
  },
  topicRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  topicLabel: {
    flex: 1,
    fontSize: 14,
    color: "#6B7280",
  },
  topicRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  topicTrack: {
    width: 72,
    height: 6,
    borderRadius: 999,
    backgroundColor: "rgba(148, 163, 184, 0.25)",
    overflow: "hidden",
  },
  topicFill: {
    height: "100%",
    borderRadius: 999,
  },
  topicScore: {
    width: 36,
    textAlign: "right",
    fontSize: 14,
    fontWeight: "700",
  },
  tipList: {
    gap: 10,
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  tipBullet: {
    fontSize: 16,
    color: "#F59E0B",
    lineHeight: 20,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    color: "#6B7280",
  },
});
