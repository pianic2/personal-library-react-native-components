import type { ComponentMeta } from "../../meta/types.js";

export const meta: ComponentMeta = {
  "name": "Heading",
  "category": "typography",
  "status": "demo",
  "summary": "Heading text with six levels mapped to theme sizes.",
  "whenToUse": [
    "Title a screen or a section"
  ],
  "whenNotToUse": [
    {
      "reason": "Use Text for body copy",
      "instead": "Text"
    }
  ],
  "composition": {
    "parents": [
      "Card",
      "Column"
    ],
    "children": [],
    "pairsWith": [
      "P",
      "Text"
    ]
  },
  "a11y": [
    "No accessibilityRole=header yet"
  ],
  "variants": {
    "level": [
      "1",
      "2",
      "3",
      "4",
      "5",
      "6"
    ]
  },
  "states": [
    "default"
  ],
  "platformNotes": [],
  "examples": [
    {
      "title": "Heading",
      "code": "<Heading level={2}>Title</Heading>"
    },
    {
      "title": "Basic usage",
      "path": "examples/basic-usage.tsx"
    }
  ]
};
