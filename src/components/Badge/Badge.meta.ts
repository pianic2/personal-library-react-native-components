import type { ComponentMeta } from "../../meta/types.js";

export const meta: ComponentMeta = {
  "name": "Badge",
  "category": "surfaces",
  "status": "demo",
  "summary": "Small label for a status, count or category.",
  "whenToUse": [
    "Mark an item with a short status or count"
  ],
  "whenNotToUse": [
    {
      "reason": "A badge carries no action",
      "instead": "Button"
    }
  ],
  "composition": {
    "parents": [],
    "children": [],
    "pairsWith": [
      "Card",
      "Text"
    ]
  },
  "a11y": [
    "Contrast of text on info, success and warning backgrounds is not verified yet"
  ],
  "variants": {},
  "states": [
    "default"
  ],
  "platformNotes": [],
  "examples": [
    {
      "title": "Feedback examples",
      "path": "examples/feedback.tsx"
    }
  ]
};
