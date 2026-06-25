# Platform Support

This page is the consumer-facing summary of `audit/components/component-platform-support-matrix-plrnui-25.md`.

No component is promoted to `stable` by this documentation.

Stability labels:

- `beta`: public consumer API, usable but contract may still change.
- `experimental`: provisional API, not recommended for production dependency.
- `internal`: not part of the public consumer API.
- `deprecated / legacy`: historical alias or API kept only for migration context.
- `stable`: currently no component/API is classified as stable.

## Beta Public Candidates

| Component group | iOS | Android | Web | Notes |
| --- | --- | --- | --- | --- |
| Layout: `Box`, `Column`, `Row`, `Divider` | Supported with notes | Supported with notes | Supported with notes | `Box` shadows and `Row` flex behavior need stable-gate hardening. |
| Typography: `Text`, `P`, `B`, `Small`, `Quote`, `TextGroup`, `Heading` | Supported with notes | Supported with notes | Supported with notes | `Heading` child contract and typography support docs remain open. |
| Feedback: `Alert`, `Badge`, `Spinner` | Supported with notes | Supported with notes | Supported with notes | Contrast and accessibility support docs remain open. |
| Forms: `Input`, `Switch`, `Checkbox`, `RadioGroup`, `FormField` | Supported with notes | Supported with notes | Supported with notes | Accessibility, focus and child-contract details remain open. |
| Navigation: `NavProvider`, `Link`, `NavBar` | Supported with notes | Supported with notes | Supported with notes | Router integration and layout behavior remain below stable. |
| Surfaces: `Badge` | Supported with notes | Supported with notes | Supported with notes | Visual support docs remain open. |

## Experimental Platform-Risk Components

| Component | iOS | Android | Web | Notes |
| --- | --- | --- | --- | --- |
| `BottomBar` | Supported with notes | Supported with notes | Supported with notes | App-shell bottom layout remains experimental. |
| `SideBar` | Minimal native fallback | Minimal native fallback | Richer web sidebar | Native behavior is not a drawer, overlay or gesture surface. |
| `TopBar` | Fallback only | Fallback only | Supported with notes | Web-oriented top navigation remains experimental. |
| `Modal` | Supported with notes | Supported with notes | Supported with notes | Focus, keyboard and accessibility behavior remain unverified. |
| `BottomSheet` | Supported with notes | Supported with notes | Supported with notes | Gesture, keyboard, safe area and snap behavior remain incomplete. |
| `Tooltip` | Fallback only | Fallback only | Supported with notes | Native renders children only; tooltip content is web-only. |
| `Popover` | Fallback only | Fallback only | Supported with notes | Native renders trigger only; popover content is web-only. |
| `Select` | Supported with notes | Supported with notes | Supported with notes | Keyboard, focus and screen reader behavior remain unverified. |

## Internal / Non-Stable Components

| Component/API | iOS | Android | Web | Notes |
| --- | --- | --- | --- | --- |
| `Stack` alias | Supported through `Column` implementation | Supported through `Column` implementation | Supported through `Column` implementation | Internal alias; prefer `Column` in consumer docs. |
| `CodeInline` | Supported with notes | Supported with notes | Supported with notes | Internal/non-stable per stability audit. |
| `ProgressBar` | Supported with notes | Supported with notes | Supported with notes | Internal/non-stable until progress behavior and support evidence are completed. |
| `PasswordInput` | Supported with notes | Supported with notes | Supported with notes | Internal/non-stable while props and behavior remain incomplete. |
| `Textarea` | Supported with notes | Supported with notes | Supported with notes | Internal/non-stable while props and token behavior remain incomplete. |
| `Card` | Supported with notes | Supported with notes | Supported with notes | Internal/non-stable; shadow behavior remains platform-sensitive. |

## Stable Gate

Stable promotion still requires consumer runtime proof, interaction coverage, accessibility evidence, and component-specific blocker cleanup.
