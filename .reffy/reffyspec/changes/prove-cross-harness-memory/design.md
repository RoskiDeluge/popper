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
