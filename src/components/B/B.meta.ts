import type { ComponentMeta } from "../../meta/types.js";

export const meta: ComponentMeta = {
  "name": "B",
  "category": "typography",
  "status": "prototype",
  "summary": "Bold text wrapper: Text with weight bold.",
  "whenToUse": [
    "Emphasise a word or phrase inside running text"
  ],
  "whenNotToUse": [
    {
      "reason": "It is only a weight shortcut; use Text for any other typography control",
      "instead": "Text"
    }
  ],
  "composition": {
    "parents": [
      "Text",
      "P"
    ],
    "children": [],
    "pairsWith": [
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
      "title": "Bold text",
      "code": "<B>Important</B>"
    }
  ]
};
