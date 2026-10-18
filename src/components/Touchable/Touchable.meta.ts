import type { ComponentMeta } from "../../meta/types.js";

export const meta: ComponentMeta = {
  "name": "Touchable",
  "category": "buttons",
  "status": "demo",
  "summary": "Pressable primitive with press feedback, a 44pt minimum target, hit slop, loading and disabled states and a web focus ring.",
  "whenToUse": [
    "Make any custom content pressable with consistent feedback, target size and accessibility semantics",
    "Build a new pressable component (chip, list row, card) instead of hand-rolling Pressable styling",
    "Add a haptic to a press with the haptic prop"
  ],
  "whenNotToUse": [
    {
      "reason": "A labelled action with a variant, size and icon is already a Button",
      "instead": "Button"
    },
    {
      "reason": "A navigation text link is a Link",
      "instead": "Link"
    }
  ],
  "composition": {
    "parents": [],
    "children": [],
    "pairsWith": [
      "Slot",
      "Button"
    ]
  },
  "a11y": [
    "role maps to accessibilityRole (button, link, tab, checkbox, radio, switch, menuitem)",
    "accessibilityState reports disabled, busy (loading), selected and checked",
    "Minimum 44x44 target through minHeight/minWidth; hitSlop adds touch area around it",
    "A development warning is logged when there is neither an accessibilityLabel nor a text child",
    "On web a focus ring (colors.primary) is drawn for keyboard focus"
  ],
  "variants": {
    "feedback": [
      "opacity",
      "scale",
      "ripple",
      "none"
    ],
    "role": [
      "button",
      "link",
      "tab",
      "checkbox",
      "radio",
      "switch",
      "menuitem"
    ],
    "haptic": [
      "light",
      "medium"
    ]
  },
  "states": [
    "default",
    "pressed",
    "focused",
    "disabled",
    "loading"
  ],
  "platformNotes": [
    "ripple is the Android ripple; iOS and web fall back to opacity",
    "The focus ring is web only; the haptic is a no-op when no haptics capability is available",
    "Press animation follows the reduced-motion preference (opacity only, no animation)"
  ],
  "examples": [
    {
      "title": "Touchable",
      "path": "examples/touchable.tsx"
    }
  ]
};
