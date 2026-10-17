import React from "react";
import * as ReactNative from "react-native";
import { useTheme } from "../../theme/useTheme.js";
import type { ThemeMode } from "../../theme/types.js";

/** The bar content style for a theme mode: dark mode needs light content, light mode needs dark content. */
export function barStyleForMode(mode: ThemeMode): "light-content" | "dark-content" {
  return mode === "dark" ? "light-content" : "dark-content";
}

export interface StatusBarComponentProps {
  barStyle: "light-content" | "dark-content";
  backgroundColor?: string;
  animated?: boolean;
}

export interface ThemedStatusBarProps {
  /** Default: the resolved mode of the theme. */
  mode?: ThemeMode;
  /** Android status bar background. Default: not set. */
  backgroundColor?: string;
  animated?: boolean;
  /** The status bar component. Default: React Native's `StatusBar`; where the host has none (tests, some targets) it renders nothing. */
  StatusBarComponent?: React.ComponentType<StatusBarComponentProps>;
}

/** React Native's `StatusBar` with `barStyle` chosen from the theme mode. Renders nothing when no status bar component exists. */
export function ThemedStatusBar({ mode, backgroundColor, animated = true, StatusBarComponent }: ThemedStatusBarProps) {
  const theme = useTheme();
  const Bar = StatusBarComponent ?? (ReactNative as unknown as { StatusBar?: React.ComponentType<StatusBarComponentProps> }).StatusBar;
  if (!Bar) return null;
  return <Bar barStyle={barStyleForMode(mode ?? theme.mode)} backgroundColor={backgroundColor} animated={animated} />;
}
