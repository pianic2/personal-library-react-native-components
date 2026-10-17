// ui/components/typography/CodeInline.tsx

import React from "react";
import { Text } from "../Text/Text.js";
import { useTheme } from "../../theme/useTheme.js";
import type { ComponentProps } from "react";

export type CodeInlineProps = ComponentProps<typeof Text>;

export function CodeInline({ style, size, ...rest }: CodeInlineProps) {
  const { theme, colors } = useTheme();
  const typographySizes = theme.typography.fontSize;
  const resolvedSize: keyof typeof typographySizes =
    size && Object.prototype.hasOwnProperty.call(typographySizes, size) ? size : "sm";
  const resolvedFontSize = typographySizes[resolvedSize];

  return (
      <Text
        {...rest}
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
          style,
        ]}
      />
  );
}
