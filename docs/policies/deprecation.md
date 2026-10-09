# Deprecation policy

Deprecation is how an API in the semver-covered set leaves the package without surprising consumers. See [Versioning](versioning.md) for what counts as breaking and [Stability](stability.md) for which APIs are covered.

## How an API is deprecated

1. Add a JSDoc `@deprecated` tag that names the replacement and the version where the deprecation starts.
2. Document the deprecation and the migration path in the component page and in the release notes of that version.
3. Keep the old behavior working. There is **no runtime warning**: deprecation is communicated by the type system (editors strike the symbol through), the documentation and the release notes.

Marking an API deprecated is a **minor** release.

## How long it stays

- The API stays for at least **one minor release and at least 6 months** after the deprecation is released, whichever is longer.
- It is removed only in a **major** release.
- Deprecated aliases kept for migration stay through the whole `1.x` line (decision H4).
- The legacy package name is kept alive by a re-export shim with its own sunset window of 12 months (ADR 0013). Open: the calendar start of that window is set by the release plan.

## Exceptions

- A security problem may force a faster removal; the release notes must say so.
- `beta` APIs follow [Stability](stability.md): they may change in a minor release, and a deprecation period is a courtesy, not a promise.
- `experimental` and `internal` APIs can be removed without deprecation.

## Checklist for the author of a deprecation

- [ ] `@deprecated` tag with replacement and start version
- [ ] Docs page and migration note updated
- [ ] Release note written
- [ ] The earliest removal date (6 months, next major) recorded in the release note
- [ ] Tests still cover the deprecated API until it is removed
