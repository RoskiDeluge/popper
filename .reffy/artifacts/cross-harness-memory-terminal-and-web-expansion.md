# Shared memory experiment: more terminal agents and web participants

Date: 2026-11-16 Pacific/Honolulu.
Status: exploratory direction approved for capture; implementation and additional
live trials have not started.

## Direction

Continue testing Codex, Claude Code, and pppr as the primary group. Add Nous
Research's Hermes Agent as the preferred fourth terminal participant when we
expand coverage. Extend the experiment afterward to ChatGPT and Claude.ai through
a proposed remote MCP interface to the same Paseo memory service.

The question is whether independently started agents can continue each other's
work through explicit shared memory, across both terminal and hosted web
interfaces. A useful outcome is a finding investigated in a browser that a
terminal agent can retrieve, verify, and extend, or the reverse.

| Surface | Participants | Position |
| --- | --- | --- |
| Terminal | Codex, Claude Code, pppr | Existing baseline; deepen testing |
| Terminal | Hermes Agent by Nous Research | Preferred fourth participant |
| Web | ChatGPT, Claude.ai | Proposed participants through remote MCP |

OpenWorker was considered. Its linked Harness SDK uses a Rust engine and requires
an application integration; its desktop application uses a separate Python engine.
The preference is to defer it and test another ready terminal agent first. This
is a choice about experimental fit, not a measured assessment of quality.

## Existing evidence and limits

`popper-memory-live-acceptance.md` records three passing rotations in fresh Docker
isolates. Each of Codex, Claude Code, and pppr wrote a finding, recalled another
participant's finding and added a linked follow-up, and read a complete chain.
One Claude writer needed explicit recovery after a confirmed pre-write failure;
the original failure is preserved. The journal and source references were checked
independently against GitHub. `popper` is the existing protocol label for pppr.

That result establishes a small, sequential, explicit-invocation experiment. It
does not establish automatic recall, a reliability rate, authenticated participant
identity, or concurrent-write safety. The completed result should remain intact;
new trials should have their own projects, markers, receipts, and reports.

## Why Hermes

Hermes provides a terminal interface, shell tools, skills, and model selection.
This makes it a plausible participant in the existing explicit shell workflow
without first building an application around an SDK.

Its built-in memory and external memory-provider interface also offer two
different questions to investigate:

1. Can a fresh Hermes participant use the same explicit Paseo workflow as the
   original three, without relying on previous local memories or conversations?
2. Later, could Paseo implement a Hermes memory-provider integration for automatic
   recall and persistence? This is a separate experiment, not a prerequisite for
   the first trial or a capability we have verified.

Hermes documents automatic loading of local memory and session search. Each
participant therefore needs a fresh Hermes home, with no inherited notes,
conversation database, or learned skills containing trial data. Verify the
available controls rather than assuming a single memory-off switch removes all
state. No external memory provider should be configured for the explicit trial.

Match Hermes and pppr to the same exact model where supported, and record model
and harness versions. The original experiment used different models; model
matching would reduce that source of ambiguity. Additional participants increase
coverage, while repeated trials are needed to estimate reliability.

## Proposed web connection

Provide a narrow, authenticated remote MCP interface for journal writes,
briefings, and outcome reconciliation. These are conceptual operations; tool
names and schemas remain to be designed. Translate them into the existing Paseo
protocol and preserve its validation, logical event identities, request IDs,
conflict handling, and pinned GitHub evidence.

ChatGPT documents custom MCP apps with read/write capabilities, subject to account,
workspace, and administrator availability. Claude.ai documents custom remote MCP
connectors. Neither product has been connected to our test manager. Confirm both
accounts' capabilities and the authentication/deployment requirements before
choosing an implementation.

The bridge would hold the required service credentials and expose only the
experiment's operations and project scopes. Credentials must stay outside model
prompts, tool results, committed configuration, and evidence. Participant labels
remain attribution data unless separately bound to authenticated principals.
MCP does not by itself establish that binding.

## Suggested trial coverage

