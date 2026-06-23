// src/theme/defaultTheme.ts

import { spacing, space } from "../tokens/spacing.base";
import { radius } from "../tokens/radius.base";
import { typography } from "../tokens/typography.base";
import { shadows } from "../tokens/shadows.base";
import { zIndex } from "../tokens/zIndex.base";
import { size } from "../tokens/size.base";
import { lightColors } from "../tokens/colors.base";
import type { ThemeMode } from "./types";


export function createBaseTheme(mode: ThemeMode) {
  return {
    mode,
    colors: lightColors,

    spacing,
    space,
    radius,
    typography,
    shadows,
    zIndex,
    size,
    globalStyles: {
      app: {
        flex: 1,
        backgroundColor: lightColors.background,
      },
      content: {
        flex: 1,
      },
      scrollContent: {
        flexGrow: 1,
      },
      safeArea: {
        flex: 1,
      },
    },

  } as const;
}

export type Theme = ReturnType<typeof createBaseTheme>;

export const defaultTheme: Theme = {
  mode: 'light',

  colors: lightColors,

  spacing,
  space,
  radius,
  typography,
  shadows,
  zIndex,
  size,
  globalStyles: {
    app: {
      flex: 1,
      backgroundColor: lightColors.background,
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
    },
    safeArea: {
      flex: 1,
    },
  },
};


