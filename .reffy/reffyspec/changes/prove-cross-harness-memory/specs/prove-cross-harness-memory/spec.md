## ADDED Requirements

### Requirement: Shared memory SHALL be invoked explicitly through Paseo

The experiment SHALL provide one journal/briefing skill on one disposable actor,
callable from all three harnesses through an ordinary shell client. The client
SHALL send a validated versioned envelope as plain stdin text through the executing
`run` path of `paseo pipe`, allow local redaction, and keep secrets out of shared files.

#### Scenario: Explicit journal invocation

- **WHEN** a harness submits a valid journal envelope
- **THEN** JSON text carries kind, project, harness, session, event, content,
  and evidence references to the configured actor
- **AND** no custom non-run action, `--json-input`, hook, or new rig runtime is required.

#### Scenario: Invalid event

- **WHEN** required fields are missing or a path component is unsafe
- **THEN** the client fails locally before transmitting the event.

### Requirement: Findings SHALL preserve project scope and attribution

The skill SHALL use GitHub records for memory and avoid built-in notes. Records
SHALL preserve source fields and evidence references, with immutable logical
identity including project, harness, session, and event. Briefings SHALL read only
the requested project and cite record paths and inspectable revisions.

#### Scenario: Durable write and recall

- **WHEN** a journal call reports a durable finding
- **THEN** independent GitHub inspection confirms exact content, source fields,
  and evidence references in a commit
- **AND** a later briefing returns the finding with record/revision citations.

#### Scenario: Project isolation

- **WHEN** the same actor receives a briefing query for another fixture project
- **THEN** it excludes the original project's marker, records, and references.

#### Scenario: Repeated logical event

- **WHEN** a sequential new attempt supplies an existing event with identical content
- **THEN** it resolves to the existing record without another logical entry
- **AND** conflicting content for that identity fails without overwriting the record.

### Requirement: Delivery SHALL distinguish success, failure, and uncertainty

Each attempt SHALL have a request ID derived from harness, session, event, and
attempt. Receipts SHALL retain identity, request/trace ID, duration, outcome, and
available record evidence. Calls SHALL be bounded. Journal success SHALL require
a matching durable record; a `409` alone SHALL NOT establish success.

#### Scenario: Duplicate after success

- **WHEN** the same successful request ID returns `409 invocation_exists`
- **THEN** the client inspects the original invocation by trace ID
- **AND** verifies its result and matching record before reporting journal success.

#### Scenario: Duplicate after failure

- **WHEN** a failed attempt has consumed its ID and a repeat returns `409`
- **THEN** the client retains the failure rather than reporting successful delivery
- **AND** a deliberate retry uses a new attempt ID with the same logical event.

#### Scenario: Ambiguous transport outcome

- **WHEN** a timeout or transport failure leaves completion uncertain
- **THEN** the client records failure or uncertainty and exits nonzero
- **AND** reconciles invocation and repository evidence before any deliberate retry
- **AND** inaccessible evidence remains unknown rather than counting as success.

### Requirement: Cross-harness recall SHALL exclude local answer transfer

The live experiment SHALL rotate all three harnesses through writer, fresh-session
reader/follow-up writer, and final reader roles. Reader environments SHALL exclude
prior transcripts, marker-bearing local files, receipts, and experiment evidence.
Reader prompts SHALL omit expected markers and prior answers.

#### Scenario: Three rotations

- **WHEN** the milestone is evaluated
- **THEN** Codex -> Claude Code -> Popper, Claude Code -> Popper -> Codex, and
  Popper -> Codex -> Claude Code each complete the journal/briefing/follow-up loop
- **AND** each second harness recalls the first finding in a fresh isolated session
- **AND** each third harness recalls the original and linked follow-up
- **AND** independent GitHub inspection verifies exact markers and attribution.

#### Scenario: Inadequate isolation

- **WHEN** local answers are accessible or fresh-session isolation cannot be established
- **THEN** the trial is inconclusive and does not satisfy acceptance.

### Requirement: Milestone claims SHALL have reproducible evidence

The experiment SHALL document setup, grants, versions, model/step configuration,
and isolation procedures. An indexed Reffy result artifact SHALL record rotations,
receipts, commit references, scope/failure checks, durations, and limitations
without credentials.

#### Scenario: Completion

- **WHEN** the milestone is declared complete
- **THEN** all rotations, project isolation, duplicate-success, consumed-failure-ID,
  reconciled-retry, and transport-failure checks have passing recorded evidence
- **AND** failed, unknown, skipped, or inconclusive trials do not count as passing
- **AND** no claim is made about automatic hooks, blocking enforcement,
  authenticated source identity, or concurrent-write safety.

#### Scenario: Implementation before live execution

- **WHEN** offline checks pass but live trials have not all completed
- **THEN** implementation readiness is reported separately from milestone completion.
