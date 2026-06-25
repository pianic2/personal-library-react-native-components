# Modal

Modal centrato con backdrop.

## Import

```ts
import { Modal } from "@personal-library/react-native-components";
```

## Props

```ts
interface ModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
  dismissOnBackdrop?: boolean;
}
```
