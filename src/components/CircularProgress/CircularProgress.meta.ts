import type { ComponentMeta } from "../../meta/types.js";

export const meta: ComponentMeta = {
  "name": "CircularProgress",
  "category": "data-display",
  "status": "prototype",
  "summary": "Ring showing a progress value from 0 to 100, or an indeterminate rotating ring, drawn with plain Views.",
  "whenToUse": [
    "Show determinate progress of a goal or task as a ring, optionally with a value in the centre",
    "Show a compact busy indicator of unknown duration that matches the ProgressBar tones"
  ],
  "whenNotToUse": [
    {
      "reason": "A linear progress value in a row or a list item is a bar",
      "instead": "ProgressBar"
    },
    {
      "reason": "A plain loading indicator with no value and no centre content is a spinner",
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
    "An undefined progress renders an empty ring (0)"
  ],
  "variants": {
    "tone": [
      "primary",
      "info",
      "success",
      "warning",
      "danger"
    ],
    "size": [
      "xs",
      "sm",
      "md",
      "lg"
    ]
  },
  "states": [
    "default",
    "indeterminate"
  ],
  "platformNotes": [
    "Built from two clipped half-circle Views, no svg; the indeterminate rotation uses the native driver and is a static segment under reduced motion",
    "iOS, Android and web are covered by render tests only, not verified on a device"
  ],
  "examples": [
    {
      "title": "Progress at 50",
      "code": "<CircularProgress progress={50} label=\"50%\" />"
    }
  ]
};
