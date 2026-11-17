# Tasks

## 1. Build the explicit experiment

- [x] 1.1 Verify installed Paseo invocation/log interfaces against the developer
  reply; document grants, model/step budget, and host session-isolation controls.
- [x] 1.2 Add `examples/cross-harness-memory/` with the schema, remote skill,
  safe immutable record paths, and project-scoped briefing rules.
- [x] 1.3 Implement the pipe client with validation/redaction, stable logical
  event IDs, per-attempt IDs, bounded calls, and inspectable receipts.
- [x] 1.4 Implement original-invocation and repository reconciliation for
  duplicates/timeouts; preserve failed and unknown outcomes without blind retries.
- [x] 1.5 Document explicit use from all three harnesses, setup, isolated fresh
  sessions, independent GitHub verification, and a README link.

## 2. Verify locally

- [x] 2.1 Add focused offline tests for invalid envelopes/paths, text stdin,
  request identity, duplicate-success/failure lookup, timeout uncertainty,
  and prevention of blind retries.
- [x] 2.2 Run focused tests and `npm run check` after implementation.
- [x] 2.3 Review skill/runbook coverage for project scope, conflicting logical
  events, redaction, and credential-free shared files.

## 3. Run live trials when requested

- [x] 3.1 Configure a fresh disposable actor/repository; verify read/write tools
  and record non-secret versions, configuration, and model/step budget.
- [x] 3.2 Complete Codex -> Claude Code -> Popper with isolated readers and
  independent marker, attribution, and follow-up verification.
- [x] 3.3 Complete Claude Code -> Popper -> Codex under the same controls.
- [x] 3.4 Complete Popper -> Codex -> Claude Code under the same controls.
- [x] 3.5 Verify second-project isolation, duplicate successful request,
  consumed failed ID, reconciled new-attempt retry, and transport failure.
- [x] 3.6 Write an indexed Reffy result artifact with the acceptance matrix,
  receipts, commit evidence, durations, failures, and limitations; run
  `reffy reindex` and `reffy validate`.

## 4. Close the milestone

- [x] 4.1 Run `reffy plan validate prove-cross-harness-memory` after final edits.
- [x] 4.2 Confirm all acceptance criteria have evidence before declaring completion;
  leave unmet checks open and distinguish implementation from proven behavior.

Acceptance status (2026-11-14 Honolulu): all three full rotations passed on
`popper-memory/popper-memory-v3-d35cb504`. Popper succeeded as writer,
recall/follow-up writer and final reader. One Claude writer required an explicit
attempt-2 recovery after reconciliation confirmed its first attempt failed before
writing; that failure remains preserved. No reader/follow-up required recovery.

Project isolation and original retrieval, duplicate success/failure reconciliation,
missing-parent repair/retry, conflict refusal and transport failure have passing
live evidence on the same actor. The strict client and memory script are unchanged;
the skill uses the recommended structured final output. Notes off and zero stored
notes were checked in every captured runtime envelope.

See `popper-memory-live-acceptance.md` and `acceptance-receipts.json` under the
example's dated evidence directory. Earlier blocked runs and their failed/unknown
receipts remain preserved. The older actor's optional remount hit a Worker
subrequest limit; the fresh actor avoided that setup issue. Both actors and
repositories remain available. Runtime model/worker are developer-reported;
participant models were explicitly pinned. This closes live acceptance, not a
claim of first-attempt reliability or a general memory service.
