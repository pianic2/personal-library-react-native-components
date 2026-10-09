# E1 — Component Maturity Audit (Texo 1.0.0)

Scope: all 36 component directories under `src/components` (every one is exported from `src/index.ts`; `Stack` is an alias of Column; NavContext = NavProvider + hooks). Source, tests, docs, examples read directly; legacy `audit/components/*.md` not trusted.
Date: 2026-10-09. Package 0.1.0-rc.2.

## Method
`demo` bar = 7 criteria: R real rendering, T typed + root-exported props, S main states/variants working, Th theme tokens (no hardcoded colors), E example in `examples/*.tsx`, C catalog (docs/components.md + mkdocs.yml nav + docs/components/**), V minimal verification (tests/components, tests/accessibility, tests/theme).
Legend: P pass, F fail, ~ partial. A component is `demo` only if all 7 are P/~ with no blocking F; any F => `prototype`. No component reaches `stable` (no semver/API freeze, docs state "no component is stable", no keyboard/focus/SR evidence, no runtime platform evidence) or `production-ready`.

## Global findings
- Catalog (C) passes for all components: docs/components.md, mkdocs.yml nav and docs/components/<family>/<name>.md exist for all 36 (no showcase app exists in repo).
- Docs pages contain Import + Props + Notes only; only 3 ```tsx blocks in docs/components/** — usage examples live only in examples/*.tsx (6 files, 799 LOC total, none for Card, Typography family except Heading/Text, BottomBar, SideBar, PasswordInput, Textarea, ProgressBar).
- Hardcoded colors: only one hit in src/components (Modal.tsx:40 rgba). Magic numbers (sizes, opacities, fontWeight "600") are widespread and not tokenised.
- tsconfig.json include=["src"] — tests/ and examples/ are NOT type-checked (only tests/types via tsconfig.type-tests.json); caused the Badge test bug.
- Prop types not exported from root: BottomSheet, Modal, Popover, Tooltip, Select (+Option); NavContextValue and useNavItems/useNavLogo/useNavPathname/useOptionalNav also absent.
- Accessibility: roles exist on Button, Checkbox, Switch, RadioGroup, PasswordInput toggle; missing on Alert, Link, Heading, ProgressBar, Spinner, Select, overlays, nav containers. tests/accessibility covers only Button, Input, Checkbox, Switch, RadioGroup.
- No machine-readable maturity registry and no CI gate on the demo bar (ci.yml runs only release:check).
- Docs inconsistency: TopBar beta (components.md) vs experimental (navigation/index.md).

## Per-component table
Criteria order: R T S Th E C V.

| Component | Maturity | R T S Th E C V | Evidence | Gaps | Tech-debt / bugs (severity) |
|---|---|---|---|---|---|
| Alert | demo | P P P P P P P | examples/feedback.tsx; tests/components/component-smoke.test.tsx | no role=alert/liveRegion; no dismiss; warning/info bg + textInverted contrast unchecked; ghost action btn uses textPrimary on colored bg | Low: a11y role missing (Medium for a11y) |
| B | prototype | P P P P P F F | none (not in examples/; no direct test; only mention in a11y harness is unrelated) | no example, no test, no docs usage snippet | Low: wrapper over Text; props spread after weight lets caller override weight |
| Badge | demo | P P P P P P P (V weak) | examples/feedback.tsx, layout-primitives.tsx; smoke test passes nonexistent `label` prop (component-smoke.test.tsx:129,201) | smoke test does not exercise children; textPrimary on info/success/warning bg contrast unchecked; web vs native divergent branches | Medium: test uses invalid prop and tests/ is excluded from tsc (tsconfig.json include=[src]) |
| BottomBar | prototype | P P P P F P F (V weak) | docs/components/navigation/bottom-bar.md; smoke tests (component-smoke.test.tsx:316-345) but no examples/ usage (navigation.tsx uses layout=top only) | no example; hardcoded height 60, marginTop 4, minWidth 64; position:absolute with no safe-area; no a11y role/selected state on items | Medium: absolute positioning overlaps content, no safe-area inset |
| BottomSheet | prototype | P F P P P P P (V weak) | examples/overlays.experimental.tsx; smoke test :431 | BottomSheetProps not exported (interface not exported, not in src/index.ts); hardcoded handle 48x5; `height as any`; no a11y (accessibilityViewIsModal, label); only 2 snaps; no drag | Medium: public type missing; Low: `as any` |
| Box | demo | P P P P P P P | examples/basic-usage.tsx, layout-primitives.tsx; smoke | none blocking; radius defaults to md always (cannot be opted out) | Low |
| Button | demo | P P F P P P P | examples/basic-usage.tsx; tests/accessibility/core-controls.test.tsx; tests/theme/button-component-tokens.test.tsx | variant=info is typed/documented but renders transparent bg with textInverted text (invisible, Button.tsx:28-30); pressed state sets bg colors.surface with textInverted text (low contrast); no style/testID passthrough; no loading state; fontWeight '600' hardcoded | High: info variant unreadable; Medium: pressed-state contrast |
| Card | prototype | P P P P F P P | tests/theme/card-component-tokens.test.tsx; smoke; docs/components/surfaces/card.md | no example in examples/ (only docs); bgColor raw string bypasses tokens; Android branch returns elevation only (no shadow color); base width:100% forced | Low: bgColor escape hatch; Low: forced width |
| Checkbox | demo | P P P P P P P | examples/form-controls.tsx; tests/accessibility/core-controls.test.tsx | no error/indeterminate state; hardcoded 22px box, 2px border, opacity 0.5 | Low: magic numbers |
| CodeInline | prototype | P P F P F P P | smoke tests :245; docs/components/typography/code-inline.md | {...props} is spread AFTER computed style/size (CodeInline.tsx:34-36) so any caller `style` or `size` replaces the whole computed style; no example | Medium: style override bug |
| Column | demo | P P P P P P P | examples/* (6 files); smoke | default flex=1 and gap='xl' surprising; wraps each child in an extra View; flex type allows -1 | Low |
| Divider | demo | P P P P P P P | examples/layout-primitives.tsx; smoke | no vertical orientation; style typed ViewStyle only (no StyleProp); useTheme() called twice (Divider.tsx:23,29); no accessibilityRole | Low: double hook call |
| FormField | prototype | P P P P P P F | examples/form-controls.tsx; docs/components/form/form-field.md | no unit test or smoke render; hardcoded margins 16/6/4; helper color `textPrimary + '99'` assumes hex; label not programmatically linked; variant/colorScheme untyped strings; child must accept props by sniffing | Medium: color string concat breaks on rgba/named tokens; Medium: no verification |
| Heading | demo | P P P P P P P | examples/basic-usage.tsx; smoke | children typed string only; no accessibilityRole='header'; levels 5-6 map to md/sm | Low: a11y role missing |
| Input | demo | P P P P P P P | examples/form-controls.tsx; a11y core-controls; tests/theme/input-component-tokens.test.tsx | label required & rendered via fragment (no wrapper style hook); `label` leaks into TextInput via ...rest; helperText not linked beyond accessibilityHint; hardcoded minHeight 44; no required indicator | Medium: unknown prop leak; Low: fragment root |
| Link | demo | P P P P P P P | examples/navigation.tsx; smoke :351-400 | no accessibilityRole='link'; no disabled state; hardcoded opacity 0.85/0.7, heightMap 32/40/48, fontWeight '600'; no testID/a11y passthrough | Medium: missing link semantics |
| Modal | prototype | P F P F P P P (V weak) | examples/overlays.experimental.tsx; smoke :421 | ModalProps not exported; hardcoded rgba(0,0,0,0.5) on RNModal style (Modal.tsx:40) duplicating colors.backdrop; no accessibilityViewIsModal / focus trap / title; widthMap hardcoded | Medium: hardcoded color; Medium: type not exported |
| NavBar | demo | P P P P P P P | examples/navigation.tsx; smoke :336 | layout 'auto' picks top on web / bottom native with no breakpoint awareness; BottomBar/SideBar variants undocumented in examples | Low |
| NavContext (NavProvider, hooks) | demo | P P P P P P P | examples/navigation.tsx; indirect via NavBar tests | useNavItems/useNavLogo/useNavPathname/useOptionalNav/NavContextValue not in root exports; no direct hook tests | Low: surface gap |
| P | prototype | P P P P P F F | none | no example, no test | Low |
| PasswordInput | prototype | P P P P F P P | smoke :266; docs/components/form/password-input.md | no example; toggle is unstyled RN <Text> 'Show'/'Hide' hardcoded English (PasswordInput.tsx:57); visible text not localizable | Low: i18n; Low: unstyled toggle |
| Popover | prototype | F F P P P P P (V weak) | examples/overlays.experimental.tsx; smoke :451 | on native renders trigger only, no popover content at all (Popover.tsx:33-36); PopoverProps not exported; no outside-press dismiss; Pressable wraps renderTrigger (nested pressables); hidden-until-measured opacity hack; no a11y | High: non-functional on native; Medium: nested Pressable |
| ProgressBar | prototype | P P F P F P P | smoke :232 (clamp); docs | no example; undefined progress silently renders 30% (fake indeterminate); no accessibilityRole='progressbar'/accessibilityValue; hardcoded height 8; `color` prop named like variant | Medium: misleading default + no semantics |
| Quote | prototype | P P P P P P F | docs/components/typography/quote.md | no example, no test; hardcoded 4px border | Low |
| RadioGroup | demo | P P F P P P P | examples/form-controls.tsx; a11y core-controls | no disabled/error states; string values only; no group label; hardcoded 22/12 sizes | Low |
| Row | demo | P P P P P P P | examples/layout-primitives.tsx; smoke | `flex` prop declared in RowProps but not destructured: forwarded to View as a non-style prop (no-op) (Row.tsx:18,27-36); wrap uses columnGap only (no rowGap) | Medium: dead prop; Low: wrap spacing |
| Select | prototype | P F F P P P P | examples/overlays.experimental.tsx; smoke :463 | SelectProps/Option not exported; no accessibilityRole/label/disabled; no onRequestClose (Android back); no scroll for long lists; no selected indicator; chevron is literal 'v'; no label/helper | Medium: a11y + type export; Medium: unusable for long option lists |
| SideBar | prototype | P P F P F P P | smoke :403; docs/components/navigation/side-bar.md | no example; duplicated implementations SideBar.tsx vs SideBar.web.tsx (types redeclared); default variant differs (embedded vs fixed); position:'fixed' via `as any`; collapse glyphs '<' '>' hardcoded; no a11y roles | Medium: divergence/duplication; Low: `as any` |
| Small | prototype | P P P P P F F | none | no example, no test | Low |
| Spinner | demo | P P P P P P P | examples/feedback.tsx; smoke | no accessibilityLabel/busy state; unused `theme` variable; numeric ActivityIndicator size not supported on iOS (only 'small'/'large') | Low: iOS size numeric ignored |
| Switch | demo | P P P P P P P | examples/form-controls.tsx; a11y core-controls | no thumb animation; hardcoded 44x24/20 offsets; opacity 0.5 literal | Low |
| Text | demo | P P P P P P P | examples/* (5 files); tests/theme/theme-overrides | default align='justify' is a surprising default (P overrides to left); fontFamily token not applied; truncate = 1 line only | Medium: surprising default |
| TextGroup | prototype | P P P P P F F | docs only | no example, no test; semantically a spacing stack duplicating Column | Low: overlap with Column |
| Textarea | prototype | P P P P F P P | smoke :256 | no example; hardcoded minHeight 100 | Low |
| Tooltip | prototype | F F P P P P P (V weak) | examples/overlays.experimental.tsx; smoke :441 | TooltipProps not exported; native returns children only (no long-press/a11y description); timer not cleared on unmount (Tooltip.tsx:23,33); fallback position top:50/left:50; anchor +10px hack; hardcoded maxWidth 260 and paddingVertical 6; default delay 1000ms | Medium: timer leak/setState after unmount; Medium: no native behavior |
| TopBar | demo | P P P P P P P | examples/navigation.tsx (via NavBar layout=top); smoke :306 | hardcoded height 40, width 90; position:absolute w/o safe-area; no landmark/nav role; docs conflict: components.md says beta, navigation/index.md says experimental | Medium: absolute positioning; Low: docs inconsistency |

Source files: `src/components/<Name>/<Name>.tsx`; docs: `docs/components/<family>/<name>.md`; catalog: `docs/components.md`, `mkdocs.yml`.

## Demo-bar blockers (what each prototype lacks)
- Missing example only: B, P, Small, Quote, TextGroup, Card, CodeInline, PasswordInput, Textarea, ProgressBar, BottomBar, SideBar
- Missing verification: B, P, Small, Quote, TextGroup, FormField
- Missing/unexported typed API: BottomSheet, Modal, Popover, Tooltip, Select
- Broken/non-functional behavior: Popover & Tooltip (native), CodeInline (style override), SideBar (divergent impls)

## Bugs and tech debt (ranked)
| # | Severity | Item | Evidence |
|---|---|---|---|
| 1 | High | Button `info` variant renders transparent bg + inverted text (unreadable); pressed state uses surface bg with inverted text | src/components/Button/Button.tsx:28-30,45 |
| 2 | High | Popover renders no popover on native (trigger only) | src/components/Popover/Popover.tsx:33-36 |
| 3 | Medium | CodeInline spreads props after computed style/size, discarding styling when `style`/`size` passed | src/components/CodeInline/CodeInline.tsx:34-36 |
| 4 | Medium | Row declares `flex` prop but never applies it; wrap lacks rowGap | src/components/Row/Row.tsx |
| 5 | Medium | Input leaks `label` into TextInput, fragment root, label mandatory | src/components/Input/Input.tsx |
| 6 | Medium | Smoke tests use nonexistent Badge `label` prop; tests excluded from tsc | tests/components/component-smoke.test.tsx:129,201; tsconfig.json |
| 7 | Medium | Tooltip timer leak on unmount; native no-op; fallback position magic | src/components/Tooltip/Tooltip.tsx |
| 8 | Medium | Modal hardcoded rgba backdrop duplicating token; no modal a11y | src/components/Modal/Modal.tsx:40 |
| 9 | Medium | Select unusable for long lists, no Android back close, no a11y/type export | src/components/Select/Select.tsx |
| 10 | Medium | SideBar native/web duplication and divergent defaults, `as any` | src/components/SideBar/SideBar.tsx, SideBar.web.tsx |
| 11 | Medium | FormField `color + "99"` string concat, hardcoded spacing, no tests | src/components/FormField/FormField.tsx |
| 12 | Medium | Text default align=justify | src/components/Text/Text.tsx:25 |
| 13 | Medium | Missing semantics: Link role, ProgressBar progressbar, Alert alert, Heading header | respective files |
| 14 | Medium | Root export gaps (prop types, nav hooks) | src/index.ts |
| 15 | Medium | TopBar/BottomBar absolute-position without safe-area, hardcoded heights | TopBar.tsx, BottomBar.tsx |
| 16 | Low | Magic numbers/hardcoded fontWeight across Button, Link, Checkbox, Switch, RadioGroup, Quote, Tooltip, BottomSheet | grep src/components |
| 17 | Low | Divider double useTheme call; Spinner unused var; ProgressBar fake 30% default | respective files |
| 18 | Low | Docs inconsistency (TopBar), docs lack usage snippets | docs/components.md, docs/components/navigation/index.md |

## Summary count per maturity level
| Level | Count | Components |
|---|---|---|
| prototype | 18 | B, BottomBar, BottomSheet, Card, CodeInline, FormField, Modal, P, PasswordInput, Popover, ProgressBar, Quote, Select, SideBar, Small, TextGroup, Textarea, Tooltip |
| demo | 18 | Alert, Badge, Box, Button, Checkbox, Column, Divider, Heading, Input, Link, NavBar, NavContext (NavProvider, hooks), RadioGroup, Row, Spinner, Switch, Text, TopBar |
| stable | 0 | - |
| production-ready | 0 | - |

Total: 36. Tickets to lift all prototypes to demo: audit/texo-v1/tickets/E1.json.
