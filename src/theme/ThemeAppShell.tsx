import React from "react";
import {
  ScrollView,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { useTheme } from "./useTheme";

export interface ThemeAppShellProps {
  children: React.ReactNode;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  showsVerticalScrollIndicator?: boolean;
}

export function ThemeAppShell({
  children,
  scroll = false,
  style,
  contentContainerStyle,
  showsVerticalScrollIndicator = false,
}: ThemeAppShellProps) {
  const { theme } = useTheme();
  const shellStyle: StyleProp<ViewStyle> = [
    {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    theme.globalStyles?.app,
    theme.globalStyles?.content,
    style,
  ];

  if (scroll) {
    return (
      <ScrollView
        style={shellStyle}
        contentContainerStyle={[
          { flexGrow: 1 },
          theme.globalStyles?.scrollContent,
          contentContainerStyle,
        ]}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      >
        {children}
      </ScrollView>
    );
  }

  return <View style={shellStyle}>{children}</View>;
}
