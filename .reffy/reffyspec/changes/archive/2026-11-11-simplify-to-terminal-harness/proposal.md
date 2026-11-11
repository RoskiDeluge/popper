# Simplify pppr to a terminal testing rig

## Why

The project is now a minimal but representative testing rig for other agentic
tools. Harness design is not the experiment. Pi should supply the established
agent loop, tools, context, authentication, extension lifecycle, and sessions.

## What Changes

- Make a standalone terminal CLI the root application, using published Pi packages.
- Support interactive shell use, one-shot prompts, pipes, and Pi JSON events.
- Load tools under development through explicitly selected Pi extensions and skills.
- Use Pi's normal coding tools and session format without a custom IR or protocol.
- Remove inherited workspaces from installation, execution, and validation. Retain
  their source initially as historical reference; the user's follow-up cleanup
  decision removes the entire `packages/` tree.
- Keep prior planning records intact; this change supersedes their product direction.

## Supersedes

- `refactor-pppr-as-agentic-ir`
- `extract-pppr-package-boundary`
- `evict-ambient-io-from-pppr-core`

The IR, host-neutral protocol, and Paseo adapter requirements describe the former
product. They are not requirements on the terminal rig.

## Reffy References

- `pppr_minimal_harness.md` - small tool surface, observable sessions, and shell use.
- `pppr_pi_surface_audit.md` - inherited source is not the product boundary.

## Impact

The root no longer builds or releases a Pi monorepo. Existing IR source and
transcripts are not migrated to the rig; new sessions use Pi's format. Extensions
that require Pi's full-screen UI are outside the plain-terminal scope.

The native scaffold command was attempted but the pre-existing Reffy manifest
failed validation with 98 errors. This change is authored directly and validated
with `reffy plan validate simplify-to-terminal-harness`.
