# useControllableState and useMergedRefs

**Stability:** beta — hooks for building inputs; exported from their own files, barrel export is done by the wiring ticket (E4-22).

Internal building blocks for inputs that support both controlled and uncontrolled usage (Slider, OTP, Rating, SegmentedControl, Accordion, Collapsible).

## useControllableState

```ts
function useControllableState<T>(options: {
  value?: T; // controlled when not undefined
  defaultValue: T; // initial value while uncontrolled
  onChange?: (next: T) => void;
}): [T, (next: T | ((previous: T) => T)) => void];
```

- Controlled: the returned value is always `value`; the setter never changes internal state, it only calls `onChange`.
- Uncontrolled: the setter updates internal state and calls `onChange`.
- `onChange` fires only when the next value differs from the current one (`Object.is`).
- Functional updates receive the current value. Uncontrolled: two updates in the same batch chain (0 -> 1 -> 2). Controlled: the parent owns the value, so both updates see the same `value` until the parent re-renders with a new one.
- Switching from controlled to uncontrolled falls back to the internal state (initially `defaultValue`); the `__DEV__` warning covers this case.
- The setter keeps a stable identity.
- In `__DEV__`, switching between controlled and uncontrolled logs a warning.

```tsx
const [value, setValue] = useControllableState({ value: props.value, defaultValue: props.defaultValue ?? 0, onChange: props.onValueChange });
```

## useMergedRefs

```ts
function useMergedRefs<T>(...refs: Array<Ref<T> | undefined>): RefCallback<T>;
```

Merges callback refs and object refs (and ignores `null`/`undefined`) into one callback ref. The callback keeps its identity while the same refs are passed in the same order.

```tsx
const merged = useMergedRefs(forwardedRef, innerRef);
return <View ref={merged} />;
```

## Catalog

No catalog entry yet: the catalog app workspace (PLRNUI-105) and the barrel export (E4-22) are separate tickets.
