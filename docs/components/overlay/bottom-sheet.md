# BottomSheet

Bottom sheet con due snap semplificati: `collapsed` / `expanded`.

## Import

```ts
import { BottomSheet } from "@personal-library/react-native-components";
```

## Props

```ts
type Snap = "collapsed" | "expanded";

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  snap?: Snap;
  header?: React.ReactNode;
  children: React.ReactNode;
}
```
