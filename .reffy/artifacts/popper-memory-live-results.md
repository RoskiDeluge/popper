# Cross-harness memory live trial: Paseo result delivery blocker

Status: historical initial run, **BLOCKED; zero passing rotations** at this point.
Paseo subsequently fixed result extraction; see
`popper-memory-result-delivery-rerun.md` for the verified fix and next blocker.
All required live checks subsequently passed; see `popper-memory-live-acceptance.md`.
Date: 2026-11-14, Pacific/Honolulu (2026-11-15 UTC).

The authorized live trial ran fresh Codex, Claude Code, and Popper sessions.
All three authenticated, invoked the shared Paseo actor through the shell client,
and accurately reported failed client receipts. The Codex write reached GitHub,
but Paseo's model loop could not reliably return the script result. Neither reader
received a verified briefing, and Claude correctly withheld its follow-up.
This is a failed diagnostic sequence, not a completed cross-harness rotation.

## Evidence and configuration

The durable, credential-free bundle is
`examples/cross-harness-memory/evidence/2026-11-14/receipts.json`. It preserves
the exact participant prompts/events, client receipts, original manager results,
duplicate response, host GitHub verification, and transport failure. Raw harness
JSONL and setup tooling remain locally in ignored
`.reffy/state/cross-harness-memory/`; readers could not access them.

- Actor: `popper-memory/popper-memory-c6f30422`.
- Repository: `paseo-ghengine-org/paseo-popper-memory-c6f30422-primary` (private).
- Working branch: `paseo/session-81fd0032`.
- Skill commit: `91905c6d80300d5407d6825ae946124bf19c50a8`.
- Paseo source/build checkout: `598111628db2440a727a308438c01c945e977728`.
  The deployed worker revision was not exposed in invocation results.
- Popper base: `0b5d2deb9`, with the uncommitted experiment implementation;
  image `popper-memory-trial:c6f30422`.
- Container: Node v24.22.3, Codex 0.167.1, Claude Code 2.1.322,
  GitHub CLI 2.23.0. Popper uses published Pi packages 0.57.1.
- Claude reported model `claude-sonnet-5-5`; Popper used `openai/gpt-4o`.
  Codex used its clean CLI default; the resolved model was not emitted in JSONL.
  Pin or capture that model on the acceptance rerun.
- Paseo's handoff reports `@cf/meta/llama-3.3-70b-instruct-fp8-fast` as its
  reference model. The actual model was not exposed in these receipts and remains
  to be independently confirmed before milestone closure.
- Mounted grants: `ghengine_read` and `ghengine_write`, alias `primary`.
  The exact committed record proves the script's GitHub write path executed.
- Effective hints: max_steps 6, notes off. Every live result independently
  reported `notes: "off"` and numeric `memory_size: 0`; each used three loop steps.
- Limits: client 75 seconds per subprocess; upstream reports 20 seconds per
  tool/sandbox and 60 seconds per managed invocation. No host deadline was hit.

## Isolation

Each participant ran in a new Docker container with a read-only root filesystem,
all capabilities dropped, `no-new-privileges`, and fresh tmpfs work/home/temp
directories. Only individual runtime credential files were mounted; no host
workspace, home, transcript, answer fixture, evidence directory, or Docker socket
was available. Credentials were prepared outside the repository and image context.
The image was built before the trial marker was supplied.

Codex used ephemeral mode with fresh auth-only home configuration. Claude used
safe mode, no setting sources, no MCP servers, and no session persistence. Popper
used a fresh auth-only agent directory, no session persistence, and explicit
read/bash/write tools. The exact startup commands are in the bundle.

Both reader prompts contain only the project and retrieval/follow-up procedure;
the verifier asserted that neither contains the expected marker. No prior answer
was transferred locally. Valid isolation does not turn failed recall into a pass.

## Rotation evidence

Project: `r1-c6f30422`. Marker: `quartz-7e59d128ab`.
The event content is `Calibration marker: quartz-7e59d128ab. Threshold = 17.`

