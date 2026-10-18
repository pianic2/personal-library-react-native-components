# Field

**Stability:** beta — public consumer API, usable but contract may still change.

Compound form field. `Field.Label`, `Field.Control`, `Field.Hint` and `Field.Error` share generated ids and state through the `Field`, and the control opts in with `useFieldControlProps()`. Nothing is cloned or guessed from the child, so any control can be labelled, described and flagged as invalid. Unlike [FormField](form-field.md), the parts are composed explicitly.

## Import

```ts
import { Field, useField, useFieldControlProps } from "@personal-library/react-native-components";
import type { FieldProps } from "@personal-library/react-native-components";
```

## Props

```ts
type FieldStatus = "default" | "error" | "success" | "warning";

interface FieldProps extends Omit<ViewProps, "children" | "style"> {
  name?: string; // prefixes the generated ids
  status?: FieldStatus; // default "default"
  required?: boolean; // marker on the label
  disabled?: boolean; // muted label, accessibilityState.disabled on the control
  style?: StyleProp<ViewStyle>;
  testID?: string;
  children?: React.ReactNode;
}

// Field.Label: LabelProps without nativeID, required, disabled (taken from the Field)
// Field.Control: View props
// Field.Hint, Field.Error: Small (Text) props without nativeID

useField(): { nativeID, labelId, hintId, errorId, status, required, disabled } // throws outside a Field
useFieldControlProps(): {
  nativeID, accessibilityLabelledBy, accessibilityDescribedBy, "aria-describedby",
  accessibilityState, editable, "aria-invalid", accessibilityHint
} // {} outside a Field
```

## Usage

```tsx
function EmailInput() {
  return <Input accessibilityLabel="Email" {...useFieldControlProps()} />;
}

<Field required>
  <Field.Label>Email</Field.Label>
  <Field.Control>
    <EmailInput />
  </Field.Control>
  <Field.Hint>We never share it</Field.Hint>
  <Field.Error>{error}</Field.Error>
</Field>
```

`Field.Error` renders nothing when `children` is falsy, so `{error}` can be `undefined`. While an error message is displayed, the field status is `error` (even with `status="default"`) and the hint is hidden.

## Accessibility

- The label has the id `labelId`; the control references it with `accessibilityLabelledBy`.
- `accessibilityDescribedBy` and `aria-describedby` list the ids of the displayed hint and error. The hint stays described while an error replaces it visually.
- `aria-invalid` is set for the error status. `accessibilityHint` carries the error message followed by the hint as the native fallback; the text is read from strings, numbers and the text inside nested elements, and no hint is set when there is none.
- `disabled` makes `useFieldControlProps()` return `accessibilityState: { disabled: true }` and `editable: false`. A control that spreads them is therefore non-editable and disabled: the library `Input` derives its own disabled state from `editable`. A control that ignores these props is not disabled by the Field; the Field only guarantees what it returns.
- `Field.Error` is a polite live region (`accessibilityLiveRegion="polite"`, `role="alert"` on web) and exists only with a message.
- `accessibilityLabelledBy` is an Android prop: on other platforms keep an `accessibilityLabel` on the control.

## Spacing and colour

Spacing is `theme.space.xs`. The hint uses `colors.textMuted` (`colors.success` / `colors.warning` for those statuses), the error `colors.error`.

## Stability

`beta` (catalog status `demo`): the API is usable but may still change before 1.0.
