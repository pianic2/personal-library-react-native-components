import type { ComponentMeta } from "../../meta/types.js";

export const meta: ComponentMeta = {
  "name": "Text",
  "category": "typography",
  "status": "demo",
  "summary": "Base themed text component with size, weight, color and alignment.",
  "whenToUse": [
    "Render any themed text"
  ],
  "whenNotToUse": [
    {
      "reason": "Use Heading for titles",
      "instead": "Heading"
    },
    {
      "reason": "Use P for paragraphs",
      "instead": "P"
    }
  ],
  "composition": {
    "parents": [
      "Card",
      "Column",
      "Row"
    ],
    "children": [],
    "pairsWith": [
      "Heading",
      "P"
    ]
  },
  "a11y": [
    "No text alignment by default (the platform default applies); set align to change it",
    "accessibilityRole and the other React Native text props pass through to the underlying Text"
  ],
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
      "title": "Basic usage",
      "path": "examples/basic-usage.tsx"
    },
    {
      "title": "Text",
      "code": "<Text>Hello</Text>"
    }
  ]
};
