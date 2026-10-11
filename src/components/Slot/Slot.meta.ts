import type { ComponentMeta } from "../../meta/types.js";

export const meta: ComponentMeta = {
  "name": "Slot",
  "category": "layout",
  "status": "prototype",
  "summary": "Merges its props into its single child element (asChild) instead of rendering a wrapper.",
  "whenToUse": [
    "Let a component render as a caller-supplied element while keeping its own props, handlers and ref"
  ],
  "whenNotToUse": [
    {
      "reason": "To lay out several children; Slot accepts exactly one element",
      "instead": "Column"
    }
  ],
  "composition": {
    "parents": [],
    "children": [],
    "pairsWith": [
      "Box"
    ]
  },
  "a11y": [
    "Never drops accessibilityRole or accessibilityState from either side: accessibilityState and accessibilityValue are merged per key, other accessibility* props take the child's value unless it is undefined",
    "onPress and other handlers only fire if the child element is itself pressable"
  ],
  "variants": {},
  "states": [
    "default"
  ],
  "platformNotes": [],
  "examples": [
    {
      "title": "Slot usage",
      "path": "docs/components/layout/Slot.md"
    }
  ]
};
