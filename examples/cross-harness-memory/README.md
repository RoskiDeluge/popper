# Cross-harness memory experiment

One disposable Paseo actor journals short synthetic findings to GitHub and briefs
fresh sessions in Codex, Claude Code, and Popper. The terminal rig stays unchanged.
All three live rotations and the required scope/failure checks passed on
2026-11-14 Honolulu. Popper succeeded in every role. One Claude writer needed an
explicit reconciled retry; its original failure remains recorded. See
[live acceptance](../../.reffy/artifacts/popper-memory-live-acceptance.md) and
[acceptance receipts](evidence/2026-11-14/acceptance-receipts.json).
The [initial failure](../../.reffy/artifacts/popper-memory-live-results.md) and
[budget rerun](../../.reffy/artifacts/popper-memory-result-delivery-rerun.md)
reports and evidence remain preserved.

## Preflight

Requires Node 22+, this repo's npm dependencies, a configured Paseo CLI and manager,
and `gh` authenticated to read the actor's repository independently. The client
uses existing Paseo profile/environment configuration; it does not load `.env`.
Do not copy Reffy's manager credentials into a micro-agent profile: these may be
different applications. Keep credentials out of example files and receipts.

Paseo's `popper_loop_hints_live.md` handoff (dated 2026-11-15) reports
`add-skill-declared-loop-hints` and capability access from loop-dispatched scripts
live in production. Verify the selected manager/runtime during preflight.
Our skill requests six steps and notes off. Check the effective hints with
`paseo skill get lab/harness-memory --content --json`; a live result must also
report `data.loop.notes: "off"` and numeric `memory_size: 0`. The client rejects
missing or inconsistent isolation fields and preserves them in verified receipts.
The proposed default runtime model is Workers AI's
`@cf/meta/llama-3.3-70b-instruct-fp8-fast`; record the actual deployed model.
Each model tool call consumes a step. The skill delegates the procedure to one
script, then returns its result. The runtime's MCP deadline also bounds the
script's GitHub calls: managed agents now receive 20 seconds per tool/sandbox
and 60 seconds per invocation, according to the handoff. Existing agents receive
these bounds on their next mount; use a fresh actor. Paseo reports journal and
briefing trials taking about 7–15 seconds, with GitHub verification and two loop
steps. These are upstream results, not completion of our three-harness milestone.
Record any timeout and do not claim a successful trial.

On the implementation machine, the CLI source/build was inspected at
`/Users/robertodelgado/dev/paseo-core/cli/`; `paseo` was absent from PATH. For the
client, point `PASEO_CLI_JS` at your built `cli/dist/paseo.mjs` if needed. Use
`node /absolute/path/to/cli/dist/paseo.mjs ...` for direct commands below in that
case. This is an executable path, not a shell command string.

Record versions (`node --version`, `gh --version`, `codex --version`,
`claude --version`), Paseo checkout/build revision, and Popper revision before trials.
Commands and output shapes were checked against local Paseo source on 2026-11-14;
preflight the deployed version rather than assuming a source checkout is deployed.

Create a disposable workspace and agent only in your configured test application:

```sh
paseo workspace create lab
paseo agent create --workspace lab --id harness-memory \
  --capabilities 'ghengine_read:repo_alias=primary,ghengine_write:repo_alias=primary' \
  --skill /absolute/path/to/popper/examples/cross-harness-memory/harness-memory
paseo agent capabilities lab/harness-memory --json
paseo skill get lab/harness-memory --content --json
paseo agent state lab/harness-memory --json
```

If creation partially succeeds, inspect it before retrying; skill mounting has a
separate failure path. Both capability families are declared explicitly. Confirm
`gh.log`, `gh.tree`, `gh.read`, and `gh.commit` work with a synthetic journal/briefing.
Do not grant shell or workspace capabilities for this experiment.

Use `state.ghengine.owner`, `repo`, and **working_branch** from the state response
as the client configuration. Journal commits land on that working branch; the
skill itself may be stored on the repository's default branch. Keep the fresh
actor's notes disabled throughout all trials. Do not remount a different skill
mid-trial. Save the mounted skill revision and effective hints in the result report.

