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
    "No accessibilityLabel or busy state yet"
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
    "Numeric sizes are ignored by ActivityIndicator on iOS"
  ],
  "examples": [
    {
      "title": "Feedback examples",
      "path": "examples/feedback.tsx"
    }
  ]
};
