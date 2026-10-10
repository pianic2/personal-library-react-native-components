import type { ComponentMeta } from "../../meta/types.js";

export const meta: ComponentMeta = {
  "name": "P",
  "category": "typography",
  "status": "prototype",
  "summary": "Paragraph text, left aligned.",
  "whenToUse": [
    "Render a paragraph of body copy"
  ],
  "whenNotToUse": [
    {
      "reason": "Use Text for a single inline run or when you need non-default alignment",
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
      "Heading",
      "Text"
    ]
  },
  "a11y": [],
  "variants": {
    "variant": [
      "default",
      "muted",
      "danger",
      "success"
    ],
    "size": [
      "xs",
      "sm",
      "md",
      "lg",
      "xl",
      "xxl",
      "xxxl"
    ],
    "weight": [
      "regular",
      "medium",
      "semibold",
      "bold"
    ],
    "align": [
      "left",
      "center",
      "right",
      "justify"
    ]
  },
  "states": [
    "default"
  ],
  "platformNotes": [],
  "examples": [
    {
      "title": "Paragraph",
      "code": "<P>Body copy.</P>"
    }
  ]
};
