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
    "No role=alert or live region yet: screen readers do not announce it when it appears"
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
    "default"
  ],
  "platformNotes": [],
  "examples": [
    {
      "title": "Feedback examples",
      "path": "examples/feedback.tsx"
    }
  ]
};