## Explicit calls

Copy this experiment directory into a clean participant environment with a
`package.json` declaring `"type": "module"` and `tsx` installed. Run the client
from that environment so `--import tsx` resolves its local installation. Use absolute client/event paths; receipts need an
existing private directory. Never use this repo's ideation files as reader context.

Prepare a local event using `journal.example.json` or `briefing.example.json`.
The schema and response contract are in [protocol.md](harness-memory/references/protocol.md).
Use a distinct project per rotation, short findings, and at most three records per
project. Briefings return all project records. A full result must fit in 1800
characters to keep the reference loop's working context small. Paseo's deployed
result-delivery fix extracts the actual return value before the 2,000-character
observation limit. That does not guarantee the model has enough generation tokens
to return it: the live two-record result was 869 characters but its final answer
was incomplete under the old separate 300-token generation cap. Paseo's
`popper_final_answer_budget_fix.md` handoff reports a deployed 2,048-token cap and
structured object final outputs; our full rotations verify complete briefings
under that deployment. The skill returns the result as the final decision's
`output` object to avoid nested JSON-string escaping. Accept only final `data.response` claims independently
verified against GitHub; never extract receipts from truncated `data.loop.steps`. Use short IDs and
references. This is a small sequential experiment, not a concurrent journal service.

```sh
node --import tsx /absolute/path/to/client.ts \
  --event /private/path/event.json \
  --agent lab/harness-memory --repo OWNER/REPO --branch WORKING_BRANCH \
  --receipt /private/path/attempt-1.receipt.json
```

Stdout is a JSON receipt including verified briefing records. Exit 0 means the
invocation and cited GitHub content were verified; exit 1 means failed/unknown or
invalid configuration. A verified empty briefing means the index at the cited
snapshot was empty/absent, not that every possible storage path was audited.
Journal receipts verify exact event content; they do not authenticate source labels.

Use `--redact-file /private/path/redactions.json` for an array of literal strings
to replace with `[REDACTED]` in content, query, and evidence references before
transmission. Identifiers must already be non-sensitive. Use only synthetic
findings: Paseo manager history retains the full sent payload and result, too.
Review the redacted event locally; changes in content change its receipt digest.
Keep the same redaction rules for reconciliation and retries.

`--timeout-ms` bounds each subprocess (default 75000, maximum 120000); a call can
include pipe, log lookup, and GitHub verification, each separately bounded. Receipts
include total invoke/reconciliation duration. The default leaves headroom above
the managed runtime's 60-second invocation limit. No background retry is scheduled.
The receipt file is reserved before invocation; reuse requires reconciliation:

```sh
node --import tsx /absolute/path/to/client.ts \
  --event /private/path/event.json \
  --agent lab/harness-memory --repo OWNER/REPO --branch WORKING_BRANCH \
  --receipt /private/path/attempt-1.receipt.json --reconcile
```

A `409` alone never establishes success. The client reads the original invocation
and GitHub. A failed invocation remains failed even if its write completed; the
receipt preserves that record evidence. A running/missing/inaccessible invocation
remains unknown and blocks a new attempt. After confirmed failure and repository
reconciliation, explicitly start the next attempt:

```sh
node --import tsx /absolute/path/to/client.ts \
  --event /private/path/event.json \
  --agent lab/harness-memory --repo OWNER/REPO --branch WORKING_BRANCH \
  --attempt 2 --previous /private/path/attempt-1.receipt.json \
  --receipt /private/path/attempt-2.receipt.json
```

When constructing IDs in zsh, brace variables before colon suffixes, for example
`"trial:${event_id}:attempt-1"`; `$event_id:a` invokes a zsh path modifier. The
client constructs IDs directly without a shell.

The client rechecks the preceding attempt. Verified or unknown preceding attempts
prevent another invocation. Logical event identity stays unchanged; only the
attempt portion of the request ID changes. The remote script reuses an identical
record and refuses conflicting content. Preserve all receipt files.

## Host instructions and isolation

