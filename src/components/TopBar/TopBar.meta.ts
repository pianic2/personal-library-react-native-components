import type { ComponentMeta } from "../../meta/types.js";

export const meta: ComponentMeta = {
  "name": "TopBar",
  "category": "navigation",
  "status": "demo",
  "summary": "Top navigation bar with a logo and links.",
  "whenToUse": [
    "Provide the main navigation at the top of a screen"
  ],
  "whenNotToUse": [
    {
      "reason": "Use NavBar to choose the layout per platform",
      "instead": "NavBar"
    }
  ],
  "composition": {
    "parents": [
      "NavBar"
    ],
    "children": [],
    "pairsWith": [
      "NavContext",
      "Link"
    ]
  },
  "a11y": [
    "No navigation landmark role yet"
  ],
  "variants": {},
  "states": [
    "default"
  ],
  "platformNotes": [
    "Positioned absolutely without safe-area handling"
  ],
  "examples": [
    {
      "title": "Navigation examples",
      "path": "examples/navigation.tsx"
    }
  ]
};
