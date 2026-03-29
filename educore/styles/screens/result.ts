import { StyleSheet } from 'react-native';

export const resultStyles = StyleSheet.create({
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaText: {
    fontSize: 14,
    color: '#5F665E',
  },
  answerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#203229',
  },
  answerRow: {
    borderTopWidth: 1,
    borderTopColor: '#EFE5D4',
    paddingTop: 14,
    gap: 6,
  },
  answerQuestion: {
    fontSize: 15,
    fontWeight: '700',
    color: '#293B31',
  },
  answerMeta: {
    fontSize: 14,
    lineHeight: 20,
    color: '#5F665E',
  },
  answerState: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 12,
    fontWeight: '800',
  },
  answerCorrect: {
    backgroundColor: '#E7F2EA',
    color: '#24583F',
  },
  answerWrong: {
    backgroundColor: '#F7E8E8',
    color: '#A53838',
  },
});
