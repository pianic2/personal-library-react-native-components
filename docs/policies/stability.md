# Stability policy

Every component and API carries a stability label. The label tells you which parts of [Versioning](versioning.md) apply. The labels are defined in ADR 0003; the current classification of each component is in [Components](../components.md) and [Platform support](../platform-support.md).

| Label | Meaning | Guarantee |
| --- | --- | --- |
| `stable` | Public API that passed the stable gate. | Semantic versioning: breaking changes only in a major release, after deprecation. |
| `beta` | Public API, usable, contract may still change. | May change in a minor release with a release note and a migration note. |
| `experimental` | Provisional API, not recommended as a production dependency. | May change or be removed in any release. |
| `internal` | Not part of the public API. | No guarantee; do not import it. |
| `deprecated` | Historical alias or API kept for migration. | Removed only following [Deprecation](deprecation.md). |

## Maturity ladder and labels

Components move along a maturity ladder (see [Contributing](../../CONTRIBUTING.md)). The ladder describes how complete a component is; the label describes what is promised.

| Maturity | Label |
| --- | --- |
| prototype | `experimental` |
| demo | `experimental`, or `beta` once it is publicly exported and documented |
| stable | `stable` |
| production-ready | `stable` |

Only `stable` and `production-ready` components are covered by semantic versioning.

## Stable gate

Promoting a component to `stable` requires consumer runtime proof, interaction coverage, accessibility evidence and cleanup of the component-specific blockers listed in [Platform support](../platform-support.md). Nothing is promoted by documentation alone.

## Exemptions

- `beta` and `experimental` APIs are exempt from the major-release rule. They are still announced in release notes.
- `internal` modules are exempt from every rule.
- Behavior that the documentation marks as unsupported on a platform is not covered, even for `stable` components.
