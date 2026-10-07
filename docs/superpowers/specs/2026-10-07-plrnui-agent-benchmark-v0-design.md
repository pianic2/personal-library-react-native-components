# PLRNUI Agent Benchmark v0 — Design

Date: 2026-10-07
Status: Design candidate for review
Branch: `agent/plrnui-agent-benchmark-v0`

## 1. Goal

Build a deterministic local benchmark that measures how effectively coding agents, initially Sonnet 5.5, use `@personal-library/react-native-components` for small visual-only UI tasks.

The benchmark isolates PLRNUI usage from business logic. Tasks contain no API calls, routing, persistence, domain rules, or meaningful application state. Controlled component handlers may use no-op callbacks when required by component contracts.

Success means we can quantify whether documentation, a PLRNUI skill, and PLRNUI-specific tools improve agent behavior compared with a package-only baseline.

## 2. Non-goals

The v0 benchmark does not evaluate:

- backend or network behavior;
- navigation flows;
- application architecture;
- production accessibility certification;
- native iOS behavior;
- native Android as the primary execution lane;
- unstable or documentation-ambiguous PLRNUI APIs;
- visual reconstruction from screenshots;
- generic React Native coding ability except where needed to detect unnecessary reinvention.

## 3. Benchmark execution lane

The primary lane is Expo Web with a fixed mobile viewport of `390x844` rendered by Playwright.

Reasons:

- fast reset between tasks;
- deterministic screenshots;
- easy DOM/layout inspection;
- no emulator boot overhead;
- suitable for repeated A/B runs.

Android remains a later validation lane and must not block v0 iteration.

## 4. PLRNUI surface allowed in v0

The initial task corpus uses only APIs with clear beta consumer contracts in current documentation:

- `Alert`
- `Badge`
- `Box`
- `Button`
- `Checkbox`
- `Column`
- `Divider`
- `Heading`
- `Input`
- `RadioGroup`
- `Row`
- `Spinner`
- `Switch`
- `Text`
- `ThemeAppShell`
- `ThemeProvider`

The following are deliberately excluded from v0 because current documentation marks them internal, non-stable, experimental, or otherwise ambiguous for this benchmark:

- `Card`
- `PasswordInput`
- `ProgressBar`
- `Stack`
- overlay components;
- experimental navigation components;
- other APIs whose documentation stability disagrees with their root export status.

Consumer imports must use the package root:

```ts
import { Button } from "@personal-library/react-native-components";
```

Deep imports into `src`, `dist`, or component internals are benchmark violations.

## 5. Repository layout

The benchmark lives inside the PLRNUI repository so its fixtures remain version-aligned with the package contract.

Target structure:

```text
benchmarks/agent-usage/
├── README.md
├── package.json
├── sandbox/
├── tasks/
│   ├── 001-heading/
│   │   ├── task.json
│   │   ├── prompt.txt
│   │   ├── reference.tsx
│   │   └── reference.png
│   └── ...
├── runner/
├── evaluator/
├── results/
└── skills/
```

`reference.tsx` and `reference.png` are ground truth and must never be exposed to the evaluated agent.

## 6. Corpus v0

The corpus contains exactly 20 small visual tasks in four groups.

### Atomic

1. Large emphasized heading: `Welcome`.
2. Success-colored text: `Account verified`.
3. Success badge: `Active`.
4. Medium centered spinner.
5. Divider with medium spacing.

### Controls

6. Primary `Continue` button.
7. Email input with label and placeholder.
8. Checked `Remember me` checkbox.
9. Enabled `Notifications` switch.
10. Radio group with `Monthly` and `Yearly`.

### Layout composition

11. Two horizontally aligned buttons with medium gap: primary `Continue`, secondary `Cancel`.
12. Vertical stack containing heading, muted text, and badge.
13. Surface box with padding and rounded corners.
14. Row with a name on the left and status badge on the right.
15. Section containing heading, divider, and description.

### Mini sections

16. Visual login section: heading, two inputs, primary button.
17. Preferences section: heading, checkbox, switch.
18. Success panel: badge, heading, body text, CTA.
19. Loading state: spinner, heading, muted text.
20. Warning panel with message and action using `Alert`.

Prompts describe desired UI, not implementation details. They must not name the expected component except for the package itself.

Example prompt:

```text
Create a section with two buttons side by side.
The first is primary with label "Continue".
The second is secondary with label "Cancel".
Use medium spacing between the two elements.

Use @personal-library/react-native-components when appropriate.
Do not modify unrelated files.
```

## 7. Experimental conditions

Every task is executed under four conditions using the same model configuration, task prompt, sandbox baseline, viewport, and reset policy.

### A0 — Package only

Agent sees the sandbox and installed PLRNUI package. No PLRNUI skill and no PLRNUI documentation injection.

### A1 — Documentation

A0 plus access to consumer-facing PLRNUI documentation.

### A2 — Skill

A0 plus the PLRNUI skill. The skill teaches process and selection behavior; it must not embed the full component documentation corpus.

### A3 — Skill + tools

A2 plus PLRNUI-specific introspection and validation tools.

No task memory is shared between executions.

Initial development runs may execute each condition once. The comparable benchmark release should support three repetitions per condition, producing 240 executions for 20 tasks x 4 conditions x 3 repetitions.

## 8. Scoring

Each task is scored from 0 to 100.

### Deterministic score — 60 points

- 20: TypeScript/typecheck success.
- 10: candidate renders without runtime crash.
- 10: PLRNUI imports follow the public root contract.
- 10: used APIs and props are valid.
- 10: appropriate PLRNUI primitives are used instead of unnecessary React Native reinvention.

### Visual score — 40 points

