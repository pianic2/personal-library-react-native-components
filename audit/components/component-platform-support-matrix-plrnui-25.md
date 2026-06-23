# PLRNUI-25 - Component Platform Support Matrix

## Scope

This artifact records the minimum platform support evidence required by the stable promotion docs gate for current root-public component candidates.

No component is promoted to `stable` by PLRNUI-25. The matrix documents current support posture from source, root exports, smoke tests and existing audit evidence.

## Evidence inputs

- Root API: `src/index.ts`.
- Component maturity: `audit/components/component-maturity-matrix.md`.
- Stable gate: `audit/components/stable-promotion-requirements.md`.
- Navigation contract: `audit/components/navigation-platform-contract-plrnui-22.md`.
- Overlay contract: `audit/components/overlay-platform-contract-plrnui-23.md`.
- API governance: `audit/api/export-matrix.md`, `audit/api/public-types.md`.
- Smoke harness: `tests/components/component-smoke.test.tsx`.

## Legend

- `Supported`: source contract is expected to render on the platform, but stable promotion still needs consumer/runtime proof.
- `Supported with notes`: source contract exists, with known layout, behavior, accessibility or runtime limits.
- `Fallback only`: component intentionally renders reduced behavior on that platform.
- `Unverified`: no stable support claim is available from current evidence.

## Public candidate support matrix

