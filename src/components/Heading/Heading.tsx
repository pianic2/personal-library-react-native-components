// ui/components/typography/Heading.tsx

import { Text } from "../Text/Text";
import { useTheme } from "../../theme/useTheme";
import type { ComponentProps } from "react";

type Level = 1 | 2 | 3 | 4 | 5 | 6;
type TextProps = ComponentProps<typeof Text>;

export interface HeadingProps extends TextProps {
  level?: Level;
  children: string
}

export function Heading({
  level = 1,
  children,
  ...rest
}: HeadingProps) {
  const { theme } = useTheme();

  const sizeMap: Record<Level, keyof typeof theme.typography.fontSize> =
    {
      1: "xxxl",
      2: "xxl",
      3: "xl",
      4: "lg",
      5: "md",
      6: "sm",
    };

  return (
    <Text
      {...rest}
      size={sizeMap[level]}
      weight="bold"
    >
      {children}
    </Text>
  );
}
