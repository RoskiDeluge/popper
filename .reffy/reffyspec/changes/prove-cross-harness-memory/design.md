# Design

## Boundary and execution path

Use one experiment directory with a remote skill and a small explicit shell
client shared by Codex, Claude Code, and Popper. Host instructions describe
invocation and session isolation. Popper uses its existing CLI and Pi resources;
no new host runtime or modifications to `src/` are needed.

The Paseo reply reports that only `run` executes and requires text input. Other
actions merely record/echo payloads; raw event JSON with `--json-input` lacks the
required `input`. Verify these planning inputs against installed versions during
preflight. Invoke the configured actor using plain text stdin:

```sh
paseo pipe lab/harness-memory --request-id '<harness>:<session>:<event>:attempt-1'
```

The address is configurable. Event meaning belongs inside the envelope's `kind`,
not a custom action. Do not use `--json-input`.

## Envelope and memory

Define schema version 1 with `kind` (`journal` or `briefing`), `project`, `harness`,
`session_id`, and `event_id`. Journal events also require `content` and
`evidence_refs`; briefings carry a project-scoped query instead of journal content.
Follow-ups identify their parent event and retain their own attribution.
Validate types and safe path components locally before sending. Harness/session
labels provide correlation, not authenticated identity.

The remote skill uses `gh.commit` for records at
`journal/<project>/<harness>/<session_id>/<event_id>.json`. Each record preserves
its identity fields, content, and evidence references. Logical records are immutable:
a sequential repeat with identical content resolves to the existing record;
conflicting content fails without overwriting it. Atomic concurrent deduplication
is outside scope; trials are sequential.

Briefings use `gh.tree` and `gh.read` within the requested project and return
findings with source fields, record paths, evidence references, and inspectable
commit revisions. Do not use built-in `save_note`: the reply describes it as
unscoped and injected into every prompt. Start with a fresh disposable actor to
exclude pre-existing notes. Confirm the grant exposes both read and write tools.

## Delivery and retries

Keep logical event identity stable across attempts. Derive a request ID from
harness, session, event, and attempt; each deliberate new attempt uses a new ID.
Retain local receipts with logical event, request/trace ID, attempt, duration,
outcome, and available record/commit references. Distinguish invocation completion
from a verified durable journal write.

A `409 invocation_exists` proves an ID was consumed. Query the original invocation
by trace ID and inspect repository evidence before reporting journal success.
A failed original remains failed. Missing or inaccessible evidence remains unknown.
After a timeout, reconcile logs and GitHub before any retry. Never retry blindly.
A new attempt must discover an existing identical record rather than create a
second logical entry. Use bounded calls, nonzero exits for failure/uncertainty,
and explicit operator retries after reconciliation. Background queues are out of scope.

Redact locally before transmission and use synthetic findings: manager history
also retains full input/result payloads according to the reply. Keep credentials
in existing environment/configuration, outside shared files and result artifacts.

## Live protocol

1. Record installed CLI/harness versions, model and step configuration, actor,
   repo alias, and grants. Verify log/result parsing and each host's fresh-session
   controls. Confirm `gh.commit`, `gh.tree`, and `gh.read` availability.
2. Configure one disposable actor and test repository with the shared skill.
3. Run three rotations: Codex -> Claude Code -> Popper;
   Claude Code -> Popper -> Codex; Popper -> Codex -> Claude Code.
4. A journals a new unique marker, then ends its session. B starts fresh in an
   isolated directory without A's transcript, marker-bearing fixture, receipt,
   or experiment evidence. Give B project/retrieval instructions without the
   marker or A's answer. B retrieves the finding and journals a linked follow-up.
5. A similarly isolated fresh C session retrieves both entries. An independent
   verifier compares exact markers and attribution against GitHub records and
   commits. Keep evidence outside reader directories until retrieval completes.
6. Query a second fixture project on the same actor and verify that the original
   marker and references do not appear.
7. Exercise a repeated successful request ID, a failed attempt followed by the
   same ID, a reconciled new-attempt retry, and a controlled transport failure.
   Record receipts, logs, and repository outcomes for each.

If fresh-session isolation cannot be established, classify that trial as
inconclusive. Preserve separate harness session storage. Measure transport and
end-to-end durations without promising a latency target.

## Verification and evidence

Use focused offline tests with a fake Paseo executable/transport for envelope and
path validation, text stdin, request IDs, bounded failures, duplicate lookup, and
receipt outcomes. Live trials verify model-driven record handling and actual
cross-session recall; offline tests cannot establish those claims.

An indexed result artifact records configuration, rotation matrix, isolation
method, invocation IDs, commit/record references, exact-marker checks, scope checks,
failure outcomes, durations, and limitations. Report implementation readiness
separately from milestone completion until every acceptance criterion passes.

## Setup facts to resolve

The disposable workspace/repo, installed output schema, actual read-tool exposure,
and host-specific isolation procedures are preflight work. They do not change
this milestone's boundary. Guard advice, automatic hooks, and enforcement remain
later experiments.

