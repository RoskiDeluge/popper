# Tasks

- [x] Replace root workspace configuration with the terminal rig application.
- [x] Implement terminal input/output around Pi's SDK.
- [x] Support explicit extensions and skills, session continuation, and JSONL events.
- [x] Document setup, tool testing, and the superseded architecture.
- [x] Verify an extension through Pi's real agent loop without live credentials.
- [x] Run focused tests, CLI smoke checks, and `npm run check`.

Validation: `npm run check`; `node node_modules/vitest/vitest.mjs run test/rig.test.ts`
(four passing tests); a PTY smoke run covering the prompt, tool execution, `/new`,
`/exit`, and extension cleanup; `git diff --check`; and
`reffy plan validate simplify-to-terminal-harness`.
