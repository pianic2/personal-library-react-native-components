import type { ComponentMeta } from "../../meta/types.js";

export const meta: ComponentMeta = {
  "name": "Column",
  "category": "layout",
  "status": "demo",
  "summary": "Vertical flex container with a token-based gap.",
  "whenToUse": [
    "Stack children vertically with consistent spacing"
  ],
  "whenNotToUse": [
    {
      "reason": "Use Row for a horizontal arrangement",
      "instead": "Row"
    }
  ],
  "composition": {
    "parents": [],
    "children": [
      "Text",
      "Button",
      "Card"
    ],
    "pairsWith": [
      "Row",
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
