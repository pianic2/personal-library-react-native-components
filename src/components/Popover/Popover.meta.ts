import type { ComponentMeta } from "../../meta/types.js";

export const meta: ComponentMeta = {
  "name": "Popover",
  "category": "overlay",
  "status": "prototype",
  "summary": "Floating panel anchored to a trigger.",
  "whenToUse": [
    "Show a small anchored panel of content or actions next to a trigger",
    "Keep the panel inside the window and the safe area (it flips and shifts)"
  ],
  "whenNotToUse": [
    {
      "reason": "A blocking dialog that traps focus",
      "instead": "Modal"
    },
    {
      "reason": "A full-width panel on a phone",
      "instead": "BottomSheet"
    }
  ],
  "composition": {
    "parents": [],
    "children": [],
    "pairsWith": [
      "Button",
      "Portal"
    ]
  },
  "a11y": [
    "The trigger exposes accessibilityState.expanded and aria-expanded",
    "The content has role dialog and an accessibilityActions entry named dismiss",
    "A press outside, Escape (web) and Android Back close it; the screen-reader focus returns to the trigger",
    "The trigger is not wrapped in a pressable: it must call toggle itself"
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
    "Renders through Portal into the nearest OverlayHost (React Native Modal fallback with a development warning when there is none)",
    "Positioned from measureInWindow and assumes the OverlayHost fills the window",
    "The preferred placement flips to the opposite side when the content does not fit and shifts to stay inside the safe area",
    "Verified in unit tests with the react-native test shim; not yet verified on devices or in a browser"
  ],
  "examples": [
    {
      "title": "Overlay examples",
      "path": "examples/overlays.experimental.tsx"
    }
  ]
};
