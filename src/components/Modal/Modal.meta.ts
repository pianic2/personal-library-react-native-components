import type { ComponentMeta } from "../../meta/types.js";

export const meta: ComponentMeta = {
  "name": "Modal",
  "category": "overlay",
  "status": "prototype",
  "summary": "Centered blocking dialog over a backdrop.",
  "whenToUse": [
    "Ask for a confirmation or a short decision that blocks the screen"
  ],
  "whenNotToUse": [
    {
      "reason": "A bottom panel suits secondary actions on small screens",
      "instead": "BottomSheet"
    }
  ],
  "composition": {
    "parents": [],
    "children": [
      "Heading",
      "Text",
      "Button"
    ],
    "pairsWith": [
      "Button"
    ]
  },
  "a11y": [
    "The dialog has role dialog, aria-modal and accessibilityViewIsModal, and is named by title or accessibilityLabel",
    "The backdrop dismiss action is a labelled button (dismissLabel) and is a separate element from the dialog content",
    "The label is announced on open; initialFocusRef and restoreFocusRef move the screen-reader focus where React Native allows it",
    "Android back and the Escape key on web call onClose through onRequestClose; there is no Tab focus trap on native"
  ],
  "variants": {
    "size": [
      "sm",
      "md",
      "lg"
    ]
  },
  "states": [
    "hidden",
    "visible"
  ],
  "platformNotes": [
    "Backdrop uses the colors.backdrop token; animation presets (fade, slide, none) go through the motion engine and are replaced by an instant change under reduced motion",
    "Web: React Native Web provides the Escape key and the focus trap; iOS and Android: initial and restored focus use AccessibilityInfo.setAccessibilityFocus",
    "avoidKeyboard needs KeyboardAvoidingView (not in the test shim); safe-area insets are a prop, not read from a context",
    "ModalProps is exported from the component index but not from the package root yet"
  ],
  "examples": [
    {
      "title": "Overlay examples",
      "path": "examples/overlays.experimental.tsx"
    }
  ]
};
