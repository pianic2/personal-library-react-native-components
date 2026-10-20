import { defineVariants } from "../../theme/variants.js";

/**
 * Styles of DescriptionList (PLRNUI-287). Semantic tokens only: labels use the secondary text colour, values the primary
 * one. `layout` is `stacked` (label above value), `inline` (label beside value, long values wrap) or `grid` (stacked pairs
 * in columns, laid out by Grid).
 */
export const descriptionListVariants = defineVariants(
  (t) => ({
    slots: ["root", "item", "label", "value"],
    base: {
      root: { gap: t.space.md },
      item: { minWidth: 0 },
      label: { color: t.semantic.text.secondary },
      value: { color: t.semantic.text.primary },
    },
    variants: {
      layout: {
        stacked: { item: { gap: t.space.xs } },
        inline: { item: { flexDirection: "row", alignItems: "flex-start", gap: t.space.md }, label: { flexShrink: 0, maxWidth: "40%" }, value: { flex: 1, flexShrink: 1, minWidth: 0 } },
        grid: { item: { gap: t.space.xs } },
      },
    },
    defaultVariants: { layout: "stacked" },
  }),
  { name: "descriptionList" }
);
