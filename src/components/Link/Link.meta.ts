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
    "accessibilityRole link; accessibilityLabel passes through",
    "disabled blocks onPress and navigation, sets accessibilityState.disabled and dims the link",
    "On web the href is rendered on the anchor (open in new tab, copy address) and a click navigates through the Link handler"
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
    "default",
    "active",
    "disabled"
  ],
  "platformNotes": [],
  "examples": [
    {
      "title": "Navigation examples",
      "path": "examples/navigation.tsx"
    }
  ]
};
