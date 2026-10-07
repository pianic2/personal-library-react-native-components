# PLRNUI Agent Benchmark Pilot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local five-task A0 benchmark pilot that can give Sonnet a clean Expo Web workspace, capture its candidate UI, score deterministic PLRNUI usage/render/layout behavior, and persist reproducible baseline results.

**Architecture:** Keep benchmark infrastructure under `benchmarks/agent-usage/` and outside the published PLRNUI package. Build PLRNUI once, pack the consumer artifact, and generate isolated temporary Expo workspaces from a neutral template so the evaluated agent cannot read reference fixtures. The pilot deliberately stops after an A0 baseline; the PLRNUI skill, documentation condition, and PLRNUI tools get separate plans only after the evaluator is proven.

**Tech Stack:** Node >=22.13.0, TypeScript, Expo SDK 57, React 19.2.3, React Native 0.86.3, React Native Web, Playwright Chromium, Node `node:test`, `tsx`, Claude Code headless adapter.

**Spec:** `docs/superpowers/specs/2026-10-07-plrnui-agent-benchmark-v0-design.md`

## Global Constraints

- Primary execution lane: Expo Web at a fixed `390x844` viewport.
- PLRNUI consumer code must import from `@personal-library/react-native-components` root only.
- Pilot task set is exactly `001`, `006`, `011`, `016`, `020` from the design spec.
- Agents may see the task prompt, generated sandbox, installed consumer package artifact, and normal runtime files; they must not see `reference.tsx`, reference screenshots, evaluator expectations, prior candidate outputs, or prior results.
- A0 provides no PLRNUI skill and no injected consumer documentation beyond what ships in the npm-style package artifact.
- No business logic, routing, network, persistence, or meaningful application state belongs in pilot tasks.
- Dummy required callbacks use no-op behavior.
- Do not change PLRNUI runtime behavior or public API to make the benchmark easier.
- Benchmark-generated workspaces and run outputs are local artifacts and must not enter the published package.
- Record the exact model string supplied to the local runner; do not silently alias an unverified model identifier.

## Review Focus

1. **Reference leakage:** generated agent workspaces must contain no reference implementation, expected-component manifest, or previous result file; the workspace-isolation test owns this.
2. **Path traversal / deep imports:** static evaluation must reject `src`, `dist`, or component-internal PLRNUI imports even when TypeScript can resolve them; the static-evaluator tests own this.
3. **Raw React Native reinvention:** a compiling candidate that uses `View`/`Pressable` instead of an obvious pilot PLRNUI primitive must be flagged without making valid RN support usage an automatic failure; task expectation tests own this.
4. **Non-rendering candidates:** compile success must not imply render success; Playwright must report a separate runtime/render failure and preserve diagnostics; render-evaluator tests own this.
5. **Nondeterministic run metadata:** every stored result must include task, repetition, condition, exact model string, PLRNUI version/SHA, viewport, candidate hash, elapsed time, score breakdown, and flags; result-schema tests own this.

---

## File Structure

Create this pilot structure:

```text
benchmarks/agent-usage/
├── README.md                         # local usage and A0 pilot contract
├── package.json                      # benchmark-only dependencies/scripts
├── package-lock.json
├── tsconfig.json
├── playwright.config.ts
├── .gitignore                        # .cache, runs, reports, generated screenshots
├── sandbox-template/
│   ├── app.json
│   ├── package.json.template
│   ├── index.ts
│   ├── App.tsx
│   └── Candidate.tsx                # neutral starter file copied per run
├── tasks/
│   ├── 001-heading/
│   │   ├── prompt.txt
│   │   ├── public.json
│   │   ├── expected.private.json
│   │   └── reference.tsx
│   ├── 006-primary-button/...
│   ├── 011-button-row/...
│   ├── 016-login-section/...
│   └── 020-warning-alert/...
├── src/
│   ├── schema.ts                    # task/result runtime types and validation
│   ├── package-artifact.ts          # build/pack PLRNUI consumer artifact
│   ├── workspace.ts                 # isolated temp-workspace lifecycle
│   ├── static-evaluator.ts          # import/API/adoption checks
│   ├── render-evaluator.ts          # Playwright runtime/layout capture
│   ├── score.ts                     # canonical 0-100 breakdown
│   ├── claude-adapter.ts            # headless CLI execution adapter
│   ├── run-task.ts                  # one task/repetition/condition
│   └── report.ts                    # pilot aggregation
└── tests/
    ├── schema.test.ts
    ├── workspace.test.ts
    ├── static-evaluator.test.ts
    ├── render-evaluator.test.ts
    ├── score.test.ts
    └── report.test.ts
```

