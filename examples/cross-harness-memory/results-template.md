# Cross-harness memory trial results

Status: NOT RUN. Implementation checks are separate from live acceptance.
Date: <local date and timezone>.

## Configuration

Record Popper/Paseo revisions, CLI and harness versions, model and step budget,
actor identity, GitHub repository and working branch, skill revision, declared and
effective notes/step hints, per-invocation notes/memory_size checks, granted
read/write tools, and timeout configuration.
Do not include tokens, auth files, or redaction lists.

## Isolation

Describe the actual OS/container boundary, session startup commands, loaded
instructions/plugins/memory, excluded transcript and evidence paths, and who held
the expected markers. A separate cwd alone is insufficient. Record any contamination
as inconclusive.

## Rotation evidence

| Project | Writer | Fresh recall + follow-up | Fresh final reader | Exact markers, attribution, parent linkage | Commit/record refs | Invocation IDs | Duration | Outcome |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| <rotation-1> | Codex | Claude Code | Popper | pending | pending | pending | pending | NOT RUN |
| <rotation-2> | Claude Code | Popper | Codex | pending | pending | pending | pending | NOT RUN |
| <rotation-3> | Popper | Codex | Claude Code | pending | pending | pending | pending | NOT RUN |

## Scope and failure evidence

| Check | Expected observation | Receipt/log + GitHub evidence | Outcome |
| --- | --- | --- | --- |
| Other project | Original marker/references absent; original still retrievable | pending | NOT RUN |
| Repeated successful request ID | 409, original success reconciled, one logical record | pending | NOT RUN |
| Consumed failed request ID | 409, original failure stays failed | pending | NOT RUN |
| Reconciled new-attempt retry | Same logical event, new trace, one record | pending | NOT RUN |
| Transport failure | Nonzero, visible unknown/failure, no blind retry | pending | NOT RUN |
| Conflicting event content | Failure; original record unchanged | pending | NOT RUN |

## Independent verification and limitations

Record the exact comparison method, commit ancestry and content checks, receipt
locations, missing/failed/inconclusive runs, and unresolved questions. Offline tests
are not live-recall evidence. No claims of hook automation, blocking enforcement,
authenticated source identity, or concurrent-write safety.

Only declare completion after every required trial has passing evidence. When
ready, save this report under `.reffy/artifacts/`, then run `reffy reindex` and
`reffy validate`.
