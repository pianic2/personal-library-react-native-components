import type { ComponentMeta } from "../../meta/types.js";

export const meta: ComponentMeta = {
  "name": "BulletList",
  "category": "typography",
  "status": "prototype",
  "summary": "Semantic list for bulleted, numbered, checklist or plain content, with nesting up to three levels and a custom marker.",
  "whenToUse": [
    "Show legal, onboarding or help content as a list instead of faking bullets with text",
    "Number steps, optionally from a start value, or show a checklist"
  ],
  "whenNotToUse": [
    {
      "reason": "A single block of prose is a paragraph",
      "instead": "P"
    }
  ],
  "composition": {
    "parents": [
      "Column",
      "Card"
    ],
    "children": [],
    "pairsWith": [
      "Heading",
      "P"
    ]
  },
  "a11y": [
    "The container has role list and each item role listitem",
    "Native items carry an accessibilityLabel (or hint, for rich content) of the form item N of M as a fallback for list semantics",
    "Markers are hidden from assistive technology; a check item exposes its checked state"
  ],
  "variants": {
    "type": [
      "bullet",
      "number",
      "check",
      "none"
    ]
  },
  "states": [
    "default",
    "nested",
    "checked"
  ],
  "platformNotes": [
    "Nesting is indented up to three levels; deeper lists keep the third level marker",
    "Verified by render tests only, not on a device"
  ],
  "examples": [
    {
      "title": "Numbered list from 3",
      "code": "<BulletList type=\"number\" start={3}><BulletList.Item>Third</BulletList.Item><BulletList.Item>Fourth</BulletList.Item></BulletList>"
    },
    {
      "title": "Checklist",
      "path": "docs/components/typography/BulletList.md"
    }
  ]
};
