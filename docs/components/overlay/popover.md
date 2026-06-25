# Popover

Popover posizionato rispetto a un anchor (web-only per la parte overlay).

## Import

```ts
import { Popover } from "@personal-library/react-native-components";
```

## Props

```ts
type Placement = "bottom" | "top" | "right" | "left";

interface PopoverProps {
  renderTrigger: (args: { open: boolean; toggle: () => void }) => React.ReactNode;
  children: React.ReactNode;
  placement?: Placement;
  gap?: keyof ReturnType<typeof useTheme>["theme"]["space"];
}
```

## Note

- Se `Platform.OS !== "web"`, renderizza solo il trigger (su mobile si usa tipicamente `BottomSheet`/`Modal`).
