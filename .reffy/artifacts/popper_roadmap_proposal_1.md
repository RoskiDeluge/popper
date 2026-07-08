# Popper Roadmap Proposal 1: The IR Is the Trainable Object

## Why this artifact
This captures the insight that crystallized while reading Section 4 of `skillopt_and_the_agent_isa.md` (2026-07-07). That section framed SkillOpt's lessons as format requirements — "the IR should be optimizable." The operator's realization is the stronger claim, and it is the seed of popper's actual roadmap:

**pppr is to the whole agent what `best_skill.md` is to the skill. The IR is not a representation that supports training. The IR is the trainable object.**

## The move, stated precisely

SkillOpt's deep move was not its optimizer machinery — it was the *choice of trainable state*. The authors froze everything expensive and opaque (model weights, execution harness) and located all adaptation in the one thing that is portable, diffable, and auditable: an external text artifact. Then they applied real optimizer discipline to it — bounded edits, validation gates, rejected-edit buffers, slow/meta updates — and showed the result transfers across models, harnesses, and benchmarks.

The generalization popper should build: freeze the model, *and* the harness, *and* the host — and let the durable representation of the work itself be what gradient-like pressure acts on. Not just the skill (standing procedural knowledge) but the entire pppr artifact class: intent, task structure, decompositions, planning state, handoff semantics, effect policies, continuation shape.

The agent improves not by changing what executes it, but by changing what it **is** — and what it is, is text under version control.

## Why this closes the loop with the ontology line

The paseo-core artifacts (`preservation_reflex_is_the_tell.md`, `agent_being_decoupled.md`) established that the elements of agent being can be durable, separable, and independently lifecycled. But they were still **hand-authored**. A trainable IR upgrades the decomposition:

- The elements are not just durable and separable — they are *subject to selection*.
- The rejected-edit buffer becomes the agent's evolutionary record: the paths tried and pruned, retained as negative feedback.
- The validation gate becomes the mechanism by which an agent's structure **earns its place** rather than being designed in.

This also inherits SkillOpt's hardest-won lesson as a design law: bounded, gated editing *outperforms* unbounded rewriting, because continuity across revisions is what makes optimization history meaningful. Stated in the vocabulary of the decoupling artifact: *transformation must not cost the artifact its past* — now a performance requirement, not just an identity principle.

## The differentiation, in one line

SkillOpt trained the agent's **procedure**. Popper's bet: the entire representation of agentic work is one artifact class, and all of it is trainable under the same discipline — bounded edits, gates, provenance.

Frameworks cannot follow, for the same structural reason they could not follow the being-decomposition: their task structure and handoff logic live in code inside a process, not in an optimizable external state. You cannot run a validation gate over a closure. The moat is the same moat as sovereignty, seen from the training side: what is expressed as portable text can be trained, audited, and owned; what is fused into a runtime cannot.

## The hard problem (named honestly)

SkillOpt's gate needed scored rollouts against benchmark verifiers. Training the *work representation* needs a score for questions like "was this decomposition better?", "did this handoff preserve what mattered?", "did this effect policy help?"

This is why the IR carrying its own acceptance criteria — a verifier, a score, a replayable check attached to each work unit — stops being a nice-to-have (as it appeared in `skillopt_and_the_agent_isa.md` §4, point 2) and becomes the **load-bearing prerequisite** of the whole roadmap.

**The gate is the hard part; the edits are easy.** An IR you cannot score is an IR you cannot train.

### The harder version: "better" is a movable target

The formulation above still understates the problem. SkillOpt's benchmarks are arguably the *easy* case: they hand the gate something rare — a frozen, exogenous, scalar definition of better. Exact-match accuracy does not drift, does not disagree with itself, and does not change its mind after seeing what it asked for. Real work is the opposite on all three counts: "better" is endogenous to the people the work is for, it moves as their understanding moves, and it is often only articulable *in reaction to* an attempt — "not this" is data, even when no spec was violated.

Two consequences follow:

**1. The acceptance criteria live inside the trainable IR, not outside it.** SkillOpt could treat the verifier as fixed infrastructure because the benchmark froze it. In the real world the gate itself is a drifting, contested artifact — so it belongs in the same representation as the work, subject to the same bounded edits, provenance, and history. When a stakeholder's sense of "better" shifts, that shift should be a *diffable event in the record*, not an invisible re-weighting of everything. There is no gradient against a moving target, but there is an audit trail of the movement — and that changes what optimization means: not converging on a fixed optimum, but tracking a target while keeping the tracking honest.

**2. The gate must be falsificationist, not verificationist.** This is where the project's name stops being decorative. Karl Popper's point was that "verified good" is unavailable — there is no benchmark for truth — and the best available move is to expose conjectures to serious attempts at refutation. A SkillOpt-style gate on sanitized targets is verificationist: accept when the score goes up. The real-world gate has to be Popperian: an artifact revision is never "validated," it is merely **not yet refuted** by the people and checks it has been exposed to, and it remains permanently open to refutation when feelings, context, or stakeholders change. Even the bounded-edit discipline rhymes — Popper argued for piecemeal engineering over utopian rewrites for precisely the reason SkillOpt's ablations found: large jumps destroy the error signal. You cannot learn from the failure of a total rewrite because you cannot tell which part failed.

The honest restatement, then: the gate is not a verifier to attach but a **social interface** to represent. The IR must carry *whose* "better," *as-of-when*, on *what evidence* — with disagreement and drift as first-class citizens rather than noise. Rejected edits were SkillOpt's load-bearing negative feedback; in the real world, **rejected definitions of better** are equally load-bearing history.

## Roadmap implications (proposal)

1. **First-class acceptance criteria — as trainable artifacts.** Every pppr work unit should be able to carry or reference its own evaluation signal, and that signal is itself part of the IR: versioned, diffable, provenance-carrying, attributable to whoever holds the definition of "better" as of that revision. Design this before designing the optimizer — the gate precedes the gradient.
2. **Bounded-edit-native format.** The representation should make small, local, mergeable edits the natural mutation and large semantic jumps unnatural. The format itself enforces the learning rate.
3. **Provenance as state, including rejections.** Accepted edits, rejected edits, and their observed effects are all part of the artifact's history. Negative feedback is load-bearing; do not garbage-collect it.
4. **Two-speed fields.** Adopt the protected slow-update region pattern: fast fields owned by the current engagement, slow fields owned by cross-engagement consolidation, boundary enforced by the format.
5. **Trainer-free deployment.** The optimized artifact must be consumable by a harness that has never heard of the machinery that produced it. The training loop is scaffolding; the artifact is the product.

## Cleanest formulation

- SkillOpt: freeze the model and harness, train the skill document.
- Popper: freeze the model, harness, and host — train the representation of the work itself.
- An agent whose being is decomposed into durable text artifacts is an agent whose being can be **optimized** — bounded edit by bounded edit, gate by gate, without ever touching a weight or a runtime.

## Related artifacts
- `skillopt_and_the_agent_isa.md` — the analysis this proposal sharpens into a roadmap claim
- `agents_x86_64_moment.md` — the ISA thesis; this proposal is what the compiler stack is *for*
- `pppr_as_intermediate_representation.md` — the IR positioning that becomes the trainable object here
- `skillopt.pdf` (paseo-core project, `nuveris-v1` workspace; read from local checkout — see `reffy_remote_binary_artifact_corruption.md`) — the empirical method being generalized
- `agent_being_decoupled.md`, `preservation_reflex_is_the_tell.md` (paseo-core project) — the ontology line this proposal closes the loop with
