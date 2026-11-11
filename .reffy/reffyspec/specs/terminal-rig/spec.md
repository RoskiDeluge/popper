# terminal-rig Specification

## Purpose
Define pppr as a minimal, representative terminal testing rig for agentic tools,
using Pi for agent behavior, tools, context, extensions, and session storage.

## Requirements

### Requirement: pppr SHALL be a terminal testing rig built on Pi

Pi SHALL own the model interaction, agent loop, tool execution, context loading,
and session format. pppr SHALL provide only shell input/output and configuration.

#### Scenario: exercising another agentic tool

- **WHEN** a user selects a Pi extension with `--extension`
- **THEN** the rig loads it through Pi's resource loader and binds its lifecycle
- **AND** the extension's tools run through Pi's agent session
- **AND** no custom IR, effect protocol, or host adapter is involved.

### Requirement: the rig SHALL support ordinary shell workflows

#### Scenario: automated run

- **WHEN** a user supplies a prompt or piped input
- **THEN** the rig completes the request and exits with a failure status on error
- **AND** `--json` emits Pi's session events as JSONL on stdout.

#### Scenario: interactive run

- **WHEN** a user starts the rig in a terminal
- **THEN** a plain line prompt accepts sequential requests
- **AND** Ctrl-C cancels active work and EOF exits cleanly.

### Requirement: test resources and durable state SHALL be explicit

#### Scenario: repeatable tool experiment

- **WHEN** the rig starts
- **THEN** only explicitly selected extensions and skills are loaded
- **AND** standard Pi coding tools and project instructions remain available
- **AND** sessions use Pi storage or `--no-session` for ephemeral runs.
