# Active application

pppr is a minimal terminal testing rig for other agentic tools. The application
is `src/`, with examples in `examples/` and focused tests in `test/`. Published
Pi packages own the agent loop, tools, prompt/context, extensions, and sessions.
Do not add another harness abstraction when a Pi extension or shell command fits.

The legacy `packages/` tree has been deleted. Git history preserves the previous
incarnation. Read the root README for current usage and
`.reffy/artifacts/pppr-terminal-testing-rig-pivot.md` for the pivot's rationale.
Legacy root Pi scripts are not application entrypoints.

## Development

- Use npm, Node.js 22+, and strict TypeScript with top-level ESM imports.
- Check installed dependency types rather than guessing APIs; avoid `any`.
- Run `npm run check` after code changes.
- Run focused tests with `node node_modules/vitest/vitest.mjs run test/rig.test.ts`.
- Do not run live model tests unless the user requests them.
- Keep entries in the root `CHANGELOG.md` under `[Unreleased]`.
- Read files in full before editing and preserve unrelated user changes.
- Do not commit or push unless asked; do not stage files with `git add .` or `git add -A`.

The Reffy/ReffySpec instructions below apply to planning.

<!-- REFFY:START -->
# Reffy Instructions

These instructions are for AI assistants working in this project.

Always open `@/.reffy/AGENTS.md` when the request:
- Mentions early-stage ideation, exploration, brainstorming, or raw notes
- Needs context before drafting specs or proposals
- Refers to "reffy", "references", "explore", or "context layer"
- Involves a remote workspace, remote synchronization, shared-reference publication, or Paseo

Use `@/.reffy/AGENTS.md` to learn:
- Reffy workflow for ideation, artifact indexing, and planning scaffolds
- How Reffy owns the runtime while preserving ReffySpec planning files
- How to store and consume ideation context in `.reffy/`

Before performing any Reffy workflow:

1. Inspect `.reffy/skills/` (or run `reffy skill list`) to enumerate available skills.
2. Match the request against each skill's `description`; optional triggers are supplementary.
3. Read the selected `SKILL.md` completely.
4. Follow that skill before running Reffy commands.

Use `reffy skill list --output json` for programmatic discovery. Resolve supporting file references relative to the selected skill directory.

For remote workspace, remote sync, shared-reference publication, or Paseo requests, read `@/.reffy/skills/sync-remote/SKILL.md` first. Loading these instructions does not authorize a remote push or other mutation; execute remote commands only when the request calls for them.

Keep this managed block so `reffy init` can refresh the instructions.

<!-- REFFY:END -->

<!-- REFFYSPEC:START -->
# ReffySpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/.reffy/reffyspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Needs the authoritative planning/spec workflow for this repo

Use `@/.reffy/reffyspec/AGENTS.md` to learn:
- How to create and apply ReffySpec change proposals
- ReffySpec format and conventions
- Project structure and planning guidelines

Keep this managed block so `reffy init` can refresh the instructions.

<!-- REFFYSPEC:END -->
