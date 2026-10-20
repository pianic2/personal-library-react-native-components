import type { ComponentMeta } from "../../meta/types.js";

export const meta: ComponentMeta = {
  "name": "Grid",
  "category": "layout",
  "status": "prototype",
  "summary": "Equal-width wrapping columns with responsive column counts, optional spans and token gaps.",
  "whenToUse": [
    "Lay out galleries, dashboards, settings tiles or form columns that adapt from phone to tablet to web",
    "Fit as many columns as a minimum item width allows (minItemWidth) inside the nearest Container"
  ],
  "whenNotToUse": [
    {
      "reason": "To place a few children side by side or stack them",
      "instead": "Row"
    }
  ],
  "composition": {
    "parents": [],
    "children": [],
    "pairsWith": [
      "Container",
      "Card"
    ]
  },
  "a11y": [
    "Pure layout: plain Views, children order preserved, no role and no accessibility props"
  ],
  "variants": {},
  "states": [
    "default"
  ],
  "platformNotes": [
    "Layout only, so light and dark mode render identically; widths are percentages, no onLayout measurement is needed except for minItemWidth, which reads the nearest Container (or window) width"
  ],
  "examples": [
    {
      "title": "Grid usage",
      "path": "docs/components/layout/Grid.md"
    }
  ]
};
