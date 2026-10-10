import type { ComponentMeta } from "../../meta/types.js";

export const meta: ComponentMeta = {
  "name": "NavBar",
  "category": "navigation",
  "status": "demo",
  "summary": "Navigation shell that renders a top bar, bottom bar or sidebar from the same items.",
  "whenToUse": [
    "Provide the main navigation of an app across platforms"
  ],
  "whenNotToUse": [
    {
      "reason": "Use TopBar, BottomBar or SideBar directly only when you need to force one layout",
      "instead": "TopBar"
    }
  ],
  "composition": {
    "parents": [],
    "children": [
      "TopBar",
      "BottomBar",
      "SideBar"
    ],
    "pairsWith": [
      "NavContext",
      "Link"
    ]
  },
  "a11y": [],
  "variants": {
    "layout": [
      "auto",
      "top",
      "bottom",
      "sidebar"
    ],
    "sidebarVariant": [
      "fixed",
      "embedded"
    ]
  },
  "states": [
    "default"
  ],
  "platformNotes": [
    "Layout auto picks top on web and bottom on native, without breakpoint awareness"
  ],
  "examples": [
    {
      "title": "Navigation examples",
      "path": "examples/navigation.tsx"
    }
  ]
};
