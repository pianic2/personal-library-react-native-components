# ADR 0014: Public API conventions

## Status

Accepted. It records decision D3 (`audit/texo-v1/DECISIONS.md`, adopted by the orchestrator 2026-10-09, from `audit/texo-v1/reviews/R1-architecture-review.md` ADR-R2 and finding M6). The conventions are frozen at 1.0; changing one afterwards follows the semver policy (ADR 0008, ADR 0011).

## Context

Event and visual-axis names already diverge in the current API: `onChange(value)` on Switch, Checkbox and RadioGroup collides with the React Native `onChange(nativeEvent)` meaning; `variant` is a colour on Button, Badge and Alert but a structure on Card; `ProgressBar` has `color` and `FormField` has `colorScheme`; `Input.error` is a string while other sketches use a boolean; Button, Link and others drop `style` and `testID`. About 150 components are planned, so the rules must exist before they land and must be checked by tooling, not by review memory.

## Decision

### Controlled values

Every non-text control and composite (Checkbox, Switch, RadioGroup, Slider, Select, Combobox, Tabs, Accordion, DatePicker and similar) uses `value`, `defaultValue` and `onValueChange(value)`. A component never declares its own `onChange`. Text inputs keep React Native's `onChangeText` and add `onValueChange` only where a transform exists (for example a masked input: `onValueChange(raw, formatted)`). Existing `onChange(value)` stays as a `@deprecated` alias through 1.x.

### Open state

Overlays and disclosures use `open`, `defaultOpen` and `onOpenChange(open)`. The names `visible` and `isOpen` are not used for new components; `onClose` may stay as an alias on Modal and BottomSheet. Existing `visible` stays as a `@deprecated` alias through 1.x.

### Visual axes

- `variant` is structure: `solid | soft | outline | ghost | link` as applicable. It never carries a colour name.
- `tone` is semantic colour: `primary | neutral | success | warning | danger | info`.
- `size` is `xs | sm | md | lg`. Larger sizes (`xl` and up) exist only on typography components (Text, Heading, B, P, Small, Quote, CodeInline).
- `color` and `colorScheme` props are not used; use `tone`. Button `variant="danger" | "info" | "primary" | "secondary"` is mapped to `tone` through a `@deprecated` alias.

### Validation

`invalid?: boolean` is the validation state. `error` holds the message and is a string, never a boolean. A field-level `status` may exist on form wrappers.

### Passthrough

Every component forwards `ref` (React 19 ref as a prop), `style` (root), `testID` and the `accessibility*` / `aria-*` props. Multi-slot components add `styles?: Partial<Record<Slot, StyleProp<...>>>`. Children are preferred over `label` strings, except where an accessible label is required.

### Compound components

Compound components are built with `Object.assign(Root, { Part })` and also exported by name (`RootPart`), so they stay tree-shakeable and visible to documentation tooling.

### A11y defaults

Role, state and label are set by default. Where the content is not text (an icon-only touchable) the types require `accessibilityLabel`. Touch targets of 44/48 are reached with `hitSlop`, not by enlarging the component.

## Enforcement

- `node scripts/check-api-conventions.mjs` (TypeScript compiler API) iterates every exported `*Props` type of `src/index.ts`; components are discovered automatically, with no per-component edits. It checks own (non-React-Native) props for: `onChange`, `visible`/`isOpen`, `color`/`colorScheme`, colour names in `variant`, `tone` and `size` value sets, boolean `error`, non-boolean `invalid`, and the `style` and `testID` passthrough (providers are exempt).
- `scripts/api-conventions.baseline.json` lists the violations that existed when the check was introduced. New components may not add entries; a baseline entry that no longer occurs is reported so it can be removed. Fixing a component means removing its entries.
- `tests/types/api-conventions.ts` holds the type-level helpers with `@ts-expect-error` negative cases (`error: boolean`, `size: "xl"` outside typography); it compiles under `npm run typecheck:contracts`.
- Limits: the check covers exported `*Props` types only (Modal, Select, BottomSheet, Popover and Tooltip export none today), and `ref` and `accessibility*` forwarding are not checked yet.

## Consequences

- Existing violations are visible and tracked in the baseline until each component is migrated, with the old names kept as `@deprecated` aliases through 1.x.
- Every component ticket can state "conforms to ADR 0014" and prove it with the check.
- Wiring the check into `npm run release:check` or CI needs a change to `package.json` or the workflow, which belongs to the release tickets.

## References

- `audit/texo-v1/DECISIONS.md` D3; `audit/texo-v1/reviews/R1-architecture-review.md` M6 and ADR-R2
- ADR 0002, 0003, 0008, 0011
