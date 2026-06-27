# LogicalAssemblies as Load-Bearing Representations

## Domain Knowledge Retention Under Entropy in Agentic Systems

*Draft white paper — `.reffy` artifact, June 2026.*
*Companion to `scm.pdf` (Structural Consequence Model, formal note) and successor to `lasm-scm.md` (early manifesto draft).*

---

### Abstract

Organizations lose semantic coherence continuously: people leave, systems are replaced, terminology drifts, and the gap between what an organization knows and what its systems represent widens by default. The arrival of agentic AI systems — software that plans and acts rather than merely records — raises the cost of this loss, because an agent acting in a domain it misrepresents produces consequential errors rather than stale reports. This paper develops the concept of a **Logical Assembly**: a versioned, machine-readable, runtime-independent representation of a domain, comprising concepts, relations, constraints, events, policies, and evaluation criteria. We situate the concept within the Structural Consequence Model (SCM), which expresses cumulative consequence as time-integrated signal retained relative to entropy, and we extend that model with a qualitative account of *differential decay*: knowledge decays at a rate inversely related to how operationally load-bearing its representation is. This account explains a historical pattern the field has not adequately theorized — why database schemas and source code retain fidelity while wikis, ERDs, and enterprise ontologies rot — and it yields a design criterion for Logical Assemblies: a domain representation retains signal only to the extent that some operational process fails observably when the representation diverges from reality. We argue that evaluation suites are the enforcement mechanism that prior semantic-representation efforts lacked, propose the *model-swap test* as an operational measure of structural capital, and identify failure modes, costs, and open problems. The contribution is a framework and a falsifiable thesis, not an implementation.

---

## 1. Introduction

### 1.1 The problem

Every organization maintains, implicitly, a model of itself: what entities it deals with, how they relate, which events matter, which constraints bind, and what counts as success. Almost none of this model exists in any single place. It is distributed across database schemas, application code, process documents, training materials, vendor configurations, and — disproportionately — the heads of employees.

This distribution is not merely inconvenient; it is unstable. Each component decays on its own schedule. Employees leave at a measurable rate, taking ambient knowledge with them. Documentation diverges from practice the day after it is written, because nothing breaks when it goes stale. Application code encodes domain rules faithfully but entangles them with framework and infrastructure concerns, so that when the application is replaced, the rules must be rediscovered by archaeology. The aggregate effect is that an organization's understanding of itself must be continuously re-derived at significant cost — a cost usually paid in onboarding time, integration projects, and production incidents.

Until recently, this was tolerable. Software consumed *data*, and the meaning of that data could remain in human heads, applied at design time by the engineers who built each system. An agentic system breaks this arrangement. An agent that plans and executes work needs the meaning at *runtime*: which actions are valid, which constraints are inviolable, what an acceptable outcome looks like. If the meaning is not represented, the agent acts on a defective world model, and the failure mode is not a stale dashboard but a wrong action taken autonomously.

### 1.2 The claim

This paper makes three claims, in increasing order of specificity:

1. **Framing.** The retention of organizational meaning is usefully modeled as a signal-versus-entropy problem, per the Structural Consequence Model (§2). The relevant design question is which representational structures maximize retained signal per unit of maintenance cost.

2. **Mechanism.** Representations of knowledge decay at rates determined primarily by whether they are *load-bearing* — whether anything fails observably when the representation diverges from reality (§4). This explains the divergent fates of prior approaches (schemas endure; ontologies rot) better than explanations based on expressiveness or tooling.

3. **Design.** A Logical Assembly (§3) — a runtime-independent domain representation coupled to an evaluation suite that gates agent operation — is a construction that makes *semantic* knowledge load-bearing for the first time at reasonable cost, because agents are the first widely deployed consumers of machine-readable meaning (§5).

The third claim is the speculative one, and we treat it as such. Sections 7 and 8 give failure modes and falsifiable predictions rather than advocacy.

### 1.3 What this paper is not

