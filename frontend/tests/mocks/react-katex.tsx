import type { ReactNode } from "react";

type MathProps = {
  math: string;
  errorColor?: string;
  renderError?: (error: Error) => ReactNode;
};

export const InlineMath = ({ math, errorColor }: MathProps) => (
  <span data-testid="inline-math" data-error-color={errorColor}>
    {math}
  </span>
);

export const BlockMath = ({ math, errorColor }: MathProps) => (
  <div data-testid="block-math" data-error-color={errorColor}>
    {math}
  </div>
);
