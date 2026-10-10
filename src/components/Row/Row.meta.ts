import type { ComponentMeta } from "../../meta/types.js";

export const meta: ComponentMeta = {
  "name": "Row",
  "category": "layout",
  "status": "demo",
  "summary": "Horizontal flex container with a token-based gap.",
  "whenToUse": [
    "Place children side by side with consistent spacing"
  ],
  "whenNotToUse": [
    {
      "reason": "Use Column for a vertical stack",
      "instead": "Column"
    }
  ],
  "composition": {
    "parents": [],
    "children": [
      "Button",
      "Text",
      "Badge"
    ],
    "pairsWith": [
      "Column",
      "Box"
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
