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
    "Text uses the textPrimary or textInverted token with the higher contrast on the variant background (4.5:1 or better in light and dark, tested)",
    "A count-only badge gets an accessibilityLabel equal to the count; the accessibilityLabel prop overrides it"
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
    },
    {
      "title": "Surfaces example",
      "path": "examples/surfaces.tsx"
    }
  ]
};
