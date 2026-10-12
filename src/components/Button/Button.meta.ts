import type { ComponentMeta } from "../../meta/types.js";

export const meta: ComponentMeta = {
  "name": "Button",
  "category": "buttons",
  "status": "demo",
  "summary": "Pressable button with variants, sizes, an optional icon and a disabled state.",
  "whenToUse": [
    "Trigger an action",
    "Submit a form or confirm a step",
    "Show one primary action per view and secondary actions as ghost or secondary"
  ],
  "whenNotToUse": [
    {
      "reason": "Use Link to navigate to another screen or URL",
      "instead": "Link"
    },
    {
      "reason": "Use Switch for an on/off setting",
      "instead": "Switch"
    }
  ],
  "composition": {
    "parents": [
      "Card",
      "Row",
      "Column",
      "Modal"
    ],
    "children": [],
    "pairsWith": [
      "Card",
      "Row",
      "Input"
    ]
  },
  "a11y": [
    "Exposes role button, the label as accessible name and the disabled state",
    "Every filled variant (primary, secondary, danger, info) keeps its background when pressed and its label reaches 4.5:1 in light and dark; the label falls back to the primary text colour when the inverted one would not",
    "The pressed state is shown with the pressed opacity token, not a background swap",
    "Hit area is at least 44x44"
  ],
  "variants": {
    "variant": [
      "primary",
      "secondary",
      "ghost",
      "danger",
      "info"
    ],
    "size": [
      "xs",
      "sm",
      "md",
      "lg"
    ]
  },
  "states": [
    "default",
    "pressed",
    "disabled"
  ],
  "platformNotes": [
    "Same behavior on iOS, Android and web"
  ],
  "examples": [
    {
      "title": "Basic usage",
      "path": "examples/basic-usage.tsx"
    },
    {
      "title": "Primary button",
      "code": "<Button label=\"Save\" onPress={() => undefined} />"
    }
  ]
};