## Implementation decisions and upstream dependency

Paseo's `add-skill-declared-loop-hints` proposal identifies a real dependency for
live acceptance: a fresh actor alone cannot guarantee that built-in notes remain
unused. The remote skill declares `dev.paseo.notes: "off"` and
`dev.paseo.max-steps: "6"`; the client requires `data.loop.notes: "off"` and
numeric `memory_size: 0` in each successful result and retains those fields in
verified receipts. Paseo's remote `popper_loop_hints_live.md` handoff, dated
2026-11-15, reports deployment of the hints, script capability binding, and
20-second tool/sandbox and 60-second invocation bounds. The client defaults to
75 seconds per subprocess. Preflight must still confirm the selected manager
and effective mounted hints. The upstream smoke trial is not our acceptance run.

The skill lives in `examples/cross-harness-memory/harness-memory/` so its folder
name matches its SKILL.md name as the Paseo CLI requires. One script performs the
procedure within the model loop's step budget. GitHub operations themselves remain
subject to the runtime's MCP timeout; only live trials can establish their timing.

Each fixture project holds at most three short records. An index at
`journal/<project>/index.json` is committed atomically with each new event;
briefings read a pinned working-branch snapshot and return all indexed records.
The client verifies index completeness even for an empty briefing and checks each
record's exact content and commit ancestry through the independent GitHub CLI.
Results are kept within 1800 characters to limit model working-context pressure.
The first deployment included generated program text ahead of the return value;
Paseo's subsequent result-delivery fix extracts the actual result first. A size
cap alone still does not guarantee enough model generation tokens. Only final
`data.response` claims verified against GitHub count; truncated loop-step observations
are not receipts. Use separate projects per rotation and sequential calls.

The client reserves a private receipt before invocation, supports explicit
reconciliation, and requires the preceding attempt's receipt before a new attempt.
It rechecks failure and repository state rather than trusting a cached outcome.
Source validation and offline execution do not establish deployed grants, model
reliability, actual session isolation, or the live milestone's acceptance criteria.

## Initial live finding: result delivery blocked acceptance

The 2026-11-14 Honolulu diagnostic exercised all three harnesses in fresh
containers. Authentication and the GitHub write path worked, but every final
skill response was an error. The runtime forwards the execution facade's JSON
with generated source before its result, then truncates model observations at
2,000 characters. Our inlined script exceeds that prefix budget, hiding its
return value. The exact record was committed before the writer reported failure;
the client correctly preserved both facts. Neither briefing was verified.

`popper-memory-live-results.md` records the receipts, source-level handoff, and
pending acceptance matrix. Upstream must deliver the execution result separately
from generated-source diagnostics before the remaining rotations can establish
the milestone. Do not weaken verification or count manager status `succeeded`
as semantic success. Capture the actual runtime/default harness models on rerun.

## Previous rerun: extraction fixed; final-output capacity blocked recall

Paseo's `popper_result_delivery_fix.md` handoff reports worker
`d4f86208-804c-4e41-9bbd-85d37b9a15b6` and the reference Llama model. Our smoke
and fresh Codex-to-Claude recall verify the extraction fix without remounting.
The old failed write recovered on attempt 2 without another commit. Separate
duplicate, missing-parent repair/retry, conflict and transport checks passed.

However, the complete 869-character two-record briefing reaches the loop but
its final model reply ends mid-JSON. Steps 2–6 are invalid JSON. Inspected Paseo
source still uses `max_tokens: 300`; that generation limit is distinct from the
2,000-character observation budget. A separate empty briefing had an escaping
error in the nested final JSON string. Neither outcome can count as verified.

`popper-memory-result-delivery-rerun.md` and its evidence bundle preserve the
successful checks, both unknown briefings and the next upstream handoff. Keep
client verification strict. All full rotations and complete project-scope
acceptance remain open; the experiment implementation and mounted skill were
unchanged during this rerun.

## Final acceptance

Paseo's `popper_final_answer_budget_fix.md` handoff reports generation raised to
2,048 tokens and a protocol hint allowing an object in the final decision's
`output`. A fresh Popper smoke verified both existing records. The optional
object-output skill remount on the old actor hit a Worker subrequest limit;
acceptance therefore used a fresh actor with a pinned mounted skill revision,
not a partial remount. The script and client stayed unchanged.

All three rotations completed on `popper-memory/popper-memory-v3-d35cb504`.
One Claude writer required an explicit reconciled attempt 2; its original failure
remains separate. All readers and follow-ups verified without recovery. Project
isolation and original retrieval, duplicate success/failure, missing-parent
repair/retry, conflict refusal and transport uncertainty also passed their checks.
Every captured runtime result reports notes off and memory_size zero.

`popper-memory-live-acceptance.md` and its credential-free bundle contain exact
prompts, receipts, markers, parent links, commit/index proofs, measured durations
and the remaining limits. Earlier unknown/failed diagnostics remain preserved.
This satisfies the specified sequential explicit-call milestone; it does not
establish a first-attempt success rate or broaden the experiment's scope.