This is not a schema proposal, a metamodel, or a standard. It deliberately does not specify a serialization format for Logical Assemblies, because the history surveyed in §4 suggests that format standardization is the *least* important determinant of whether such representations survive. It is a framework paper: it proposes definitions, a causal account, and tests.

---

## 2. Preliminaries: the Structural Consequence Model

The Structural Consequence Model (SCM) is a minimal formalism for systems operating under persistent entropy. We restate it here in the form given in the companion formal note.

Let $t \in \mathbb{R}_{>0}$ denote time, and define:

- $X(t)$ — retained signal at time $t$
- $C(t)$ — entropy (churn) at time $t$, with $C(t) > 0$ for all $t$
- $S(t)$ — structural consequence at time $t$

Instantaneous structural strength is the ratio $S = X/C$, and cumulative consequence is

$$S(t) = t \cdot \frac{X(t)}{C(t)}$$

so that, when signal and entropy are approximately stable, consequence accumulates linearly with time. The rate form $S(t)/t = X(t)/C(t)$ makes the key property explicit: **time integrates structural strength; it does not independently generate consequence.** An organization that retains little signal relative to its churn accumulates little consequence no matter how long it operates.

Applied to organizations, we interpret the terms as follows:

- **Signal** $X(t)$: the durable, *usable* understanding of how the business operates — entities, relations, governing constraints, meaningful events, success criteria. "Usable" matters: knowledge that exists but cannot be brought to bear (a forgotten document, a departed expert) does not count toward $X$.
- **Entropy** $C(t)$: the aggregate rate of processes that erode that understanding — turnover, system replacement, terminology drift, siloing, vendor churn, undocumented exception-making.
- **Consequence** $S(t)$: cumulative consequential capacity — the organization's ability to act coherently and compound on its own past.

Two observations follow directly from the model and frame the rest of the paper:

**Observation 1.** There are exactly two levers: increase retained signal or decrease entropy. Most enterprise-architecture practice has aimed at the second lever (standardization, governance, change control), which fights the organization's need to adapt. Representational infrastructure aims at the first: let churn happen, but make understanding survive it.

**Observation 2.** $X(t)$ is itself dynamic. Signal must be actively retained against decay; a representation written once and never reconciled with reality is a contribution to $X$ at time $t_0$ that depreciates thereafter. The *decay rate* of represented knowledge is therefore the central quantity of interest, and SCM as stated is silent on what determines it. Section 4 proposes an answer.

---

## 3. Logical Assemblies: definition

### 3.1 Definition

A **Logical Assembly** is a machine-readable, versioned, runtime-independent representation of a domain, comprising at minimum:

| Component | Content | Answers |
|---|---|---|
| **Concepts** | The entities of the domain and their identity conditions | "What exists, and when are two things the same thing?" |
| **Relations** | How concepts connect, with cardinality and lifecycle | "What can be related to what, and how do relationships change?" |
| **Constraints** | Invariants that valid states and actions must satisfy | "What must never happen?" |
| **Events** | The occurrences that change domain state, and their semantics | "What happens, and what does it mean when it does?" |
| **Policies** | Conditional commitments about how the organization responds | "Given X, what do we do?" |
| **Evaluations** | Executable criteria for whether an actor operating in the domain is doing so correctly | "How do we know an agent (or process) understands this domain well enough to act in it?" |

The first five components have ancestors (ontologies, conceptual models, business-rule engines, event schemas). The sixth is the structurally novel element, and §5 argues it is what makes the construction viable where ancestors failed.

We write an assembly as a tuple $A = (\Sigma, R, \Phi, E, \Pi, V)$ — concepts, relations, constraints, events, policies, evaluations — without committing to a representation language for any component. In practice the components will be heterogeneous: schemas, typed event definitions, executable predicates, policy documents with machine-checkable structure, and evaluation harnesses.

### 3.2 Required properties

The definition is completed by four properties. An artifact lacking any of them is something else (a schema, a wiki, a test suite), whatever it is called.

