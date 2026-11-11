# Changelog

## [Unreleased]

### Changed

- Pivot pppr from a custom IR/runtime and Pi monorepo to a terminal testing rig
  using published Pi packages. Historical package source is excluded from the
  active application.

### Added

- Plain interactive input, one-shot and piped prompts, and native Pi JSONL events.
- Explicit Pi extensions and skills, selectable built-in tools, Pi session
  continuation, and ephemeral runs.
- A sample tool extension and offline integration checks of Pi's tool loop,
  session restoration, extension lifecycle, and CLI output.

### Removed

- The legacy `packages/` tree, including the inherited Pi monorepo packages and
  custom pppr IR/runtime implementation. The terminal rig uses published Pi packages.
