import { StyleSheet } from "react-native";

const AVATAR_SIZE = 172;
const AVATAR_OVERLAP = 50;

export const profileStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F0F4FF",
  },
  content: {
    paddingHorizontal: 15,
    paddingTop: 40,
    paddingBottom: 92,
  },

  // Wrapper: avatar first, card second
  heroWrapper: {
    marginBottom: 14,
  },

  // Avatar — centered, behind card (zIndex 0)
  avatarContainer: {
    alignItems: "center",
    zIndex: 0,
    marginBottom: -AVATAR_OVERLAP - 10,
  },
  avatarShell: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 3,
    borderColor: "#2563EB",
    overflow: "hidden",
    backgroundColor: "#EFF6FF",
    // No shadow — clean circle
    shadowColor: "transparent",
    elevation: 0,
  },
  avatarImage: {
    width: "100%",
    height: "108%",
    marginTop: "-8%",
  },
  avatarImageDefault: {
    transform: [{ scale: 1.08 }],
  },
  avatarFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFF6FF",
  },
  avatarInitials: {
    fontSize: 40,
    fontWeight: "800",
    color: "#2563EB",
  },

  // Card — above avatar (zIndex 1), avatar bottom peeking above card top
  profileCard: {
    borderRadius: 24,
    overflow: "hidden",
    paddingTop: AVATAR_OVERLAP - 8,
    paddingHorizontal: 16,
    paddingBottom: 17,
    backgroundColor: "rgba(255,255,255,0.6)",
    borderWidth: 1,
    borderColor: "rgba(37,99,235,0.15)",
    shadowColor: "#2563EB",
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
    zIndex: 1,
  },
  profileHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  profileHeaderText: {
    flex: 1,
    paddingRight: 12,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0C121A",
    marginBottom: 2,
  },
  profileRole: {
    fontSize: 12,
    color: "#7A8A8C",
    fontWeight: "400",
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },


  xpSection: {
    gap: 6,
  },
  xpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  xpLabel: {
    fontSize: 12,
    color: "#7A8A8C",
    fontWeight: "400",
  },
  xpValue: {
    fontSize: 12,
    color: "#7A8A8C",
    fontWeight: "500",
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "rgba(37,99,235,0.12)",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#2563EB",
  },

  // ─── Feature cards ──────────────────────────────────────────────────────────
  featureRow: {
    flexDirection: "row",
    gap: 24,
    marginBottom: 14,
  },
  featureCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(37,99,235,0.4)",
    paddingVertical: 13,
    paddingHorizontal: 13,
    alignItems: "center",
    gap: 6,
  },
  featureIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0C121A",
    textAlign: "center",
  },
  featureSubtitle: {
    fontSize: 14,
    color: "#7A8A8C",
    fontWeight: "400",
    textAlign: "center",
  },

  // ─── Achievements ───────────────────────────────────────────────────────────
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0C121A",
  },
  sectionMeta: {
    fontSize: 12,
    color: "#7A8A8C",
  },
  achievementRow: {
    flexDirection: "row",
    gap: 24,
    marginBottom: 14,
  },
  achievementCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(37,99,235,0.4)",
    paddingVertical: 17,
    paddingHorizontal: 13,
    alignItems: "center",
    gap: 8,
    overflow: "hidden",
  },
  achievementIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  achievementIcon: {
    fontSize: 18,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0C121A",
    textAlign: "center",
  },
  achievementSubtitle: {
    fontSize: 14,
    color: "#7A8A8C",
    fontWeight: "400",
    textAlign: "center",
  },

  // ─── Menu ──────────────────────────────────────────────────────────────────
  menuCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(37,99,235,0.4)",
    overflow: "hidden",
    marginBottom: 14,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  menuIconWrap: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  menuCopy: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0C121A",
    lineHeight: 20,
  },
  menuLabelDanger: {
    fontSize: 14,
    fontWeight: "600",
    color: "#E62B34",
    lineHeight: 20,
  },
  menuSub: {
    fontSize: 12,
    color: "#7A8A8C",
    lineHeight: 16,
  },
  menuDivider: {
    height: 1,
    backgroundColor: "#DDE1E8",
  },

  // ─── Panels ────────────────────────────────────────────────────────────────
  panelCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(37,99,235,0.4)",
    padding: 16,
    marginBottom: 14,
    gap: 12,
  },
  panelTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0C121A",
  },
  panelText: {
    fontSize: 13,
    color: "#7A8A8C",
    lineHeight: 20,
  },
  selectorOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(37,99,235,0.2)",
    backgroundColor: "#FAFBFF",
  },
  selectorOptionSelected: {
    backgroundColor: "#EFF6FF",
    borderColor: "#2563EB",
  },
  selectorName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0C121A",
  },
  selectorCode: {
    fontSize: 13,
    color: "#7A8A8C",
    marginTop: 2,
  },
  feedbackText: {
    fontSize: 13,
    textAlign: "center",
  },
  actionButton: {
    backgroundColor: "#2563EB",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.45,
  },
});

export const achStyles = StyleSheet.create({});
