// src/theme/types.ts

import type { Colors } from "../tokens/colors.base";
import type { spacing, space } from "../tokens/spacing.base";
import type { radius } from "../tokens/radius.base";
import type { typography } from "../tokens/typography.base";
import type { shadows } from "../tokens/shadows.base";
import type { zIndex } from "../tokens/zIndex.base";
import { size } from "../tokens/size.base";
import type { ImageStyle, TextStyle, ViewStyle } from "react-native";

type ThemeStyle = ViewStyle | TextStyle | ImageStyle;

export type ButtonComponentSizeTokens = {
  sm: number;
  md: number;
  lg: number;
};

export type ButtonComponentTokens = {
  height: ButtonComponentSizeTokens;
  paddingX: ButtonComponentSizeTokens;
  iconSize: ButtonComponentSizeTokens;
  radius: number;
  gap: number;
  borderWidth: number;
  opacity: {
    disabled: number;
    pressed: number;
  };
};

export type InputComponentSizeTokens = {
  xs: number;
  sm: number;
  md: number;
  lg: number;
};

export type InputComponentTokens = {
  height: InputComponentSizeTokens;
  paddingX: InputComponentSizeTokens;
  paddingY: InputComponentSizeTokens;
  iconBoxHeight: InputComponentSizeTokens;
  radius: number;
};

export interface GlassMaterialTokens {
  tint: string;
  border: string;
  highlight: string;
  shadow: string;
  noiseOpacity?: number;
  web?: {
    backdropBlur?: number;
    backdropSaturate?: number;
  };
  native?: {
    elevation?: number;
  };
}

export interface Theme {
  colors: Colors;
  mode?: ThemeMode;

  spacing: typeof spacing;
  space: typeof space;

  radius: typeof radius;
  typography: typeof typography;
  shadows: typeof shadows;
  zIndex: typeof zIndex;
  size: typeof size;

  components: {
    button: ButtonComponentTokens;

    input: InputComponentTokens;

    card?: {
      radius?: number;
      shadow?: any;
      padding?: number;
    };
  };

  materials?: {
    glass?: GlassMaterialTokens;
  };

  globalStyles?: {
    app?: ViewStyle;
    content?: ViewStyle;
    scrollContent?: ViewStyle;
    safeArea?: ViewStyle;
  };
  screens?: Record<string, Record<string, ThemeStyle>>;
}

export type ThemeMode = "light" | "dark";

export interface ThemeStorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem?(key: string): Promise<void>;
}
