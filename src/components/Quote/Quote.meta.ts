import type { ComponentMeta } from "../../meta/types.js";

export const meta: ComponentMeta = {
  "name": "Quote",
  "category": "typography",
  "status": "prototype",
  "summary": "Block quotation with a leading border.",
  "whenToUse": [
    "Render a quotation or a pulled statement"
  ],
  "whenNotToUse": [
    {
      "reason": "Use P for ordinary paragraphs",
      "instead": "P"
    }
  ],
  "composition": {
    "parents": [
      "Column",
      "Card"
    ],
    "children": [],
    "pairsWith": [
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
      "title": "Quote",
      "code": "<Quote>Quoted text.</Quote>"
    }
  ]
};
