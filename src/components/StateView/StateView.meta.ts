import type { ComponentMeta } from "../../meta/types.js";

export const meta: ComponentMeta = {
  "name": "StateView",
  "category": "feedback",
  "status": "prototype",
  "summary": "Empty, error, loading and result blocks plus an AsyncBoundary that picks one from a request status.",
  "whenToUse": [
    "Show what a screen or list looks like with no data, after a failure, or while loading",
    "Give a request a retry action and an optional collapsible technical detail",
    "Pick the right view from { status, data, error } in one place with AsyncBoundary"
  ],
  "whenNotToUse": [
    {
      "reason": "Use Alert for a message inside content that is still usable",
      "instead": "Alert"
    },
    {
      "reason": "Use Spinner for a small busy indicator inside a control",
      "instead": "Spinner"
    },
    {
      "reason": "Use ProgressBar when the progress is known",
      "instead": "ProgressBar"
    }
  ],
  "composition": {
    "parents": [
      "Card",
      "Column"
    ],
    "children": [
      "Button",
      "Heading",
      "Spinner",
      "Text"
    ],
    "pairsWith": [
      "Button",
      "Card"
    ]
  },
  "a11y": [
    "Titles are Heading; the reading order is icon (hidden), title, description, actions",
    "ErrorState wraps title and message in accessibilityRole alert with accessibilityLiveRegion polite so the failure is announced",
    "ErrorState retry is the library Button; it is disabled and relabelled while retrying, and fires once per press",
    "ErrorState technical detail is absent from the tree until the toggle is pressed; the toggle is a 44pt button with accessibilityState expanded",
    "LoadingState exposes the spinner as a progressbar named by the label; the visible label is hidden from assistive technology to avoid reading it twice",
    "Result icons and illustrations are decorative (hidden from assistive technology); only the error status is announced",
    "Copy defaults are English props; the i18n catalog does not carry these strings yet"
  ],
  "variants": {
    "EmptyState variant": [
      "empty",
      "no-results",
      "offline"
    ],
    "EmptyState size": [
      "sm",
      "md"
    ],
    "ErrorState variant": [
      "inline",
      "fullscreen"
    ],
    "LoadingState variant": [
      "inline",
      "fullscreen"
    ],
    "Result status": [
      "success",
      "info",
      "warning",
      "error",
      "403",
      "404"
    ],
    "AsyncBoundary status": [
      "idle",
      "loading",
      "error",
      "success"
    ]
  },
  "states": [
    "empty",
    "error",
    "retrying",
    "details open",
    "loading",
    "result"
  ],
  "platformNotes": [
    "Same behavior on iOS, Android and web; the iOS spinner ignores numeric sizes"
  ],
  "examples": [
    {
      "title": "Async list",
      "code": "<AsyncBoundary status={status} data={items} error={error} onRetry={refetch}>{(rows) => <List rows={rows} />}</AsyncBoundary>"
    },
    {
      "title": "Empty search",
      "code": "<EmptyState variant=\"no-results\" actionLabel=\"Clear filters\" onAction={clear} />"
    }
  ]
};
