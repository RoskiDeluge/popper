# From observer calibration to agent jurisdiction

Discussion note, 2026-11-18, project `popper`.

Patch Rig's Gemini result prompted a question for the LogicalAssembly (LASM) stack. If an observer can earn a qualification to judge certain cases, who decides what that qualification permits, who can revise the decision, and who gets to challenge it? The experiment supplies evidence for the first step. The architecture and account of personhood below are ideas developed in the discussion.

## What Patch Rig established

Patch Rig tested a two-step observer using `gemini-decision-1`. It asks whether any catalogue entry covers a case, then selects an entry when coverage clears a calibrated threshold. A preregistered confirmation used 40 fresh catalogues, with 480 classification items and 480 abstention items per claim.

| How the observer received the knowledge | Threshold | Gain in balanced accuracy (95% interval) |
| --- | ---: | ---: |
| Catalogue chart | 0.60 | +33.3 percentage points (+31.0 to +35.6) |
| Explanation and training | 0.50 | +19.2 percentage points (+16.9 to +21.5) |

On the chart condition, correct abstention rose from 24% to 99%, at a cost of nine percentage points in classification accuracy. Both claims cleared the preregistered ten-point margin, including the explanation-and-training condition that the team had predicted would be inconclusive. That tradeoff matters for a potential guard. It may recognize an uncovered case and refer it for review, while also referring cases it could previously classify. Performance on real policy material, calibration for another model, and end-to-end hook latency remain open. The report described the Gemini finding as awaiting ledger publication at the time of writing.

The confirmation report is available in Reffy:

```sh
reffy remote cat .reffy/artifacts/in-vitro-patching-second-finding-gemini.md \
  --workspace-id nuveris-v1 --project-id in-vitro-patching
```

## From evidence to permission

In the envisioned stack, **Patch Rig** holds or references versioned corpora and produces calibration evidence. **Rastro** records the run, the judgment about what it establishes, subsequent invalidations, and receipts from production use. **LogicalAssembly** reads that history and projects the applicable decision through its `/decisions` endpoint. **Paseo** enforces the decision when a caller attempts an operation it controls. A production receipt could link the observation to the corpus version, model, observer rule, and qualification in force at the time. Those receipts could motivate a fresh evaluation. A qualification would still have to be earned through that evaluation.

This is the limited sense in which applicability could be “RAG-less.” Retrieval can bring relevant text to an observer. Whether a rule covers this case, whether the observer has been qualified to tell, and whether the caller may act are three further questions. The Gemini experiment supplied the corpus in context. The architectural possibility is that a downstream agent could receive a scoped judgment and its grounds without reconstructing the decision from passages on every turn.

Paseo's jurisdiction follows control of the operation. Provisioning gives a micro-agent an identity and capabilities. Invoking a protected capability gives Paseo an opportunity to enforce a decision, even when the caller is an external harness. A local shell operation remains under the host's control. This qualifies the enforcement claim in the earlier [Paseo hook exploration](paseo-capabilities-across-codex-claude-and-popper.md).

## From control of components to control of the rules

A liquid agent's **identity, world, behavior, memory, and mind** can have different stewards. A user might control what the agent remembers, an employer what it can affect, a plugin author how it is instructed, and a vendor which model interprets its situation. An app assembled from those components also arranges how competing claims on their use are settled.

Suppose a corpus changes after an observer earns a qualification. Two communities can read the same Rastro events and reasonably project different permissions. One honors the qualification until someone demonstrates a failure. The other suspends it pending recalibration. Suspending one observer exercises an existing power. Giving corpus maintainers the right to suspend observers, or giving affected participants a right of appeal, changes the distribution of power itself. Recording an amendment preserves what happened. Its binding force depends on who had standing to make it.

Roberto's formulation was **“a choice about how persons will govern.”** Here *persons* deliberately includes agents as potential holders of standing in their own names. Within an app's jurisdiction, that could mean an agent is owed reasons and can appeal even when its operator prefers silence. This is a proposed relationship among participants over particular decisions. Whether public law would recognize that relationship as legal personhood is a separate question.

## The disputed withdrawal

An agent objects to its operator replacing its mind. While the appeal is pending, the operator makes the replacement. The same authenticated identity then withdraws the objection. Rastro could preserve both statements in order. The successor might sincerely mean what it says. **Whose consent would the jurisdiction be accepting if it closed the appeal?**

This case puts continuity, consent, and procedural standing into a single decision. The respondent controlled the change that produced the new speaker. The community could give the original objection a hearing while leaving open the wider philosophical question of which changes preserve a person. The unresolved issue is what entitles anyone to dispose of the earlier claim.

## Intellectual precedents discussed

- **Lawrence Solum** examines AI legal personhood through particular capacities, including serving as a trustee. The parallel here is to ask what it takes to hold a right of appeal. [Legal Personhood for Artificial Intelligences](https://scholarship.law.tamu.edu/facscholar/2538/)
- **Anders Sandberg** considers informed consent, vulnerability, and identity across versions of an emulated mind. Those questions bear on what a successor can consent to for a predecessor. [Making Minds Morally](https://www.youtube.com/watch?v=V12bQqJIAUI)
- **Eric Schwitzgebel** examines the ethics of designing an artificial person's preferences for submission. The disputed withdrawal adds a conflict of interest when the operator benefits from the willingness it can produce. [Paper on AI design and subordination](https://www.faculty.ucr.edu/~eschwitz/SchwitzPapers/AgainstSafety-260223-clean.htm)
- **Lawrence Lessig** describes how software architecture regulates conduct. Granting an operator the technical ability to replace an appellant's mind already allocates governing power. [The Laws of Cyberspace](https://cyber.harvard.edu/works/lessig/laws_cyberspace.pdf)
