import type { ComponentMeta } from "../../meta/types.js";

export const meta: ComponentMeta = {
  "name": "Field",
  "category": "form",
  "status": "demo",
  "summary": "Compound form field: Label, Control, Hint and Error share ids so any control is labelled, described and announces its error.",
  "whenToUse": [
    "Give any control a label, a hint and an error message that assistive technology links to it",
    "Compose the label and the messages explicitly instead of passing label and helper props to the control"
  ],
  "whenNotToUse": [
    {
      "reason": "A single labelled input with a helper line, and no composition needed",
      "instead": "Input"
    },
    {
      "reason": "The prop-based wrapper that clones its child is enough",
      "instead": "FormField"
    }
  ],
  "composition": {
    "parents": [],
    "children": [
      "Label",
      "Small",
      "Input"
    ],
    "pairsWith": [
      "Input",
      "Textarea",
      "Select"
    ]
  },
  "a11y": [
    "Field.Label carries the label id; the control references it with accessibilityLabelledBy through useFieldControlProps()",
    "The control gets aria-invalid for the error status and aria-describedby / accessibilityDescribedBy for the displayed hint and error",
    "Field.Error is a polite live region (accessibilityLiveRegion polite, role alert on web) and renders only when it has a message",
    "The error message, or the hint without an error, is also the control's accessibilityHint as the native fallback",
    "The hint is hidden while an error is displayed but both stay in the description"
  ],
  "variants": {
    "status": [
      "default",
      "error",
      "success",
      "warning"
    ]
  },
  "states": [
    "default",
    "error",
    "success",
    "warning",
    "disabled",
    "required"
  ],
  "platformNotes": [
    "role alert is set on web only; native uses accessibilityLiveRegion polite",
    "accessibilityLabelledBy is an Android prop; web and iOS rely on the control's own accessibilityLabel"
  ],
  "examples": [
    {
      "title": "Field with Input",
      "path": "examples/field.tsx"
    }
  ]
};
