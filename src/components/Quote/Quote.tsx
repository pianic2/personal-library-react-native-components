// ui/components/typography/Quote.tsx

import React from "react";
import { View } from "react-native";
import { Text } from "../Text/Text";
import { useTheme } from "../../theme/useTheme";

export interface QuoteProps {
  children: React.ReactNode;
}

export function Quote({ children }: QuoteProps) {
  const { theme, colors } = useTheme();

  return (
    <View
      style={{
        borderLeftWidth: 4,
        borderLeftColor: colors.primary,
        paddingLeft: theme.space.md,
        marginVertical: theme.space.md,
      }}
    >
      <Text
        variant="muted"
        style={{ fontStyle: "italic" }}
      >
        {children}
      </Text>
    </View>
  );
}
