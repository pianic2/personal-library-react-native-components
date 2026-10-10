import type { ComponentMeta } from "../../meta/types.js";

export const meta: ComponentMeta = {
  "name": "Popover",
  "category": "overlay",
  "status": "prototype",
  "summary": "Floating panel anchored to a trigger.",
  "whenToUse": [
    "Show a small anchored panel of content or actions on web"
  ],
  "whenNotToUse": [
    {
      "reason": "Native renders only the trigger; use BottomSheet on native",
      "instead": "BottomSheet"
    }
  ],
  "composition": {
    "parents": [],
    "children": [],
    "pairsWith": [
      "Button"
    ]
  },
  "a11y": [
    "No accessibility semantics or outside-press dismiss yet"
  ],
  "variants": {
    "placement": [
      "top",
      "bottom",
      "left",
      "right"
    ],
    "gap": [
      "none",
      "xs",
      "sm",
      "md",
      "lg",
      "xl",
      "xxl"
    ]
  },
  "states": [
    "closed",
    "open"
  ],
  "platformNotes": [
    "Native renders the trigger only, no popover content",
    "PopoverProps is not exported from the root yet"
  ],
  "examples": [
    {
      "title": "Overlay examples",
      "path": "examples/overlays.experimental.tsx"
    }
  ]
};
