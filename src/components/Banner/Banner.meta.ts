import type { ComponentMeta } from "../../meta/types.js";

export const meta: ComponentMeta = {
  "name": "Banner",
  "category": "feedback",
  "status": "demo",
  "summary": "Persistent full-width announcement for a page or section, with a tone, optional actions and a dismiss button.",
  "whenToUse": [
    "Announce an app-level notice such as offline, update available or trial ending",
    "Keep a notice at the top of a screen with position sticky until the user dismisses it"
  ],
  "whenNotToUse": [
    {
      "reason": "A message that belongs to one piece of content, in the page flow, is an inline card",
      "instead": "Alert"
    }
  ],
  "composition": {
    "parents": [],
    "children": [],
    "pairsWith": [
      "Button",
      "Text"
    ]
  },
  "a11y": [
    "role alert (and accessibilityRole alert) for the warning and danger tones, role status for neutral, info and success; accessibilityLiveRegion assertive for danger and polite for the others",
    "The dismiss button has a 44pt target and accessibilityLabel from dismissLabel (default Dismiss); the icon slot is decorative (hidden from assistive technology)",
    "Text uses the primary text token on the sunken surface; the tone accent is a left border, so severity never relies on colour alone"
  ],
  "variants": {
    "tone": [
      "neutral",
      "info",
      "success",
      "warning",
      "danger"
    ],
    "position": [
      "inline",
      "sticky"
    ]
  },
  "states": [
    "default",
    "dismissible",
    "dismissed"
  ],
  "platformNotes": [
    "sticky uses position sticky on web and an absolute top pin on native (the parent must be positioned); iOS, Android and web are covered by render tests only, not verified on a device",
    "The top safe-area inset is added only when a SafeAreaInsetsProvider is mounted; without it the banner adds no inset"
  ],
  "examples": [
    {
      "title": "Banner example",
      "path": "examples/banner.tsx"
    }
  ]
};
