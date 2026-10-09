# E13 - AI-native layer (skills, manifests, llms.txt, CLI/MCP)

Scope: research + architecture. Tickets: `audit/texo-v1/tickets/E13.json` (34 tickets). Date: 2026-10-09.
Source reliability note: agentskills.io, shadcn docs, llmstxt.org and agents.md were unreachable from the sandbox (DNS). Findings below come from the vercel-labs/skills README (fetched), a mirror of the Agent Skills spec (fetched via GitHub raw), and search summaries of third-party pages. Items marked (unverified) must be re-checked against primary docs before implementation.

## 1. Repo state (what exists)
- `src/index.ts`: 100 lines, ~37 component value exports, 25+ `*Props` type exports. Modal, Select, BottomSheet, Popover, Tooltip export no Props type -> the extractor must degrade for these (E1 should fix).
- Types are plain TS interfaces in the `.tsx` files (`src/components/Button/Button.tsx`: `ButtonProps`, defaults in destructuring, literal unions). Almost no JSDoc -> descriptions must come from hand-written meta sidecars, not types.
- Tokens: `src/tokens/*.base.ts`, `ThemeTokens` in `src/tokens/themeTokens.ts`, `createThemeTokens/defaultThemeTokens`; component tokens in `theme.components.*`.
- Docs: Italian, hand-written `docs/components/**/*.md` duplicating prop types (drift risk). MkDocs site.
- Existing generator-and-gate precedent: `scripts/public-api-snapshot.mjs` (regex over index.ts; names only) + `api:snapshot:check`. Same pattern should be used for `ai:check`.
- No AGENTS.md, CLAUDE.md, llms.txt, skills/ or .claude/ today. `package.json` `files` ships only dist/README/LICENSE (consumers' agents cannot see metadata until fixed - E13-01).

## 2. Ecosystem findings
**Agent Skills (SKILL.md) open standard** (spec mirror; agentskills.io unreachable)
- Skill = directory with `SKILL.md` (YAML frontmatter + Markdown), optional `scripts/`, `references/`, `assets/`.
- Frontmatter: `name` (required, 1-64, lowercase/digits/hyphens, no leading/trailing/double hyphen, must equal directory name); `description` (required, <=1024, say what + when, keywords); optional `license`, `compatibility` (<=500), `metadata` (string map), `allowed-tools` (experimental, space-separated).
- Progressive disclosure, 3 stages: metadata (~100 tokens, always loaded) -> SKILL.md body (<~5k tokens, <500 lines) on activation -> files in scripts/references/assets on demand; references one level deep.
- Sources: https://raw.githubusercontent.com/agentskills/agentskills/main/docs/specification.mdx ; https://learn.microsoft.com/agent-framework/agents/skills

**Vercel skills CLI / skills.sh** (fetched https://github.com/vercel-labs/skills)
- `npx skills add <owner/repo | git URL | local path | tarball/SKILL.md URL>`; flags `-g`, `-a <agents>`, `-s <skills>`, `-l/--list`, `--copy` (default symlink to one canonical copy), `-y`, `--all`. Also `find`, `check`, `update`.
- Project install paths: Claude Code `.claude/skills/`; Codex and Cursor `.agents/skills/` (global: `~/.claude/skills`, `~/.agents/skills`, `~/.cursor/skills`); ~75 other agents.
- Discovery order: repo root `SKILL.md`, then `skills/`, `skills/.curated|.experimental|.system`, agent folders (`.claude/skills`), up to 3 levels; also `.claude-plugin/marketplace.json`/`plugin.json`. A shallower SKILL.md hides nested ones (so: no root SKILL.md; use `skills/<name>/`).
- skills.sh is a leaderboard fed by install telemetry: there is no publish step; a repo is "published" once it is a public git repo with valid skills (https://skills.sh, search summary). Implication: installability = valid layout + public repo; ranking comes from usage.

**AGENTS.md** (agents.md unreachable; third-party summaries, unverified in detail)
- Plain Markdown at repo root, nested files allowed (nearest wins in the spec). Read by Codex, Cursor, Copilot, others; Claude Code reads CLAUDE.md, with `@AGENTS.md` import as the common bridge. Codex has a ~32 KiB combined budget. Recommendation: AGENTS.md primary, CLAUDE.md = one-line import. Sources: https://getunblocked.com/blog/claude-md-vs-agents-md-vs-cursor-rules/ ; https://www.augmentcode.com/guides/agents-md-vs-claude-md
- Library-shipped AGENTS content cannot auto-load in consumer apps: ship a copyable snippet (E13-17) and skills, which do load.

**llms.txt / llms-full.txt** (llmstxt.org unreachable; summaries)
- Markdown at site root: H1, blockquote summary, H2 sections of links, `## Optional` for skippable. `llms-full.txt` inlines content. Proposed Sept 2024 by Jeremy Howard. No major model provider confirms consuming it; tooling/agents increasingly do. Verdict: cheap to generate from the same cards, secondary channel. Source: https://www.greengeeks.com/blog/what-is-llms-txt-does-it-work-and-how-to-add-one-to-your-site/

**shadcn registry + MCP** (summaries; ui.shadcn.com unreachable)
- `registry.json` {`$schema`, `name`, `homepage`, `items`}; items per registry-item schema: `name`, `type` (registry:component/block/lib/hook...), `title`, `description`, `files[{path,type,content}]`, `dependencies`, `cssVars`. Registries declared in consumer `components.json` as namespace -> URL template. The shadcn MCP (`shadcn mcp init --client claude`) lets agents browse/search/install registry items; a registry-only MCP exposes init/get_items/get_item/add_item. Sources: https://ui.shadcn.com/docs/registry/registry-json , https://ui.shadcn.com/docs/mcp , https://marmelab.com/blog/2025/08/19/shadcn-admin-kit-mcp.html
- Model fit: shadcn copies source into the app, so MCP/CLI `add` is essential there. This library is imported from npm, so the "add" half has little value; the "discover/search" half is better served by a tier-0 index in a skill. Registry JSON is only useful for recipes/templates (copyable code) -> E13-12.

## 3. Recommended architecture
**Principle:** generate everything derivable from code (props, tokens, index, cards, llms, registry); hand-write only judgement (meta sidecars, recipes, templates, skills prose). A CI gate (`ai:check`) fails on drift, as `api:snapshot:check` does.

Layout (all disjoint ownership):
```
ai/README.md                  hand  (contract)
ai/schema/*.json              hand  (props, tokens, meta, presets)
ai/meta/<Component>.meta.json hand  (whenToUse/whenNotToUse{instead}/composition/a11y)
ai/examples/<Name>.tsx        hand, compile-checked (<=25 lines)
ai/recipes/ ai/templates/     hand, compile-checked
ai/manifests/props.json tokens.json presets.json index.json index.txt   GENERATED
ai/cards/<Name>.md            GENERATED (props + meta + example)
ai/registry/                  GENERATED (shadcn-style, recipes/templates only)
llms.txt llms-full.txt        GENERATED
skills/<name>/SKILL.md        hand; references/ copies of index/tokens summary GENERATED at build
AGENTS.md CLAUDE.md           hand; ai/AGENTS.consumer.md snippet for apps
scripts/ai/*  evals/ai/*      tooling
```
**Token-budget tiers:** T0 `index.txt` <=6000 chars (~1.5k tokens, one line per component: name - summary [category,status]); T1 per-component card <=700 tokens (import, props table, when/not, one example); T2 full docs/llms-full/recipes/templates on demand. Skills carry T0 in `references/`, SKILL.md bodies <=200 lines pointing to T1 paths; agents read T0, then only the cards they need. Budgets are test-enforced.

**Props manifest:** TS compiler API (`typescript` Program from `src/index.ts`) rather than the regex used by public-api-snapshot or react-docgen-typescript; it resolves unions/defaults/aliases and is already a devDependency. Formats: JSON with JSON Schema, sorted keys, schemaVersion, package version. Token manifest: dot-paths resolvable on `useTheme().theme`, light/dark values, kind.

**Skills layout:** one skill per concern, small and trigger-specific (selection, screen-generation, design-system, forms, navigation, accessibility, responsive, motion), under `skills/` so `npx skills add` finds them (no root SKILL.md - it would hide nested ones). No symlinks across skills (copy build artifacts) for `--copy` installs. Publishing = public repo + `npx skills add pianic2/<repo>`; consider a `.claude-plugin/marketplace.json` later (open decision D4). Skill names are `texo-*` (new brand, not the old package name) so the cutover does not rename them; content references import path via a single templated variable in the build so only one generator line changes at E15.

**CLI vs MCP - judgement:**
- Real leverage is in shipped files (manifests + skills + AGENTS snippet): offline, zero process, work in every agent. 
- CLI `add` has no job (npm import model). `info`/`doctor` have modest value (human DX, peer-version checks) -> optional, low priority (E13-32).
- MCP: marginal; costs a process, install config and tool-definition tokens each session, and returns what a 700-token card file read already gives. Justify only if evals (E13-31) show agents failing to find/read files or enterprise requests it. Default recommendation: do not build; keep E13-33 gated on D3.
- Do ship shadcn-compatible registry JSON (E13-12) for recipes/templates: cheap, and makes the library consumable by shadcn-style tooling/MCP without us owning a server.

**Proof of value:** eval harness (E13-30/31): same 20 tasks, arms baseline vs +index vs +skills, N>=5 runs, deterministic graders (tsc compile, AST component usage, banned hex/raw Pressable, prop validity vs props.json, context tokens). Skills ship only if uplift is reported.

**Cutover compatibility:** manifests include `package` and `importPath` fields from one config; old package becomes a re-export shim, so manifests/skills regenerate from the single codebase (E15 changes one value). No file here encodes the package name by hand except generated outputs.

## 4. Dependencies on other streams
E1 (export Props types, JSDoc), E2 (preset registry for E13-16, token shape), E3 (motion primitives for E13-29), E4-E7 (new components extend meta/examples; meta lint --strict then forces coverage), E11 (templates source), E14 (package.json/files, exports), E17 (release-guard, prepack).

## 5. Open decisions
- D1 Language of cards/skills: English (recommended) vs Italian docs parity.
- D2 Ship `info`/`doctor` CLI at all? (recommend defer to post-1.0).
- D3 Build MCP? (recommend no unless evals show need).
- D4 Also publish a Claude Code plugin marketplace manifest in addition to skills.sh layout?
- D5 Manifest location in tarball: `ai/` at package root vs `dist/ai` and a documented export (`./ai/*`); affects exports map (E14).
- D6 Meta authoring model: JSON sidecars (chosen) vs JSDoc tags in source (needs E1 coordination; better colocation, harder to lint).
- D7 Eval budget and acceptance margin for skills uplift; which agent/model is the reference.
- D8 Verify unreachable primary sources (agentskills.io, agents.md, llmstxt.org, shadcn docs) before E13-01/12/17/21 start.
