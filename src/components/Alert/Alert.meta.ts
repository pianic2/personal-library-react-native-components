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
    "onDismiss adds a close button (44pt target, accessibilityLabel from dismissLabel, default Dismiss)",
    "soft and outline use textPrimary on the tinted surface / the page; the icon slot is decorative (hidden from assistive technology); the outline warning border is only about 2:1 on white, so severity never relies on colour alone"
  ],
  "variants": {
    "variant": [
      "primary",
      "info",
      "success",
      "warning",
      "error"
    ],
    "appearance": [
      "solid",
      "soft",
      "outline"
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
