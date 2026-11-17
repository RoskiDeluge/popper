# Cross-harness memory: live acceptance passed

Status: **PASS — all required milestone checks have evidence.**
Date: 2026-11-14 Pacific/Honolulu (2026-11-15 UTC).

Codex, Claude Code and Popper each wrote a finding, recalled another harness's
finding in a fresh isolated session, contributed a linked follow-up, and served
as a fresh final reader. All three full rotations completed. Rotation 2 required one explicit Claude
writer retry after a confirmed pre-write rejection; its original failure remains
preserved. No reader or follow-up needed recovery. Independent GitHub inspection confirmed exact
markers, attribution, evidence references, parent links, paths, pinned indices
and commit ancestry. Earlier failed/unknown diagnostics remain preserved and
are not counted as passes.

## Configuration

- Actor: `popper-memory/popper-memory-v3-d35cb504`.
- Repository: `paseo-ghengine-org/paseo-popper-memory-v3-d35cb504-primary` (private).
- Working branch: `paseo/session-a403564d`.
- Skill commit: `08ec435cd3162e39870d1646dc2589f4364a921b`; the recommended object-output
  instruction is mounted. The script and strict client verification are unchanged.
- Paseo handoff `popper_final_answer_budget_fix.md`, project `paseo-core`, workspace
  `nuveris-v1`, reports commit `4cea511`, worker
  `4ac495aa-103c-4ebb-ae48-e4fcbd933f98`, and reference model
  `@cf/meta/llama-3.3-70b-instruct-fp8-fast`. Worker/model are developer-reported,
  not fields exposed in the receipts. Inspected source revision:
  `0346a00b0e04c6a446a022a163ffade3bf1563a2`.
- Generation budget: 2,048 tokens; mounted max_steps 6, notes off. All captured
  runtime envelopes confirm notes off and numeric memory_size zero.
- Container: Node v24.22.3, Codex 0.167.1, Claude Code 2.1.322,
  GitHub CLI 2.23.0, published Pi packages 0.57.1; image
  `popper-memory-trial:c6f30422` built from clean runtime files before the markers.
- Participant models: Codex `gpt-6.1-sol`, Claude `claude-sonnet-5-5`,
  Popper `openai/gpt-4o`, each explicitly selected.
- Grants: ghengine_read and ghengine_write, alias primary. Client deadline:
  75 seconds per subprocess; managed invocation/tool bounds reported as 60/20 s.
- Popper base `0b5d2deb9` with the uncommitted experiment implementation.

## Isolation and reproducible evidence

Each participant used a new read-only Docker container with all capabilities
dropped, no-new-privileges, and new tmpfs work/home/temp directories. Only minimal
runtime credential files were mounted. No host workspace/home, writer fixture,
prior transcript, verifier evidence or Docker socket was mounted. Reader
environments also excluded every prior receipt. The recovery writer alone was
given its own failed receipt inline for explicit reconciliation. The verifier generated and held the expected markers. Every reader prompt was
checked to exclude all expected markers and prior answers.

Codex used ephemeral mode with fresh auth-only configuration; Claude used safe
mode, no setting sources/MCP servers and no session persistence; Popper used a
fresh auth-only agent directory, no session persistence and explicit read/bash/write
tools. This is explicit shell integration, with no hook or adapter installed.

The credential-free bundle is
`examples/cross-harness-memory/evidence/2026-11-14/acceptance-receipts.json`.
It includes exact prompts/events, client receipts, original runtime results,
scope/failure proofs and independent GitHub comparisons. The startup procedure and CLI flags are recorded in this bundle; the same
isolated runner used in the prior rerun was pointed at the fresh actor. Raw JSONL stays in ignored local state. Secrets
were excluded from the repo, artifacts, build context and image.

## Full rotations

| Rotation | Project | Writer → recall/follow-up → final reader | Fresh-session durations A / B / C | Result |
| --- | --- | --- | --- | --- |
| 1 | `v3r1-a0264d9d` | codex → claude-code → popper | 21.92 s / 37.0 s / 20.49 s | PASS |
| 2 | `v3r2-2b68ce00` | claude-code → popper → codex | 22.54 s / 32.56 s / 23.2 s | PASS |
| 3 | `v3r3-700c2265` | popper → codex → claude-code | 16.33 s / 37.82 s / 23.94 s | PASS |

The second participant recalled exactly one finding and authored content equal
to that finding plus ` Confirmed.` with the original event as parent. The third
participant recalled exactly both records, including their source fields and
parent linkage. Each invocation had a new receipt and request ID. Rotation 2
used a fresh Claude writer for an explicitly authorized attempt 2 after
reconciliation confirmed attempt 1 had failed without a record. Its failed
request `v3r2-2b68ce00:claude-code:a:a:attempt-1` and original 13.68-second
session remain preserved under `v3-r2-a-attempt1` in the bundle. The writer
received only its own finding and failed receipt; the later readers received
neither. Table A reports the successful recovery session, excluding that prior
failed session. This demonstrates eventual completion with deliberate recovery,
not first-attempt reliability.

### Rotation 1: `v3r1-a0264d9d`

Finding: `Calibration marker: ecfed289f643475d. Threshold = 17.`

