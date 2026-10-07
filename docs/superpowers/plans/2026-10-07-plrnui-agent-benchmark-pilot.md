# PLRNUI Agent Benchmark Pilot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local five-task A0 benchmark that gives Sonnet an isolated Expo Web workspace, evaluates the resulting UI deterministically, and stores a reproducible package-only baseline.

**Architecture:** Benchmark code lives under `benchmarks/agent-usage/` and never changes PLRNUI runtime/API behavior. The root package is built and packed as a consumer tarball; every agent execution gets a fresh temporary Expo workspace containing only the task prompt, sandbox files, and installed package artifact. A0 runs Claude Code in bare/sandboxed mode with reads outside the workspace blocked and web/MCP access unavailable, so reference fixtures and online PLRNUI docs cannot influence the baseline.

**Tech Stack:** Node >=22.13.0, TypeScript, Expo SDK 57, React 19.2.3, React Native 0.86.3, React Native Web, Playwright Chromium, Node `node:test`, `tsx`, Claude Code headless CLI.

**Spec:** `docs/superpowers/specs/2026-10-07-plrnui-agent-benchmark-v0-design.md`

## Global Constraints

- Viewport is exactly `390x844`.
- Pilot tasks are exactly `001`, `006`, `011`, `016`, `020`.
- PLRNUI consumer imports must use `@personal-library/react-native-components` root only.
- A0 exposes no PLRNUI skill, injected docs, web search, web fetch, MCP, project memory, or reference/evaluator artifacts.
- The model may inspect the installed consumer package artifact because package inspection is part of the A0 condition.
- Claude file tools must be configured with `permissions.blockReadsOutsideWorkingDirectories: true`; Bash must run with Claude Code sandboxing enabled and no benchmark-required write access outside the generated workspace/temp area.
- Do not hard-code a guessed Sonnet identifier. Record and pass the exact model value accepted by the local Claude Code installation.
- No task contains routing, network logic, persistence, domain logic, or meaningful state. Required callbacks are no-ops.
- Generated workspaces/results/screenshots are ignored by git until evidence format review.

## Review Focus

1. Reference leakage: the agent workspace and readable filesystem boundary expose no `reference.tsx`, private expectation, previous candidate, or prior result.
2. A0 contamination: user/project skills, CLAUDE.md, MCP, web tools, and injected documentation do not affect the run.
3. Deep imports / invented API: valid TypeScript resolution must not hide an invalid PLRNUI consumer contract.
4. Native reinvention: raw RN support code is allowed, but replacing an obvious expected PLRNUI primitive is flagged.
5. Run reproducibility: every result records exact model, package version/SHA, candidate hash, condition, repetition, viewport, timings, score breakdown, and flags.

---

## File Map

```text
benchmarks/agent-usage/
├── README.md
├── package.json
├── package-lock.json
├── tsconfig.json
├── playwright.config.ts
├── .gitignore
├── sandbox-template/
│   ├── app.json
│   ├── package.json.template
│   ├── index.ts
│   ├── App.tsx
│   └── Candidate.tsx
├── tasks/
│   ├── 001-heading/{prompt.txt,public.json,expected.private.json,reference.tsx}
│   ├── 006-primary-button/{...}
│   ├── 011-button-row/{...}
│   ├── 016-login-section/{...}
│   └── 020-warning-alert/{...}
├── src/
│   ├── schema.ts
│   ├── package-artifact.ts
│   ├── workspace.ts
│   ├── static-evaluator.ts
│   ├── render-evaluator.ts
│   ├── score.ts
│   ├── claude-adapter.ts
│   ├── run-task.ts
│   └── report.ts
└── tests/
    ├── schema.test.ts
    ├── workspace.test.ts
    ├── static-evaluator.test.ts
    ├── render-evaluator.test.ts
    ├── score.test.ts
    ├── run-task.test.ts
    └── report.test.ts
```

Benchmark package scripts are fixed as:

```text
test        = node --import tsx --test tests/**/*.test.ts
typecheck   = tsc --noEmit
bench:task  = tsx src/run-task.ts
bench:pilot = tsx src/report.ts
```

The sandbox dependency template pins React `19.2.3`, React Native `0.86.3`, Expo `~57.0.26`, and installs compatible web dependencies through Expo tooling during benchmark setup. PLRNUI is installed from the locally produced tarball, not from a source-tree symlink.

---

### Task 1: Scaffold benchmark package and isolated workspace lifecycle

**Files:** package/config files, `sandbox-template/*`, `src/schema.ts`, `src/package-artifact.ts`, `src/workspace.ts`, `tests/schema.test.ts`, `tests/workspace.test.ts`.

