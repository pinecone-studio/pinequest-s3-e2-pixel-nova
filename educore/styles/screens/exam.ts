import { StyleSheet } from 'react-native';

export const examStyles = StyleSheet.create({
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  topMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  metaChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E7DDCB',
    borderRadius: 18,
    padding: 14,
    backgroundColor: '#FFF7E7',
  },
  metaChipLabel: {
    fontSize: 12,
    color: '#6A6A63',
    marginBottom: 6,
  },
  metaChipValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#23412F',
  },
  questionCounter: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5D6B57',
  },
  questionText: {
    fontSize: 20,
    lineHeight: 30,
    color: '#19271E',
    fontWeight: '700',
  },
  questionImage: {
    width: '100%',
    height: 180,
    borderRadius: 20,
    backgroundColor: '#F0E9DC',
  },
  optionList: {
    gap: 10,
  },
  optionButton: {
    borderWidth: 1,
    borderColor: '#D9CCB4',
    borderRadius: 18,
    padding: 16,
    backgroundColor: '#FFF8ED',
  },
  optionButtonSelected: {
    borderColor: '#2D6A4F',
    backgroundColor: '#E7F2EA',
  },
  optionLabel: {
    fontSize: 16,
    lineHeight: 24,
    color: '#314135',
  },
  optionLabelSelected: {
    color: '#1D4F38',
    fontWeight: '700',
  },
  answerInput: {
    minHeight: 160,
    borderWidth: 1,
    borderColor: '#DCCFB6',
    borderRadius: 20,
    backgroundColor: '#FFF9ED',
    padding: 16,
    textAlignVertical: 'top',
    fontSize: 16,
    color: '#1F2A1F',
  },
  footerActions: {
    gap: 12,
    paddingBottom: 24,
  },
  helperText: {
    color: '#5D6B57',
    fontSize: 13,
    lineHeight: 20,
  },
  warningText: {
    color: '#8B5A22',
    fontSize: 13,
    lineHeight: 20,
  },
});
