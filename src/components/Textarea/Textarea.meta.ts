import type { ComponentMeta } from "../../meta/types.js";

export const meta: ComponentMeta = {
  "name": "Textarea",
  "category": "form",
  "status": "prototype",
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
  "a11y": [],
  "variants": {},
  "states": [
    "default",
    "focused",
    "disabled"
  ],
  "platformNotes": [
    "Hardcoded minimum height of 100"
  ],
  "examples": [
    {
      "title": "Textarea",
      "code": "<Textarea label=\"Message\" value=\"Hello\" onChangeText={() => undefined} />"
    }
  ]
};
