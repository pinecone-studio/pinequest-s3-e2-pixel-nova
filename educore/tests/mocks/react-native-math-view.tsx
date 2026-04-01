import { Text } from "react-native";

const MathView = ({ math }: { math: string }) => (
  <Text testID="math-view">{math}</Text>
);

export default MathView;