Give each harness the client location, actor/repo/branch, its own session/event IDs,
and the event it must submit. Ask it to call the client through its shell tool,
inspect the exit status, and report the receipt's verified content and citations.
For a follow-up, have it create a journal event with a new identity and `parent`:
`{"harness":"codex","session_id":"writer-1","event_id":"finding-1"}`.

Start fresh sessions without resume/continue/fork. Use a clean working directory
and an OS/container boundary that excludes other harness transcripts, writer
fixtures, receipts, verifier data, and this repo's Reffy context. A different
working directory alone does not prevent shell access to sibling directories.
Give a reader only the project and retrieval task, never the expected marker,
writer's prompt, answer, record body, or full writer receipt. Reader output may
contain the records it has just retrieved. Keep verifier credentials/evidence
outside participant environments. If effective isolation cannot be established,
record the trial as inconclusive.

- **Codex:** start a new invocation with the clean directory selected via `-C`.
  Do not resume/fork an existing session. Audit loaded instructions, plugins,
  memory, and tool permissions for that environment before the trial.
- **Claude Code:** start a new invocation from the clean directory; avoid
  `--resume`/`--continue`. Audit settings, auto-memory, plugins, and MCP context.
  Installed `--bare` skips those integrations but changes auth requirements;
  verify local help and available credentials before choosing it.
- **Popper:** use `--cwd /clean/reader --agent-dir /clean/config --no-session
  --tools read,bash,write`. Invoke the rig with an absolute `src/cli.ts` path and
  explicit resources only. Pi still loads project instructions/configuration;
  audit them. Keep any writer transcript and evidence outside its accessible tree.

These are explicit shell integrations; no hook, adapter runtime, or context
injection feature is installed. A host blocking the command due to its permissions
is a failed setup trial, not a memory-system success.

## Live runbook and independent verification

Run only when live model trials are requested. Use three projects with newly
generated markers; do not use the examples' placeholder as a test marker.

| Rotation | A: journal | B: fresh recall + follow-up | C: fresh recall both |
| --- | --- | --- | --- |
| 1 | Codex | Claude Code | Popper |
| 2 | Claude Code | Popper | Codex |
| 3 | Popper | Codex | Claude Code |

For each rotation: A writes, ends its session, and hands no answer to B. B recalls
through a briefing, writes an attributed linked follow-up, and ends its session.
C recalls both. The independent verifier compares exact markers, source fields,
parent linkage, record paths, and commit references through GitHub. Preserve raw
receipts and record durations. Re-query the original project after querying a
second empty fixture project; the second briefing must exclude the original marker
and references while the original remains retrievable.

Verify a cited record independently with:

```sh
gh api 'repos/OWNER/REPO/compare/COMMIT_SHA...WORKING_BRANCH'
gh api 'repos/OWNER/REPO/contents/journal/PROJECT/HARNESS/SESSION/EVENT.json?ref=COMMIT_SHA'
paseo agent logs lab/harness-memory --trace-id REQUEST_ID --json
```

Quote endpoint arguments in your shell, particularly the contents URL with `?ref=`.
The contents API returns base64; decode it and compare with the expected event.
The compare result must be `ahead` or `identical` (working branch contains commit).

Exercise failure cases after the rotations, keeping their evidence separate:

1. Repeat a successful ID with the original redacted event via plain stdin and
   `paseo pipe ... --raw --request-id ID`. Capture `409`, then use `--reconcile`.
   No second logical record or changed content is permitted.
2. Create a recorded failure using a disposable fixture and deliberately missing
   parent; obtain the request ID from the receipt. Repeat that ID, observe `409`,
   and reconcile. The failed attempt must remain failed, not delivered.
3. For a successful retry of that same event, add the missing parent with its own
   new event, then explicitly retry with `--attempt 2 --previous ...`. Verify that
   the event has one logical record. Reconcile a failed attempt that wrote a record
   if one occurs; preserve both failure and commit evidence.
4. Point a disposable Paseo profile at an unreachable endpoint or set a tiny
   client timeout. Confirm a nonzero result/unknown receipt and no automatic retry.
   Restore connectivity and reconcile before considering any new attempt.
