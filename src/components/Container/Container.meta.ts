import type { ComponentMeta } from "../../meta/types.js";

export const meta: ComponentMeta = {
  "name": "Container",
  "category": "layout",
  "status": "prototype",
  "summary": "Centred, width-capped layout box with breakpoint gutters that also provides its measured size to descendants.",
  "whenToUse": [
    "Cap and centre page content on wide screens, with gutters that grow at breakpoints",
    "Let descendants react to the width of their container (useContainerSize, useContainerBreakpoint) instead of the window"
  ],
  "whenNotToUse": [
    {
      "reason": "To lay out children in a row or a column",
      "instead": "Row"
    }
  ],
  "composition": {
    "parents": [],
    "children": [],
    "pairsWith": [
      "Box",
      "Column"
    ]
  },
  "a11y": [
    "A plain View: no role and no accessibility props; it adds nothing to the accessibility tree"
  ],
  "variants": {
    "size": [
      "sm",
      "md",
      "lg",
      "xl",
      "full"
    ]
  },
  "states": [
    "default"
  ],
  "platformNotes": [
    "Before the first layout the context holds the window width (capped by the maximum), so a first paint on a wide window can differ from the measured width by a frame; the measured size replaces it as soon as onLayout fires"
  ],
  "examples": [
    {
      "title": "Container usage",
      "path": "docs/components/layout/Container.md"
    }
  ]
};
