import type { ComponentMeta } from "../../meta/types.js";

export const meta: ComponentMeta = {
  "name": "Switch",
  "category": "form",
  "status": "demo",
  "summary": "On/off toggle for a setting that applies immediately.",
  "whenToUse": [
    "Toggle a setting on or off"
  ],
  "whenNotToUse": [
    {
      "reason": "Use Checkbox to select an option inside a form",
      "instead": "Checkbox"
    }
  ],
  "composition": {
    "parents": [],
    "children": [],
    "pairsWith": [
      "FormField",
      "Text"
    ]
  },
  "a11y": [
    "Exposes role switch with the checked and disabled state"
  ],
  "variants": {},
  "states": [
    "off",
    "on",
    "disabled"
  ],
  "platformNotes": [],
  "examples": [
    {
      "title": "Form controls",
      "path": "examples/form-controls.tsx"
    }
  ]
};
