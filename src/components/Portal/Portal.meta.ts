import type { ComponentMeta } from "../../meta/types.js";

export const meta: ComponentMeta = {
  "name": "Portal",
  "category": "overlay",
  "status": "prototype",
  "summary": "Mounts content into the nearest OverlayHost, which owns one stack for z-order, Android Back and the Escape key.",
  "whenToUse": [
    "Render a popover, tooltip, toast or custom overlay above the rest of the screen, including above a Modal",
    "Close only the topmost dismissable overlay on Android Back and on Escape"
  ],
  "whenNotToUse": [
    {
      "reason": "A true modal surface that needs the native window and its focus trap",
      "instead": "Modal"
    }
  ],
  "composition": {
    "parents": [],
    "children": [],
    "pairsWith": [
      "Modal",
      "Popover",
      "Tooltip"
    ]
  },
  "a11y": [
    "The portal does not move focus; the opener returns focus when it closes the overlay",
    "accessibilityViewIsModal marks the portal layer as modal on iOS so VoiceOver ignores the views behind it",
    "Back and Escape only call onDismiss: the owner decides whether to close"
  ],
  "variants": {
    "layer": [
      "dropdown",
      "sticky",
      "overlay",
      "modal",
      "toast",
      "tooltip"
    ]
  },
  "states": [
    "mounted in a host",
    "fallback modal (no host)",
    "unmounted"
  ],
  "platformNotes": [
    "iOS and Android: the host is a View layer; native-window surfaces such as Modal are separate windows and must render their own nested OverlayHost",
    "Web: the Escape key closes the topmost dismissable overlay",
    "Without an OverlayHost the children are shown in React Native's Modal and a warning is logged in development"
  ],
  "examples": [
    {
      "title": "Portal usage",
      "path": "docs/components/overlay/Portal.md"
    }
  ]
};
