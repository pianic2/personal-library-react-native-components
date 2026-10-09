# Versioning policy

The package follows [semantic versioning](https://semver.org) for the public API that is covered by semver (the `stable` set, see [Stability](stability.md)). Version `1.0.0` is the first stable release; the criteria are at the end of this page. The decision record is ADR 0011.

## What is public API

- The documented entry points: the root entry and any subpath listed in the export contract (`exports` in `package.json`). Deep imports into `src/` or `dist/` internals are not public.
- Exports of those entry points: components, hooks, theme provider and hooks, tokens, and their types, including the props and prop types of every exported component.
- The theme contract and the public token names and value types.
- Documented accessibility behavior: roles, labels, states and values that assistive technology announces, and touch-target minimums.
- Documented behavior and defaults.

Everything else is internal and can change in any release.

## What is breaking

A change is breaking when code that compiled and behaved correctly against the previous version can stop compiling or behave differently. For the `stable` set it needs a **major** release. Breaking examples:

1. Removing an export from a public entry point.
2. Renaming an export or a subpath.
3. Narrowing a prop type (for example `string` to `"a" | "b"`).
4. Making an optional prop required.
5. Renaming or removing a theme token, or changing its value type.
6. Tightening a peer dependency range (for example React Native `>=0.86.0 <0.88.0` to `>=0.86.0 <0.87.0`).
7. Raising the minimum Node, Expo or React Native version.
8. Changing an accessibility role or state that a screen reader announces.
9. Changing a documented default so the rendered result differs materially.
10. Requiring a provider that was not required before.
11. Removing a deprecated API before its window ends (not allowed, see [Deprecation](deprecation.md)).

## What is not breaking

These are **minor** (new capability) or **patch** (fix) changes:

1. Adding a new export, component or hook.
2. Adding an optional prop.
3. Widening a prop type (accepting more values).
4. Adding a new token.
5. Widening a peer dependency range.
6. Fixing a bug where the old behavior contradicted the documentation.
7. Adding an accessibility label or improving an announcement without removing one.
8. Internal refactors with identical public behavior.
9. Marking an API `@deprecated` (a minor release).
10. Documentation and example changes.

## Version bumps

| Change | Bump |
| --- | --- |
| Compatible bug fix | patch |
| Compatible addition, new deprecation | minor |
| Breaking change to a `stable` API | major |
| Change to a `beta` API | minor, with a release note and migration note |
| Change to an `experimental` API | any release |

Every breaking, deprecation and `beta` change needs a release note describing the impact and the migration path (see [CONTRIBUTING](../../CONTRIBUTING.md) for the process).

## Criteria for `1.0.0`

- The stable set is non-empty and listed in [Components](../components.md).
- The public API snapshots are committed and checked (`npm run api:snapshot:check`).
- The support matrix is verified: [Compatibility](../compatibility.md) has at least one `supported` entry with evidence (`npm run docs:compat:check`).

At the time of writing no component is classified `stable`, so these criteria are not met yet. The supported Expo and React Native versions for `1.0.0` are listed in [Compatibility](../compatibility.md).
