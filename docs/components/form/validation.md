# Validation

**Stability:** experimental — schema-agnostic resolver contract and rule combinators; not yet exported from the package root.

A `Resolver<T>` turns form values into an error map, and the built-in rules cover simple forms without a schema library. Messages come from the `LocaleProvider` catalog (`validation.*` keys), so they follow the app locale and are plain strings that can be announced in a live region.

## Import

The wiring ticket exports these from the package root. Until then they live in `src/forms/validation`.

```ts
import { createResolver, useResolver, required, minLength, maxLength, pattern, email, min, max, matches, custom, setValidationMessages } from "@personal-library/react-native-components";
import type { Errors, Path, Resolver, Rule, RuleMap } from "@personal-library/react-native-components";
```

## API

```ts
type Errors<T> = Partial<Record<Path<T>, string>>; // Path<T>: "name", "address.city", "tags.0"
type Resolver<T> = (values: T) => Errors<T> | Promise<Errors<T>>;
type Rule<T = unknown> = (value: unknown, ctx: { values: T; path: string; message(key, vars?): string }) => string | undefined | Promise<string | undefined>;

createResolver<T>(rules: { [path]: Rule | Rule[] }, options?: { messages? }): Resolver<T>
useResolver<T>(rules): Resolver<T> // same, with the LocaleProvider catalog (hoist or memoize rules)
```

| Rule | Fails when | Catalog key |
| --- | --- | --- |
| `required(msg?)` | undefined, null, blank string, empty array | `validation.required` |
| `minLength(n, msg?)` / `maxLength(n, msg?)` | length below `n` / above `n` | `validation.minLength` / `validation.maxLength` |
| `pattern(re, msg?)` | non-empty value does not match `re` | `validation.pattern` |
| `email(msg?)` | non-empty value is not an email | `validation.email` |
| `min(n, msg?)` / `max(n, msg?)` | not a number, or below / above `n` | `validation.number` |
| `matches(otherPath, msg?)` | differs from the value at `otherPath` | `validation.pattern` |
| `custom(fn)` | `fn` returns a message (may be async) | — |

Only `required` reports an empty value; every other built-in rule passes it. The first failing rule per field is reported and later rules do not run. The resolver is synchronous unless a rule returns a promise.

## Usage

```tsx
const rules: RuleMap<SignUp> = {
  email: [required(), email()],
  password: [required(), minLength(8)],
  confirm: matches("password"),
  username: custom(async (value) => ((await isTaken(String(value))) ? "Already taken" : undefined)),
};
const resolve = useResolver<SignUp>(rules);
const errors = await resolve(values); // { email: "Enter a valid email address" }
```

## Messages and i18n

Message resolution, first match wins: the rule's `msg`, `setValidationMessages()` overrides, the `LocaleProvider` catalog (through `useResolver`), the English default. `setValidationMessages(partial)` merges into earlier calls and `resetValidationMessages()` clears them; use it outside React or once at start-up. `{min}` and `{max}` placeholders are filled in.

`min`, `max` and `matches` reuse `validation.number` and `validation.pattern` because the catalog has no dedicated keys yet; pass `msg` for a specific text.

## Accessibility

Errors are plain strings: render them in `Field.Error` or a live region so assistive technology announces them.
