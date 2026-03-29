import { StyleSheet } from 'react-native';

export const leaderboardStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#EFE5D4',
  },
  activeRow: {
    backgroundColor: '#F7FBF5',
    borderRadius: 18,
    paddingHorizontal: 12,
  },
  rank: {
    width: 28,
    fontSize: 18,
    fontWeight: '800',
    color: '#24583F',
    textAlign: 'center',
  },
  body: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#24392F',
  },
  meta: {
    marginTop: 2,
    fontSize: 13,
    color: '#6E6A62',
  },
});
