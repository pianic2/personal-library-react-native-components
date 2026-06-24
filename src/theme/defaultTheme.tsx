// src/theme/defaultTheme.ts

import { spacing, space } from "../tokens/spacing.base";
import { radius } from "../tokens/radius.base";
import { typography } from "../tokens/typography.base";
import { shadows } from "../tokens/shadows.base";
import { zIndex } from "../tokens/zIndex.base";
import { size } from "../tokens/size.base";
import { resolveColors } from "../tokens/colors.base";
import type { Theme, ThemeMode } from "./types";


export function createBaseTheme(mode: ThemeMode): Theme {
  const colors = resolveColors(mode);

  return {
    mode,
    colors,

    spacing,
    space,
    radius,
    typography,
    shadows,
    zIndex,
    size,
    components: {
      button: {
        height: {
          sm: size.height.sm,
          md: size.height.md,
          lg: size.height.lg,
        },
        paddingX: {
          sm: 12,
          md: 16,
          lg: 20,
        },
        iconSize: {
          sm: 16,
          md: 20,
          lg: 24,
        },
        radius: radius.md,
        gap: 8,
        borderWidth: 2,
        opacity: {
          disabled: 0.5,
          pressed: 1,
        },
      },
    },
    globalStyles: {
      app: {
        flex: 1,
        backgroundColor: colors.background,
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
}

export const defaultTheme: Theme = createBaseTheme("light");
