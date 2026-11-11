# Project Context

## Current product direction

The user has pivoted pppr to a minimal, representative terminal testing rig for
other agentic tools. The active application is the root `src/` directory, using
published Pi packages. Pi owns harness behavior; pppr selects explicit extensions
and skills and supplies plain shell I/O. It has no custom IR or host protocol.

`simplify-to-terminal-harness` records this decision and its implementation.
Earlier specs and the baseline below describe the previous product direction;
they do not constrain the terminal rig. The old `packages/` tree has been deleted;
its source remains in Git history. The decision and working baseline are captured
in `.reffy/artifacts/pppr-terminal-testing-rig-pivot.md`.

Development uses npm, Node.js 22+, strict TypeScript, and Vitest. Do not extend
the former runtime/adapter architecture when adding a tool experiment. Prefer
an ordinary Pi extension, skill, or shell command.

## Previous product context (historical)

## Purpose

For planning purposes, `pppr` is the evolving **intermediate representation layer** for agentic work. It is not the enclosing harness, not a host bridge, and not a product surface defined by one CLI. The core planning identity comes from `.reffy/reffyspec/specs/pppr-ir-core/spec.md`.

The most important architectural rule currently in force is:

- `pppr` is a durable representation layer for agentic work
- host execution concerns stay outside the core
- inherited `pi` structure requires positive justification
- the implementation may collapse to a very small TypeScript shape if that best expresses the contract
- the core is **sans-I/O**
- host adapter is a first-class architectural noun, with **Paseo** as the first concrete runtime target

Specifications and proposals should assume that `packages/pppr` is the canonical home of the core protocol/runtime surface unless a change explicitly proposes otherwise.

## Architectural Baseline

### Core identity

`pppr` owns representational concerns such as:

- intent
- task structure
- state
- transitions
- handoff semantics
- replayable artifacts
- protocol vocabulary for inputs, outputs, effects, and snapshots

`pppr` does **not** own:

- shell execution
- local process management
- transport
- pod lifecycle
- terminal rendering
- filesystem/network/process I/O
- model invocation as an ambient operation
- time and identity as self-sourced globals

Those concerns belong at the adapter edge.

### Sans-I/O rule

The core under `packages/pppr/src/` is planned as a sans-I/O runtime. ReffySpec work should treat the following as the intended direction:

- no platform-module imports in the core (`node:*`, `cloudflare:*`, `bun:*`, `deno:*`)
- no ambient global I/O inside core transitions or constructors
- identity and time are supplied as inputs, not self-sourced
- side effects are expressed as effect requests and fulfilled by adapters

If current code violates that rule, the violation is a code bug or follow-up implementation task, not a reason to weaken the planning baseline.

### Adapter model

Planning should distinguish these nouns clearly:

- **core**: the sans-I/O runtime and protocol surface under `packages/pppr`
- **protocol**: the documented input/output/effect/snapshot contract, especially `packages/pppr/PROTOCOL.md`
- **host adapter** / **runtime adapter**: code outside the core that supplies environmental capabilities and fulfills effect requests

`legacy-pi-host` is a legacy adapter, not the defining consumer of the architecture. **Paseo** is the first concrete runtime adapter target for future work.

## Tech Stack

- TypeScript with strict ESM modules is the primary implementation language.
- Node.js 22+ is the current runtime baseline for local development and validation.
- `pnpm` is the default package manager for repo work.
- Vitest is the test runner used by the repo.
- Reffy and ReffySpec are the planning workflow and canonical spec surface.

The repo may still contain inherited packages and surfaces from `pi` or upstream history. Their presence in the tree is not, by itself, planning justification.

## Planning Conventions

### Specs describe intended truth

- Treat `.reffy/reffyspec/specs/` as canonical planning truth.
- Use change proposals for new capabilities, breaking changes, architecture shifts, or major performance/security work.
- Keep proposals aligned with current canonical specs, especially `pppr-ir-core`, before drafting new deltas.

### Prefer `pppr`-first reasoning

- Start from the question: "Is this part of the portable representation of the work, or is it specific to one host/runtime?"
- If it is host- or runtime-specific, place it in an adapter unless a canonical requirement explicitly says otherwise.
- Do not preserve inherited `pi` assumptions by default.

### Protocol and code disagreements

- `packages/pppr/PROTOCOL.md` is the binding contract for the core protocol surface.
- If code and protocol prose disagree, treat that as an implementation bug or follow-up change.
- Do not silently normalize architecture back toward the current implementation if the canonical spec already says otherwise.

### Archiving superseded changes

- If a change is completed and its delta specs should merge into canonical specs, use the normal Reffy archive flow.
- If a change is superseded and its deltas should **not** merge into canonical specs, archive it as a historical record under `.reffy/reffyspec/changes/archive/` instead of using the merging archive path.
- Historical archival is appropriate when preserving planning history matters but merging the old delta would pollute current canonical truth.

## Implementation Guidance

### Code shape

- Prefer strict typing and explicit data flow.
- Keep files focused and small where practical.
- Prefer ASCII unless an existing file justifies Unicode.
- Add comments only where the logic is genuinely non-obvious.

### Architecture

- Prefer explicit boundaries over convenience imports from inherited surfaces.
- Keep host adapters thin and keep core behavior protocol-shaped.
- Avoid introducing abstractions "for future hosts" unless they are pulled by a real planning need.
- Smaller implementation shapes are acceptable if they expose the `pppr` contract more cleanly.

### Testing

- Tests should increasingly describe IR-level invariants rather than only legacy-host behavior.
- When planning new test work, favor replayability, protocol correctness, effect contract clarity, and snapshot semantics.
- Do not let unrelated inherited packages block `pppr` planning unless they directly affect the core, its adapters, or repo policy.

## Important Constraints

- The planning center of gravity is `pppr`, not the broader inherited monorepo.
- The canonical architectural split is core/protocol/adapter.
- `packages/pppr/src/` should move toward the sans-I/O invariant, even if the current implementation is not there yet.
- Spec work should avoid speculative permanence outside the `pppr` contract; the implementation is still evolving.
- Changes that affect the core identity should be argued against `pppr-ir-core` first, not against inherited repository structure.

## External Context

- Paseo is the first concrete runtime-adapter target named by the canonical spec.
- `legacy-pi-host` remains relevant as migration and comparison context, but it is not the architectural authority.
- Reffy artifacts in `.reffy/artifacts/` are context inputs for planning, not substitutes for canonical specs.
