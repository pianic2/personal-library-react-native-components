import type { ComponentMeta } from "../../meta/types.js";

export const meta: ComponentMeta = {
  "name": "BottomBar",
  "category": "navigation",
  "status": "prototype",
  "summary": "Bottom navigation bar for the main destinations on small screens.",
  "whenToUse": [
    "Switch between three to five top-level destinations on native"
  ],
  "whenNotToUse": [
    {
      "reason": "It is positioned absolutely and has no safe-area handling yet; NavBar chooses the right layout",
      "instead": "NavBar"
    }
  ],
  "composition": {
    "parents": [
      "NavBar"
    ],
    "children": [],
    "pairsWith": [
      "NavContext"
    ]
  },
  "a11y": [
    "Items expose no role or selected state yet"
  ],
  "variants": {},
  "states": [
    "default",
    "selected item"
  ],
  "platformNotes": [
    "Positioned absolutely: it overlaps content and ignores safe-area insets"
  ],
  "examples": [
    {
      "title": "BottomBar page",
      "path": "docs/components/navigation/bottom-bar.md"
    }
  ]
};
