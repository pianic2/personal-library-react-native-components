# cn

**Stability:** internal / non-stable — not part of the public consumer API.

Utility per comporre classi CSS (stringhe) in modo condizionale.

## Import

No consumer import is documented for `cn`.

`cn` is an internal / non-stable helper. It is not part of the public consumer
API, is not exported from the package root, and must not be imported from
repository internals, unpublished subpaths, `src/*` or `dist/*`.

## Firma

```ts
function cn(...classes: (string | false | null | undefined)[]): string
```