| Trial | Example handoff | Evidence sought |
| --- | --- | --- |
| Hermes roles | Three rotations placing Hermes as initial writer, recall/follow-up participant, and final reader | Same protocol works for a fourth terminal agent |
| Terminal to web | pppr writes; fresh ChatGPT chat recalls and extends | Web participant can continue terminal work |
| Web to terminal | Claude.ai writes; fresh Codex recalls | Terminal participant can continue web work |
| Web to web | ChatGPT writes; fresh Claude.ai recalls and extends | Both hosted products use the same shared records |

Use new unpredictable markers for every trial. Reader prompts must omit expected
answers, prior receipts, and prior transcripts. Verify exact content, project
scope, source references, and parent links independently against GitHub. Capture
MCP requests/results and server receipts alongside the visible conversation;
an answer or screenshot alone does not prove the retrieval path.

Keep the existing distinction between failed and unknown outcomes. Reconcile an
uncertain write before a new attempt, and preserve unsuccessful attempts rather
than replacing them with eventual successes. Include negative controls such as
an empty unrelated project and a reader without access to shared memory.

## Isolation and comparison

Terminal participants can run entirely inside fresh Docker isolates. Hosted web
participants cannot inherit that same execution boundary: the provider controls
their runtime, while we control conversation setup, account settings, supplied
context, and exposed tools. Report these as different evidence conditions.

For each web trial, start a new conversation without prior project context and
record the selected model, memory/personalization settings, instructions,
connected tools, tool approvals, and any manual intervention. Verify that the
chosen setup permits MCP tools while excluding previous trial context. Do not
assume a new chat or a temporary/incognito mode alone guarantees both properties.

Record terminal automation time separately from web interactions and approval
delays. These trials measure interoperability; they should not be presented as a
ranking of models or directly comparable execution speeds.

## Proposed sequence and open questions

1. Deepen coverage of the original three with repeated runs and targeted failure
   cases, including currently unproven concurrency or recovery behavior where
   useful.
2. Verify a pinned Hermes installation in the container environment, extend the
   experiment's harness allowlists, and exercise its three participant roles.
3. Design the shared remote MCP bridge and validate its protocol behavior before
   connecting web products. Keep experiment integration under the example; add
   no new pppr core harness abstraction.
4. Connect ChatGPT and Claude.ai and run the cross-surface trials with separately
   documented isolation controls.
5. Consider automatic memory integrations only after explicit interoperability
   is demonstrated.

Before implementation, resolve which web accounts/workspaces support the required
tools, where the MCP endpoint will run, how authentication restricts project
access, and which evidence can be exported without secrets. Choose a repeat
count and model configurations if the next milestone will make reliability
claims. The current fixture bounds briefings to a small project; broader or
concurrent trials need an explicit capacity and consistency design.

This artifact captures research and direction. A later ReffySpec change should
define the implementation scope and acceptance criteria without reopening or
silently expanding the completed three-harness milestone.

## References

Local evidence and implementation:

- [Three-harness acceptance](popper-memory-live-acceptance.md).
- [Verified remount fix](popper-memory-remount-verified.md).
- [Experiment implementation and protocol](../../examples/cross-harness-memory/README.md).

Primary documentation reviewed during discussion on 2026-11-16; product access
and APIs should be checked again before implementation:

- [OpenWorker Harness SDK](https://github.com/andrewyng/openworker/blob/main/harness/README.md).
- [Hermes Agent](https://github.com/NousResearch/hermes-agent).
- [Hermes persistent memory](https://github.com/NousResearch/hermes-agent/blob/main/website/docs/user-guide/features/memory.md).
- [Hermes external memory providers](https://github.com/NousResearch/hermes-agent/blob/main/website/docs/user-guide/features/memory-providers.md).
- [ChatGPT developer mode and MCP apps](https://help.openai.com/en/articles/12584461).
- [ChatGPT temporary-chat controls](https://help.openai.com/en/articles/8914046-temporary-chat-in-chatgpt).
- [Claude custom remote MCP connectors](https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp).
