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
    "The info variant renders transparent with inverted text and is unreadable (audit E1)",
    "Pressed state contrast is low (audit E1)"
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