**P1 — Machine-consumable.** Every component must be readable by a machine actor at runtime, not merely by a human at design time. This excludes prose documentation, however accurate.

**P2 — Runtime-independent.** The assembly must not be expressed in terms of any particular application, model, vendor, or execution environment. The test: replacing any single system in the organization's stack — including the foundation model behind its agents — should require no change to the assembly. (Changing the *business* should require a change to the assembly; that asymmetry is the point.)

**P3 — Versioned and diffable.** Domain understanding changes; the assembly must change with it, and the change must be reviewable as a first-class event. "The concept of Customer changed" should be as visible, attributable, and revertible as a code change.

**P4 — Load-bearing.** Some operational process must fail observably when the assembly diverges from reality. This is the property the rest of the paper is about, and it is the one most often missing from the assembly's ancestors.

### 3.3 What an assembly is not

Distinguishing the concept from its neighbors sharpens it:

- **Not a database schema.** A schema describes how facts are stored, and is load-bearing only for storage: it enforces shape, not meaning. A schema will happily store a refund issued against a vehicle the customer never owned.
- **Not an API specification.** An API spec describes an interface to one system. It is projection-level, not domain-level.
- **Not a knowledge graph.** A knowledge graph captures instances and relations but typically lacks constraints, event semantics, policies, and — critically — evaluations. It says what is connected to what; it does not say what must not happen or what success looks like.
- **Not the application code.** Code does encode domain rules and *is* load-bearing — which is exactly why organizations belatedly discovered that source code, not the running application, was the asset. But code entangles domain logic with infrastructure, and its domain content is recoverable only by expert reading. An assembly is the disentangled, declared form of what code currently encodes incidentally.
- **Not documentation.** Documentation fails P1 and P4 simultaneously, which (per §4) is why it decays fastest of all.

A useful slogan-level compression, due to the earlier draft of this work: *applications are temporary projections; the assembly is the durable artifact.* Section 6 takes the projection framing seriously as architecture.

---

## 4. Differential decay: why some representations survive

### 4.1 The historical record

Consider the fates of the major attempts to represent organizational knowledge, asking of each not "was it expressive enough?" but "what happened when it went stale?"

**Expert systems (1970s–80s).** Rule bases (MYCIN and descendants; later, large common-sense efforts such as Cyc) encoded expertise in executable form. Where the rules sat on a real decision path, they were maintained; the broader program collapsed largely under the cost of acquisition and maintenance — the "knowledge-acquisition bottleneck." The knowledge was executable but the *maintenance loop* was manual and expensive, and nothing in the environment automatically signaled divergence.

**Canonical data models and enterprise architecture (1990s–2000s).** Unified entity models were built to reduce integration costs. Where a canonical model was compiled into actual message contracts (and thus broke builds when violated), it held. Where it lived in a modeling tool as reference material, it drifted within a budget cycle or two. The same artifact class had both fates, distinguished by enforcement.

**The Semantic Web (2000s).** RDF/OWL provided more expressive machinery than almost any enterprise needed — formal semantics, decidable reasoning fragments, global identifiers. Adoption failed in the large anyway. The standard diagnosis is cost-benefit: authoring ontologies was expensive and the consumers who would have made them valuable did not exist yet. In our terms: **there were no runtime consumers of meaning**, so no process failed when an ontology was wrong, so ontologies were documentation with better syntax, and decayed accordingly. The notable survivor — schema.org — is the exception that proves the rule: search engines were a consumer that rewarded conformance observably (in traffic), making the markup load-bearing for publishers.

**Digital twins (2010s).** Models of physical systems synchronized with sensor telemetry. These have been durably useful precisely where the synchronization is real: the sensor stream makes divergence between model and reality *observable by default*. A twin that drifts from its asset announces the drift. This is load-bearing-ness achieved through instrumentation.

