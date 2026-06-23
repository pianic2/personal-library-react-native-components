import { darkColors, lightColors, type ColorScheme } from "./colors.base";
import { radius } from "./radius.base";
import { shadows } from "./shadows.base";
import { space } from "./spacing.base";
import { typography } from "./typography.base";

export interface TokensSnapshot {
  readonly typography: {
    readonly fontFamily: typeof typography.fontFamily;
    readonly fontSize: typeof typography.fontSize;
    readonly lineHeight: typeof typography.lineHeight;
    readonly fontWeight: typeof typography.fontWeight;
  };
  readonly spacing: typeof space;
  readonly radius: typeof radius;
  readonly elevation: {
    readonly none: number;
    readonly sm: number;
    readonly md: number;
    readonly lg: number;
  };
  readonly colors: {
    readonly surface: {
      readonly background: string;
      readonly surface: string;
      readonly surfaceElevated: string;
      readonly overlay: string;
      readonly backdrop: string;
    };
    readonly text: {
      readonly primary: string;
      readonly secondary: string;
      readonly muted: string;
      readonly inverted: string;
    };
    readonly border: {
      readonly border: string;
      readonly divider: string;
      readonly outline: string;
    };
    readonly brand: {
      readonly primary: string;
      readonly secondary: string;
      readonly accent: string;
    };
    readonly feedback: {
      readonly success: string;
      readonly warning: string;
      readonly error: string;
      readonly info: string;
    };
  };
}

function createSnapshot(mode: ColorScheme): TokensSnapshot {
  const colors = mode === "dark" ? darkColors : lightColors;

  return {
    typography: {
      fontFamily: typography.fontFamily,
      fontSize: typography.fontSize,
      lineHeight: typography.lineHeight,
      fontWeight: typography.fontWeight,
    },
    spacing: space,
    radius,
    elevation: {
      none: shadows.none.elevation,
      sm: shadows.sm.elevation,
      md: shadows.md.elevation,
      lg: shadows.lg.elevation,
    },
    colors: {
      surface: {
        background: colors.background,
        surface: colors.surface,
        surfaceElevated: colors.surfaceElevated,
        overlay: colors.overlay,
        backdrop: colors.backdrop,
      },
      text: {
        primary: colors.textPrimary,
        secondary: colors.textSecondary,
        muted: colors.textMuted,
        inverted: colors.textInverted,
      },
      border: {
        border: colors.border,
        divider: colors.divider,
        outline: colors.outline,
      },
      brand: {
        primary: colors.primary,
        secondary: colors.secondary,
        accent: colors.accent,
      },
      feedback: {
        success: colors.success,
        warning: colors.warning,
        error: colors.error,
        info: colors.info,
      },
    },
  };
}

const lightSnapshot = Object.freeze(createSnapshot("light"));
const darkSnapshot = Object.freeze(createSnapshot("dark"));

export const auraTokens: TokensSnapshot = lightSnapshot;

export function getAuraTokens(mode: ColorScheme = "light"): TokensSnapshot {
  return mode === "dark" ? darkSnapshot : lightSnapshot;
}