| Component | Maturity | Root export/public status | iOS support | Android support | Web support | Platform limits | Evidence/source audit |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `Button` | beta | Root public component and `ButtonProps` type | Supported with notes | Supported with notes | Supported with notes | Variant hardening remains open; `info` variant behavior still blocks stable. | `src/index.ts`; `src/components/Button/Button.tsx`; `audit/components/component-maturity-matrix.md`; `audit/components/component-blockers.md` |
| `Box` | beta | Root public component and `BoxProps` type | Supported with notes | Supported with notes | Supported with notes | Shadow behavior differs by platform; web `boxShadow` requires explicit docs. | `src/components/Box/Box.tsx`; `audit/components/platform-limitations.md` |
| `Column` | beta | Root public component and `ColumnProps` type | Supported | Supported | Supported | Child wrapping/index-key debt remains; not a stable blocker by itself. | `src/components/Column/Column.tsx`; `audit/components/component-maturity-matrix.md` |
| `Row` | beta | Root public component and `RowProps` type | Supported with notes | Supported with notes | Supported with notes | Declared `flex` prop behavior remains a known blocker before stable. | `src/components/Row/Row.tsx`; `audit/components/component-blockers.md` |
| `Divider` | beta | Root public component and `DividerProps` type | Supported | Supported | Supported | Double theme lookup cleanup noted before stable hardening. | `src/components/Divider/Divider.tsx`; `audit/components/component-maturity-matrix.md` |
| `P` | beta | Root public component and `PProps` type | Supported | Supported | Supported | Typography shorthand; no platform-specific behavior beyond `Text`. | `src/components/P/P.tsx`; `audit/api/public-types.md` |
| `B` | beta | Root public component and `BProps` type | Supported | Supported | Supported | Typography shorthand; no platform-specific behavior beyond `Text`. | `src/components/B/B.tsx`; `audit/api/public-types.md` |
| `Small` | beta | Root public component and `SmallProps` type | Supported | Supported | Supported | Typography shorthand; no platform-specific behavior beyond `Text`. | `src/components/Small/Small.tsx`; `audit/api/public-types.md` |
| `CodeInline` | beta | Root public component and `CodeInlineProps` type | Supported with notes | Supported with notes | Supported with notes | Smoke coverage exists; docs/platform review remains incomplete. | `src/components/CodeInline/CodeInline.tsx`; `audit/components/component-blocker-remediation-plrnui-21.md`; `tests/components/component-smoke.test.tsx` |
| `Quote` | beta | Root public component and `QuoteProps` type | Supported | Supported | Supported | Public props now named; broader docs/support review remains. | `src/components/Quote/Quote.tsx`; `audit/api/public-types.md` |
| `Text` | beta | Root public component and `TextProps` type | Supported | Supported | Supported | Core typography primitive; stable still needs docs/support proof. | `src/components/Text/Text.tsx`; `audit/api/public-types.md` |
| `TextGroup` | beta | Root public component and `TextGroupProps` type | Supported | Supported | Supported | Index-key implementation debt remains before stable hardening. | `src/components/TextGroup/TextGroup.tsx`; `audit/components/component-maturity-matrix.md` |
| `Heading` | beta | Root public component and `HeadingProps` type | Supported with notes | Supported with notes | Supported with notes | `children` contract is narrower than arbitrary React content; document before stable. | `src/components/Heading/Heading.tsx`; `audit/components/component-maturity-matrix.md` |
| `Spinner` | beta | Root public component and `SpinnerProps` type | Supported | Supported | Supported | Needs smoke/support matrix evidence before stable. | `src/components/Spinner/Spinner.tsx`; `audit/components/component-maturity-matrix.md` |
| `Alert` | beta | Root public component and `AlertProps` type | Supported with notes | Supported with notes | Supported with notes | Contrast/action behavior needs accessibility review. | `src/components/Alert/Alert.tsx`; `audit/components/component-blockers.md` |
| `Badge` | beta | Root public component and `BadgeProps` type | Supported with notes | Supported with notes | Supported with notes | Color/variant review remains before stable. | `src/components/Badge/Badge.tsx`; `audit/components/component-maturity-matrix.md` |
| `Card` | beta | Root public component and `CardProps` type | Supported with notes | Supported with notes | Supported with notes | PLRNUI-21 removed hook blocker; shadow behavior remains platform-sensitive. | `src/components/Card/Card.tsx`; `audit/components/component-blocker-remediation-plrnui-21.md` |
| `Input` | beta | Root public component and `InputProps` type | Supported with notes | Supported with notes | Supported with notes | Label/focus contract requires stabilization before stable. | `src/components/Input/Input.tsx`; `audit/components/component-blockers.md` |
| `PasswordInput` | beta | Root public component and `PasswordInputProps` type | Supported with notes | Supported with notes | Supported with notes | Accessible toggle smoke coverage exists; fuller accessibility/platform validation remains. | `src/components/PasswordInput/PasswordInput.tsx`; `tests/components/component-smoke.test.tsx` |
| `ProgressBar` | beta | Root public component and `ProgressBarProps` type | Supported with notes | Supported with notes | Supported with notes | Clamping smoke coverage exists; progress accessibility/support docs remain. | `src/components/ProgressBar/ProgressBar.tsx`; `tests/components/component-smoke.test.tsx` |
| `Switch` | beta | Root public component and `SwitchProps` type | Supported with notes | Supported with notes | Supported with notes | Accessibility state and animation behavior remain incomplete. | `src/components/Switch/Switch.tsx`; `audit/components/component-maturity-matrix.md` |
| `Checkbox` | beta | Root public component and `CheckboxProps` type | Supported with notes | Supported with notes | Supported with notes | Accessibility role/state remains incomplete. | `src/components/Checkbox/Checkbox.tsx`; `audit/components/component-maturity-matrix.md` |
| `RadioGroup` | beta | Root public component, `RadioGroupProps` and `RadioGroupOption` types | Supported with notes | Supported with notes | Supported with notes | Disabled state and accessibility contract remain incomplete. | `src/components/RadioGroup/RadioGroup.tsx`; `audit/api/public-types.md` |
| `FormField` | beta | Root public component and `FormFieldProps` type | Supported with notes | Supported with notes | Supported with notes | Clone-props heuristic and child contract require docs before stable. | `src/components/FormField/FormField.tsx`; `audit/components/component-maturity-matrix.md` |
| `Textarea` | beta | Root public component and `TextareaProps` type | Supported with notes | Supported with notes | Supported with notes | PLRNUI-21 multiline smoke coverage exists; form docs/support review remains. | `src/components/Textarea/Textarea.tsx`; `tests/components/component-smoke.test.tsx` |
| `NavProvider` | beta | Root public provider and `NavItem` type | Supported with notes | Supported with notes | Supported with notes | Helper hooks remain internal; provider contract needs docs/support proof. | `src/components/NavContext/NavContext.tsx`; `audit/api/export-matrix.md` |
| `Link` | beta | Root public component, `LinkProps` and `LinkRouterAdapter` types | Supported with notes | Supported with notes | Supported with notes | Router-agnostic contract exists; native no-op and guarded web fallback must be documented. | `src/components/Link/Link.tsx`; `audit/components/navigation-platform-contract-plrnui-22.md` |
| `NavBar` | beta | Root public component and `NavBarProps` type | Supported with notes | Supported with notes | Supported with notes | `layout="auto"` differs by platform; app-shell behavior remains below stable. | `src/components/NavBar/NavBar.tsx`; `audit/components/navigation-platform-contract-plrnui-22.md` |
| `TopBar` | beta | Root public component and `TopBarProps` type | Supported with notes | Supported with notes | Supported with notes | Slot rendering smoke coverage exists; docs/platform/accessibility gate remains. | `src/components/TopBar/TopBar.tsx`; `audit/components/navigation-platform-contract-plrnui-22.md` |

