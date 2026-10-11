import type { ComponentMeta } from "../../meta/types.js";

export const meta: ComponentMeta = {
  "name": "Input",
  "category": "form",
  "status": "demo",
  "summary": "Text input with a label, helper text and an error state.",
  "whenToUse": [
    "Collect short free text such as a name or an email address"
  ],
  "whenNotToUse": [
    {
      "reason": "Use Textarea for multi-line text",
      "instead": "Textarea"
    },
    {
      "reason": "Use PasswordInput for secrets",
      "instead": "PasswordInput"
    }
  ],
  "composition": {
    "parents": [
      "FormField",
      "Card"
    ],
    "children": [],
    "pairsWith": [
      "FormField",
      "Button"
    ]
  },
  "a11y": [
    "The label (or an explicit accessibilityLabel) and the helper text are announced as the accessible name and hint",
    "label is optional; without label and accessibilityLabel a dev warning is logged"
  ],
  "variants": {
    "size": [
      "xs",
      "sm",
      "md",
      "lg"
    ]
  },
  "states": [
    "default",
    "focused",
    "error",
    "disabled"
  ],
  "platformNotes": [
    "Unknown props leak to the underlying TextInput, except label, which is consumed",
    "containerStyle styles the wrapper View"
  ],
  "examples": [
    {
      "title": "Form controls",
      "path": "examples/form-controls.tsx"
    }
  ]
};
