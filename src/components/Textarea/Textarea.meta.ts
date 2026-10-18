import type { ComponentMeta } from "../../meta/types.js";

export const meta: ComponentMeta = {
  "name": "Textarea",
  "category": "form",
  "status": "demo",
  "summary": "Multi-line text input with a label.",
  "whenToUse": [
    "Collect longer free text such as a message or a note"
  ],
  "whenNotToUse": [
    {
      "reason": "Use Input for single-line text",
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
    "Takes the same label, helperText and accessibilityLabel as Input; without a label give an accessibilityLabel"
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
    "disabled"
  ],
  "platformNotes": [
    "The minimum height follows the rows prop (default 4) from the typography and space tokens"
  ],
  "examples": [
    {
      "title": "Textarea",
      "code": "<Textarea label=\"Message\" value=\"Hello\" onChangeText={() => undefined} />"
    }
  ]
};