The five `reference.tsx` files remain repository fixtures for evaluator/reference generation only. `workspace.ts` must copy an allowlist of sandbox/public files rather than copying the benchmark directory and deleting private files afterward.

---

### Task 1: Benchmark package, schemas, and isolated sandbox template

**Files:**
- Create: `benchmarks/agent-usage/package.json`
- Create: `benchmarks/agent-usage/package-lock.json`
- Create: `benchmarks/agent-usage/tsconfig.json`
- Create: `benchmarks/agent-usage/.gitignore`
- Create: `benchmarks/agent-usage/README.md`
- Create: `benchmarks/agent-usage/sandbox-template/app.json`
- Create: `benchmarks/agent-usage/sandbox-template/package.json.template`
- Create: `benchmarks/agent-usage/sandbox-template/index.ts`
- Create: `benchmarks/agent-usage/sandbox-template/App.tsx`
- Create: `benchmarks/agent-usage/sandbox-template/Candidate.tsx`
- Create: `benchmarks/agent-usage/src/schema.ts`
- Create: `benchmarks/agent-usage/src/package-artifact.ts`
- Create: `benchmarks/agent-usage/src/workspace.ts`
- Test: `benchmarks/agent-usage/tests/schema.test.ts`
- Test: `benchmarks/agent-usage/tests/workspace.test.ts`

**Interfaces:**
- Produces: `TaskPublic`, `TaskExpectation`, `RunResult`, `ScoreBreakdown`, `createWorkspace(options) -> Promise<WorkspaceHandle>`, `preparePackageArtifact(options) -> Promise<string>`.
- `WorkspaceHandle` exposes absolute `root`, `candidatePath`, `cleanup(): Promise<void>` and no path to benchmark-private fixtures.

- [ ] **Step 1: Write schema tests**

Assert that a valid result requires `benchmarkVersion`, `taskId`, `condition`, `repetition`, `model`, `plrnuiVersion`, `plrnuiGitSha`, viewport `{ width: 390, height: 844 }`, candidate SHA-256, elapsed milliseconds, score breakdown, and flags; assert malformed condition/model/task data is rejected.

- [ ] **Step 2: Run schema tests and verify failure**

Run from `benchmarks/agent-usage`: `npm test -- --test-name-pattern="schema"`
Expected: FAIL because `src/schema.ts` does not exist.

- [ ] **Step 3: Implement schema types/validators**

In `src/schema.ts`, define exact condition type `"A0" | "A1" | "A2" | "A3"`, viewport constant `{ width: 390, height: 844 }`, pilot task/result types, and runtime validation functions used when reading JSON fixtures/results.

- [ ] **Step 4: Write workspace-isolation tests**

Create a temporary pilot fixture containing a public prompt plus fake `reference.tsx`, `expected.private.json`, previous result, and screenshot. Assert `createWorkspace()` copies only the sandbox template, public task metadata/prompt, and PLRNUI consumer package artifact; assert all private/reference/result fixture names are absent recursively from the generated workspace.

- [ ] **Step 5: Implement package artifact and workspace lifecycle**

`preparePackageArtifact()` must build the root PLRNUI package then create an npm-style tarball from the root package with scripts disabled for packing, returning its absolute path. `createWorkspace()` must create a fresh OS temporary directory, copy the sandbox allowlist, render a workspace `package.json` pinned to Expo 57 / React 19.2.3 / React Native 0.86.3 plus the tarball dependency, install dependencies, and return a cleanup handle.

- [ ] **Step 6: Run Task 1 tests**

Run: `npm test -- tests/schema.test.ts tests/workspace.test.ts`
Expected: PASS, including the leakage test.

- [ ] **Step 7: Verify neutral sandbox manually**

Run the benchmark sandbox smoke script defined in `package.json`; expected result is an Expo Web page that renders the neutral `Candidate` at `390x844` without importing benchmark references.

- [ ] **Step 8: Commit Task 1**

```bash
git add benchmarks/agent-usage
git commit -m "feat: scaffold PLRNUI agent benchmark sandbox"
```

---

### Task 2: Five pilot fixtures and canonical references

