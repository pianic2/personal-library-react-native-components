import { defineVariants } from "../../theme/variants.js";

/**
 * Styles of Collapsible (PLRNUI-340). The region clips its content while it is closed or animating; the height itself is
 * animated, so it is set inline by the component and not here. No colours: the region is structural.
 */
export const collapsibleVariants = defineVariants(
  () => ({
    slots: ["root", "region"],
    base: {
      root: {},
      region: {},
    },
    states: {
      closed: { region: { height: 0, overflow: "hidden" } },
      animating: { region: { overflow: "hidden" } },
    },
  }),
  { name: "collapsible" }
);
