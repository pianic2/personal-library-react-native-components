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
  "a11y": [
    "Card is a plain container with no role; put the meaning in its content"
  ],
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
    "Android renders elevation and forwards the token shadowColor (tint on API 28+)"
  ],
  "examples": [
    {
      "title": "Card with text",
      "code": "<Card><Text>Content</Text></Card>"
    },
    {
      "title": "Surfaces example",
      "path": "examples/surfaces.tsx"
    }
  ]
};