**Files:**
- Create: `benchmarks/agent-usage/tasks/001-heading/{prompt.txt,public.json,expected.private.json,reference.tsx}`
- Create: `benchmarks/agent-usage/tasks/006-primary-button/{prompt.txt,public.json,expected.private.json,reference.tsx}`
- Create: `benchmarks/agent-usage/tasks/011-button-row/{prompt.txt,public.json,expected.private.json,reference.tsx}`
- Create: `benchmarks/agent-usage/tasks/016-login-section/{prompt.txt,public.json,expected.private.json,reference.tsx}`
- Create: `benchmarks/agent-usage/tasks/020-warning-alert/{prompt.txt,public.json,expected.private.json,reference.tsx}`
- Modify: `benchmarks/agent-usage/tests/schema.test.ts`

**Interfaces:**
- Consumes: fixture validators from Task 1.
- Produces: five validated pilot `TaskPublic`/`TaskExpectation` pairs and five canonical PLRNUI-only reference components.

- [ ] **Step 1: Add failing fixture-validation tests**

Assert exactly five pilot fixture directories exist, IDs are unique and equal `{001,006,011,016,020}`, each public prompt avoids naming expected components, each private expectation references only the approved beta pilot surface, and every reference imports PLRNUI from the package root.

- [ ] **Step 2: Run fixture tests and verify failure**

Run: `npm test -- tests/schema.test.ts`
Expected: FAIL because pilot fixtures are absent.

- [ ] **Step 3: Implement task 001 fixture**

Prompt requests a large emphasized `Welcome` title. Private expectation requires `Heading`; reference wraps the candidate UI with the same benchmark shell contract used by all tasks.

- [ ] **Step 4: Implement task 006 fixture**

Prompt requests a primary `Continue` action. Private expectation requires `Button` with primary/default primary semantics and exact visible label.

- [ ] **Step 5: Implement task 011 fixture**

Prompt requests primary `Continue` and secondary `Cancel` actions side-by-side with medium spacing. Private expectation requires `Row` plus two `Button` instances and validates horizontal relation and gap semantics.

- [ ] **Step 6: Implement task 016 fixture**

Prompt requests a visual login section with heading, email input, password-like input using the stable `Input` API with `secureTextEntry`, and primary submit action. Private expectation requires `Column`, `Heading`, two `Input`s, and `Button`; it must not require excluded `PasswordInput`.

- [ ] **Step 7: Implement task 020 fixture**

Prompt requests a warning panel with message and action. Private expectation requires `Alert` with warning semantics and action label/callback.

- [ ] **Step 8: Run fixture validation**

Run: `npm test -- tests/schema.test.ts`
Expected: PASS for all five fixtures.

- [ ] **Step 9: Commit Task 2**

```bash
git add benchmarks/agent-usage/tasks benchmarks/agent-usage/tests/schema.test.ts
git commit -m "test: add PLRNUI benchmark pilot fixtures"
```

---

### Task 3: Deterministic static evaluator and adoption flags

**Files:**
- Create: `benchmarks/agent-usage/src/static-evaluator.ts`
- Create: `benchmarks/agent-usage/tests/static-evaluator.test.ts`

**Interfaces:**
- Consumes: candidate source text and `TaskExpectation`.
- Produces: `evaluateStatic(source, expectation) -> StaticEvaluation` containing root-import validity, expected primitive usage, invalid/deep imports, raw-RN reinvention findings, source facts, and static points.

- [ ] **Step 1: Write failing root-import and invalid-import tests**

Cover valid root import; imports from `/src`, `/dist`, and component internals; nonexistent PLRNUI named import; unrelated package import that must not be mislabeled as a PLRNUI deep import.

- [ ] **Step 2: Write failing adoption/reinvention tests**

For task 011, assert `Row + Button` satisfies expected primitive usage. Assert raw `View` row plus raw `Pressable` actions is flagged `native_reimplementation`. Assert supporting RN APIs that do not replace an expected PLRNUI primitive are not automatically penalized.

- [ ] **Step 3: Run static tests and verify failure**

Run: `npm test -- tests/static-evaluator.test.ts`
Expected: FAIL because evaluator is absent.

- [ ] **Step 4: Implement AST-based static evaluation**

Use the TypeScript compiler API already available to the benchmark package. Do not use regex as the canonical import/JSX parser. Extract imports, JSX tag names, literal enum props when statically available, and obvious RN primitive replacements specified by each private expectation.

- [ ] **Step 5: Run static evaluator tests**

