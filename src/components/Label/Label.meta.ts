import type { ComponentMeta } from "../../meta/types.js";

export const meta: ComponentMeta = {
  "name": "Label",
  "category": "form",
  "status": "prototype",
  "summary": "Label for form and custom controls with a required marker, optional hint, disabled state and press-to-focus.",
  "whenToUse": [
    "Name a custom control, a Checkbox or Switch row, or any control that has no label of its own",
    "Link a label to an input so that pressing it focuses the input"
  ],
  "whenNotToUse": [
    {
      "reason": "Input already renders its own label; use Label only for controls that do not",
      "instead": "Input"
    }
  ],
  "composition": {
    "parents": [
      "Row",
      "Column",
      "FormField"
    ],
    "children": [],
    "pairsWith": [
      "Input",
      "Checkbox",
      "Switch"
    ]
  },
  "a11y": [
    "required adds ', required' to the accessibility label; the visible * is hidden from the accessibility tree",
    "nativeID lets a control reference the label with accessibilityLabelledBy",
    "Pressing the label focuses the referenced control (htmlFor): a pointer convenience, the control stays the accessible target",
    "disabled sets accessibilityState.disabled and mutes the text"
  ],
  "variants": {
    "size": [
      "sm",
      "md"
    ]
  },
  "states": [
    "default",
    "required",
    "optional",
    "disabled"
  ],
  "platformNotes": [],
  "examples": [
    {
      "title": "Label usage",
      "path": "docs/components/form/Label.md"
    }
  ]
};
