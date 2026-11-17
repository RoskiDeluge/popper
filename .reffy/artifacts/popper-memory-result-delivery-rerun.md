# Result-delivery fix verified; model output still blocks full recall

Status: historical rerun, **BLOCKED; zero passing full rotations** at this point.
Paseo subsequently fixed the final-answer budget; all required live checks later
passed. See `popper-memory-live-acceptance.md` for the final evidence.
Date: 2026-11-14 Pacific/Honolulu, 2026-11-15 UTC.

Paseo's result-delivery fix works on our existing actor without remounting.
A smoke briefing and a fresh Claude Code session both retrieved and independently
verified a prior finding. The next boundary is model output: a complete two-record
script result reaches the loop, but its final reply ends mid-JSON. An empty-project
briefing also encountered a separate JSON-escaping failure. Neither counts as
verified recall. This report follows `popper-memory-live-results.md`; the original
failed receipts remain preserved.

## Configuration and isolation

Paseo's remote `popper_result_delivery_fix.md` handoff, project `paseo-core`,
workspace `nuveris-v1`, reports commit `78b114a`, worker version
`d4f86208-804c-4e41-9bbd-85d37b9a15b6`, and runtime model
`@cf/meta/llama-3.3-70b-instruct-fp8-fast`. Worker/model are developer-reported;
they are not machine-readable fields in our invocation receipts.

The actor, repository, branch and mounted skill are unchanged:

- `popper-memory/popper-memory-c6f30422`.
- `paseo-ghengine-org/paseo-popper-memory-c6f30422-primary`.
- Working branch `paseo/session-81fd0032`.
- Skill commit `91905c6d80300d5407d6825ae946124bf19c50a8`.
- Six loop steps, notes off, numeric memory_size zero. Every captured runtime
  invocation in this rerun confirms notes off and zero stored notes.
- Same prebuilt image and CLI versions as the original report. Codex explicitly
  used `gpt-6.1-sol`, Claude Code `claude-sonnet-5-5`, Popper `openai/gpt-4o`.
- Each participant started in a new read-only Docker container with fresh tmpfs
  work/home/temp directories, all capabilities dropped and no-new-privileges.
  Only minimal runtime credentials were mounted. No host workspace, transcript,
  fixture, verifier evidence, prior receipt or Docker socket was available.
  Reader prompts were checked to exclude the expected marker and finding.

Durable evidence is in
`examples/cross-harness-memory/evidence/2026-11-14/rerun-receipts.json`:
prompts, events, receipts, original invocation results, duplicate responses,
GitHub content/ancestry checks, and the complete expected two-record result.
Raw harness JSONL remains in ignored local state. Credentials are excluded from
both evidence bundles and the container build context.

## What now passes

1. **Result-delivery smoke:** `r1-c6f30422:codex:fixcheck:q:attempt-1`, verified
   in 17.093 seconds. Returned the original exact record and commit.
2. **Reconciled old write:** `r1-c6f30422:codex:a:a:attempt-2`, verified
   in 10.568 seconds. Attempt 1 remains failed; identical-record reuse made no
   new commit and preserved commit `756529695aa03312597c4cb6a8bcd35f6621c650`.
3. **Fresh cross-harness recall:** Codex wrote a new marker in project
   `v2r1-1eb3a05c`; an isolated Claude session recalled it through Paseo with
   exact GitHub-verified attribution and content.

The fresh marker was `ae8a956780ca464e`; finding:
`Calibration marker: ae8a956780ca464e. Threshold = 17.`

| Call | Request ID | Client duration | Outcome |
| --- | --- | --- | --- |
| Codex write | `v2r1-1eb3a05c:codex:a:a:attempt-1` | 11.743 s | VERIFIED |
| Claude briefing | `v2r1-1eb3a05c:claude-code:b:q:attempt-1` | 10.278 s | VERIFIED |
| Claude linked write | `v2r1-1eb3a05c:claude-code:b:b:attempt-1` | 5.243 s | FAILED; script input rejected, no record |
| Explicit operator recovery | `v2r1-1eb3a05c:claude-code:b:b:attempt-2` | 16.002 s | VERIFIED after failure reconciliation |
| Fresh Popper final reader | `v2r1-1eb3a05c:popper:c:q:attempt-1` | 28.855 s | UNKNOWN; incomplete JSON |

The operator recovered Claude's exact authored follow-up with a new attempt ID;
the failed attempt was not relabeled. That assisted recovery and the unknown
final briefing prevent counting this sequence as a passing rotation.

Independent host GitHub verification confirms both exact records and the parent
link in snapshot `b4d58a8a23a0de816b597f260fa93372cbdd5a0e`:

