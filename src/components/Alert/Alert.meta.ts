import type { ComponentMeta } from "../../meta/types.js";

export const meta: ComponentMeta = {
  "name": "Alert",
  "category": "feedback",
  "status": "demo",
  "summary": "Inline message block with a tone for success, warning, error or information.",
  "whenToUse": [
    "Show the outcome of an action inside the page flow",
    "Surface a persistent warning or error next to the content it concerns"
  ],
  "whenNotToUse": [],
  "composition": {
    "parents": [],
    "children": [],
    "pairsWith": [
      "Button",
      "Text"
    ]
  },
  "a11y": [
    "accessibilityRole alert; accessibilityLiveRegion assertive for the error variant and polite for the others, so screen readers announce it when it appears",
    "Text and close button use the text token (textInverted or textPrimary) with the higher WCAG contrast on the variant background",
    "onDismiss adds a close button (44pt target, accessibilityLabel from dismissLabel, default Dismiss)"
  ],
  "variants": {
    "variant": [
      "primary",
      "info",
      "success",
      "warning",
      "error"
    ]
  },
  "states": [
    "default",
    "dismissible"
  ],
  "platformNotes": [],
  "examples": [
    {
      "title": "Feedback examples",
      "path": "examples/feedback.tsx"
    }
  ]
};
