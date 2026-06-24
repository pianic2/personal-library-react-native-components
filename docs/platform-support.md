# Platform Support

This page is the consumer-facing summary of `audit/components/component-platform-support-matrix-plrnui-25.md`.

No component is promoted to `stable` by this documentation.

## Beta Public Candidates

| Component group | iOS | Android | Web | Notes |
| --- | --- | --- | --- | --- |
| Layout: `Box`, `Column`, `Row`, `Divider` | Supported with notes | Supported with notes | Supported with notes | `Box` shadows and `Row` flex behavior need stable-gate hardening. |
| Typography: `Text`, `P`, `B`, `Small`, `Quote`, `TextGroup`, `Heading`, `CodeInline` | Supported with notes | Supported with notes | Supported with notes | `Heading` child contract and `CodeInline` docs/support review remain open. |
| Feedback: `Alert`, `Badge`, `Spinner`, `ProgressBar` | Supported with notes | Supported with notes | Supported with notes | Contrast, accessibility and progress support docs remain open. |
| Forms: `Input`, `PasswordInput`, `Textarea`, `Switch`, `Checkbox`, `RadioGroup`, `FormField` | Supported with notes | Supported with notes | Supported with notes | Accessibility, focus and child-contract details remain open. |
| Navigation: `NavProvider`, `Link`, `NavBar`, `TopBar` | Supported with notes | Supported with notes | Supported with notes | Router integration and layout behavior remain below stable. |
| Surfaces: `Card` | Supported with notes | Supported with notes | Supported with notes | Shadow behavior remains platform-sensitive. |

## Experimental Platform-Risk Components

| Component | iOS | Android | Web | Notes |
| --- | --- | --- | --- | --- |
| `BottomBar` | Supported with notes | Supported with notes | Supported with notes | App-shell bottom layout remains experimental. |
| `SideBar` | Minimal native fallback | Minimal native fallback | Richer web sidebar | Native behavior is not a drawer, overlay or gesture surface. |
| `Modal` | Supported with notes | Supported with notes | Supported with notes | Focus, keyboard and accessibility behavior remain unverified. |
| `BottomSheet` | Supported with notes | Supported with notes | Supported with notes | Gesture, keyboard, safe area and snap behavior remain incomplete. |
| `Tooltip` | Fallback only | Fallback only | Supported with notes | Native renders children only; tooltip content is web-only. |
| `Popover` | Fallback only | Fallback only | Supported with notes | Native renders trigger only; popover content is web-only. |
| `Select` | Supported with notes | Supported with notes | Supported with notes | Keyboard, focus and screen reader behavior remain unverified. |

## Stable Gate

Stable promotion still requires consumer runtime proof, interaction coverage, accessibility evidence, and component-specific blocker cleanup.

