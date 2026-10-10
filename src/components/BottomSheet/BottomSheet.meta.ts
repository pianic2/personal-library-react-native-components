import type { ComponentMeta } from "../../meta/types.js";

export const meta: ComponentMeta = {
  "name": "BottomSheet",
  "category": "overlay",
  "status": "prototype",
  "summary": "Panel that slides up from the bottom edge with two snap positions.",
  "whenToUse": [
    "Present secondary content or actions without leaving the screen"
  ],
  "whenNotToUse": [
    {
      "reason": "A centred blocking dialog is a better fit for confirmations",
      "instead": "Modal"
    }
  ],
  "composition": {
    "parents": [],
    "children": [],
    "pairsWith": [
      "Button",
      "Text"
    ]
  },
  "a11y": [
    "No accessibilityViewIsModal, label or drag gesture yet"
  ],
  "variants": {
    "snap": [
      "collapsed",
      "expanded"
    ]
  },
  "states": [
    "hidden",
    "visible"
  ],
  "platformNotes": [
    "BottomSheetProps is not exported from the root yet"
  ],
  "examples": [
    {
      "title": "Overlay examples",
      "path": "examples/overlays.experimental.tsx"
    }
  ]
};
