import type { ComponentMeta } from "../../meta/types.js";

export const meta: ComponentMeta = {
  "name": "Spinner",
  "category": "feedback",
  "status": "demo",
  "summary": "Activity indicator in three sizes.",
  "whenToUse": [
    "Show that work of unknown duration is in progress"
  ],
  "whenNotToUse": [
    {
      "reason": "Use ProgressBar when progress is known",
      "instead": "ProgressBar"
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
    "accessibilityRole progressbar, accessibilityState.busy and an accessibilityLabel (default Loading)"
  ],
  "variants": {
    "size": [
      "sm",
      "md",
      "lg"
    ]
  },
  "states": [
    "default"
  ],
  "platformNotes": [
    "iOS maps sm and md to small and lg to large (it ignores numeric sizes); Android and web use 16, 24 and 32"
  ],
  "examples": [
    {
      "title": "Feedback examples",
      "path": "examples/feedback.tsx"
    }
  ]
};
