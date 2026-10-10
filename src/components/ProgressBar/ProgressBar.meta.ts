import type { ComponentMeta } from "../../meta/types.js";

export const meta: ComponentMeta = {
  "name": "ProgressBar",
  "category": "feedback",
  "status": "prototype",
  "summary": "Horizontal bar showing a progress value from 0 to 100.",
  "whenToUse": [
    "Show determinate progress of a task"
  ],
  "whenNotToUse": [
    {
      "reason": "Use Spinner when the duration is unknown",
      "instead": "Spinner"
    }
  ],
  "composition": {
    "parents": [],
    "children": [],
    "pairsWith": [
      "Text",
      "Card"
    ]
  },
  "a11y": [
    "No progressbar role or accessibilityValue yet",
    "An undefined progress renders at 30%"
  ],
  "variants": {
    "color": [
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
      "title": "Progress at 50",
      "code": "<ProgressBar progress={50} />"
    }
  ]
};
