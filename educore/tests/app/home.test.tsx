import { render } from '@testing-library/react-native';

import HomeScreen from '@/app/(tabs)/index';

describe('HomeScreen', () => {
  it('renders the app shell copy', () => {
    const { getByText } = render(<HomeScreen />);

    expect(getByText('EduCore')).toBeTruthy();
    expect(
      getByText('Mobile app shell is ready. Replace this screen with your actual student or teacher flow.')
    ).toBeTruthy();
  });
});