**Source code and database schemas (throughout).** The control group. Both are routinely maintained with high fidelity over decades, across total turnover of the people involved. Neither is more expressive than OWL. Both share one property: when they diverge from intended reality, something visible breaks — a compile, a test, a write, a customer.

### 4.2 The load-bearing thesis

The pattern admits a compact statement:

> **Thesis (differential decay).** The decay rate of a knowledge representation is determined primarily not by its expressiveness, formality, or tooling, but by whether it is *load-bearing*: whether some operational process fails observably, and attributably, when the representation diverges from reality. Load-bearing representations are self-correcting, because divergence produces a signal that triggers repair. Non-load-bearing representations decay at the ambient rate of organizational forgetting, regardless of their quality at creation time.

In SCM terms: partition retained signal into compartments by representation type, $X = X_{\text{ambient}} + X_{\text{doc}} + X_{\text{lb}}$ (in heads; in non-enforced artifacts; in load-bearing artifacts), each with its own effective decay rate $\lambda$. Then:

- $\lambda_{\text{ambient}}$ is set by turnover and is high.
- $\lambda_{\text{doc}}$ is set by the rate of un-reflected change in the domain — high, and insidiously invisible.
- $\lambda_{\text{lb}}$ is set by the latency of the failure-and-repair loop — low, and bounded by how quickly divergence surfaces.

The design objective for representational infrastructure is then simply stated: **maximize the fraction of domain-critical knowledge held in the low-decay compartment.** Notice that this reframes the goal away from coverage ("model everything") toward enforcement ("model only what something will check"), which is close to the opposite of how enterprise ontology projects were typically scoped — and is, we suggest, why they were typically doomed.

We stress the qualitative status of this model. $X$, $C$, and $\lambda$ are not directly measurable, and we do not propose pseudo-precise metrics for them. The model earns its keep by ordering design alternatives and by generating the predictions in §8, not by supporting calculation.

### 4.3 The corollary that constrains assembly design

The thesis has an immediate, somewhat uncomfortable corollary:

> **Corollary.** Building a Logical Assembly does not, by itself, retain anything. An assembly that no operational process consumes is an ontology with a new name, and will share the ontology's fate.

This is the discipline the concept needs in order to avoid becoming the next entry in §4.1's graveyard. The question "should we represent X in the assembly?" must always be paired with "what will fail if this entry is wrong?" — and if the answer is "nothing," the entry is documentation and should be either connected to an enforcement path or deliberately left out.

---

## 5. Why agentic AI changes the economics

### 5.1 The missing consumer arrives

Section 4 located the failure of prior semantic infrastructure in the absence of runtime consumers of meaning. The significance of agentic AI for this paper is exactly that it supplies the missing consumer, at scale, with an economic forcing function.

A conventional application needs to know what fields exist; its developers held the meaning, at design time. An agent needs, at runtime: which actions are valid in the current state, which constraints are inviolable versus advisory, which outcomes are desirable, and what the entities it manipulates *are*. Every one of these is a query against domain meaning. An organization deploying agents therefore consults its domain representation continuously and operationally — and an error in the representation now produces a wrong *action*, with cost and attribution, rather than a quietly wrong document.

This converts semantic knowledge from documentation into load-bearing structure by the mechanism of §4: divergence between assembly and reality surfaces as observable agent failure, triggering repair. The maintenance loop that expert systems had to fund manually comes, in part, for free.

### 5.2 Evaluations as the enforcement instrument

The loop closes fully only with the assembly's sixth component. An evaluation suite, in this context, is not a benchmark; it is an executable test of whether an actor understands the domain well enough to be permitted to act in it. Each evaluation encodes domain assumptions, success criteria, constraints, and expected reasoning in *checkable* form, and — critically — it **gates deployment**: an agent (or a new model version, or a modified prompt or policy) that fails the suite does not operate.

This produces the feedback structure:

$$\text{Assembly} \;\longrightarrow\; \text{Evaluations} \;\longrightarrow\; \text{Agent behavior} \;\longrightarrow\; \text{Observed outcomes} \;\longrightarrow\; \text{Assembly revision}$$

