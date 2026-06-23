// ui/components/typography/CodeInline.tsx

import React from "react";
import { Text } from "../Text/Text";
import { useTheme } from "../../theme/useTheme";
import type { ComponentProps } from "react";

export type CodeInlineProps = ComponentProps<typeof Text>;

export function CodeInline(props: CodeInlineProps) {
  const { theme, colors } = useTheme();
  const size = props.size ?? "sm";

  return (
      <Text
        size={size}
        style={[
          {
            fontFamily: theme.typography.fontFamily.mono,
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderWidth: 1,
            borderRadius: theme.radius.sm,
            paddingHorizontal: theme.space.sm,
            paddingVertical: 1,
            lineHeight:
              theme.typography.fontSize[size] *
              theme.typography.lineHeight.normal,
            },
          props.style,
        ]}
        {...props}
      />
  );
}
