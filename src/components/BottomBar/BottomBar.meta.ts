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
    "The bar is a navigation landmark, its items form a tablist: each item has role tab and accessibilityState.selected for the current route"
  ],
  "variants": {
    "position": [
      "absolute",
      "static"
    ]
  },
  "states": [
    "default",
    "selected item"
  ],
  "platformNotes": [
    "Positioned absolutely by default (position=\"static\" lays it out in the flow); safe-area insets are passed in through the insets prop, the library reads none"
  ],
  "examples": [
    {
      "title": "BottomBar page",
      "path": "docs/components/navigation/bottom-bar.md"
    }
  ]
};