- `journal/v3r1-a0264d9d/claude-code/b/b.json` at `ffe64c7c9192e2c1ead79a7387b3719d4a3ba58c`; exact content and branch ancestry verified.
- `journal/v3r1-a0264d9d/codex/a/a.json` at `ffe64c7c9192e2c1ead79a7387b3719d4a3ba58c`; exact content and branch ancestry verified.

Pinned index snapshot: `ffe64c7c9192e2c1ead79a7387b3719d4a3ba58c`; exactly two records.

Request IDs:

- `v3r1-a0264d9d:codex:a:a:attempt-1` — verified, 13.507 s client duration.
- `v3r1-a0264d9d:claude-code:b:b:attempt-1` — verified, 13.510 s client duration.
- `v3r1-a0264d9d:claude-code:b:q:attempt-1` — verified, 12.014 s client duration.
- `v3r1-a0264d9d:popper:c:q:attempt-1` — verified, 15.930 s client duration.

### Rotation 2: `v3r2-2b68ce00`

Finding: `Calibration marker: cead0946677c4737. Threshold = 18.`

- `journal/v3r2-2b68ce00/claude-code/a/a.json` at `fba5daf39d6646a128585dada73a470adcc94878`; exact content and branch ancestry verified.
- `journal/v3r2-2b68ce00/popper/b/b.json` at `fba5daf39d6646a128585dada73a470adcc94878`; exact content and branch ancestry verified.

Pinned index snapshot: `fba5daf39d6646a128585dada73a470adcc94878`; exactly two records.

Request IDs:

- `v3r2-2b68ce00:claude-code:a:a:attempt-2` — verified, 11.462 s client duration.
- `v3r2-2b68ce00:popper:b:b:attempt-1` — verified, 13.109 s client duration.
- `v3r2-2b68ce00:popper:b:q:attempt-1` — verified, 10.174 s client duration.
- `v3r2-2b68ce00:codex:c:q:attempt-1` — verified, 13.928 s client duration.

### Rotation 3: `v3r3-700c2265`

Finding: `Calibration marker: 4b75936a6ccd434c. Threshold = 19.`

- `journal/v3r3-700c2265/codex/b/b.json` at `176400fa1dba4435d6b4871a5544f800e577ef1d`; exact content and branch ancestry verified.
- `journal/v3r3-700c2265/popper/a/a.json` at `176400fa1dba4435d6b4871a5544f800e577ef1d`; exact content and branch ancestry verified.

Pinned index snapshot: `176400fa1dba4435d6b4871a5544f800e577ef1d`; exactly two records.

Request IDs:

- `v3r3-700c2265:popper:a:a:attempt-1` — verified, 11.830 s client duration.
- `v3r3-700c2265:codex:b:b:attempt-1` — verified, 13.137 s client duration.
- `v3r3-700c2265:codex:b:q:attempt-1` — verified, 11.458 s client duration.
- `v3r3-700c2265:claude-code:c:q:attempt-1` — verified, 15.304 s client duration.


## Scope and failure acceptance

| Check | Result | Evidence |
| --- | --- | --- |
| Other-project isolation | PASS | Verified empty briefing for `empty-5467893d`; none of the three rotation markers or source refs returned |
| Original still retrievable | PASS | Re-query returned the first rotation's exact two records with a verified pinned index |
| Duplicate successful ID | PASS | HTTP 409; original invocation unchanged, reconciliation verified, branch head unchanged |
| Consumed failed ID | PASS | Missing-parent journal failed with no child record; duplicate 409 and reconciliation retained failure |
| Reconciled new-attempt retry | PASS | Added parent, rechecked the same failed event, used attempt 2, verified exactly one child and parent link |
| Conflicting event content | PASS | `Conflicting logical event`; original record and branch head unchanged |
| Controlled transport failure | PASS | Unreachable endpoint; outcome unknown, exit 1, 331 ms; no automatic retry |

The repaired fixture index is pinned at `e32b46a93fa2d0538e88969e030f204d4ff71dc9` and contains
exactly its parent and child. Detailed trace IDs and process exit statuses are
in the bundle. These are skill-level failures with manager status `succeeded`;
actual manager-status-failed behavior was not separately exercised live.
Failures here are expected test inputs with independently verified
outcomes, distinct from an unverified or failed required rotation.

## Preserved diagnostics and limits

Before acceptance, a fresh Popper smoke on the original actor successfully
recalled both old records after the budget fix. The optional skill update on that
older actor returned HTTP 502 `Too many subrequests by single Worker invocation`.
That deployment-path issue was bypassed by creating the fresh actor above, whose
mounted commit and initial empty invocation state were captured before the trials.
No skill was remounted during the passing rotations. Both actors/repositories
remain intact; manager teardown belongs to Paseo and repo deletion is manual.

`popper-memory-live-results.md` and `popper-memory-result-delivery-rerun.md`
preserve the generated-source, output-budget and malformed-JSON failures and
their original evidence. Their unknown receipts were not overwritten or retried
blindly. The final acceptance used new projects and markers.

This proves the specified small, sequential explicit-invocation experiment.
It does not establish automatic hooks, blocking enforcement, authenticated
harness identity, concurrent-write safety, arbitrary-size memory, or a general
reliability rate. Skill source labels are correlation data, not authentication.
The old-actor remount issue was outside the required recall path and was later
verified resolved; see `popper-memory-remount-verified.md`. The original 502
above remains part of the acceptance setup history.
