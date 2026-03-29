import { StyleSheet } from 'react-native';

export const progressStyles = StyleSheet.create({
  historyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#203229',
  },
  historyRow: {
    borderTopWidth: 1,
    borderTopColor: '#EFE5D4',
    paddingTop: 14,
    gap: 6,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    alignItems: 'center',
  },
  historyName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#24392F',
  },
  historyMeta: {
    fontSize: 13,
    color: '#6E6A62',
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 21,
    color: '#5F665E',
  },
});
