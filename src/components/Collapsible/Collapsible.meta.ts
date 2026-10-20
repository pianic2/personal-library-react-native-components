import type { ComponentMeta } from "../../meta/types.js";

export const meta: ComponentMeta = {
  "name": "Collapsible",
  "category": "surfaces",
  "status": "prototype",
  "summary": "Disclosure region: a trigger shows or hides content with an animated height, controlled or uncontrolled.",
  "whenToUse": [
    "Show and hide a block of content in the page flow, such as an accordion item, an FAQ answer or advanced filters",
    "Build a larger disclosure component on a measured, animated expand/collapse base"
  ],
  "whenNotToUse": [
    {
      "reason": "Content that floats over the page and closes when the user taps outside is a popover",
      "instead": "Popover"
    }
  ],
  "composition": {
    "parents": [],
    "children": [],
    "pairsWith": [
      "Touchable",
      "Text",
      "Slot"
    ]
  },
  "a11y": [
    "Collapsible.Trigger has accessibilityRole button and accessibilityState expanded (aria-expanded and aria-controls on web)",
    "Closed content is hidden from screen readers (importantForAccessibility no-hide-descendants, accessibilityElementsHidden, aria-hidden) and does not receive touches",
    "Reduced motion, or animated false, opens and closes instantly"
  ],
  "variants": {},
  "states": [
    "closed",
    "open",
    "animating"
  ],
  "platformNotes": [
    "Height is animated with the motion engine on the JS driver (layout properties cannot use the native driver); LayoutAnimation is not used",
    "iOS, Android and web are covered by render tests only, not verified on a device"
  ],
  "examples": [
    {
      "title": "Collapsible usage",
      "path": "docs/components/surfaces/Collapsible.md"
    }
  ]
};
