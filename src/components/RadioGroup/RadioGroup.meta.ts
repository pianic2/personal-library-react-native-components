import type { ComponentMeta } from "../../meta/types.js";

export const meta: ComponentMeta = {
  "name": "RadioGroup",
  "category": "form",
  "status": "demo",
  "summary": "Group of radio options where exactly one value is selected.",
  "whenToUse": [
    "Choose exactly one option from a short list"
  ],
  "whenNotToUse": [
    {
      "reason": "Use Checkbox for independent options",
      "instead": "Checkbox"
    },
    {
      "reason": "Use Select for long lists",
      "instead": "Select"
    }
  ],
  "composition": {
    "parents": [],
    "children": [],
    "pairsWith": [
      "FormField"
    ]
  },
  "a11y": [
    "Exposes radio roles with the selected state; a disabled option reports accessibilityState.disabled",
    "The group takes an accessibilityLabel"
  ],
  "variants": {},
  "states": [
    "unselected",
    "selected",
    "disabled"
  ],
  "platformNotes": [
    "String values only; disabled applies to the whole group or to one option"
  ],
  "examples": [
    {
      "title": "Form controls",
      "path": "examples/form-controls.tsx"
    }
  ]
};