Run: `npm test -- tests/static-evaluator.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit Task 3**

```bash
git add benchmarks/agent-usage/src/static-evaluator.ts benchmarks/agent-usage/tests/static-evaluator.test.ts
git commit -m "feat: add PLRNUI static benchmark evaluator"
```

---

### Task 4: Render evaluator, geometry assertions, and canonical score

**Files:**
- Create: `benchmarks/agent-usage/playwright.config.ts`
- Create: `benchmarks/agent-usage/src/render-evaluator.ts`
- Create: `benchmarks/agent-usage/src/score.ts`
- Create: `benchmarks/agent-usage/tests/render-evaluator.test.ts`
- Create: `benchmarks/agent-usage/tests/score.test.ts`

**Interfaces:**
- Consumes: runnable workspace, task private expectations, `StaticEvaluation`.
- Produces: `evaluateRender(workspace, expectation) -> RenderEvaluation` and `scoreCandidate(staticEval, renderEval, compileResult) -> ScoreBreakdown` with total bounded `0..100`.

- [ ] **Step 1: Write failing render-failure tests**

Create one valid fixture and one component that throws during render. Assert compile and render are independent fields; runtime exception produces `render_failure` with captured console/page diagnostics rather than crashing the benchmark runner.

- [ ] **Step 2: Write failing geometry tests**

At viewport `390x844`, assert task 011 can distinguish horizontal from vertical action placement and can validate relative ordering plus a tolerant medium-gap range derived from the canonical reference geometry.

- [ ] **Step 3: Write failing score tests**

Assert exact 60-point deterministic allocation from the design spec; assert visual 40 points are computed from explicit expectation checks, not subjective labels; assert total is clamped `0..100`; assert screenshot/perceptual data is diagnostic-only in the pilot.

- [ ] **Step 4: Run render/score tests and verify failure**

Run: `npm test -- tests/render-evaluator.test.ts tests/score.test.ts`
Expected: FAIL.

- [ ] **Step 5: Implement Playwright render evaluator**

Launch Chromium through benchmark scripts, wait for an explicit benchmark-ready marker, collect console/page errors, capture candidate screenshot and expected DOM/layout measurements, and close browser/server reliably even on failure.

- [ ] **Step 6: Implement canonical score calculation**

Preserve the spec weighting: typecheck 20, no render crash 10, root import contract 10, valid statically inspectable API/props 10, appropriate PLRNUI primitives 10, deterministic visual checks 40. Record flags separately from the bounded total.

- [ ] **Step 7: Run evaluator tests**

Run: `npm test -- tests/render-evaluator.test.ts tests/score.test.ts`
Expected: PASS.

- [ ] **Step 8: Commit Task 4**

```bash
git add benchmarks/agent-usage/playwright.config.ts benchmarks/agent-usage/src benchmarks/agent-usage/tests
git commit -m "feat: add deterministic PLRNUI render scoring"
```

---

### Task 5: Sonnet A0 runner with exact telemetry and reset semantics

**Files:**
- Create: `benchmarks/agent-usage/src/claude-adapter.ts`
- Create: `benchmarks/agent-usage/src/run-task.ts`
- Create: `benchmarks/agent-usage/tests/run-task.test.ts`
- Modify: `benchmarks/agent-usage/package.json`
- Modify: `benchmarks/agent-usage/README.md`

**Interfaces:**
- Consumes: task ID, repetition, exact model CLI value, workspace lifecycle, evaluators.
- Produces: `runTask(options) -> Promise<RunResult>` and CLI script `npm run bench:task -- --task 001 --condition A0 --model <exact-model>`.

- [ ] **Step 1: Write failing reset/isolation runner tests**

Use a fake agent executable. Assert each repetition gets a different clean temp workspace; candidate changes from run N never appear in run N+1; only `prompt.txt` task content is passed as benchmark instruction; A0 injects no skill or private docs.

- [ ] **Step 2: Write failing telemetry tests**

Fake the agent JSON output. Assert result preserves the exact model string provided by the caller, command exit status, elapsed time, token/tool telemetry when present, candidate SHA-256, PLRNUI version and repository SHA, condition `A0`, repetition, and evaluator outputs.

- [ ] **Step 3: Run runner tests and verify failure**

Run: `npm test -- tests/run-task.test.ts`
Expected: FAIL because runner/adapter are absent.

- [ ] **Step 4: Implement Claude Code headless adapter**

Invoke the locally installed `claude` CLI in non-interactive print mode with structured JSON output, cwd set to the generated workspace, no session continuation, and the exact `--model` value supplied by the benchmark caller. The adapter must not hard-code a guessed Sonnet identifier; the run record stores the caller-supplied value verbatim.

- [ ] **Step 5: Implement one-task orchestration**

`runTask()` creates the workspace, runs the agent, hashes the resulting `Candidate.tsx`, typechecks it, evaluates static usage, runs Playwright evaluation, computes score, writes a timestamped local result, and cleans the workspace unless `--keep-workspace` is explicitly selected for debugging.

- [ ] **Step 6: Run runner tests**

Run: `npm test -- tests/run-task.test.ts`
Expected: PASS with fake-agent isolation and telemetry assertions.

- [ ] **Step 7: Add local operator instructions**

README must tell the operator to run `claude --help` or interactive `/model` to identify the exact installed Sonnet model value, then pass that exact value to `bench:task`. Do not claim an unverified `sonnet-5.5` identifier.

- [ ] **Step 8: Commit Task 5**

```bash
git add benchmarks/agent-usage
git commit -m "feat: add isolated Sonnet benchmark runner"
```

---

### Task 6: Pilot aggregation and first A0 baseline

**Files:**
- Create: `benchmarks/agent-usage/src/report.ts`
- Create: `benchmarks/agent-usage/tests/report.test.ts`
- Modify: `benchmarks/agent-usage/package.json`
- Modify: `benchmarks/agent-usage/README.md`
- Generated locally, not committed by default: `benchmarks/agent-usage/results/<run-id>/...`

**Interfaces:**
- Consumes: five `RunResult` records.
- Produces: `aggregateResults(results) -> PilotReport` and CLI `npm run bench:pilot -- --condition A0 --model <exact-model>`.

- [ ] **Step 1: Write failing report tests**

Given fixed synthetic results, assert exact calculation of `compile_rate`, `render_rate`, `task_success_rate`, `plrnui_adoption_rate`, `invalid_api_rate`, `native_reimplementation_rate`, mean, median, total elapsed time, token totals when present, and task-by-task score table.

- [ ] **Step 2: Run report tests and verify failure**

Run: `npm test -- tests/report.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement aggregation and pilot CLI**

