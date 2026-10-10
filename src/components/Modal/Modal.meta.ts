import type { ComponentMeta } from "../../meta/types.js";

export const meta: ComponentMeta = {
  "name": "Modal",
  "category": "overlay",
  "status": "prototype",
  "summary": "Centered blocking dialog over a backdrop.",
  "whenToUse": [
    "Ask for a confirmation or a short decision that blocks the screen"
  ],
  "whenNotToUse": [
    {
      "reason": "A bottom panel suits secondary actions on small screens",
      "instead": "BottomSheet"
    }
  ],
  "composition": {
    "parents": [],
    "children": [
      "Heading",
      "Text",
      "Button"
    ],
    "pairsWith": [
      "Button"
    ]
  },
  "a11y": [
    "No accessibilityViewIsModal, focus trap or title yet"
  ],
  "variants": {
    "size": [
      "sm",
      "md",
      "lg"
    ]
  },
  "states": [
    "hidden",
    "visible"
  ],
  "platformNotes": [
    "The backdrop color is hardcoded instead of using the backdrop token",
    "ModalProps is not exported from the root yet"
  ],
  "examples": [
    {
      "title": "Overlay examples",
      "path": "examples/overlays.experimental.tsx"
    }
  ]
};
