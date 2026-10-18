import { defineVariants } from "../../theme/variants.js";

/** Slots of the paging viewport: `root` is the scroll viewport, `page` is one page frame. Overridable as `theme.variants.pager`. */
export const pagerVariants = defineVariants(
  () => ({
    slots: ["root", "page"],
    base: {
      root: { overflow: "hidden" },
      page: { overflow: "hidden" },
    },
  }),
  { name: "pager" }
);

/**
 * Slots of the page indicator: `root` is the row of dots, `dot` one dot. The dot diameter is a `theme.space` key, the
 * selected dot uses the primary action color and the others the default border color (semantic tokens only).
 * Overridable as `theme.variants.pageIndicator`.
 */
export const pageIndicatorVariants = defineVariants(
  (t) => ({
    slots: ["root", "dot"],
    base: {
      root: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: t.space.xs },
      dot: { backgroundColor: t.semantic.border.default },
    },
    variants: {
      size: {
        xs: { dot: { width: t.space.xs, height: t.space.xs, borderRadius: t.radius.full } },
        sm: { dot: { width: t.space.sm, height: t.space.sm, borderRadius: t.radius.full } },
        md: { dot: { width: t.space.md, height: t.space.md, borderRadius: t.radius.full } },
        lg: { dot: { width: t.space.lg, height: t.space.lg, borderRadius: t.radius.full } },
      },
    },
    states: {
      active: { dot: { backgroundColor: t.semantic.action.primary } },
    },
    defaultVariants: { size: "sm" },
  }),
  { name: "pageIndicator" }
);