- Writer path `journal/v2r1-1eb3a05c/codex/a/a.json`, originally committed at
  `aa87d267a105d29ed642a7882115fdd219459284`.
- Follow-up path `journal/v2r1-1eb3a05c/claude-code/b/b.json`, committed at
  `b4d58a8a23a0de816b597f260fa93372cbdd5a0e`; content is the exact finding plus
  ` Confirmed.`, parent is Codex session `a`, event `a`.
- The pinned project index contains exactly those two paths. Each cited record
  matches GitHub content and belongs to the working branch's history.

## Remaining Paseo blocker: final model output budget

For the Popper reader, step 1 is now the actual structured script result, with
no generated-source prefix. Steps 2–6 are `invalid_json`. The returned response
ends while emitting the second record's `commit_sha` value; it never reaches the
remaining commit text, snapshot citation or closing JSON delimiters. The client
returns exit 1 and outcome unknown, including after original-invocation lookup.

The complete expected script result is **869 characters**, within both our
1,800-character limit and Paseo's 2,000-character observation budget. Its canonical
final decision with a JSON-string output is 1,005 characters. Exact content is
preserved under `v2-two-record-proof.json` in the evidence bundle.

Local Paseo source at `91dbdbb51b2aa5ca183bc2f23b7afb72225f55eb`,
`src/agents/runtimeAgent.ts:858`, still calls the reference model with
`max_tokens: 300`. The cutoff and repeated incomplete replies are consistent with
that generation limit. The provider's finish reason/token usage is not exposed,
so budget exhaustion is a source-supported diagnosis rather than a measured
finish-reason field. This is separate from the now-fixed observation prefix.

Requested upstream change: give the model a bounded generation budget sufficient
for complete tool decisions and final result envelopes, including this fixture
(for example 1,024–2,048 tokens, or an appropriately bounded configurable value).
Detect provider length exhaustion if available and report it explicitly. Repeating
the same truncated final response across five loop steps does not recover it.
Retain notes suppression and the existing per-invocation/tool deadlines.

Regression coverage should exercise a **full two-record briefing**, including
parent attribution, paths, commit and snapshot citations, through final-decision
serialization and parsing. The earlier long-script/short-sentinel test proves
result extraction, but does not establish enough final-output capacity.

## Separate malformed-JSON case

The empty-project check `empty-28e07d33:codex:checks:q:attempt-1` returned a short,
correct script result at step 1: no records, pinned snapshot. Its model final
decision omitted an escape at the nested `records` key, then repeated the same
malformed JSON through steps 2–6. The client stayed unknown/nonzero. This response
is short; it is not evidence of generation-budget exhaustion.

Avoiding nested JSON-string escaping via an already-supported structured final
output, or improving invalid-JSON recovery, may help this separate reliability
case. Keep the client strict; do not turn malformed output into verified success
or extract claims from diagnostic step excerpts.

## Acceptance matrix

| Check | Result | Evidence |
| --- | --- | --- |
| Original generated-source blocker | RESOLVED | Smoke, fresh write and fresh recall all verified |
| Codex -> Claude Code -> Popper | INCOMPLETE | Fresh recall passes; assisted follow-up recovery; final briefing unknown |
| Claude Code -> Popper -> Codex | NOT RUN | Shared final-output blocker |
| Popper -> Codex -> Claude Code | NOT RUN | Shared final-output blocker |
| Other-project isolation plus original retrieval | UNKNOWN | Empty script result exists, but final JSON is malformed; original two-record final also unknown |
| Duplicate successful ID | PASS | HTTP 409; original invocation unchanged; reconciliation verified; branch head unchanged |
| Consumed failed ID | PASS for semantic failure | Missing-parent error; duplicate 409; reconciliation stays failed; no child record |
| Deliberate retry after repair | PASS | Added the missing parent, reconciled failure, used attempt 2; one child record, correct parent link |
| Failed write with existing identical record | PASS | Earlier failed writer reconciled; attempt 2 verifies original record without another commit |
| Conflicting event content | PASS | `Conflicting logical event`; original record and branch head unchanged |
| Transport failure | PASS | Unreachable endpoint, 101 ms, unknown receipt, exit 1, no automatic retry |

The missing-parent repair used project `failure-8b08c57b`. Its index has one parent
and one child, snapshot `877b8f1890e3d66a1a706e8f4ab7d95367df982b`. Manager status
is `succeeded` for these skill-level errors; actual manager-status-failed behavior
is not claimed as separately exercised.

Keep the manager, actor and repositories intact. Preserve failed/unknown receipts.
After the next fix, use new projects and markers for complete acceptance rotations;
do not retry an unknown attempt until its outcome is reconciled. This milestone
still makes no claim about hooks, enforcement, authenticated source identity or
concurrent writes.
