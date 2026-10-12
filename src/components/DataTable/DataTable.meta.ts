import type { ComponentMeta } from "../../meta/types.js";

export const meta: ComponentMeta = {
  "name": "DataTable",
  "category": "data-display",
  "status": "prototype",
  "summary": "Headless data table model: column definitions, stable sorting with a three-step cycle, and single, multiple or all-row selection.",
  "whenToUse": [
    "Sort and select the rows of a table with logic that is separate from rendering and testable in plain Node",
    "Drive your own table, list or card layout from the same sorted row ids and selection state"
  ],
  "whenNotToUse": [
    {
      "reason": "To lay out a short, static list of items",
      "instead": "Column"
    }
  ],
  "composition": {
    "parents": [],
    "children": [],
    "pairsWith": [
      "Checkbox",
      "Text"
    ]
  },
  "a11y": [
    "The model renders nothing: the view that uses it must expose sort buttons with an accessibility label and checkboxes (or a selected state) for the selection, and use someSelected for the indeterminate header state"
  ],
  "variants": {
    "selectionMode": [
      "none",
      "single",
      "multi"
    ]
  },
  "states": [
    "unsorted",
    "sorted ascending",
    "sorted descending",
    "row selected"
  ],
  "platformNotes": [
    "The model files import no React Native module and run in plain Node; the default order of ASCII strings is case-insensitive and numeric, other strings use the locale collator"
  ],
  "examples": [
    {
      "title": "DataTable model usage",
      "path": "docs/components/data-display/DataTable.md"
    }
  ]
};