Run tasks `001`, `006`, `011`, `016`, `020` once each for the requested condition/model. Refuse mixed model strings, mixed PLRNUI SHAs, or mixed conditions in one report.

- [ ] **Step 4: Run all automated benchmark tests**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Run benchmark package typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 6: Run root PLRNUI regression gates**

From repository root run: `npm run typecheck && npm test && npm run build && npm run api:snapshot:check`
Expected: PASS; benchmark infrastructure must not change public API/runtime behavior.

- [ ] **Step 7: Execute the first real A0 Sonnet pilot**

First resolve the exact local model identifier with the installed Claude Code CLI. Then run `npm run bench:pilot -- --condition A0 --model <exact-model>`. Expected: five independent result records plus one aggregate report; failures in individual candidates are benchmark outcomes, not runner crashes.

- [ ] **Step 8: Inspect A0 evidence before designing skill v0**

Confirm the report can answer: which tasks compile, which PLRNUI primitives Sonnet chose, where invalid/deep API use occurred, where RN primitives replaced PLRNUI, and each deterministic score breakdown. Freeze this A0 pilot as the comparison baseline before adding any skill/tool assistance.

- [ ] **Step 9: Commit Task 6 implementation**

```bash
git add benchmarks/agent-usage/src/report.ts benchmarks/agent-usage/tests/report.test.ts benchmarks/agent-usage/package.json benchmarks/agent-usage/README.md
git commit -m "feat: complete PLRNUI A0 benchmark pilot"
```

Do not commit generated result artifacts until their evidence format has been reviewed for secrets, machine-specific paths, and useful reproducibility metadata.

---

## Completion Gate

The pilot plan is complete only when:

- all benchmark unit/integration tests pass;
- root PLRNUI regression gates pass;
- a real five-task A0 Sonnet run completes without benchmark-runner failure;
- each candidate is isolated from reference/private fixtures;
- each result records exact model and PLRNUI identifiers;
- evaluator output is deterministic and explains every awarded point/flag;
- A0 evidence is frozen before any PLRNUI skill or tool is introduced.

After this gate, write a separate plan for `skill v0`, run A2 against the frozen pilot, then write a separate tool-layer plan for A3 only if the A2 evidence leaves measurable failure modes for tools to address.
