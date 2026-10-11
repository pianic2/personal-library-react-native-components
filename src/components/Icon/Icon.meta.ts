import type { ComponentMeta } from "../../meta/types.js";

export const meta: ComponentMeta = {
  "name": "Icon",
  "category": "typography",
  "status": "prototype",
  "summary": "Draws an icon by name from pluggable icon sets, decorative by default and an image when labelled.",
  "whenToUse": [
    "Show a glyph next to text or inside a control with a consistent size scale and colour tokens",
    "Plug in the app's own icon set (components, SVG paths or a third-party library) once and refer to icons by name"
  ],
  "whenNotToUse": [
    {
      "reason": "Content that carries meaning without text needs a label on the Icon; a bare decorative icon is hidden from assistive technology. For text use Text",
      "instead": "Text"
    }
  ],
  "composition": {
    "parents": [
      "Row",
      "Button",
      "Badge"
    ],
    "children": [],
    "pairsWith": [
      "Row",
      "Text"
    ]
  },
  "a11y": [
    "Decorative by default: without label the icon is hidden (accessibilityElementsHidden, importantForAccessibility no-hide-descendants)",
    "With label the icon is an image with that accessibilityLabel",
    "The icon never receives focus"
  ],
  "variants": {
    "size": [
      "xs",
      "sm",
      "md",
      "lg"
    ]
  },
  "states": [
    "default",
    "labelled",
    "unknown name"
  ],
  "platformNotes": [
    "createSvgIconSet takes the react-native-svg module as an argument; this library does not import it"
  ],
  "examples": [
    {
      "title": "Icon usage",
      "path": "docs/components/typography/Icon.md"
    }
  ]
};
