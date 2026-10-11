// Reference variants for Button (PLRNUI-181). Not wired into Button.tsx: components migrate one at a time under E1.
import { defineVariants } from "../variants.js";

export const buttonVariants = defineVariants(
  (t) => ({
    slots: ["root", "label"],
    base: {
      root: { flexDirection: "row", alignItems: "center", justifyContent: "center", borderRadius: t.radius.md, gap: t.space.sm },
      label: { ...t.textStyles.label },
    },
    variants: {
      variant: {
        solid: { root: { backgroundColor: t.semantic.action.primary }, label: { color: t.semantic.text.inverted } },
        outline: {
          root: { backgroundColor: "transparent", borderWidth: t.borderWidth.thin, borderColor: t.semantic.border.default },
          label: { color: t.semantic.text.primary },
        },
        ghost: { root: { backgroundColor: "transparent" }, label: { color: t.semantic.text.primary } },
        danger: { root: { backgroundColor: t.semantic.feedback.error }, label: { color: t.semantic.text.inverted } },
      },
      size: {
        sm: { root: { minHeight: t.size.height.sm, paddingHorizontal: t.space.md } },
        md: { root: { minHeight: t.size.height.md, paddingHorizontal: t.space.lg } },
        lg: { root: { minHeight: t.size.height.lg, paddingHorizontal: t.space.xl } },
      },
    },
    states: {
      pressed: { root: { backgroundColor: t.semantic.action.primaryActive } },
      disabled: { root: { opacity: t.opacity.disabled }, label: { color: t.semantic.text.disabled } },
    },
    compoundVariants: [{ when: { variant: "ghost", size: "sm" }, style: { root: { paddingHorizontal: t.space.sm } } }],
    defaultVariants: { variant: "solid", size: "md" },
  }),
  { name: "button" }
);