The assembly defines the domain; the evaluations operationalize the definition; agent behavior is selected against the evaluations; production outcomes reveal where the assembly itself is wrong; and the assembly is revised under version control (P3). Each arrow is an enforcement edge — a place where divergence becomes observable. The structure is precisely what every prior approach in §4.1 lacked, with the partial exception of digital twins, whose sensor loop is the physical-domain analogue.

The widely circulated remark that *private evaluations are the new intellectual property* (attributed to Satya Nadella, in the context of enterprise AI differentiation) reads, in this framework, as a recognition of one component's value. Our account both supports and qualifies it: evaluations are where domain understanding becomes *enforceable*, which is why they feel like the crown jewels — but an evaluation suite is the enforcement instrument of an underlying domain theory. Evals without an articulated assembly are assertions without a model: hard to extend coherently, hard to audit for coverage, and prone to encoding accidental properties of today's systems. The durable asset is the pair.

### 5.3 The model-swap test and structural capital

The framework yields an operational definition of what the earlier draft of this work called **structural capital**:

> **Structural capital is what survives a model swap.** Replace the foundation model behind an organization's agents with a different one. Whatever organizational capability persists across the swap — because it is encoded in representations the new model can consume and evaluations the new model must pass — is structural capital. Whatever degrades was implicit in the old model's weights, in prompt incantations tuned to its quirks, or in human workarounds, and was never owned by the organization at all.

The test is concrete and will be run involuntarily by every organization, repeatedly, as model generations turn over every six to eighteen months. Data largely survives a swap; application code survives; prompt libraries survive poorly; fine-tuning survives not at all. An assembly-plus-evals layer is *designed* to survive — that is property P2 — and the degree to which agent behavior reconstitutes after a swap is a direct, observable measure of how much organizational meaning has been captured in durable form.

This also gives the cleanest statement of the economic inversion the manifesto draft gestured at: as models commoditize and turn over rapidly, they take the character of interchangeable components, and competitive differentiation migrates to the slowest-changing layer that governs their behavior. The historical rhyme is the realization that source code, not the deployed application, was the asset. The candidate successor claim — to be treated as a hypothesis, not a conclusion — is that the assembly, not the agent stack, is the asset; agents become deployments of the organization's self-understanding.

---

## 6. Architectural position

### 6.1 The projection structure

If the assembly is the durable layer, everything above it is a projection: applications project the assembly into user-facing workflows; agent configurations project it into operating policies for a particular model; reports project it into views; integrations project it into other systems' terms. Projections are expected to be short-lived and cheap to regenerate — increasingly, generated in substantial part *by* agents reading the assembly.

The inversion in maintenance discipline is the practical consequence: today, when reality changes, organizations patch projections (the app, the report, the prompt) and the shared understanding silently forks. Under the projection structure, a domain change is made *once, in the assembly*, as a versioned, reviewed event, and projections are re-derived. "The concept of Customer changed" becomes a diff with an author, a review, and a propagation path — which is what P3 is for.

We note honestly that full re-derivation of projections is an aspiration with significant unsolved engineering inside it; §7 returns to this. The near-term version is weaker but already valuable: projections *validate against* the assembly, so that divergence is at least detected even where regeneration is not yet automatic.

### 6.2 Separation from the runtime layer

The assembly answers *what the domain is*; it deliberately does not answer *how agentic work executes*. Those concerns — session state, effect fulfillment, continuation, observability — belong to an agent runtime, and the same design pressure identified in this paper applies there in mirror image: a runtime should be host-neutral for the same reason an assembly is model-neutral, namely that the durable layer must not be expressed in terms of its most rapidly churning dependency.

This is the design thesis of `pppr`, developed in companion artifacts: a sans-I/O, host-neutral agent runtime in which the durable representation of *work* (intent, task structure, planning state, transitions, handoff semantics) is separated from any particular harness or host, which are treated as fulfillment layers at the edge. Logical Assemblies and `pppr` are the same architectural move — *isolate the slow-changing representation; push the volatile parts to adapters* — applied at two different layers:

