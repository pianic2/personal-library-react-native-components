import type { ComponentMeta } from "../../meta/types.js";

export const meta: ComponentMeta = {
  "name": "IconGlyphs",
  "category": "typography",
  "status": "prototype",
  "summary": "A built-in set of about 30 own-drawn UI glyphs (check, close, chevrons, search, eye ...) for Icon, drawn through react-native-svg.",
  "whenToUse": [
    "Give Icon the common UI icons without a consumer icon library"
  ],
  "whenNotToUse": [
    {
      "reason": "To draw an icon that is not in the built-in set",
      "instead": "Icon"
    }
  ],
  "composition": {
    "parents": [],
    "children": [
      "Icon"
    ],
    "pairsWith": [
      "Icon"
    ]
  },
  "a11y": [
    "Decorative by default through Icon: without a label the glyph is hidden from assistive technology; pass label to Icon to expose an image"
  ],
  "variants": {},
  "states": [
    "default"
  ],
  "platformNotes": [
    "Needs the react-native-svg module you install; it is passed in as the svg prop and never imported by this library"
  ],
  "examples": [
    {
      "title": "IconGlyphs usage",
      "path": "docs/components/typography/IconGlyphs.md"
    }
  ]
};
