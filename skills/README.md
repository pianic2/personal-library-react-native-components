# Texo skills

Agent skills for working with Texo and for maintaining this repository. Each skill is a folder `skills/<name>/SKILL.md`
that the open [`skills`](https://skills.sh) CLI can install into Claude Code (`.claude/skills`) and into Codex, Cursor and
other agents (`.agents/skills`).

## Install

```sh
# list what the repository offers
npx skills add pianic2/personal-library-react-native-components --list

# install everything, or choose skills (-s) and agents (-a)
npx skills add pianic2/personal-library-react-native-components
npx skills add pianic2/personal-library-react-native-components -s texo-execute -a claude-code -a codex

# real copies instead of symlinks (recommended in CI and containers)
npx skills add pianic2/personal-library-react-native-components --copy

# pick up new versions later
npx skills update
```

Review a skill before installing it: skills run with the permissions of your agent.

## Layout and rules

```
skills/<name>/
  SKILL.md          # frontmatter + instructions, at most 500 lines
  references/       # supporting files, one level deep, no nested folders
  scripts/          # optional helper scripts
```

`SKILL.md` frontmatter:

| Field              | Rule                                                           |
| ------------------ | -------------------------------------------------------------- |
| `name`             | equals the folder name; lowercase letters, digits, hyphens; at most 64 characters |
| `description`      | what the skill does and when to use it; at most 1024 characters |
| `license`          | required for skills published to consumers                     |
| `metadata.version` | required for skills published to consumers                     |

Relative links must resolve inside the skill folder, and nothing under a skill may be a symlink. The maintainer
workflow skills `texo-execute` and `texo-review` predate the `license` / `metadata.version` rule and are the only
exemptions (`METADATA_EXEMPT` in the validator).

## Validate

```sh
node scripts/ai/validate-skills.mjs                  # exit 0 when the pack is valid, 1 with one line per problem
node --import tsx --test tests/scripts/validate-skills.test.ts
node scripts/ai/skills-install-smoke.mjs             # installs into a temp project (needs npm registry access)
```

The smoke script pins `skills@1.7.2`, so a CLI release cannot change the result silently. A listing on skills.sh appears
after real installs; there is no publish step.