| Participant | Request ID | Client duration | Session duration | Observation |
| --- | --- | --- | --- | --- |
| Codex writer | `r1-c6f30422:codex:a:a:attempt-1` | 21.624 s | 30.97 s | Failed receipt; exact record exists |
| Claude recall/follow-up | `r1-c6f30422:claude-code:b:q:attempt-1` | 9.476 s | 17.30 s | Failed briefing; no follow-up |
| Popper diagnostic reader | `r1-c6f30422:popper:c:q:attempt-1` | 9.482 s | 14.26 s | Failed briefing; no verified records |

All three manager invocations have status `succeeded` and envelope `ok: true`,
but their final skill JSON contains `error: "Invalid identity/version/kind"`.
Manager completion is distinct from semantic success. The client exits 1 for each;
the harness process itself exits 0 after truthfully reporting that failure.

Independent host GitHub inspection confirmed the exact event at
`journal/r1-c6f30422/codex/a/a.json`, commit
`756529695aa03312597c4cb6a8bcd35f6621c650`. Comparing that commit with the working
branch returned `identical`. The failed writer receipt retains this durable
evidence without relabeling the attempt successful.

| Required rotation | Result |
| --- | --- |
| Codex -> Claude Code -> Popper | FAILED diagnostic sequence; no verified recall or follow-up |
| Claude Code -> Popper -> Codex | NOT RUN; same shared runtime blocker |
| Popper -> Codex -> Claude Code | NOT RUN; same shared runtime blocker |

## Scope and failure checks

| Check | Result | Evidence |
| --- | --- | --- |
| Other-project isolation and original retrieval | NOT RUN | Briefing delivery blocked |
| Duplicate successful semantic request | NOT RUN | No verified successful request exists |
| Consumed semantically failed ID | PASS for this failure mode | Repeated Codex ID returns HTTP 409 `invocation_exists`; reconciliation exits 1 and remains failed with matching record |
| Manager status `failed` duplicate | NOT RUN | Observed failure was skill-level; manager status was `succeeded` |
| Reconciled new-attempt retry | NOT RUN | Deferred until result delivery is fixed; no blind retry |
| Controlled transport failure | PASS | Unreachable localhost endpoint; exit 1, outcome unknown, 73 ms; no automatic retry |
| Conflicting content | NOT RUN | Original record preserved; conflict scenario not exercised |

## Paseo handoff

The first tool observation in every invocation begins with
`{"generated_code":"async () => { ...` and the inlined memory script.
The second call fails `Invalid identity/version/kind`, then the model emits that
error as its final answer. The initial writer tool already committed the exact
valid event. These observations support a result-delivery failure rather than a
missing capability or invalid initial event.

Source inspection at the recorded Paseo revision identifies the mechanism:

1. `src/handlers/mcpEngine.ts` returns text serialized in the order
   `{generated_code, result, ghengine}` (around line 1039).
2. `src/agents/runtimeAgent.ts`, `dispatchMcpTool`/`extractExecutionText`, forwards
   that entire facade text (around lines 963 and 989).
3. The model working context receives only `observation.slice(0, 2000)`
   (line 920). The full inlined script is already longer than this budget, so the
   return value that follows it is cut off. The separate 300-character step
   observation is only a diagnostic excerpt, not a receipt.

Requested upstream correction: extract the structured execution **result** before
applying the model observation limit. Keep generated source in diagnostics rather
than ahead of the return value. Preserve actual tool errors and make oversized
results explicit instead of silently dropping them. A regression test should use
a script longer than 2,000 characters returning a short sentinel object, verify
that the model-facing observation includes that object, and cover error/truncation
handling. Merely increasing step count or shortening event content will not fix
the generated-source prefix.

After deployment, first run a short result-delivery smoke test. Reconcile the
failed writer before any attempt-2 diagnostic retry; never rewrite its receipt or
reuse its consumed request ID. Use new projects and markers for the three full
acceptance rotations, capture the actual models, and complete all pending checks.
Keep the test manager, actor, and repository intact until milestone closure.

No claim is made about hooks, enforcement, authenticated source identity, or
concurrent-write safety. The milestone remains open.
