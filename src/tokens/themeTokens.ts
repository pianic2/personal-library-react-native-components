import { darkColors, lightColors, type ColorScheme } from "./colors.base.js";
import { radius } from "./radius.base.js";
import { createSemanticRoles } from "./semantic.base.js";
import { shadows } from "./shadows.base.js";
import { space } from "./spacing.base.js";
import { typography } from "./typography.base.js";

export interface ThemeTokens {
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

function buildThemeTokens(mode: ColorScheme): ThemeTokens {
  const colors = mode === "dark" ? darkColors : lightColors;
  const roles = createSemanticRoles(mode);

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
        background: roles.surface[0],
        surface: roles.surface[1],
        surfaceElevated: colors.surfaceElevated,
        overlay: roles.scrim,
        backdrop: colors.backdrop,
      },
      text: {
        primary: roles.onSurface,
        secondary: roles.onSurfaceMuted,
        muted: colors.textMuted,
        inverted: colors.textInverted,
      },
      border: {
        border: colors.border,
        divider: colors.divider,
        outline: roles.outline,
      },
      brand: {
        primary: roles.primary.main,
        secondary: roles.secondary.main,
        accent: colors.accent,
      },
      feedback: {
        success: colors.success,
        warning: colors.warning,
        error: roles.error.main,
        info: colors.info,
      },
    },
  };
}

const lightThemeTokens = Object.freeze(buildThemeTokens("light"));
const darkThemeTokens = Object.freeze(buildThemeTokens("dark"));

export const defaultThemeTokens: ThemeTokens = lightThemeTokens;

export function createThemeTokens(mode: ColorScheme = "light"): ThemeTokens {
  return mode === "dark" ? darkThemeTokens : lightThemeTokens;
}