- 15: structure and layout.
- 10: spacing and alignment.
- 10: requested visual semantics such as variant, hierarchy, and status.
- 5: simplicity and compositional coherence.

The initial visual evaluator must remain deterministic. It may combine element presence, measured geometry, relative spacing, and tolerant perceptual screenshot similarity. Pixel-perfect RGB equality is explicitly rejected because it is too sensitive to rendering noise.

A probabilistic LLM visual judge may be added later only as a separate optional metric and must not replace the deterministic v0 score.

## 9. Anti-pattern penalties and failure flags

The evaluator records explicit findings in addition to the score.

Required flags include:

- `deep_import`
- `invalid_component`
- `invalid_prop`
- `compile_failure`
- `render_failure`
- `native_reimplementation`
- `unnecessary_hardcoding`
- `unrelated_file_change`

Suggested severity penalties used by the reporting layer:

- deep import: severe;
- invented component or prop: severe;
- compile failure: severe;
- recreating a clearly available PLRNUI primitive with raw React Native: material;
- unnecessary hardcoded spacing/style where PLRNUI already models the concept: moderate.

The canonical 0-100 score is component-based and bounded; reporting may display penalty findings without allowing totals below zero.

## 10. Metrics

The runner must aggregate at least:

- `compile_rate`
- `render_rate`
- `task_success_rate`
- `plrnui_adoption_rate`
- `invalid_api_rate`
- `native_reimplementation_rate`
- `mean_score`
- `median_score`
- `tokens_used` when available from the local agent runner
- `tool_calls` when available
- `time_to_solution`

Results must be attributable to model, condition, task, benchmark version, PLRNUI version, and run timestamp.

## 11. PLRNUI skill v0 boundary

The first skill is intentionally small. It teaches four behaviors:

1. Prefer PLRNUI for concepts already represented by its public API.
2. Discover before inventing components or props.
3. Compose layout primitives instead of recreating the design system with raw `View`/`Text` styling.
4. Validate imports and usage before considering the task complete.

The skill must not copy the entire component documentation into model context. Detailed API knowledge belongs in tools or selected docs.

## 12. Tool boundary

The initial tool surface contains five conceptual operations:

### `plrnui_list_components()`

Return the supported public benchmark component inventory with stability metadata.

### `plrnui_search(query)`

Find likely PLRNUI primitives by semantic intent, such as `horizontal actions` or `status message`.

### `plrnui_get_component(name)`

Return concise public contract information: import, stability, supported props, accepted enum values, and short usage notes.

### `plrnui_get_example(name)`

Return a small canonical consumer-facing example derived from approved docs/examples.

### `plrnui_validate(file)`

Validate candidate code for root imports, known exports, supported props when statically inspectable, and obvious PLRNUI reinvention patterns.

Tool responses must expose consumer contract information, not internal implementation source unless a later benchmark explicitly needs it.

## 13. Ground truth and leakage prevention

Each task owns a canonical `reference.tsx` implemented with the selected PLRNUI public surface. Reference screenshots are generated from the same fixed sandbox and viewport as candidates.

The runner must ensure evaluated agents cannot read:

- `reference.tsx`;
- `reference.png`;
- evaluator expected-component metadata;
- prior candidate outputs;
- prior benchmark results for the current task.

Task metadata may contain private evaluator expectations in a location mounted only for the evaluator process.

## 14. Reproducibility

A run record must capture:

- benchmark schema version;
- PLRNUI package version and git SHA;
- model identifier exactly as supplied by the local runner;
- condition A0/A1/A2/A3;
- task ID;
- repetition index;
- viewport;
- candidate source snapshot/hash;
- typecheck result;
- render result;
- score breakdown;
- evaluator flags;
- elapsed time;
- token/tool telemetry when available.

The sandbox is reset to the same baseline before every execution.

## 15. Implementation order

Implementation should proceed in this order:

1. Create benchmark package and neutral Expo Web sandbox.
2. Implement five representative tasks: 001, 006, 011, 016, 020.
3. Implement deterministic typecheck/import/API/render evaluator.
4. Implement screenshot capture and deterministic visual scoring.
5. Run A0 baseline with Sonnet 5.5 on the five-task pilot.
6. Freeze baseline results.
7. Implement skill v0.
8. Run A2 pilot and measure delta.
9. Implement tool layer.
10. Run A3 pilot and measure delta.
11. Add A1 documentation condition.
12. Expand from five pilot tasks to all 20 tasks only after the evaluator is stable.
13. Run the full matrix and publish benchmark results under `benchmarks/agent-usage/results/`.

This staged order prevents spending effort on 20 fixtures before scoring and runner correctness are proven.

## 16. Acceptance criteria

Benchmark v0 is complete when:

- all 20 tasks are present and independently runnable;
- reference implementations render consistently at `390x844`;
- candidates cannot access reference artifacts;
- A0-A3 conditions can run from the same clean baseline;
- deterministic scoring produces a 0-100 result with breakdown and flags;
- aggregate metrics are generated automatically;
- at least one full Sonnet 5.5 benchmark matrix has been recorded;
- results make it possible to quantify whether skill and tools improve PLRNUI adoption and reduce invalid API usage;
- benchmark code does not change PLRNUI runtime behavior or consumer API.

## 17. Design constraints

- Evidence-first: every reported improvement must be backed by stored run data.
- Keep the benchmark local-first and cheap to repeat.
- Prefer deterministic checks over evaluator LLMs.
- Keep skill instructions small and tool responses targeted.
- Avoid coupling benchmark correctness to unstable PLRNUI APIs.
- Benchmark infrastructure must remain isolated from published package files unless explicitly added to publication policy later.