**Interfaces:**
- `createWorkspace(options) -> Promise<WorkspaceHandle>` where `WorkspaceHandle` exposes `root`, `candidatePath`, `cleanup()`.
- `preparePackageArtifact(options) -> Promise<string>` returns absolute `.tgz` path.
- Schema module exports `TaskPublic`, `TaskExpectation`, `RunResult`, `ScoreBreakdown`, condition type `"A0" | "A1" | "A2" | "A3"`, and viewport constant `{width:390,height:844}`.

- [ ] Write schema tests requiring benchmark version, task, condition, repetition, exact model string, PLRNUI version/SHA, viewport, candidate SHA-256, elapsed time, score breakdown, and flags.
- [ ] Run `npm test -- tests/schema.test.ts`; verify FAIL because schema is absent.
- [ ] Implement schema types/runtime validators.
- [ ] Write workspace test with fake public prompt plus fake `reference.tsx`, `expected.private.json`, screenshot, and prior result; assert only allowlisted public/sandbox files enter the generated workspace.
- [ ] Add a test that recursively inspects the generated workspace and proves the private/reference filenames and contents are absent.
- [ ] Implement `preparePackageArtifact()`: from repository root run build, then pack the already-built package as an npm consumer artifact with lifecycle scripts disabled for the pack operation.
- [ ] Implement `createWorkspace()`: create fresh OS temp dir, copy sandbox allowlist, generate workspace package manifest using the tarball, install dependencies, and return cleanup handle.
- [ ] Run `npm test -- tests/schema.test.ts tests/workspace.test.ts`; verify PASS.
- [ ] Commit: `feat: scaffold PLRNUI agent benchmark sandbox`.

---

### Task 2: Add the five pilot fixtures and references

**Files:** the five task directories; modify `tests/schema.test.ts`.

**Interfaces:** five validated `TaskPublic`/`TaskExpectation` pairs plus canonical reference components available only to evaluator/reference generation.

- [ ] Add a failing fixture test asserting task IDs equal `{001,006,011,016,020}`, public prompts do not name expected PLRNUI components, private expectations use only the approved beta surface, and references use only root PLRNUI imports.
- [ ] Run `npm test -- tests/schema.test.ts`; verify FAIL because fixtures are absent.
- [ ] Implement `001`: large emphasized `Welcome`; expect `Heading`.
- [ ] Implement `006`: primary `Continue` action; expect `Button`.
- [ ] Implement `011`: primary `Continue` + secondary `Cancel`, horizontal, medium spacing; expect `Row` + two `Button`s.
- [ ] Implement `016`: heading + email input + password-like `Input secureTextEntry` + primary button; expect `Column`, `Heading`, two `Input`s, `Button`; do not use excluded `PasswordInput`.
- [ ] Implement `020`: warning message with action; expect `Alert` warning semantics.
- [ ] Run fixture tests; verify PASS.
- [ ] Commit: `test: add PLRNUI benchmark pilot fixtures`.

---

### Task 3: Implement deterministic static PLRNUI evaluation

**Files:** `src/static-evaluator.ts`, `tests/static-evaluator.test.ts`.

**Interface:** `evaluateStatic(source, expectation) -> StaticEvaluation` including import validity, expected primitive adoption, invalid component/prop findings, native-reimplementation findings, source facts, and static score inputs.

- [ ] Write failing tests for valid root imports; `/src`, `/dist`, and component-internal deep imports; nonexistent named PLRNUI imports; unrelated third-party imports.
- [ ] Write failing task-011 tests proving `Row + Button` satisfies adoption while raw `View` row + raw `Pressable` actions yields `native_reimplementation`.
- [ ] Add test proving RN support usage that does not replace an expected PLRNUI primitive is not penalized automatically.
- [ ] Run `npm test -- tests/static-evaluator.test.ts`; verify FAIL.
- [ ] Implement AST analysis with TypeScript compiler API; regex must not be the canonical parser.
- [ ] Run static evaluator tests; verify PASS.
- [ ] Commit: `feat: add PLRNUI static benchmark evaluator`.

---

### Task 4: Implement render/layout evaluation and canonical score

**Files:** `playwright.config.ts`, `src/render-evaluator.ts`, `src/score.ts`, `tests/render-evaluator.test.ts`, `tests/score.test.ts`.

**Interfaces:**
- `evaluateRender(workspace, expectation) -> RenderEvaluation`.
- `scoreCandidate(staticEval, renderEval, compileResult) -> ScoreBreakdown`, total bounded `0..100`.

- [ ] Write failing test where TypeScript succeeds but component throws at runtime; require separate `render_failure` and captured diagnostics.
- [ ] Write failing geometry test for task 011 distinguishing horizontal vs vertical buttons and validating relative ordering/spacing at `390x844`.
- [ ] Write failing score tests for exact weights: typecheck 20, render 10, root import 10, valid API/props 10, PLRNUI adoption 10, deterministic visual expectations 40.
- [ ] Assert screenshot/perceptual similarity is diagnostic-only in pilot scoring.
- [ ] Run render/score tests; verify FAIL.
- [ ] Implement Playwright server/browser lifecycle, explicit ready marker, console/page error capture, screenshot, and geometry capture.
- [ ] Implement bounded score calculation and explicit flags.
- [ ] Run render/score tests; verify PASS.
- [ ] Commit: `feat: add deterministic PLRNUI render scoring`.