5. Submit conflicting content for an existing logical identity under a deliberate
   new request ID directly; verify failure and unchanged GitHub content. Do not
   mutate an existing client receipt to bypass its digest checks.

Copy [results-template.md](results-template.md) into an indexed Reffy artifact
when running trials. Record unsupported, failed, unknown, and inconclusive cases;
do not mark the milestone complete until every acceptance criterion passes.

## Verified Popper test connection

The Paseo team supplied the named `popper` profile in `~/.paseo/config.json`.
Use the built CLI and clear the Reffy token before every test-manager command:

```sh
env -u PASEO_TOKEN PASEO_PROFILE=popper \
  node /Users/robertodelgado/dev/paseo-core/cli/dist/paseo.mjs workspace ls --json
```

For our client, additionally set `PASEO_CLI_JS` to that built CLI. Avoid sourcing
this repo's `.env` into the experiment. Environment variables override profile
values. Do not copy the token into this repo, image context, or result artifact.

The acceptance setup is recorded in `.reffy/state/cross-harness-memory/setup.json`:
workspace `popper-memory`, actor `popper-memory-v3-d35cb504`, repository
`paseo-ghengine-org/paseo-popper-memory-v3-d35cb504-primary`, working branch
`paseo/session-a403564d`. The profile, grants, effective six-step/notes-off hints,
and independent GitHub access were verified. The older diagnostic actor
`popper-memory-c6f30422` remains intact; an optional remount there hit a Worker
subrequest limit, so acceptance used a fresh actor. Keep both actors/repositories
for review. The later [remount verification](../../.reffy/artifacts/popper-memory-remount-verified.md)
confirmed Paseo's fix on the older actor without changing its journal branch.
The Paseo team owns manager teardown; repository deletion is manual.

## Container isolation preparation

`prepare-container.mjs` copies only the application source, package manifests,
client, Dockerfile, and bundled Paseo CLI into a new temporary build context.
It excludes host credentials, `.env`, Reffy artifacts, event fixtures, and receipts.
The image contains pinned Codex/Claude Code versions and the installed Pi rig.
The Linux build completes any missing optional-platform lockfile entries inside
the disposable image; the host lockfile is unchanged.
Build from the generated temporary context, not this repository:

```sh
node examples/cross-harness-memory/prepare-container.mjs /absolute/path/to/paseo.mjs
docker build --tag popper-memory-trial:local /the/printed/context/path
```

Start a new container per participant session, with no host workspace, home,
Docker socket, or evidence directory mounted. Only that session's minimal provider
credentials and the test-manager connection may be supplied at runtime; never bake
credentials into the image. Supply only a reader's retrieval instructions on stdin.
Collect stdout on the verifier side. Do not reuse containers or session volumes.
Run without provider credentials first to check executables and filesystem isolation:

```sh
docker run --rm --network none --read-only --cap-drop ALL \
  --security-opt no-new-privileges \
  --tmpfs /tmp:rw,nosuid,nodev \
  --tmpfs /trial:rw,nosuid,nodev,uid=1000,gid=1000 \
  --tmpfs /home/node:rw,nosuid,nodev,uid=1000,gid=1000 \
  popper-memory-trial:local \
  node -e 'console.log({home:require("node:os").homedir(),cwd:process.cwd()})'
```

Within the container invoke the client as
`node --import /opt/popper/node_modules/tsx/dist/loader.mjs /opt/popper/experiment/client.ts ...`
and Popper as
`node --import /opt/popper/node_modules/tsx/dist/loader.mjs /opt/popper/src/cli.ts ...`.
The absolute loader path works even though `/trial` has no dependencies installed.
Live calls need network access; the offline isolation probe deliberately disables it.
All three providers authenticated in these clean sessions during the live trials.
Authentication alone does not establish successful journal/briefing behavior.

The image `popper-memory-trial:c6f30422` was built and passed the offline
`probe-container.mjs` check. To rerun that check, mount only that standalone script
at `/probe.mjs` read-only, use the isolation flags above, and run `node /probe.mjs`.
No credentials or model requests are needed for the probe.
