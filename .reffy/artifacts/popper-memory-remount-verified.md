# Older diagnostic actor: remount fix verified

Status: PASS. Date: 2026-11-14 Pacific/Honolulu (2026-11-15 UTC).

Paseo's `popper_remount_subrequest_fix.md` handoff, project `paseo-core`, workspace
`nuveris-v1`, reports commit `5c705e9` and worker version
`464c3cf3-0775-4241-88c4-582096f35312`. The handoff attributes the fix to bounded
GitHub backend request counts and installation-token reuse. Those implementation
and deployment details are developer-reported; this follow-up independently
checks the previously failing operation on our original actor.

Remounting the current `examples/cross-harness-memory/harness-memory` skill onto
`popper-memory/popper-memory-c6f30422` succeeded with CLI exit 0 in **5.109 s**.
The earlier operation on that same actor had returned HTTP 502 with
`Too many subrequests by single Worker invocation`.

The resulting skill commit is `4bb48cef979942a8d030f837ab087c6f8a477ae9` in
`paseo-ghengine-org/paseo-popper-memory-c6f30422-primary`. Independent GitHub
inspection at that exact commit confirmed byte-for-byte matches for all files:

- `skills/harness-memory/SKILL.md`.
- `skills/harness-memory/references/protocol.md`.
- `skills/harness-memory/scripts/memory.js`.

The complete mounted `skills/` tree contains exactly those files. `skill get`
reports the new commit and effective hints `max_steps: 6`, `notes: "off"`.
The existing working branch `paseo/session-81fd0032` has the same head before and
after remount, so its journal commits were preserved.

Evidence, including before/after state, CLI output, duration and file hashes:
`examples/cross-harness-memory/evidence/2026-11-14/remount-receipts.json`.
The acceptance actor `popper-memory/popper-memory-v3-d35cb504` was not targeted
by this check. No Docker containers or model calls were needed, and no credentials
were copied into the evidence.

The three-harness acceptance result remains complete. Earlier reports retain the
original 502 as historical evidence; the remaining remount issue is now verified
resolved for our fixture. This does not establish arbitrary-size journal behavior
or remove other Worker limits. Both actors and repositories remain intact.
