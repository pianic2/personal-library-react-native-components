import type { ComponentMeta } from "../../meta/types.js";

export const meta: ComponentMeta = {
  "name": "Link",
  "category": "navigation",
  "status": "demo",
  "summary": "Text or button style link that navigates through the navigation context or a URL.",
  "whenToUse": [
    "Navigate to another screen or an external URL"
  ],
  "whenNotToUse": [
    {
      "reason": "Use Button for an action that is not navigation",
      "instead": "Button"
    }
  ],
  "composition": {
    "parents": [
      "NavBar",
      "Text"
    ],
    "children": [],
    "pairsWith": [
      "NavContext"
    ]
  },
  "a11y": [
    "No accessibilityRole=link and no disabled state yet"
  ],
  "variants": {
    "variant": [
      "text",
      "button"
    ],
    "size": [
      "sm",
      "md",
      "lg"
    ]
  },
  "states": [
    "default"
  ],
  "platformNotes": [],
  "examples": [
    {
      "title": "Navigation examples",
      "path": "examples/navigation.tsx"
    }
  ]
};
