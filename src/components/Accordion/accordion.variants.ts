import { defineVariants } from "../../theme/variants.js";

/** Styles of Accordion (PLRNUI-345): semantic theme tokens only, no literal colours. */
export const accordionVariants = defineVariants(
  (t) => ({
    slots: ["root", "item", "header", "title", "chevron", "panel"],
    base: {
      root: { width: "100%" },
      item: { borderBottomWidth: 1, borderBottomColor: t.semantic.border.default },
      header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: t.space.md },
      title: { flexShrink: 1, color: t.semantic.text.primary },
      chevron: { marginStart: t.space.sm, color: t.semantic.text.muted },
      panel: { paddingBottom: t.space.md },
    },
    states: {
      disabled: { header: { opacity: 0.5 } },
      open: {},
    },
  }),
  { name: "accordion" }
);
