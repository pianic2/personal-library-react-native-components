import type { ComponentMeta } from "../../meta/types.js";

export const meta: ComponentMeta = {
  "name": "Chip",
  "category": "buttons",
  "status": "demo",
  "summary": "Compact selectable, removable token for filters, multi-select values and tags, with an optional icon or avatar.",
  "whenToUse": [
    "Show a filter that the user turns on and off",
    "Show a chosen value or tag that the user can remove"
  ],
  "whenNotToUse": [
    {
      "reason": "A status or count that carries no action is a static label",
      "instead": "Badge"
    },
    {
      "reason": "A primary or form-submitting action",
      "instead": "Button"
    }
  ],
  "composition": {
    "parents": [],
    "children": [],
    "pairsWith": [
      "Touchable",
      "Icon",
      "Badge"
    ]
  },
  "a11y": [
    "role checkbox with accessibilityState checked and selected when the chip is selectable, role button when it only has onPress; accessibilityState disabled",
    "The remove control is a separate button labelled Remove <label>; its 44pt target is reached with hitSlop, so the chip stays 32 or 40 high",
    "leftIcon and avatar are decorative (hidden from assistive technology); the label carries the meaning, and selection is not shown by colour alone for assistive technology because it is also in the state"
  ],
  "variants": {
    "variant": [
      "filled",
      "outline",
      "soft"
    ],
    "size": [
      "sm",
      "md"
    ],
    "tone": [
      "primary",
      "neutral",
      "success",
      "warning",
      "danger",
      "info"
    ]
  },
  "states": [
    "default",
    "selected",
    "pressed",
    "disabled",
    "removable"
  ],
  "platformNotes": [
    "Press feedback comes from Touchable and follows the reduced-motion preference; iOS, Android and web are covered by render tests only, not verified on a device"
  ],
  "examples": [
    {
      "title": "Chip example",
      "path": "docs/components/buttons/Chip.md"
    }
  ]
};
