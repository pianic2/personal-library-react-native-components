# PasswordInput

**Stability:** beta — public consumer API, usable but contract may still change.

`Input` with a themed show/hide toggle that switches `secureTextEntry`. Everything `Input` accepts (except `rightIcon` and `secureTextEntry`) passes through.

## Import

```ts
import { PasswordInput } from "@personal-library/react-native-components";
```

## Props

```ts
interface PasswordInputProps extends Omit<InputProps, "rightIcon" | "secureTextEntry"> {
  passwordVisible?: boolean;            // controlled visibility
  defaultPasswordVisible?: boolean;     // initial visibility when uncontrolled, default false
  onPasswordVisibilityChange?: (visible: boolean) => void;
  showPasswordLabel?: string;           // default: the "password.show" message
  hidePasswordLabel?: string;           // default: the "password.hide" message
}
```

## Usage

```tsx
<PasswordInput label="Password" value={value} onChangeText={setValue} />
<PasswordInput label="Password" showPasswordLabel="Mostra" hidePasswordLabel="Nascondi" value={value} onChangeText={setValue} />
```

The toggle text and its accessibility label are the same string: the prop when given, otherwise the `password.show` / `password.hide` message of the nearest `LocaleProvider` (English by default, see the i18n guide).

## Accessibility

- The toggle is a `button` with `accessibilityState { checked }`, drawn with the themed `Text` in the primary color.
- The field is named by `label` or `accessibilityLabel`, as for `Input`.