## Experimental and platform-risk components

These components are root-visible or documented in historical audits but are not stable public candidates in PLRNUI-25.

| Component | Maturity | iOS support | Android support | Web support | Reason not stable/root-public candidate | Evidence/source audit |
| --- | --- | --- | --- | --- | --- | --- |
| `BottomBar` | experimental | Supported with notes | Supported with notes | Supported with notes | App-shell bottom layout and accessibility support remain incomplete. | `audit/components/navigation-platform-contract-plrnui-22.md` |
| `SideBar` | experimental | Supported as minimal native list | Supported as minimal native list | Supported through `SideBar.web.tsx` | Native is not a drawer/overlay/gesture contract; richer sidebar remains experimental. | `audit/components/navigation-platform-contract-plrnui-22.md`; `src/components/SideBar/SideBar.tsx`; `src/components/SideBar/SideBar.web.tsx` |
| `Modal` | experimental | Supported with notes | Supported with notes | Supported with notes | Focus, keyboard and accessibility behavior unverified. | `audit/components/overlay-platform-contract-plrnui-23.md` |
| `BottomSheet` | experimental | Supported with notes | Supported with notes | Supported with notes | Gesture, keyboard, safe area and snap behavior incomplete. | `audit/components/overlay-platform-contract-plrnui-23.md` |
| `Tooltip` | experimental | Fallback only | Fallback only | Supported with notes | Tooltip content is web-only; native renders children only. | `audit/components/overlay-platform-contract-plrnui-23.md`; `src/components/Tooltip/Tooltip.tsx` |
| `Popover` | experimental | Fallback only | Fallback only | Supported with notes | Popover content is web-only; native renders trigger only. | `audit/components/overlay-platform-contract-plrnui-23.md`; `src/components/Popover/Popover.tsx` |
| `Select` | experimental | Supported with notes | Supported with notes | Supported with notes | Keyboard, focus and screen reader behavior unverified. | `audit/components/overlay-platform-contract-plrnui-23.md` |
| `Code` | experimental | Unverified | Unverified | Unverified | Clipboard/timer lifecycle and dependency strategy require hardening. | `audit/components/platform-limitations.md` |
| `ToastProvider` | experimental | Unverified | Unverified | Supported with notes | Web-specific implementation and timer lifecycle require review. | `audit/components/platform-limitations.md`; `audit/components/component-blockers.md` |
| `Page` | experimental | Supported with notes | Supported with notes | Supported with notes | App-layout helper mixed into typography; root API decision required. | `audit/components/component-maturity-matrix.md` |
| `Hero` | experimental | Supported with notes | Supported with notes | Supported with notes | App-shell/responsive screen-height behavior is not stable library API. | `audit/components/component-maturity-matrix.md` |

## PLRNUI-25 stable gate impact

PLRNUI-25 satisfies the documentation requirement to declare iOS, Android and Web posture for public component candidates. It does not satisfy the full stable gate because consumer runtime proof, complete accessibility/focus/keyboard validation, and remaining component-specific hardening are still open.

