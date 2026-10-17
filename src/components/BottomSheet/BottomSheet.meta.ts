import type { ComponentMeta } from "../../meta/types.js";

export const meta: ComponentMeta = {
  "name": "BottomSheet",
  "category": "overlay",
  "status": "demo",
  "summary": "Panel that slides up from the bottom edge, snaps to configurable heights and closes by drag, Back, Escape or backdrop.",
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
    "The sheet is a dialog on the overlay stack with accessibilityViewIsModal; the backdrop is a labelled button",
    "The drag handle exposes a screen-reader action that closes the sheet (closeActionLabel)"
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
    "BottomSheetProps is exported from the component folder, not from the root yet",
    "Back and Escape are handled by the root OverlayHost; without a host the sheet falls back to a native Modal",
    "The drag uses PanResponder; pass gestureDriver to use another gesture library"
  ],
  "examples": [
    {
      "title": "Overlay examples",
      "path": "examples/overlays.experimental.tsx"
    }
  ]
};
