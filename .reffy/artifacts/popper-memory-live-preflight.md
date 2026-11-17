# Popper memory trial: verified live setup

Status: historical preflight snapshot, before model invocations. The later live
run and blocker are recorded in `popper-memory-live-results.md`.
Date: 2026-11-14, Pacific/Honolulu.

The Paseo developers supplied the `popper` CLI profile. With `PASEO_TOKEN` cleared,
workspace listing succeeded against the test manager. The Reffy workspace token
must not override this profile. No token is recorded here or in the build context.

## Provisioned resources

- Workspace: `popper-memory`.
- Agent: `popper-memory/popper-memory-c6f30422`.
- Repository: `paseo-ghengine-org/paseo-popper-memory-c6f30422-primary` (private).
- Working branch: `paseo/session-81fd0032`; default branch: `main`.
- Skill: `harness-memory`, commit `91905c6d80300d5407d6825ae946124bf19c50a8`.
- Declared and mounted capabilities: `ghengine_read`, `ghengine_write`, both bound
  to alias `primary`; script `memory` registered.
- Effective loop hints from `skill get`: max_steps 6, notes off.
- Independent GitHub CLI read access confirmed through the repo metadata API.
- Agent state reported no prior invocation at preflight.

Keep the manager and repository in place until milestone closure. The Paseo team
will tear down the manager afterward; repositories require manual deletion.

## Local tools and isolation preparation

Host versions: Node v24.12.0; Codex CLI 0.167.1; Claude Code 2.1.322;
GitHub CLI 2.86.0; Docker server 27.5.1.

The Paseo CLI is the supplied build at `~/dev/paseo-core/cli/dist/paseo.mjs`.
Codex auth and Pi's OpenAI auth file are present. Claude Code's login status is
valid outside the coding sandbox; the sandbox initially hid the Keychain-backed
login. No auth token was printed or added to the repository.

An explicit temporary Docker build context contains only runtime code and package
manifests. Each future participant will use a fresh container without host
workspace, transcript, home, or evidence mounts. The image `popper-memory-trial:c6f30422` built successfully. An offline probe
with network disabled, a read-only root filesystem, dropped capabilities, and
fresh tmpfs home/work directories passed. No host workspace/home, Docker socket,
Reffy context, event fixtures, or transcripts were mounted. The only probe mount
was the standalone probe script. All harness version/help commands succeeded.

Container versions: Node v24.22.3, Codex CLI 0.167.1, Claude Code 2.1.322,
GitHub CLI 2.23.0. The Linux build completed missing optional-platform lock entries
inside the image; the repository lockfile was left unchanged.

Provider authentication inside those isolated sessions remains a live preflight
check. Model calls made by the isolation probe: zero.

## Acceptance still pending

The journal/briefing smoke call, per-invocation notes-off/memory-size-zero check,
all three harness rotations, and failure/retry cases remain unrun. Successful
resource provisioning is not memory-transfer evidence. See
`examples/cross-harness-memory/README.md` and the ReffySpec change
`prove-cross-harness-memory` for execution and acceptance criteria.
