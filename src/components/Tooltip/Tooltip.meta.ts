import type { ComponentMeta } from "../../meta/types.js";

export const meta: ComponentMeta = {
  "name": "Tooltip",
  "category": "overlay",
  "status": "prototype",
  "summary": "Short hint shown near a trigger after a delay.",
  "whenToUse": [
    "Explain an icon or a control on web with a short text"
  ],
  "whenNotToUse": [
    {
      "reason": "Native returns the children only; put the information in visible text",
      "instead": "Text"
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
    "No long-press or accessibility description on native"
  ],
  "variants": {
    "placement": [
      "top",
      "bottom",
      "left",
      "right"
    ]
  },
  "states": [
    "hidden",
    "visible"
  ],
  "platformNotes": [
    "Native returns the children only",
    "TooltipProps is not exported from the root yet"
  ],
  "examples": [
    {
      "title": "Overlay examples",
      "path": "examples/overlays.experimental.tsx"
    }
  ]
};
