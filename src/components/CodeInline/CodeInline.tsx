// ui/components/typography/CodeInline.tsx

import React from "react";
import { Text } from "../Text/Text";
import { useTheme } from "../../theme/useTheme";
import type { ComponentProps } from "react";

export type CodeInlineProps = ComponentProps<typeof Text>;

export function CodeInline(props: CodeInlineProps) {
  const { theme, colors } = useTheme();
  const typographySizes = theme.typography.fontSize;
  const resolvedSize: keyof typeof typographySizes =
    props.size && Object.prototype.hasOwnProperty.call(typographySizes, props.size)
      ? props.size
      : "sm";
  const resolvedFontSize = typographySizes[resolvedSize];

  return (
      <Text
        size={resolvedSize}
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
              resolvedFontSize *
              theme.typography.lineHeight.normal,
            },
          props.style,
        ]}
        {...props}
      />
  );
}
