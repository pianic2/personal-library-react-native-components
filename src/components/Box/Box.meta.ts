import type { ComponentMeta } from "../../meta/types.js";

export const meta: ComponentMeta = {
  "name": "Box",
  "category": "layout",
  "status": "demo",
  "summary": "Themed container with padding, background and radius from tokens.",
  "whenToUse": [
    "Group content with spacing, background or border radius from the theme"
  ],
  "whenNotToUse": [
    {
      "reason": "Use Row or Column to lay children out in a direction with a gap",
      "instead": "Column"
    }
  ],
  "composition": {
    "parents": [],
    "children": [
      "Text",
      "Card"
    ],
    "pairsWith": [
      "Row",
      "Column"
    ]
  },
  "a11y": [],
  "variants": {},
  "states": [
    "default"
  ],
  "platformNotes": [],
  "examples": [
    {
      "title": "Layout primitives",
      "path": "examples/layout-primitives.tsx"
    }
  ]
};
