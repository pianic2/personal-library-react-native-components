import type { ComponentMeta } from "../../meta/types.js";

export const meta: ComponentMeta = {
  "name": "Pager",
  "category": "data-display",
  "status": "demo",
  "summary": "Horizontal paging with a controlled index, a Carousel with peek and optional autoplay, and a dot PageIndicator.",
  "whenToUse": [
    "Onboarding steps, image galleries and banners that the user swipes through",
    "Show the position in a set of pages with PageIndicator"
  ],
  "whenNotToUse": [
    {
      "reason": "A long scrolling list is a list, not pages",
      "instead": "DataTable"
    }
  ],
  "composition": {
    "parents": [],
    "children": [],
    "pairsWith": [
      "Card",
      "Text"
    ]
  },
  "a11y": [
    "PageIndicator is one accessible element labelled 'Page X of Y' (progressbar role with min 1, max Y, now X); its dots are hidden",
    "Pages other than the current one are hidden from assistive technology",
    "Autoplay is off under reduced motion and pauses while the user touches the carousel"
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
    "controlled",
    "autoplay"
  ],
  "platformNotes": [
    "Built on ScrollView with no extra dependency; onIndexChange relies on the momentum scroll end event"
  ],
  "examples": [
    {
      "title": "Pager with indicator",
      "path": "examples/pager.tsx"
    }
  ]
};
