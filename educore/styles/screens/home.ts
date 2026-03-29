import { StyleSheet } from 'react-native';

export const homeStyles = StyleSheet.create({
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: '#24392F',
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#4F584F',
  },
  metaText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#6E6A62',
  },
  resultValue: {
    fontSize: 34,
    fontWeight: '800',
    color: '#203229',
  },
  warningText: {
    color: '#8B5A22',
    fontSize: 13,
    lineHeight: 20,
  },
});
