# Project Context

## Purpose
Popper is a small, human/agent-friendly Unix-style shell focused on readable built-ins, sane defaults, and simple extensibility for automation.

## Tech Stack
- Rust 1.80 (edition 2021)
- rustyline for line editing, completion, hints, and history
- anyhow/thiserror for error handling (pattern of choice)
- bytes for buffer-friendly helpers (available for future parsing/IO work)

## Project Conventions

### Code Style
- Use `cargo fmt` for formatting and `cargo clippy` for linting.
- Keep modules minimal and explicit; prefer small helper functions over implicit side effects.
- Favor `Result<anyhow::Error>` for fallible flows; define custom errors with `thiserror` if behavior-specific.
- Stick to standard library primitives unless a dependency adds clear value.

### Architecture Patterns
- Single binary CLI (`src/main.rs`) with a REPL loop driven by rustyline.
- Helpers:
  - `ShellHelper` implements completion/highlight/hints.
  - `parse_arguments` handles quoting/escapes; `parse_redirection` extracts stdout/stderr targets; `find_in_path` resolves executables.
  - Built-ins are handled inline before spawning processes; pipelines are orchestrated via `execute_pipeline`, with built-in output piped through a helper `cat` process when needed.
- Unix-first implementation (uses `std::os::unix` for exec/permissions).

### Testing Strategy
- Default: `cargo test`.
- Add unit tests for parsers (`parse_arguments`, `parse_redirection`) and PATH/builtin resolution.
- Use integration tests with `Command` to cover pipelines, redirection, and history behaviors when adding features.
- Manual smoke: `cargo run` and exercise built-ins (`echo`, `cd`, `pwd`, `type`, `history` flags), pipelines, and redirections.

### Git Workflow
- Assume trunk on `main`; develop in short-lived feature branches and merge via PR.
- Keep commits focused and descriptive; rebase locally before PR when practical.

## Domain Context
- Built-ins: `echo`, `exit [code]`, `type`, `pwd`, `cd`, `history` (with `-r/-w/-a` and optional count).
- History persists to `$HISTFILE` when set; starts populated from that file if present.
- Supports pipelines and stdout/stderr redirection (`>`, `>>`, `1>`, `1>>`, `2>`, `2>>`, with or without spacing).
- External commands resolved via `PATH` and executed with original arg0 preserved.

## Important Constraints
- Target is Unix-like systems only (uses `std::os::unix` permissions/exec).
- Minimal dependency set; prefer keeping the shell lightweight and fast.
- Avoid breaking built-ins or pipeline/redirection semantics without a proposal.

## External Dependencies
- None beyond standard OS commands available on the host; relies on `PATH` executables for non-builtins.
