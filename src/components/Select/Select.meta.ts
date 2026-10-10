import type { ComponentMeta } from "../../meta/types.js";

export const meta: ComponentMeta = {
  "name": "Select",
  "category": "form",
  "status": "prototype",
  "summary": "Single-choice dropdown that opens a list of options.",
  "whenToUse": [
    "Choose one value from a medium-sized list"
  ],
  "whenNotToUse": [
    {
      "reason": "Use RadioGroup for a short list that should stay visible",
      "instead": "RadioGroup"
    }
  ],
  "composition": {
    "parents": [
      "FormField"
    ],
    "children": [],
    "pairsWith": [
      "FormField"
    ]
  },
  "a11y": [
    "No role, label, disabled state or selected indicator yet"
  ],
  "variants": {},
  "states": [
    "closed",
    "open",
    "error"
  ],
  "platformNotes": [
    "SelectProps and Option are not exported from the root yet",
    "No scrolling for long lists and no Android back handling"
  ],
  "examples": [
    {
      "title": "Overlay examples",
      "path": "examples/overlays.experimental.tsx"
    }
  ]
};
