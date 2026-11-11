# pppr: pivot to a terminal testing rig

## Decision

pppr is a minimal, representative terminal environment for testing other agentic
tools. The user clarified the purpose: "rather than innovating at the layer of
the harness," this project should be a testing rig for the tools they create.

Pi supplies the established agent environment. Experiments should concentrate on
the tools, their interfaces, and how an agent uses them to complete real tasks.

## What changed

The previous incarnation combined an inherited Pi monorepo with a custom pppr
intermediate representation, runtime, effect protocol, and host-adapter design.
That work explored useful ideas but added harness development to the experiment.

The working application now lives in three files under root `src/`. It uses
published Pi 0.57.1 packages for agent sessions, model access, standard coding
tools, project instructions, extension loading, and session persistence. The local
code selects test inputs and connects ordinary terminal I/O to Pi's SDK.

The user subsequently authorized deleting the entire legacy `packages/` tree.
The local forks, custom IR/runtime, old interfaces, and their package-level tests
and documentation have been removed. Git history and earlier Reffy artifacts
retain the historical context. Earlier artifacts describe prior directions, not
requirements to recreate those subsystems.

## Working baseline

- Plain terminal conversations and one-shot prompts.
- Piped input and native Pi JSONL events for scripted experiments.
- Pi's `read`, `bash`, `edit`, and `write` tools, with selectable built-ins.
- Explicit Pi extensions and skills for the tools under test.
- Project instructions, persistent Pi sessions, continuation, and ephemeral runs.

The user reports having exercised all five workflows in the usage walkthrough:
conversation, project context, extension tools, repeatable runs, and resumption.
Inspection of transcripts in `~/.pppr/agent/sessions` independently confirmed live
GPT-4o responses using the correct working directory and project instructions,
a successful `probe` call with `hello` returning `hello`, and subsequent recall
of that call and result. These local transcripts contain the proof, not a
repository fixture or a new transcript format.

Four offline integration tests also cover Pi's actual tool loop, extension
lifecycle, session restoration, JSONL output, piped input, and invalid inputs.
Terminal smoke checks exercised interactive prompts and session commands.

## Implications for future work

Use shell commands for tools that already have a CLI. Use ordinary Pi extensions
for structured tool calls and skills for explicit operating guidance. Compare
tool behavior across realistic prompts and inspect the resulting events and
transcripts. Keep changes to pppr small and driven by friction in those experiments.

The custom IR, host-neutral runtime, Paseo adapters, full-screen interfaces, and
inherited monorepo release machinery are outside the current product direction.
The cleanup removes `packages/`; any legacy root scripts still present are
separate cleanup candidates and are not application entrypoints.

## Related context

- [Minimal harness exploration](pppr_minimal_harness.md) records the original
  preference for small tool surfaces, shell composition, and observable state.
- [Inherited Pi surface audit](pppr_pi_surface_audit.md) records the earlier
  package inventory; its IR-centered recommendations are historical.
- [Terminal harness change](../reffyspec/changes/simplify-to-terminal-harness/proposal.md)
  records implementation scope and the architecture pivot.
- [Current usage](../../README.md) describes the working application.
