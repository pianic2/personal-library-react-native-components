import { defineVariants } from "../../theme/variants.js";

/** Styles of Field (PLRNUI-280): theme tokens only. `errorShown` hides the hint while an error message is displayed. */
export const fieldVariants = defineVariants(
  (t) => ({
    slots: ["root", "control", "hint", "error"],
    base: {
      root: { width: "100%" },
      control: { marginTop: t.space.xs },
      hint: { marginTop: t.space.xs, color: t.semantic.text.muted },
      error: { marginTop: t.space.xs, color: t.semantic.feedback.error },
    },
    variants: {
      status: {
        default: {},
        error: {},
        success: { hint: { color: t.semantic.feedback.success } },
        warning: { hint: { color: t.semantic.feedback.warning } },
      },
    },
    states: {
      errorShown: { hint: { display: "none" } },
    },
    defaultVariants: { status: "default" },
  }),
  { name: "field" }
);
