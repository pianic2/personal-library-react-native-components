import type { ComponentMeta } from "../../meta/types.js";

export const meta: ComponentMeta = {
  "name": "FormField",
  "category": "form",
  "status": "prototype",
  "summary": "Wrapper that adds a label, helper text and a status color to a form control.",
  "whenToUse": [
    "Label a form control and show helper or validation text"
  ],
  "whenNotToUse": [
    {
      "reason": "Input already takes a label and helper text itself",
      "instead": "Input"
    }
  ],
  "composition": {
    "parents": [],
    "children": [
      "Input",
      "Select",
      "Checkbox",
      "Switch",
      "RadioGroup"
    ],
    "pairsWith": [
      "Text"
    ]
  },
  "a11y": [
    "The label is not programmatically linked to the control yet"
  ],
  "variants": {
    "status": [
      "default",
      "error",
      "success",
      "warning"
    ]
  },
  "states": [
    "default",
    "error",
    "success",
    "warning"
  ],
  "platformNotes": [],
  "examples": [
    {
      "title": "Form controls",
      "path": "examples/form-controls.tsx"
    }
  ]
};
