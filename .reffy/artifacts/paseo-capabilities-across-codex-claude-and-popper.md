# Paseo Capabilities Across Codex, Claude Code, and Popper

Date: 2026-11-14. Exploration for the Paseo developers, from project `popper`.

## The opportunity

Roberto has three harnesses on the same computer: Codex, Claude Code, and
Popper. That gives us a practical setting for exploring the idea in
`paseo-core`'s `paseo-as-an-agent-plugin-hook.md`: extend an agent through a
Paseo pipe, with durable capability living behind the connection.

The interesting claim is that a harness can acquire memory, specialist work,
or policy consultation without owning that capability's implementation or
lifetime. A plugin supplies instructions and connection details. A Paseo
actor supplies persistent identity and state. Changing harnesses need not
mean abandoning the relationship with that actor.

Working hypothesis: connect all three harnesses to one shared Paseo actor,
using a small adapter for each. First demonstrate memory across harnesses;
then test shared policy and the enforcement each harness can actually offer.
The shared actor is a proving shape, not a commitment that every capability
or user must share a single actor.

## Two ways to reach the same capability

| Integration | Trigger | Candidate uses |
| --- | --- | --- |
| Explicit pipe invocation | The agent chooses to invoke a CLI or exposed tool | Recall, record a finding, delegate specialist work, consult policy |
| Lifecycle hook | The harness invokes an adapter at a supported event | Automatic journaling, session briefing, checks before tool execution |

Both paths could invoke the same actor. Explicit calls make the capability
available during work; hooks connect it to lifecycle events automatically.
A skill can explain when and how to invoke the pipe. The host-specific
integration determines whether calls happen automatically and whether a
decision can block an action.

“Any agent” is therefore a portability goal whose depth depends on the host.
Shell invocation can provide a useful initial connection where available.
Automatic briefing, comprehensive journaling, and enforceable guards require
appropriate host extension points. Installing the same instructions everywhere
does not establish equivalent behavior.

## The four shapes form a loop

1. **Journal:** preserve selected events and findings from one session.
2. **Briefing:** retrieve relevant memory in a later session, including one
   running in another harness.
3. **Guard:** consult shared policy before a proposed action and record the
   decision and its basis.
4. **Witness:** let a separate reader inspect decisions and observed outcomes.

The journal-to-briefing loop is the first useful capability to prove. Work
done in Codex could inform Claude Code; a result produced in Popper could
inform a later Codex session. Returned context should retain its project,
source harness, session, and evidence references so that recall remains
attributable rather than becoming an undifferentiated shared transcript.

The same actor could later connect a policy decision to the subsequent
observed action. The witness reader would need to distinguish a proposed
action, a decision about it, and evidence of what actually happened.

## A concrete experiment

### First: demonstrate shared memory

- Choose one disposable project and a benign finding with a unique marker.
- In harness A, record that finding through an explicit Paseo invocation.
- End the session. Start a fresh session in harness B, without passing A's
  transcript or the finding in its prompt.
- Ask B to retrieve a briefing from the same actor. Verify the marker,
  source identity, and supporting reference are returned.
- Have B record a follow-up. Retrieve both contributions from harness C.
- Rotate the harnesses through these roles. Keep each harness's normal
  local session storage separate so it cannot explain the transfer.

This establishes continuity through Paseo. It does not yet establish that
hooks automatically collect or inject anything.

### Next: attach lifecycle integration where supported

Map each installed harness's actual extension points before wiring it up.
Use a hook or extension to journal a selected event and request a briefing
at an appropriate lifecycle point. Repeat the memory experiment and compare
the automatic path with explicit calls.

Popper is both a participating harness and a controlled environment for
exercising the integration. Its current application uses Pi's agent loop,
tools, extension lifecycle, and sessions. Its README documents explicit
`--extension` and `--skill` loading, with automatic discovery disabled. An
ordinary Pi extension or a shell invocation is the starting point to assess;
this exploration does not call for another harness abstraction.

The exact installed Codex and Claude Code hook, plugin, and context-injection
surfaces have not been audited here. This artifact makes no claim that the
three hosts support identical events or blocking semantics.

### Then: test a shared guard

Use a harmless fixture action and a simple deterministic policy. Observe an
allowed action and a denied action in each harness, checking actual fixture
effects as well as the displayed decision. Exercise timeout and unreachable
service cases, and record each adapter's effective failure behavior.

