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
    "The bar is a navigation landmark (role navigation); the title has accessibilityRole header; the current item has accessibilityState.selected"
  ],
  "variants": {
    "position": [
      "absolute",
      "static"
    ]
  },
  "states": [
    "default"
  ],
  "platformNotes": [
    "Positioned absolutely by default (position=\"static\" lays it out in the flow); safe-area insets are passed in through the insets prop, the library reads none"
  ],
  "examples": [
    {
      "title": "Navigation examples",
      "path": "examples/navigation.tsx"
    }
  ]
};
