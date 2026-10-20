import { defineVariants } from "../../theme/variants.js";

/**
 * Styles of CircularProgress (PLRNUI-407). Slots: `track` (the full ring), `arc` (a ring whose top and right borders are
 * coloured, so rotating it sweeps a half circle) and `label`. Colours come from semantic tokens only; the geometry
 * (size, thickness, radius) is set inline by the component because it depends on the `size` and `thickness` props.
 */
export const circularProgressVariants = defineVariants(
  (t) => ({
    slots: ["track", "arc", "label"],
    base: {
      track: { borderColor: t.semantic.border.default },
      arc: { borderColor: "transparent" },
      label: { color: t.semantic.text.primary },
    },
    variants: {
      tone: {
        primary: { arc: { borderTopColor: t.semantic.action.primary, borderRightColor: t.semantic.action.primary } },
        info: { arc: { borderTopColor: t.semantic.feedback.info, borderRightColor: t.semantic.feedback.info } },
        success: { arc: { borderTopColor: t.semantic.feedback.success, borderRightColor: t.semantic.feedback.success } },
        warning: { arc: { borderTopColor: t.semantic.feedback.warning, borderRightColor: t.semantic.feedback.warning } },
        danger: { arc: { borderTopColor: t.semantic.feedback.error, borderRightColor: t.semantic.feedback.error } },
      },
    },
    defaultVariants: { tone: "primary" },
  }),
  { name: "circularProgress" }
);