An explicit policy consultation demonstrates advice. A guard demonstrates
enforcement only when the host prevents the denied action on the tested
execution path. Broader authority claims require checking bypass paths and
the ability to disable or modify the integration.

Roberto is interested in guard and journal together. Memory is the first
observable milestone; guard work can proceed alongside it without treating
unmeasured model latency as an established hook budget.

## What should be shared, and what belongs in adapters?

Candidate shared content includes skill instructions, action meanings,
memory selection rules, policy versions, and evidence conventions. Candidate
adapter responsibilities include host-event translation, output formatting,
context insertion, timeouts, and mapping transport failures or guard
decisions into the host's actual behavior.

This is a place to discover the smallest common contract through use. It
does not require Paseo's invocation protocol to adopt a particular harness's
event schema. Nor does it establish that one plugin manifest can install
unchanged across all three hosts. A common behavior package with small host
adapters is the hypothesis to test.

Useful experimental record fields would include project scope, source
harness, session ID, event ID, proposed tool call where relevant, and the
Paseo invocation `trace_id`. A guard record should also identify its policy
version. These are candidate application payload fields, not proposed new
Paseo wire requirements. Client-supplied labels provide correlation; they
are not automatically authenticated identities.

## Questions the experiment must keep honest

- **Enforcement:** policy stored outside a harness is protected from local
  edits, but local actions are controlled only where the harness enforces
  the answer. Record the boundary actually demonstrated.
- **Delivery:** asynchronous journaling needs a stated delivery policy,
  stable event IDs, and deduplication behavior. A retry should not silently
  become a second event. A successful invocation proves receipt of that
  invocation, not completeness of the session history.
- **Concurrency:** serialized actor handling does not establish the causal
  order of events emitted by multiple harnesses. Preserve enough source
  information to interpret concurrent or late arrivals.
- **Scope:** demonstrate intentional sharing within the test project and
  avoid leaking its context into an unrelated project's briefing. Decide
  which event content needs to leave the machine.
- **Latency and failure:** measure end-to-end adapter and transport costs,
  including tail latency. Record timeout behavior per host. The Decisions
  adapter discussed in the Paseo artifact is a candidate for later guard
  evaluation; its suitability and latency remain unproven here.
- **Witness evidence:** distinguish remote decision records from observed
  tool outcomes, failed delivery, and missing coverage. A complete-looking
  view must not hide unobserved activity.

The Paseo witness RFP prefers a Rastro episode reader and leaves the emitter
deferred until there is a reader. This experiment could provide concrete
records and consumer needs without first committing to a new witness UI or
a second ledger inside Paseo.

## Questions for the Paseo developers

1. Can existing invocation and memory surfaces support the shared journal
   and briefing experiment directly? Which existing agent or skill is the
   best starting point?
2. What is the smallest useful behavior package shared by the three hosts,
   and which files or adapter logic must remain host-specific?
3. Should journal, briefing, and guard initially be actions on one actor,
   or do existing authority and state boundaries favor separate actors?
4. What receipt, deduplication, and query behavior already exists, and what
   would the experimental adapters need to supply?
5. Which evidence from this experiment would make the witness-view RFP
   actionable for LogicalAssembly and Rastro?

## Reffy references and handoff

The following artifacts were read from project `paseo-core` in workspace
`nuveris-v1`:

- `.reffy/artifacts/paseo-as-an-agent-plugin-hook.md` — the hook/pipe
  connection, four shapes, failure-policy questions, and Patch Rig follow-up.
- `.reffy/artifacts/paseo_as_the_missing_pipe.md` — durable capability as a
  composable stage, with durability per completed stage rather than an
  automatic guarantee for an entire pipeline.
- `.reffy/artifacts/agent_skills_and_plugins_in_the_micro_agent_stack.md` —
  behavior packaging, host-specific hooks, and credentials kept out of
  distributable plugin files.
- `.reffy/artifacts/lasm_harness_witness_view_rfp.md` — witness consumers,
  candidate read paths, and the deferred Rastro emitter.

Local context: `README.md` and the conversation establishing Codex, Claude
Code, and Popper as the three available harnesses. This note records an
experiment to discuss; adapters have not been implemented or measured.

After this artifact is published to `nuveris-v1`, Paseo developers can read it
from project `popper`:

```sh
reffy remote cat .reffy/artifacts/paseo-capabilities-across-codex-claude-and-popper.md \
  --workspace-id nuveris-v1 --project-id popper
```
