import type { ComponentMeta } from "../../meta/types.js";

export const meta: ComponentMeta = {
  "name": "TextGroup",
  "category": "typography",
  "status": "prototype",
  "summary": "Vertical stack of text blocks with token-based spacing.",
  "whenToUse": [
    "Group a heading and its text with consistent spacing"
  ],
  "whenNotToUse": [
    {
      "reason": "It duplicates Column; prefer Column for stacking",
      "instead": "Column"
    }
  ],
  "composition": {
    "parents": [],
    "children": [
      "Heading",
      "P",
      "Small"
    ],
    "pairsWith": [
      "Heading",
      "P"
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
      "title": "Text group",
      "code": "<TextGroup><Heading level={3}>Title</Heading><P>Body</P></TextGroup>"
    }
  ]
};
