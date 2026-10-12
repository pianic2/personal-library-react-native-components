# StateView

**Stability:** experimental — prototype, not yet exported from the package root.

`EmptyState`, `ErrorState`, `LoadingState` and `Result` are the blocks every async screen needs, and `AsyncBoundary` picks
one of them from a request status. They use `Heading`, `Text`, `Button` and `Spinner`, and theme tokens only.

## Import

```ts
// not exported from the package root yet (E14 wave-wiring); until then:
import { AsyncBoundary, EmptyState, ErrorState, LoadingState, Result } from "<package>/src/components/StateView";
```

## Props

```ts
interface EmptyStateProps {
  variant?: "empty" | "no-results" | "offline"; // preset copy, default "empty"
  size?: "sm" | "md";                           // compact vs full, default "md"
  title?: string; description?: string;
  icon?: ReactNode;                             // decorative slot
  actionLabel?: string; onAction?: () => void;  // primary Button
  secondaryActionLabel?: string; onSecondaryAction?: () => void;
  actions?: ReactNode; style?: StyleProp<ViewStyle>; testID?: string;
}

interface ErrorStateProps {
  variant?: "inline" | "fullscreen";            // default "fullscreen"
  title?: string; message?: string;
  onRetry?: () => void | Promise<void>;         // a promise disables the button until it settles
  retrying?: boolean;                           // controlled retrying state
  retryLabel?: string; retryingLabel?: string;
  detail?: string; showDetailsLabel?: string; hideDetailsLabel?: string;
  open?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void;
  style?: StyleProp<ViewStyle>; testID?: string;
}

interface LoadingStateProps {
  variant?: "inline" | "fullscreen"; label?: string; // default label "Loading"
  style?: StyleProp<ViewStyle>; testID?: string;
}

interface ResultProps {
  status?: "success" | "info" | "warning" | "error" | "403" | "404"; // default "info"
  title?: string; description?: string; icon?: ReactNode; actions?: ReactNode;
  style?: StyleProp<ViewStyle>; testID?: string;
}

interface AsyncBoundaryProps<T> {
  status: "idle" | "loading" | "error" | "success"; // idle shows the loading state
  data?: T | null; error?: unknown;
  isEmpty?: (data: T | null | undefined) => boolean; // default: null, undefined, []
  onRetry?: () => void | Promise<void>;
  loading?: ReactNode; empty?: EmptyStateProps | ReactElement; errorView?: ErrorStateProps | ReactElement;
  children: (data: T) => ReactNode; style?: StyleProp<ViewStyle>; testID?: string;
}
```

## Usage

```tsx
<AsyncBoundary status={query.status} data={query.data} error={query.error} onRetry={query.refetch}>
  {(books) => <BookList books={books} />}
</AsyncBoundary>

<EmptyState variant="no-results" actionLabel="Clear filters" onAction={clearFilters} />
<ErrorState title="Could not load" message="Check your connection." detail={String(error)} onRetry={reload} />
<Result status="404" actions={<Button label="Go home" onPress={goHome} />} />
```

## Accessibility

- Titles are `Heading`s; the order is icon, title, description, actions. Icons and illustrations are decorative.
- `ErrorState` announces its title and message (`alert`, live region polite). The retry button is the library `Button`: it
  fires once per press and is disabled and relabelled while retrying. The technical detail is not in the tree until the
  "Show details" toggle (a 44pt button with `expanded` state) is pressed.
- `LoadingState` is a `progressbar` named by its label; only the error `Result` is announced.

## Platform notes

- Same behaviour on iOS, Android and web. Verified in the test renderer only; not yet checked on devices.
- The default copy is English props. The i18n catalog (`src/i18n`) does not carry these strings yet.
