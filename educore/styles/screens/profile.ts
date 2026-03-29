import { StyleSheet } from 'react-native';

export const profileStyles = StyleSheet.create({
  screenContent: {
    paddingBottom: 28,
  },
  hero: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  avatarWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#DCEBE4',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: 30,
    fontWeight: '800',
    color: '#2D6A4F',
  },
  heroBody: {
    flex: 1,
    gap: 6,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#203229',
  },
  profileMeta: {
    fontSize: 14,
    color: '#5F665E',
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#203229',
  },
  switchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  helperText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#5F665E',
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF5FB',
  },
  selectorCard: {
    gap: 10,
  },
  selectorOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E7DDCB',
    backgroundColor: '#FFF8EA',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  selectorOptionSelected: {
    borderColor: '#9BD0E3',
    backgroundColor: '#F2FBFF',
  },
  selectorOptionText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#203229',
  },
  selectorMeta: {
    fontSize: 12,
    color: '#6E6A62',
  },
  pressed: {
    opacity: 0.86,
  },
});
