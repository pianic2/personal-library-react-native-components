import type { ComponentMeta } from "../../meta/types.js";

export const meta: ComponentMeta = {
  "name": "Card",
  "category": "surfaces",
  "status": "prototype",
  "summary": "Surface that groups related content with padding, shadow and an outline or elevated variant.",
  "whenToUse": [
    "Group related content into one visual unit"
  ],
  "whenNotToUse": [
    {
      "reason": "Use Box when you only need spacing or a background",
      "instead": "Box"
    }
  ],
  "composition": {
    "parents": [],
    "children": [
      "Text",
      "Button",
      "Heading"
    ],
    "pairsWith": [
      "Column",
      "Row"
    ]
  },
  "a11y": [],
  "variants": {
    "variant": [
      "default",
      "elevated",
      "outline"
    ],
    "padding": [
      "none",
      "xs",
      "sm",
      "md",
      "lg",
      "xl",
      "xxl"
    ],
    "shadow": [
      "none",
      "sm",
      "md",
      "lg"
    ]
  },
  "states": [
    "default"
  ],
  "platformNotes": [
    "Android renders elevation only (no shadow color)"
  ],
  "examples": [
    {
      "title": "Card with text",
      "code": "<Card><Text>Content</Text></Card>"
    }
  ]
};
