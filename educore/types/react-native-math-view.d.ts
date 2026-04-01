declare module "react-native-math-view" {
  import type { ComponentType } from "react";

  export type MathViewProps = {
    math: string;
  };

  const MathView: ComponentType<MathViewProps>;
  export default MathView;
}
