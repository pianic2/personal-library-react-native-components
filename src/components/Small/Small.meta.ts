import type { ComponentMeta } from "../../meta/types.js";

export const meta: ComponentMeta = {
  "name": "Small",
  "category": "typography",
  "status": "prototype",
  "summary": "Small secondary text.",
  "whenToUse": [
    "Render captions, helper text or fine print"
  ],
  "whenNotToUse": [
    {
      "reason": "Use Text for body copy",
      "instead": "Text"
    }
  ],
  "composition": {
    "parents": [
      "Column",
      "Card"
    ],
    "children": [],
    "pairsWith": [
      "Text"
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
      "title": "Small text",
      "code": "<Small>Caption</Small>"
    }
  ]
};
