# FormField

**Stability:** beta — public consumer API, usable but contract may still change.

Wrapper per label + helper/error text e pass-through di alcune props al child (es. `error`, `status`, `aria-*`).

## Import

```ts
import { FormField } from "@personal-library/react-native-components";
```

## Props

```ts
type FormStatus = "default" | "error" | "success" | "warning";

interface FormFieldProps {
  label?: string;
  helperText?: string;
  errorText?: string;
  required?: boolean;
  variant?: "outline" | "filled" | "unstyled"; // forwarded only to a child that has a `variant` prop
  colorScheme?: "primary" | "secondary" | "danger"; // forwarded only to a child that has a `colorScheme` prop
  status?: FormStatus;
  style?: ViewStyle | ViewStyle[];
  id?: string;
  children: React.ReactElement;
}
```

## Comportamento

- Se `errorText` è presente (o `status === "error"`), forza lo stato a `error`.
- Se il child supporta certe props, `FormField` le imposta via `React.cloneElement`.

## Usage

```tsx
<FormField label="Email" helperText="Use your work address" required>
  <Input value={email} onChangeText={setEmail} accessibilityLabel="Email" />
</FormField>

<FormField label="Email" errorText="Enter a valid address">
  <Input value={email} onChangeText={setEmail} accessibilityLabel="Email" />
</FormField>
```

## Accessibility

- The error is exposed twice: as text in a polite live region (announced when it appears) and as the child's `accessibilityHint` (read with the control; a hint the child already has is kept).
- `Input`, `PasswordInput`, `Textarea` and `Select` receive `error` from the FormField even when you did not pass the prop; any other child receives `error`, `status`, `variant`, `colorScheme`, `aria-invalid` and `aria-describedby` only if it declares that prop. The child's own value always wins.
- `aria-describedby` references the helper text or the error text, whichever is rendered (the error replaces the helper).
- The label is still not programmatically linked to the control: give the control an `accessibilityLabel`.

## Spacing and colour

- Spacing comes from the theme (`spacing[16]` below the field, `space.sm` under the label, `space.xs` above the helper and error). The helper text uses `colors.textMuted` and the error `colors.error`.
