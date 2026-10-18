import type { ComponentMeta } from "../../meta/types.js";

export const meta: ComponentMeta = {
  "name": "PasswordInput",
  "category": "form",
  "status": "demo",
  "summary": "Input with a show/hide toggle for secrets.",
  "whenToUse": [
    "Collect a password or another secret"
  ],
  "whenNotToUse": [
    {
      "reason": "Use Input for non-secret text",
      "instead": "Input"
    }
  ],
  "composition": {
    "parents": [
      "FormField"
    ],
    "children": [],
    "pairsWith": [
      "FormField",
      "Button"
    ]
  },
  "a11y": [
    "The toggle is a button named by showPasswordLabel / hidePasswordLabel (default: the password.show / password.hide messages) with accessibilityState checked"
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
    "hidden",
    "revealed",
    "error",
    "disabled"
  ],
  "platformNotes": [],
  "examples": [
    {
      "title": "Password field",
      "code": "<PasswordInput label=\"Password\" value={value} onChangeText={setValue} />"
    }
  ]
};
