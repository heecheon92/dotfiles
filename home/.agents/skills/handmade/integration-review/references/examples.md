# Examples and compact record shape

These are fictional examples, not observations or accepted decisions. Names,
dates, URLs, and citations illustrate the required precision. `example.invalid`
is deliberately non-routable; angle-bracket locators are placeholders, not real
links. Replace them with inspected project evidence before using a brief. Follow
the project's language and record convention, not these example filenames.

## False conflict: recommend withdrawal

> IR-012 — first recorded 2026-09-08; reviewed 2026-10-23.
>
> On `/settings/gates`, **Assign camera** was listed as blocked because an
> earlier review assumed each camera must belong to only one gate. Rechecking
> the PRD, its gate description says “select one camera per gate”
> (<verified PRD file/page/control link>); it does not say
> that a camera can belong to only one gate. `PATCH
> https://example.invalid/api/gates/{gateId}` documents a scalar `cameraId`
> (<verified request-schema link>), which limits cameras per gate, not gates per
> camera. The reviewed contract does not establish camera exclusivity. Runtime
> enforcement has not been observed, so this is a documentation finding, not a
> claim about the deployed backend.
>
> Gate editing can proceed against the documented mapping contract; actual
> rejection of a shared assignment, if later observed, would be new evidence.
> I recommend withdrawing the exclusivity blocker rather than requesting a new
> endpoint. This does not claim that the editor is implemented or validated.
> **Can we withdraw IR-012 on this evidence?**

An engineering correction can require no decision when existing authority allows
it; then report the dated withdrawal without manufacturing a question. A second
common false blocker is asking for a dedicated XLSX endpoint when existing data
can be faithfully converted client-side. Assess pagination, required fields,
size, and authorization from evidence, not by assuming conversion always works.

## Genuine mismatch: forwardable contract question

> IR-018 — first recorded 2026-09-12; reviewed 2026-10-23.
>
> On `/settings/retention`, **Save retention period** must support 90 days: the
> approved PRD says “retain records for 90 days” (<verified PRD page, description
> number, and control link>). However, `PATCH
> https://example.invalid/api/sites/{siteId}/retention` limits request field
> `retentionDays` to `7 | 30` in the current API baseline (<verified enum link>).
> This is a documented contract mismatch; no live PATCH has been attempted.
>
> Reading the current retention value and rendering the form remain supported.
> Saving the required 90-day value cannot be implemented correctly against that
> enum. The frontend cannot silently save 30 days or display 90 while persisting
> another value. No prior approval to change the requirement was found in the
> reviewed decision record (<verified decision-index scope link>).
>
> I recommend supporting 90 in the write contract because it preserves the
> approved outcome. For the API-contract owner: **Will this operation accept
> `retentionDays: 90`, with the published schema updated to match?** If a different
> period is required, that needs a separate decision by the requirement owner;
> the frontend should not choose it on their behalf.

Do not substitute an invented endpoint when the actual problem is a missing
operation. Instead write, for example: “No documented delete operation for a
saved mapping in the reviewed API revision <version/link>; listing and creation
are documented, but required deletion remains unsupported by that baseline.”

## “I left a note”: still pending

Human: “I left the product owner a note. Yes, those documents disagree.”

Response:

> That confirms the discrepancy was reported, not which behavior is approved.
> IR-018 remains pending an external answer as of 2026-10-23. Your note is the
> current handoff; it is not approval to use 30 days or confirmation that the
> write contract will change. The read/form work remains independent, while
> saving the required 90-day value still lacks a compatible documented contract.
> The forwardable question remains: **Will the operation accept
> `retentionDays: 90`?** No implementation or baseline change is authorized by
> this exchange.

Do not ask the same question again merely to force a resolution after the human
has already identified the pending owner. A partial answer stays attributed:
“Owner X reportedly accepts the discrepancy” is not “user approved our fix.”

## Compact current-item shape

Start the item with a short decision brief, then place supporting fields under
**Evidence and review history**. Adapt these fields to existing prose or tables;
they are a record aid, not the opening paragraph or a repeated user-facing form.
Populate only with real evidence. Nonblocking side notes stay outside the
decision queue.

```text
<ID> — <actual route / screen / control>

Decision brief
<Concrete mismatch, exact source pointers, affected action, recommendation,
and one remaining question, written for the person who must decide.>

Evidence and review history
Original proposed: <known date | unknown>
First recorded: <earliest verifiable date + record link>
Last reviewed: <actual date | unknown>; carried forward: <date, if relevant>
State: <unreviewed | open | partially answered | pending external answer>
Classification: <missing contract | product decision | nonblocking category>
Requirement: <short quote + precise PRD locator>
Baseline: <PRD/API revision + source links + known hashes if available>
Evidence: <documented / code-evidenced / observed, with date/environment>
Current blocked operation: <specific action | none; reason>
Working / independent work: <brief statement>
Prior answer: <ID/date/author/authority/link; exactly what was answered>
Remaining question: <one precise decision>
Owner / next action: <evidenced authority, or unknown; concrete handoff>
Freshness limits: <what is stale/unavailable/unobserved, if material>
```

For a partially answered item, retain the accepted answer in its original dated
record and link to the latest unresolved remainder. An old anchor may say:

```text
<ID> — <original accepted part, answer date, authority, and evidence>.
Remaining question → <verified latest-file item link>.
```

For an entirely migrated unresolved item, keep only its ID/anchor, provenance as
needed, and the forward link in the older file. For withdrawal, preserve the
original allegation and add the actual disposition date, reason, authority, and
superseding evidence. Never invent a resolution date, erase a prior answer, or
turn a decision outcome into an implementation-completion claim.
