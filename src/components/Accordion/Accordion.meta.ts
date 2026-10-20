import type { ComponentMeta } from "../../meta/types.js";

export const meta: ComponentMeta = {
  "name": "Accordion",
  "category": "surfaces",
  "status": "prototype",
  "summary": "Group of disclosure items built on Collapsible: single (optionally collapsible) or multiple items open, controlled or uncontrolled.",
  "whenToUse": [
    "Group related disclosures such as an FAQ or settings sections where only one (single) or several (multiple) stay open",
    "Show headings with expandable detail in a vertical list without leaving the page"
  ],
  "whenNotToUse": [
    {
      "reason": "A single standalone show/hide region does not need a group",
      "instead": "Collapsible"
    },
    {
      "reason": "Content that floats over the page and closes when the user taps outside is a popover",
      "instead": "Popover"
    }
  ],
  "composition": {
    "parents": [],
    "children": [],
    "pairsWith": [
      "Collapsible",
      "Text"
    ]
  },
  "a11y": [
    "Accordion.Header has accessibilityRole button and accessibilityState expanded (and disabled for a disabled item)",
    "Accordion.Panel is labelled by its header (accessibilityLabelledBy and aria-labelledby)",
    "Closed panels are hidden from screen readers; reduced motion opens and closes instantly"
  ],
  "variants": {},
  "states": [
    "closed",
    "open",
    "disabled"
  ],
  "platformNotes": [
    "Built on Collapsible: height is animated with the motion engine on the JS driver; LayoutAnimation is not used",
    "iOS, Android and web are covered by render tests only, not verified on a device"
  ],
  "examples": [
    {
      "title": "Accordion usage",
      "path": "docs/components/surfaces/Accordion.md"
    }
  ]
};
