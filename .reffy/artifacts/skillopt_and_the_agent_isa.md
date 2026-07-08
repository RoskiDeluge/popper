# SkillOpt and the Agent ISA: Competence Compiles to the Architecture

## Why this artifact
This applies the SkillOpt paper (`skillopt.pdf`, paseo-core project, `nuveris-v1` workspace — Yang et al., Microsoft/SJTU, May 2026, arXiv:2605.23904) to the thesis of `agents_x86_64_moment.md`. The paper trains a compact skill document (`best_skill.md`, 300–2,000 tokens) as "the external state of a frozen agent," using deep-learning optimizer discipline in text space: bounded add/delete/replace edits under a textual learning-rate budget, a held-out validation gate, a rejected-edit buffer, and epoch-wise slow/meta updates. It reports best-or-tied results on 52/52 (model, benchmark, harness) cells and — most relevant here — positive transfer of the trained artifact across model scales, across execution harnesses (Codex → Claude Code: +59.7 on SpreadsheetBench), and across nearby benchmarks.

Read against the x86-64 framing, SkillOpt is not just a compatible result; it is close to an independent experimental confirmation of the ISA claim, plus a working prototype of one component of the toolchain popper is betting on.

## 1. Cross-harness transfer is the ISA measured

The x86-64 artifact argued that a de facto instruction set is precipitating out of independent stacks. SkillOpt's transfer experiments are what it looks like to *measure* that:

- Three unrelated execution environments — direct chat, the Codex CLI loop, the Claude Code loop — all consume **the same `best_skill.md` file format** through a thin adapter that "injects the current skill into the agent context."
- A skill trained inside one harness improves performance inside another, with no re-optimization: the two harnesses "expose different tool/file APIs and command surfaces," yet the artifact carries.
- The same artifact also transfers *down model scales* (frontier-trained skills lifting mini/nano variants) and to adjacent benchmarks.

In ISA terms: a program compiled once ran on competing microarchitectures and got a speedup on each. That only works if there is a stable contract underneath — a shared way that context, tools, files, and procedural text compose. Nobody standardized that contract; SkillOpt just assumed it, and 52/52 cells said the assumption holds. The paper's own framing agrees without the vocabulary: it calls the method "harness-agnostic" and treats the harness as a swappable adapter — microarchitecture below, artifact above.

Notably, the artifact that transfers is exactly the kind of thing the x86-64 note said the winning architecture would be made of: **what's on hand**. A markdown file. Not a checkpoint, not a serialized object graph — text that any harness can prepend.

## 2. A new element for the decomposition: trained competence

`agent_being_decoupled.md` decomposed agent being into identity, world/capabilities, state, memory, and authority — each with an independent lifecycle. SkillOpt isolates a sixth element that was previously fused into either weights or prompts:

- **competence** — learned procedural knowledge, trainable offline, deployable as text, auditable in minutes, with a lifecycle independent of the model (frozen), the harness (swappable), and the task instance (rules are "procedural rather than instance-specific").

The paper's core move is a decoupling move: *domain adaptation is lifted out of weight space and into an external artifact*. The model is explicitly frozen; the thing that learns is the document. That is the preservation-reflex insight applied to learning itself: just as the agent's continuity stopped being the developer's homework, the agent's *improvement* stops being fused to the substrate that improves. Competence becomes a first-class, portable, versionable element of agent being — one more thing with nothing to preserve, because it is already text under version control.

The machine analogy extends cleanly: if weights are the silicon, the skill document is **software** — and SkillOpt's transfer results are the payoff of software/hardware separation, available only because there is an architecture line to separate across.

## 3. SkillOpt is a toolchain component — which is popper's layer

The x86-64 artifact positioned popper at the compiler stack, not the chip. SkillOpt is what one piece of that stack looks like when built with real discipline: it is an **optimizing compiler pass for text-space artifacts**. The optimizer/target separation mirrors compiler/CPU separation exactly — a stronger optimizer model improves the artifact at training time and "adds zero inference-time model calls at deployment," the way an expensive `-O3` pass costs nothing at runtime.

Its machinery translates almost term-for-term:

| SkillOpt mechanism | Toolchain analogue |
|---|---|
| bounded add/delete/replace edits under a budget | peephole passes with a step-size bound, not whole-program rewrites |
| held-out validation gate (strict improvement or reject) | regression suite gating every optimization pass |
| rejected-edit buffer as negative feedback | a record of transformations known to pessimize |
| protected slow-update region step edits cannot overwrite | linker-reserved sections; fast passes cannot clobber durable structure |
| `edit_apply_report.json` per step | build provenance — every change to the shipped artifact is traceable |

