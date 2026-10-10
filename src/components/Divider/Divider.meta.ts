import type { ComponentMeta } from "../../meta/types.js";

export const meta: ComponentMeta = {
  "name": "Divider",
  "category": "layout",
  "status": "demo",
  "summary": "Full-width horizontal separator with token-based spacing.",
  "whenToUse": [
    "Separate two groups of content"
  ],
  "whenNotToUse": [
    {
      "reason": "It has no vertical orientation; use spacing in Column or Row between siblings",
      "instead": "Column"
    }
  ],
  "composition": {
    "parents": [
      "Column",
      "Card"
    ],
    "children": [],
    "pairsWith": [
      "Column"
    ]
  },
  "a11y": [
    "No accessibility role: it is decorative"
  ],
  "variants": {
    "spacing": [
      "none",
      "xs",
      "sm",
      "md",
      "lg",
      "xl",
      "xxl"
    ]
  },
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
