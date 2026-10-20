import type { ComponentMeta } from "../../meta/types.js";

export const meta: ComponentMeta = {
  "name": "ExpandableText",
  "category": "typography",
  "status": "prototype",
  "summary": "Text clamped to a number of lines with a read more / show less toggle that appears only when the text is truncated.",
  "whenToUse": [
    "Show a long description, review or feed item that should start short and expand on demand",
    "Replace a hand-built onTextLayout truncation check with a toggle"
  ],
  "whenNotToUse": [
    {
      "reason": "Text that never needs a toggle, only a hard limit with an ellipsis",
      "instead": "Text"
    },
    {
      "reason": "A block of arbitrary content, not a string, that is shown or hidden",
      "instead": "Collapsible"
    }
  ],
  "composition": {
    "parents": [],
    "children": [],
    "pairsWith": [
      "Text",
      "P",
      "Card"
    ]
  },
  "a11y": [
    "The toggle has accessibilityRole button and accessibilityState expanded (aria-expanded on web); its label is the visible moreLabel or lessLabel",
    "The invisible measuring copy of the text is hidden from assistive technology and ignores touches",
    "The toggle is one line high; its 44pt target is reached with hit slop"
  ],
  "variants": {
    "size": [
      "sm",
      "md",
      "lg"
    ]
  },
  "states": [
    "collapsed",
    "expanded",
    "not truncatable"
  ],
  "platformNotes": [
    "Truncation is detected from onTextLayout of an invisible copy of the text without a line limit, because the visible clamped text may report fewer lines than it has; iOS, Android and web are covered by render tests only, not verified on a device"
  ],
  "examples": [
    {
      "title": "ExpandableText usage",
      "path": "docs/components/typography/ExpandableText.md"
    }
  ]
};