The headline ablation is the toolchain lesson: unbounded rewriting *underperforms* bounded, gated editing. Continuity of the artifact across revisions is what makes optimization history meaningful ("if consecutive skill revisions move too far... rejected edits no longer provide a meaningful optimization history"). This is the same correctness criterion the decoupling artifact stated for capability mutation — *transformation must not cost the artifact its past* — now shown to be not just an ontological nicety but a **performance requirement**.

## 4. Design implications for pppr as IR

If pppr is the intermediate representation of agentic work, SkillOpt implies the IR should be **optimizable**, and says concretely what that requires:

1. **Diffable in bounded units.** SkillOpt works because a skill admits atomic add/delete/replace edits. pppr artifacts should be structured so that small, local, mergeable edits are the natural mutation — the representation itself should make "large semantic jumps" unnatural.
2. **Gateable.** Every artifact mutation should be able to pass through an accept/reject gate scored against held-out evidence. That presupposes pppr work units carry or reference their own evaluation signal — a verifier, a score, a replayable check. An IR you cannot score is an IR you cannot train.
3. **Provenance-carrying.** The rejected-edit buffer and apply-reports mean the optimization *history* is part of the system's state. pppr already owns "transitions" and "replayable artifacts"; this adds: keep the rejected paths too — negative feedback is load-bearing.
4. **Layered by update speed.** The protected slow-update field vs. fast step edits is a two-speed memory hierarchy *inside one text document*. pppr's representation could adopt this directly: fast fields owned by the current engagement, slow fields owned by longer-horizon consolidation, with the boundary enforced by the format.
5. **Deployment-free by construction.** The trained artifact adds no runtime dependency on its trainer. Whatever pppr emits must be consumable by a harness that has never heard of the machinery that produced it — the "on hand" gate from the x86-64 note, applied to outputs.

## 5. What SkillOpt leaves on the table — and popper's opening

SkillOpt trains one skill for one domain against benchmark verifiers, and its stated limitations point exactly at the layer popper wants to own:

- **It optimizes the skill, not the work.** The skill is standing procedural knowledge; pppr represents intent, task structure, and continuation. SkillOpt proves text-space artifacts are trainable under gates; nothing in the method restricts it to skills. The same loop could optimize *any* element of the durable representation — task decompositions, handoff protocols, effect policies — if they are expressed in a diffable, gateable IR. That generalization is a popper-shaped project.
- **It needs verifiers.** The gate requires scored rollouts, so open-ended work is out of scope for the paper. An IR that carries its own acceptance criteria per work unit (the way pppr owns "handoff semantics") is the missing substrate for extending gated optimization beyond benchmarks.
- **Its calling convention is implicit.** Cross-harness transfer worked through the thinnest possible convention: "prepend the text." That is the ISA's current, primitive calling convention — and its success at +59.7 points suggests the convention can stay primitive longer than one would guess. The open thread in `agents_x86_64_moment.md` about harness hand-off should take this seriously: the first version of the convention is probably a file, not a protocol.
- **Skill libraries are future work.** The paper's outlook (shared skill libraries, meta-skill reuse across domains) describes an artifact ecosystem — versioned, transferable, independently owned competence documents. That ecosystem needs exactly what the sovereignty axis describes: artifacts living in the operator's own substrates, outliving any platform. Trained competence should be as sovereign as memory.

## Cleanest formulation

- SkillOpt froze the model and the harness, trained only a text file, and the file transferred across microarchitectures with gains. **The artifact, not the runtime, is where adaptation lives** — the strongest empirical support yet for the claim that the durable layer of agentic systems is the portable text contract.
- In the x86-64 frame: weights are silicon, harnesses are microarchitectures, skills are software, and SkillOpt is the first optimizing compiler. Popper's bet is that the IR this compiler should target is the representation of the work itself.

## Related artifacts
- `skillopt.pdf` (paseo-core project, `nuveris-v1` workspace) — the paper this note applies. NOTE: the remote projection of this PDF is corrupted (see `reffy_remote_binary_artifact_corruption.md`); read it from the paseo-core local checkout until the remote copy is re-pushed in binary-safe form.
- `agents_x86_64_moment.md` — the ISA thesis this note tests against external evidence
- `pppr_as_intermediate_representation.md` — the IR positioning that Section 4 turns into concrete format requirements
- `agent_being_decoupled.md` (paseo-core project) — the decomposition of agent being that trained competence joins as a sixth element
- `preservation_reflex_is_the_tell.md` (paseo-core project) — nothing-to-preserve as an architectural property, here extended from continuity to learning