| Layer | Durable representation | Volatile, swappable edge |
|---|---|---|
| Domain (this paper) | Logical Assembly | Foundation models, applications, agent stacks |
| Execution (`pppr`) | Portable work representation | Hosts, harnesses, transports, tool surfaces |

An agent system built with both separations has a defensible answer to the two churn sources that currently dominate: model turnover (absorbed by the assembly boundary, P2) and infrastructure turnover (absorbed by the runtime boundary). In SCM terms, both moves shrink the set of things whose churn can destroy signal.

---

## 7. Costs, failure modes, and limits

A framework paper that does not state how its proposal fails is a manifesto with sections. The following are the principal known hazards.

**The assembly is itself subject to entropy.** Nothing exempts the assembly from the dynamics of §2; it merely (if well-built) sits in the low-$\lambda$ compartment. It still requires owners, review practices, and budget — a *curation function* analogous to what database administration was for the schema era. An organization that builds an assembly and then disbands the team that tends it has built expensive documentation. The maintenance cost is real and recurring, and the construction pays for itself only when the value of retained signal exceeds it; small organizations, or those in domains being deliberately reinvented (where high $C$ is strategy, not pathology), may rationally decline.

**Over-formalization.** The Semantic Web's cautionary lesson was not only about missing consumers; it was also that modeling ambition outruns modeling need. The corollary in §4.3 is the guardrail: represent what something will check. An assembly scoped by enforcement rather than coverage stays small enough to maintain. The failure mode is staffing the effort with people who enjoy ontology for its own sake.

**Goodhart pressure on evaluations.** Once evaluations gate deployment, they become optimization targets, and agents (or the teams tuning them) will satisfy the letter of an eval while violating its intent. Evaluation suites therefore need adversarial review and periodic rotation, and the assembly's constraints need to be checked in production, not only at the deployment gate. This is a permanent tax, not a solvable problem.

**The formalization boundary.** Some load-bearing organizational knowledge is tacit, political, or legitimately ambiguous — *which constraints are actually negotiable, for whom* is often the most operationally important fact in a domain and the least writable-down. An assembly that pretends to capture this will be wrong with confidence; one that omits it leaves agents naive in exactly the situations where errors are most expensive. The honest position is that assemblies capture the formalizable core and that the boundary of formalizability is an empirical question each organization discovers, painfully, at its own edge.

**Wrongness propagates with the same efficiency as correctness.** The projection structure of §6.1 is a force multiplier without a sign. A defective assembly entry, consumed by many agents across many projections, produces *correlated* failure — potentially worse than the uncorrelated local errors of the siloed status quo. Versioning (P3) plus staged rollout of assembly changes, treated with the seriousness of schema migrations, is the mitigation; it is also more discipline than most organizations currently apply to meaning.

**The cold-start problem.** Extracting an assembly from a running organization is the knowledge-acquisition bottleneck again. The new factor is that agents themselves can now do much of the archaeology — reading code, schemas, tickets, and transcripts to *propose* assembly entries for human ratification. Whether this reduces the bottleneck enough to change the adoption economics is, candidly, the load-bearing empirical bet of the whole program.

---

## 8. Falsifiable expectations

The framework predicts the following. Each is stated so that its failure would count against the thesis.

1. **Differential decay is observable.** In any organization, audit a sample of knowledge artifacts for staleness (divergence from current reality). Artifacts on an enforcement path (compiled contracts, gating tests, monitored twins) will show materially lower staleness than expressively comparable artifacts off such paths (wikis, reference models, non-gating ontologies), controlling for age and domain volatility. If staleness turns out to track tooling quality or initial investment rather than enforcement, the §4 thesis is wrong.

