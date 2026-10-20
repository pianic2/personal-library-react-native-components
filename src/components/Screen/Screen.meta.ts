import type { ComponentMeta } from "../../meta/types.js";

export const meta: ComponentMeta = {
  "name": "Screen",
  "category": "layout",
  "status": "demo",
  "summary": "Page root with safe-area edges, a static or scrolling body, header and sticky footer slots, keyboard avoidance and a themed status bar.",
  "whenToUse": [
    "Scaffold a screen with one import instead of stacking a safe area, a scroll view and a keyboard-avoiding view",
    "Keep a footer with the primary action above the keyboard and the home indicator"
  ],
  "whenNotToUse": [
    {
      "reason": "Only a themed surface with padding is needed, with no insets or keyboard handling",
      "instead": "Box"
    }
  ],
  "composition": {
    "parents": [],
    "children": [
      "Column",
      "Row",
      "Box"
    ],
    "pairsWith": [
      "Container",
      "Column"
    ]
  },
  "a11y": [
    "Adds no role and does not trap focus; header, body and footer are rendered in reading order",
    "The pull-to-refresh control carries an accessibility label (refreshAccessibilityLabel, default Refresh)"
  ],
  "variants": {
    "statusBar": [
      "auto",
      "light",
      "dark"
    ],
    "edges": [
      "top",
      "bottom",
      "left",
      "right"
    ]
  },
  "states": [
    "static",
    "scroll",
    "refreshing",
    "keyboard-open"
  ],
  "platformNotes": [
    "Insets come from the safe-area adapter (SafeAreaInsetsProvider); without one they fall back to zero (Android status bar height for the top edge, CSS env(safe-area-inset-*) on web)",
    "keyboardAvoiding uses padding on iOS and height on Android; on web there is no KeyboardAvoidingView and the browser handles the keyboard",
    "The scroll body adjusts for the keyboard natively on iOS (automaticallyAdjustKeyboardInsets) only when keyboardAvoiding is off, to avoid adjusting twice",
    "Verified in tests with mocked adapters; not yet verified on a device or simulator"
  ],
  "examples": [
    {
      "title": "Screen usage",
      "path": "examples/screen.tsx"
    }
  ]
};
