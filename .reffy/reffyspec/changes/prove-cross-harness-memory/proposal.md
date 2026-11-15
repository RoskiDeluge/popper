# Prove shared memory across Codex, Claude Code, and Popper

## Why

A finding recorded in one harness should remain available when work moves to
another. The experiment needs to demonstrate that continuity through Paseo,
with independently inspectable GitHub records and isolated reader sessions.

## What Changes

- Add an experiment under `examples/cross-harness-memory/`: a remote agent skill,
  versioned event schema, small explicit pipe client, host instructions, and runbook.
- Use one disposable journal/briefing actor and its GitHub repository for
  project-scoped, attributed memory.
- Rotate Codex, Claude Code, and Popper through writer, fresh-session reader,
  follow-up writer, and final reader roles.
- Reconcile duplicate, failed, and ambiguous invocations without treating a
  `409` as proof of a successful journal write.
- Capture versions, receipts, commit evidence, scope checks, and measured outcomes
  in an indexed Reffy result artifact.

## Acceptance

All three harnesses must write a finding, recall another harness's finding in a
fresh isolated session, and contribute a follow-up recalled by a third harness.
Every claimed success must match a project-scoped GitHub record and commit.
A briefing for another project must exclude the original project's marker.
Duplicate, failure, retry, and transport checks must have recorded outcomes.
Failed or inconclusive trials prevent declaring the milestone complete.

## Out of Scope

Automatic hooks, automatic context injection, blocking guards, witness UI,
a new harness abstraction, and changes to paseo-core. Guard advice and enforcement
are separate follow-up experiments. This milestone does not establish authenticated
source identity, concurrent-write safety, or a general memory service.

## Impact

- New capability: `prove-cross-harness-memory`.
- Expected implementation: experiment files under `examples/cross-harness-memory/`,
  focused offline tests under `test/`, and a README link. Keep `src/` unchanged.
- Live execution requires configured Paseo/GitHub access and installed harnesses.
  Credentials remain outside distributable files. Live model trials run only
  when explicitly requested, following repository instructions.
- The existing `terminal-rig` spec remains the implementation boundary: ordinary
  shell calls and explicit Pi resources.

## Reffy References

- `paseo-capabilities-across-codex-claude-and-popper.md` - experiment scope,
  attribution, host boundaries, and isolation criteria.
- `pppr-terminal-testing-rig-pivot.md` - use Pi and shell tools without rebuilding
  a harness.
- Remote `paseo-core:popper_cross_harness_experiment_reply.md`, dated 2026-11-14,
  workspace `nuveris-v1` - input/action corrections, GitHub memory storage,
  invocation receipts, and deduplication limits. Retrieve with:
  `reffy remote cat .reffy/artifacts/popper_cross_harness_experiment_reply.md --workspace-id nuveris-v1 --project-id paseo-core`.