---

### Task 5: Implement hardened Claude Code A0 adapter and one-task runner

**Files:** `src/claude-adapter.ts`, `src/run-task.ts`, `tests/run-task.test.ts`, modify README/package scripts as needed.

**Interfaces:**
- `runTask(options) -> Promise<RunResult>`.
- CLI: `npm run bench:task -- --task 001 --condition A0 --model <exact-model>`.

- [ ] Write fake-agent tests proving every repetition gets a fresh workspace and previous candidate changes never survive reset.
- [ ] Write tests proving the agent receives only public task instructions and A0 injects no skill/docs/reference metadata.
- [ ] Write tests proving result metadata preserves exact caller-supplied model string, candidate SHA-256, exit status, elapsed time, tokens/tool telemetry when available, PLRNUI version/SHA, condition, repetition, and evaluator outputs.
- [ ] Add a capability check for the installed Claude Code CLI. The benchmark must fail clearly if required reproducibility/security flags are unavailable rather than silently weakening A0.
- [ ] Generate a runner-owned Claude settings file and invoke Claude Code with filesystem sandboxing enabled and `permissions.blockReadsOutsideWorkingDirectories: true`; only the generated workspace is a working directory.
- [ ] Run Claude in non-interactive/bare mode so user/project CLAUDE.md, skills, plugins, hooks, MCP, and automatic memory do not contaminate A0. Restrict available agent tools to local file/code operations needed for the task; do not expose WebSearch/WebFetch/MCP.
- [ ] Deny tool-network access for A0; dependencies are installed before the agent starts.
- [ ] Pass the exact caller-provided model value to `--model`; never map `sonnet 5.5` to an assumed internal identifier.
- [ ] Implement orchestration: create workspace -> run agent -> hash `Candidate.tsx` -> typecheck -> static evaluate -> render evaluate -> score -> persist local result -> cleanup unless `--keep-workspace`.
- [ ] Run `npm test -- tests/run-task.test.ts`; verify PASS.
- [ ] README: instruct operator to use local `claude --help` or `/model` to discover the exact accepted Sonnet model identifier, then pass it verbatim.
- [ ] Commit: `feat: add isolated Sonnet benchmark runner`.

---

### Task 6: Aggregate and freeze the first A0 pilot

**Files:** `src/report.ts`, `tests/report.test.ts`, modify README/package scripts.

**Interface:** `aggregateResults(results) -> PilotReport`; CLI: `npm run bench:pilot -- --condition A0 --model <exact-model>`.

- [ ] Write failing synthetic report test for `compile_rate`, `render_rate`, `task_success_rate`, `plrnui_adoption_rate`, `invalid_api_rate`, `native_reimplementation_rate`, mean, median, elapsed time, optional token totals, and task score table.
- [ ] Add tests rejecting mixed conditions, mixed exact model strings, or mixed PLRNUI SHAs in one aggregate.
- [ ] Run `npm test -- tests/report.test.ts`; verify FAIL.
- [ ] Implement aggregation and pilot CLI over tasks `001,006,011,016,020` once each.
- [ ] Run all benchmark tests: `npm test`; verify PASS.
- [ ] Run benchmark typecheck: `npm run typecheck`; verify PASS.
- [ ] From repo root run `npm run typecheck && npm test && npm run build && npm run api:snapshot:check`; verify PASS.
- [ ] Resolve the exact local Sonnet model identifier and execute `npm run bench:pilot -- --condition A0 --model <exact-model>`.
- [ ] Verify five independent results plus aggregate report exist; individual candidate failures count as benchmark outcomes, not runner crashes.
- [ ] Inspect evidence for compile failures, PLRNUI choices, invalid/deep APIs, RN reinvention, and deterministic score breakdown. Freeze this A0 pilot before adding any skill/tool assistance.
- [ ] Commit implementation only: `feat: complete PLRNUI A0 benchmark pilot`. Keep generated run evidence uncommitted until reviewed for secrets and machine-specific paths.

---

## Completion Gate

Do not design skill v0 until all of these are true:

- benchmark tests and root PLRNUI regression gates pass;
- a real five-task A0 Sonnet run completes;
- private/reference files are outside the agent-readable boundary;
- A0 has no web/MCP/memory/skill contamination;
- each result contains exact model and PLRNUI identifiers;
- every score is deterministic and explainable;
- the A0 baseline is frozen for comparison.

After this gate, create a separate `skill v0` plan for A2. Add a tool-layer A3 plan only for failure modes that remain measurable after A2.
