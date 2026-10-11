import type { ComponentMeta } from "../../meta/types.js";

export const meta: ComponentMeta = {
  "name": "Checkbox",
  "category": "form",
  "status": "demo",
  "summary": "Two-state checkbox with a label.",
  "whenToUse": [
    "Let the user select zero or more independent options",
    "Accept terms or toggle a boolean preference in a form"
  ],
  "whenNotToUse": [
    {
      "reason": "Use Switch for an immediate on/off setting",
      "instead": "Switch"
    },
    {
      "reason": "Use RadioGroup when exactly one option must be chosen",
      "instead": "RadioGroup"
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
    "Exposes role checkbox with the checked and disabled state; indeterminate reports checked: mixed"
  ],
  "variants": {},
  "states": [
    "unchecked",
    "checked",
    "indeterminate",
    "invalid",
    "disabled"
  ],
  "platformNotes": [
    "invalid only recolours the box; React Native has no invalid accessibility state, so pair it with visible text"
  ],
  "examples": [
    {
      "title": "Form controls",
      "path": "examples/form-controls.tsx"
    }
  ]
};
