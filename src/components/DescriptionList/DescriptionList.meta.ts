import type { ComponentMeta } from "../../meta/types.js";

export const meta: ComponentMeta = {
  "name": "DescriptionList",
  "category": "data-display",
  "status": "prototype",
  "summary": "Label/value pairs for detail views: stacked, inline or in grid columns, with an optional consumer-handled copy action.",
  "whenToUse": [
    "Show the details of a record as label and value pairs, such as a profile, an order or a device",
    "Reuse one details view inside a card or a data table row"
  ],
  "whenNotToUse": [
    {
      "reason": "Rows and columns of many records to compare, sort or select belong in a data table",
      "instead": "DataTable"
    }
  ],
  "composition": {
    "parents": [],
    "children": [],
    "pairsWith": [
      "Card",
      "Grid",
      "Text"
    ]
  },
  "a11y": [
    "Each label/value pair is one accessible element whose label reads \"label: value\", so a screen reader announces them together",
    "A copyable pair has accessibilityRole button and an optional hint; the library does not write to the clipboard"
  ],
  "variants": {
    "layout": [
      "stacked",
      "inline",
      "grid"
    ]
  },
  "states": [
    "default",
    "copyable"
  ],
  "platformNotes": [
    "Grid columns follow the breakpoint (default one column, two from md)",
    "iOS, Android and web are covered by render tests only, not verified on a device"
  ],
  "examples": [
    {
      "title": "DescriptionList usage",
      "path": "docs/components/data-display/DescriptionList.md"
    }
  ]
};
