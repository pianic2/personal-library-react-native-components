// src/tokens/semantic.base.ts
// Semantic roles derived from the resolved color palette (no raw values).

import type { Colors } from "./colors.base.js";

export function createSemantic(colors: Colors) {
  return {
    surface: {
      base: colors.background,
      raised: colors.surfaceElevated,
      sunken: colors.surface,
      overlay: colors.overlay,
    },
    text: {
      primary: colors.textPrimary,
      secondary: colors.textSecondary,
      muted: colors.textMuted,
      inverted: colors.textInverted,
      disabled: colors.disabled,
    },
    border: {
      default: colors.border,
      divider: colors.divider,
      focus: colors.outline,
    },
    action: {
      primary: colors.primary,
      primaryHover: colors.primaryHover,
      primaryActive: colors.primaryActive,
      disabled: colors.disabledBg,
    },
    feedback: {
      success: colors.success,
      warning: colors.warning,
      error: colors.error,
      info: colors.info,
    },
  } as const;
}

export type SemanticTokens = ReturnType<typeof createSemantic>;
