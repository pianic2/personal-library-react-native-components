import type { ComponentMeta } from "../../meta/types.js";

export const meta: ComponentMeta = {
  "name": "SideBar",
  "category": "navigation",
  "status": "prototype",
  "summary": "Vertical navigation panel with items, an optional logo and collapse control.",
  "whenToUse": [
    "Provide persistent navigation on wide web layouts"
  ],
  "whenNotToUse": [
    {
      "reason": "Use NavBar to pick the layout per platform",
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
    "No roles or landmark yet",
    "Collapse glyphs are hardcoded"
  ],
  "variants": {
    "variant": [
      "fixed",
      "embedded"
    ]
  },
  "states": [
    "expanded",
    "collapsed"
  ],
  "platformNotes": [
    "position fixed on web through a typed escape hatch"
  ],
  "examples": [
    {
      "title": "SideBar page",
      "path": "docs/components/navigation/side-bar.md"
    }
  ]
};
