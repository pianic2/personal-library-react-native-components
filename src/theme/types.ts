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

  components?: {
    button?: {
      height?: {
        sm?: number;
        md?: number;
        lg?: number;
      };
      radius?: number;
    };

    input?: {
      height?: number;
      radius?: number;
    };

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
