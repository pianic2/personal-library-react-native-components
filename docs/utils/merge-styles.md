# mergeStyles

**Stability:** experimental — provisional API, not recommended for production dependency.

Utility per unire array di style (React Native) filtrando valori falsy.

## Import

```ts
import { mergeStyles } from "@personal-library/react-native-components";
```

## Firma

```ts
function mergeStyles<T>(...styles: (StyleProp<T> | false | null | undefined)[]): StyleProp<T>
```
