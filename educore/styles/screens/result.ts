import { StyleSheet } from "react-native";

export const resultStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  screenContent: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 16,
  },
  resultCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 10,
  },
  closeButton: {
    alignSelf: "flex-end",
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  heroWrap: {
    alignItems: "center",
    marginTop: 2,
  },
  heroCheck: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: "#3568F5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  illustrationWrap: {
    width: "100%",
    height: 250,
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    lineHeight: 36,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: 22,
    paddingHorizontal: 16,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 18,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 20,
    paddingTop: 10,
    paddingBottom: 12,
    paddingHorizontal: 12,
  },
  summaryCardBlue: {
    backgroundColor: "#3568F5",
  },
  summaryCardGreen: {
    backgroundColor: "#97D91F",
  },
  summaryLabel: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  summaryInner: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    minHeight: 76,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  summaryValue: {
    fontSize: 30,
    fontWeight: "800",
  },
  summaryValueBlue: {
    color: "#3568F5",
  },
  summaryValueGreen: {
    color: "#84CC16",
  },
  collectButton: {
    backgroundColor: "#3568F5",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2F5BE3",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
  collectButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
});
