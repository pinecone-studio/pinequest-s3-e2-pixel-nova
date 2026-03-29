import { StyleSheet } from 'react-native';

export const uiStyles = StyleSheet.create({
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFDF7',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFE6D4',
  },
  statLabel: {
    fontSize: 13,
    color: '#6A655B',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2A1F',
  },
});

export const studentAppUiStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F1E8',
  },
  keyboard: {
    flex: 1,
  },
  screenInner: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
  },
  card: {
    backgroundColor: '#FFFCF5',
    borderRadius: 28,
    padding: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: '#E7DDCB',
    shadowColor: '#5A4630',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  sectionHeader: {
    gap: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1D2A24',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: '#5E655D',
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#274336',
  },
  input: {
    borderWidth: 1,
    borderColor: '#DCCFB6',
    backgroundColor: '#FFF9ED',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1F2A1F',
  },
  inputMultiline: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  buttonPrimary: {
    backgroundColor: '#2D6A4F',
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimaryText: {
    color: '#FFF8E8',
    fontWeight: '800',
    fontSize: 16,
  },
  buttonSecondary: {
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CDBFA7',
    backgroundColor: '#FFF8EA',
  },
  buttonSecondaryText: {
    color: '#6B5642',
    fontWeight: '700',
    fontSize: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },
  errorText: {
    color: '#A13131',
    fontSize: 14,
    lineHeight: 20,
  },
  pill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: '#EFE7D5',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pillSuccess: {
    backgroundColor: '#E7F2EA',
  },
  pillWarning: {
    backgroundColor: '#F9E9D2',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4F5F4C',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});
