import type { ComponentMeta } from "../../meta/types.js";

export const meta: ComponentMeta = {
  "name": "Spacer",
  "category": "layout",
  "status": "demo",
  "summary": "Empty space sized by a spacing token, or a flexible gap that pushes siblings apart in a Row or Column.",
  "whenToUse": [
    "Push one item to the end of a Row or Column with <Spacer flex />",
    "Add a fixed gap that is not the gap shared by all siblings"
  ],
  "whenNotToUse": [
    {
      "reason": "An equal gap between all children is already the gap prop of the stack",
      "instead": "Column"
    }
  ],
  "composition": {
    "parents": [
      "Row",
      "Column"
    ],
    "children": [],
    "pairsWith": [
      "Row",
      "Column"
    ]
  },
  "a11y": [
    "Hidden from assistive technology (accessibilityElementsHidden, importantForAccessibility no-hide-descendants): it is decorative"
  ],
  "variants": {
    "size": [
      "none",
      "xs",
      "sm",
      "md",
      "lg",
      "xl",
      "xxl"
    ],
    "axis": [
      "vertical",
      "horizontal"
    ]
  },
  "states": [
    "fixed",
    "flexible"
  ],
  "platformNotes": [],
  "examples": [
    {
      "title": "Spacer",
      "path": "docs/components/layout/Spacer.md"
    }
  ]
};
