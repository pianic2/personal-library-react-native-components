import type { ComponentMeta } from "../../meta/types.js";

export const meta: ComponentMeta = {
  "name": "NavContext",
  "category": "navigation",
  "status": "demo",
  "summary": "Provider and hooks that share navigation items, the current pathname and the navigate function.",
  "whenToUse": [
    "Share navigation state with NavBar, Link and custom navigation components"
  ],
  "whenNotToUse": [
    {
      "reason": "It holds state only and renders nothing; use NavBar for the visible navigation",
      "instead": "NavBar"
    }
  ],
  "composition": {
    "parents": [],
    "children": [
      "NavBar",
      "Link"
    ],
    "pairsWith": [
      "NavBar",
      "Link"
    ]
  },
  "a11y": [],
  "variants": {},
  "states": [
    "default"
  ],
  "platformNotes": [
    "The helper hooks are not exported from the root yet"
  ],
  "examples": [
    {
      "title": "Navigation examples",
      "path": "examples/navigation.tsx"
    }
  ]
};
