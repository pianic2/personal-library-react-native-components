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
    "accessibilityRole progressbar with accessibilityValue {min:0,max:100,now} (clamped)",
    "Indeterminate: progressbar with accessibilityState.busy and no value",
    "An undefined progress renders an empty bar (0%)"
  ],
  "variants": {
    "tone": [
      "primary",
      "info",
      "success",
      "warning",
      "danger"
    ]
  },
  "states": [
    "default",
    "indeterminate"
  ],
  "platformNotes": [
    "The indeterminate sweep honours reduced motion (a static segment); color is a deprecated alias of tone"
  ],
  "examples": [
    {
      "title": "Progress at 50",
      "code": "<ProgressBar progress={50} />"
    }
  ]
};