2. **The model-swap test discriminates.** Among organizations operating agents, those with eval-gated deployment over runtime-independent domain representations will reconstitute agent capability after a foundation-model swap measurably faster, and with fewer behavioral regressions, than those whose domain knowledge lives in model-tuned prompts and fine-tunes. If swap costs turn out to be dominated by factors orthogonal to representation (e.g., raw model capability deltas), the structural-capital claim is overstated.

3. **Enforcement-scoped assemblies outlive coverage-scoped ones.** Assembly efforts scoped by "what will something check" will still be maintained and consumed three years on at a higher rate than efforts scoped by "model the domain." This is the prediction that distinguishes the present proposal from a rebranded ontology program; if both cohorts rot at similar rates, the proposal *is* a rebranded ontology program.

4. **Evals without assemblies plateau.** Organizations that accumulate evaluation suites without an articulated domain representation will hit a coherence ceiling — duplicated and contradictory evals, inability to audit coverage — that assembly-backed suites do not, observable as a divergence in eval-suite maintenance cost over time.

---

## 9. Conclusion

The Structural Consequence Model says that consequence accumulates as time integrates the ratio of retained signal to entropy, and that time gives nothing for free. For organizations, the model converts the question of agentic AI from "which model?" — a question whose answer churns semiannually and is therefore nearly pure entropy — into "what structure retains our understanding while everything around it churns?"

This paper has proposed an answer with a built-in discipline. A Logical Assembly is a machine-consumable, runtime-independent, versioned representation of a domain — concepts, relations, constraints, events, policies, and evaluations — that earns durability not from its formality but from being load-bearing: wired into agent operation through evaluation gates and production checks so that divergence from reality announces itself. The supporting thesis, that representations decay at rates set by enforcement rather than expressiveness, is offered as an explanation of forty years of mixed results in knowledge representation, and it cuts both ways: it explains why this construction could succeed where ontologies failed, and it specifies exactly how this construction becomes the next failure if it is built as coverage rather than enforcement.

The claims here are framework-level and the largest of them — that assemblies become the durable asset while models and applications become interchangeable projections — is a hypothesis with stated tests, not a conclusion. What can be said with more confidence is the conditional: *if* organizational meaning can be held in a low-decay compartment at all, it will be held in structures with the properties described here, because those properties are reverse-engineered from every representation that has ever survived its authors.

---

## References and traditions

The paper draws on, and positions itself against, the following bodies of work; canonical entry points are given rather than exhaustive citations.

- **Structural Consequence Model** — companion formal note (`scm.pdf`, this repository); the earlier manifesto-form draft of the present argument is `lasm-scm.md`.
- **Expert systems and the knowledge-acquisition bottleneck** — Buchanan & Shortliffe, *Rule-Based Expert Systems* (1984); Lenat & Guha on Cyc, *Building Large Knowledge-Based Systems* (1990).
- **Semantic Web and ontologies** — Berners-Lee, Hendler & Lassila, "The Semantic Web," *Scientific American* (2001); W3C RDF/OWL specifications; Guha, Brickley & Macbeth, "Schema.org: Evolution of Structured Data on the Web," *CACM* (2016).
- **Domain modeling as engineering practice** — Evans, *Domain-Driven Design* (2003), whose "ubiquitous language" is the nearest prior articulation of organization-owned domain meaning, enforced (where it is enforced) through code.
- **Event semantics** — Fowler on event sourcing; the CQRS literature, as prior art for treating domain events as first-class, durable records.
- **Digital twins** — Grieves & Vickers, "Digital Twin: Mitigating Unpredictable, Undesirable Emergent Behavior in Complex Systems" (2017), as the instrumented-enforcement precedent.
- **Evaluations as organizational assets** — the practitioner literature on LLM evaluation harnesses (2023–); the "private evals are the new IP" framing attributed to Satya Nadella (2025) in discussion of enterprise AI differentiation.
- **Host-neutral agent runtimes** — the `pppr` companion artifacts in this repository, especially `pppr_as_intermediate_representation.md` and `pppr_state_of_the_union.md`, for the execution-layer instance of the same separation.
