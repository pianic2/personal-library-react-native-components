import type { ComponentMeta } from "../../meta/types.js";

export const meta: ComponentMeta = {
  "name": "CodeInline",
  "category": "typography",
  "status": "prototype",
  "summary": "Inline monospace code fragment.",
  "whenToUse": [
    "Show a short code token, command or identifier inside text"
  ],
  "whenNotToUse": [
    {
      "reason": "Prose that is not code",
      "instead": "Text"
    }
  ],
  "composition": {
    "parents": [
      "Text",
      "P"
    ],
    "children": [],
    "pairsWith": [
      "Text"
    ]
  },
  "a11y": [],
  "variants": {},
  "states": [
    "default"
  ],
  "platformNotes": [],
  "examples": [
    {
      "title": "Inline code",
      "code": "<CodeInline>const ok = true;</CodeInline>"
    }
  ]
};
