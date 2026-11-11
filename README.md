# pppr

A minimal terminal rig for testing agentic tools in a representative coding-agent
environment. Pi supplies the agent loop, model providers, standard tools, project
instructions, extension lifecycle, and session storage. pppr supplies shell I/O
and selects the tools under test.

## Run

Requires Node.js 22 or newer.

```sh
npm ci
export OPENAI_API_KEY=...
npm start -- --model openai/gpt-4o
```

Use Pi's provider environment variables or credentials in
`~/.pppr/agent/auth.json`. Set `PPPR_MODEL` to avoid repeating `--model`.
`--agent-dir` or `PPPR_AGENT_DIR` selects an independent test configuration.
Models can also be configured through Pi's `models.json` in that directory.

The interactive loop accepts one request per line. `/new` starts a fresh Pi
session; `/exit` or Ctrl-D exits. Ctrl-C cancels an active request or exits at the
prompt. There is no full-screen interface.

For scripts and pipelines:

```sh
npm start -- --model openai/gpt-4o -p 'Review README.md'
git diff | node --import tsx src/cli.ts --model openai/gpt-4o 'Review this diff'
node --import tsx src/cli.ts --model openai/gpt-4o --json 'Inspect the project' > events.jsonl
```

Use `node --import tsx src/cli.ts` when stdout must contain only agent output;
`npm start` also prints npm's script banner. JSON mode emits native Pi events as
JSONL. Text mode streams assistant text to stdout and tool activity to stderr.
Failed one-shot runs exit nonzero.

## Exercise a tool

Tools that already expose a CLI can be exercised directly through Pi's `bash`
tool. To expose a structured tool, use an ordinary Pi extension:

```sh
npm start -- --model openai/gpt-4o --extension ./examples/tool.ts 'Call probe with value hello'
npm start -- --model openai/gpt-4o --extension /path/to/your/extension.ts --skill /path/to/your/skill
```

[examples/tool.ts](examples/tool.ts) is a small starting point: replace its execute
body with the tool you are testing. Repeat `--extension` and `--skill` to combine
resources. Paths resolve from the invoking shell; `--cwd` selects the tools'
working directory and Pi's project instruction context.

The default built-in tools are `read`, `bash`, `edit`, and `write`. Use
`--tools read,bash` to narrow them, or `--no-tools` to exercise only extension
tools. Automatic extension and skill discovery is disabled. Pi still loads
project instructions and configuration, so use `--cwd` and `--agent-dir` to
control the experiment's environment. Extensions requiring Pi's full-screen UI
are outside this rig's scope. Arbitrary extension CLI flags are not forwarded.

## Sessions

Pi transcripts are saved under `~/.pppr/agent/sessions`. Use `--continue` to resume
the latest session for the working directory, `--session <file>` to open a
specific transcript, or `--no-session` for an ephemeral run. Tool calls and
results remain inspectable in Pi's normal session format.

## Develop

The application is three files under `src/`. Dependencies are pinned to the Pi
0.57.1 API this repository originally used, now installed as published packages.

```sh
npm run check
npx vitest run test/rig.test.ts
```

The tests use an offline Pi provider and an actual extension to verify tool
execution, lifecycle events, JSONL, piped input, and session restoration. They
make no model API requests. `npm run build` compiles the CLI to `dist/cli.js` for
running with `node dist/cli.js`.

The previous `packages/` tree, including the Pi monorepo fork and custom IR
implementation, has been deleted. Git history retains that source. Legacy root
scripts such as `pi-test.sh` describe the former workspace and are not entrypoints
for this rig. The pivot is documented in the Reffy artifact
[pppr terminal testing rig pivot](.reffy/artifacts/pppr-terminal-testing-rig-pivot.md)
and the implementation change
[simplify-to-terminal-harness](.reffy/reffyspec/changes/simplify-to-terminal-harness/proposal.md).

MIT. Pi is by Mario Zechner; see [LICENSE](LICENSE).
