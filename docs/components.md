# Components

This page summarizes the current consumer-facing component surface. It follows `audit/components/component-platform-support-matrix-plrnui-25.md` and does not promote any component to `stable`.

## Beta Public Candidates

Use these from the root package entrypoint:

```tsx
import {
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Checkbox,
  CodeInline,
  Column,
  Divider,
  FormField,
  Heading,
  Input,
  Link,
  NavBar,
  NavProvider,
  P,
  PasswordInput,
  ProgressBar,
  Quote,
  RadioGroup,
  Row,
  Small,
  Spinner,
  Switch,
  Text,
  TextGroup,
  Textarea,
  ThemeProvider,
  TopBar,
} from "@personal-library/react-native-components";
```

These components are expected to render on iOS, Android and Web, but stable promotion remains blocked by consumer runtime proof, accessibility/focus/keyboard coverage, and component-specific hardening.

## Experimental Components

The following APIs remain experimental and must be labelled as such in examples:

- `BottomBar`
- `BottomSheet`
- `Modal`
- `Popover`
- `Select`
- `SideBar`
- `Tooltip`

`Tooltip` and `Popover` have web content behavior and reduced native fallback behavior. `SideBar` has a minimal native vertical-list fallback and richer web behavior.

## Import Policy

Consumer-facing docs and examples must use:

```tsx
import { Button } from "@personal-library/react-native-components";
```

Forbidden in consumer docs/examples:

- legacy package names;
- source internals;
- build output;
- direct component internals;
- repo-relative package imports;
- package subpaths not declared in package metadata.
