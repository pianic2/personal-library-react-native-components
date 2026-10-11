// ui/components/typography/Text.tsx

import { Text as RNText, type TextProps as RNTextProps } from "react-native";
import { useTheme } from "../../theme/useTheme.js";

type Variant = "default" | "muted" | "danger" | "success";
type Align = "left" | "center" | "right" | "justify";

export interface TextProps extends RNTextProps {
  variant?: Variant;
  size?: keyof ReturnType<typeof useTheme>["theme"]["typography"]["fontSize"];
  weight?: keyof ReturnType<typeof useTheme>["theme"]["typography"]["fontWeight"];
  /** Text alignment. Omitted by default, so the platform default applies (it used to default to `justify`). */
  align?: Align;
  /** Shorthand for a one-line limit with a tail ellipsis. */
  truncate?: boolean;
  /**
   * Limits the text to this many lines with a tail ellipsis. Precedence: an explicit `numberOfLines` wins over `lines`,
   * which wins over `truncate` (one line). `accessibilityRole` and every other React Native text prop pass through.
   */
  lines?: number;
}

export function Text({
  variant = "default",
  size = "md",
  weight = "regular",
  align,
  truncate = false,
  lines,
  style,
  children,
  ...rest
}: TextProps) {
  const { theme, colors } = useTheme();

  const colorMap: Record<Variant, string> = {
    default: colors.textPrimary,
    muted: colors.textMuted,
    danger: colors.error,
    success: colors.success,
  };

  const limit = rest.numberOfLines ?? lines ?? (truncate ? 1 : undefined);

  return (
    <RNText
      {...rest}
      numberOfLines={limit}
      ellipsizeMode={rest.ellipsizeMode ?? (limit ? "tail" : undefined)}
      style={[
        {
          fontFamily: theme.typography.fontFamily.regular,
          fontSize: theme.typography.fontSize[size],
          lineHeight:
            theme.typography.fontSize[size] *
            theme.typography.lineHeight.normal,
          fontWeight: theme.typography.fontWeight[weight],
          color: colorMap[variant],
          ...(align ? { textAlign: align } : null),
        },
        style,
      ]}
    >
      {children}
    </RNText>
  );
}
