---
name: integration-review
description: Human-requested integration decision review that reconciles existing product requirements, API contracts, implementation evidence, and accepted decisions before presenting one concise, actionable question at a time. Use when explicitly invoked or when the human asks to review integration discrepancies or unresolved implementation decisions; not for automatic requirements interviews or feature implementation.
disable-model-invocation: true
---

# Integration Review

## Scope and authority

Review an existing integration problem, not a blank-sheet idea. Activate only for
an explicit human invocation (`$integration-review`, a harness-native equivalent,
or an unambiguous request for this review). Stay within the requested feature or
question set. Do not launch an interview just because implementation is ambiguous,
and never invoke or chain into Lantern.

The result is a decision-ready conversation, not a verbose ADR, a new PRD, or a
feature implementation. An answer authorizes the decision it actually states; it
does not authorize coding, publishing, or changing an original specification.

Use the repository's existing sources, locations, language, IDs, and authority
rules. Match the human's language in briefs. Do not assume project names, fixed
job titles, storage paths, or a particular harness. Use available read-only file,
search, and runtime evidence tools as needed for the requested review; no MCP,
companion application, or structured-question tool is required. Chat suffices.
Do not start tool workflows merely because this skill is loaded. Do not install
tools, start services, change authentication or permissions, write to live
systems, or publish anything automatically. Existing authorization and safety
requirements still govern runtime access; an API probe is not necessarily safe
just because its method is GET.

Default to chat and read-only work. Edit review records only when the human
explicitly requests documentation changes or has agreed to review-record
maintenance. If neither applies, report proposed record changes in chat. Never
rewrite PRD originals, API baselines, or accepted decisions without authority.

## 1. Reconcile before asking

Read only sources needed for the selected operation, following the repository's
documentation router when present:

- Current PRD/specification, including narrative, diagrams, control descriptions,
  and acceptance criteria; relevant API schema and explanatory API documentation.
- Actual affected code and existing runtime evidence, including whether a screen
  is a synthetic preview, connected implementation, or production behavior.
- Accepted decisions, previous answers, and current unresolved review records.
- Canonical implementation/status tracking, where relevant to the claimed block.

Build a small internal evidence map: requirement, contract, observed behavior,
prior decision, and authority/freshness of each. A newer timestamp alone does not
make a draft authoritative. Record available versions, revisions, environment,
and review date. Flag stale, unavailable, or mutually inconsistent sources; do
not silently choose a winner. Use supplied source hashes when available, but do
not introduce a mandatory hashing routine.

Keep claims distinct: **documented**, **code-evidenced**, **runtime-observed**
(with environment/date), **accepted decision**, **proposal**, and **inference**.
A schema describes a contract, not proof of deployed behavior. Code inspection
is not a runtime check; a fixture or preview is not production evidence. If live
behavior was not observed, say so rather than implying verification. Source
access gaps are evidence limitations, not automatically backend defects.

## 2. Revalidate the blocker first

For every candidate, including previously recorded ones, establish:

1. Does the current requirement still apply to this operation and screen?
2. Is the alleged gap still present in the current contract/code/evidence?
3. Has an authorized answer already settled all or part of it? Read the answer,
   its date, scope, and linked evidence rather than relying on a summary label.
4. What required operation cannot be correctly implemented today, and why?
   What work can proceed independently without inventing a product decision?

Classify the result before putting anything to the human:

- **Missing operation/contract:** a required frontend operation has no supported
  API or lacks necessary semantics/data. Name the exact missing capability.
- **Product decision:** required behavior has genuinely incompatible or undefined
  outcomes that engineering cannot select under current authority.
- **Frontend work:** current contracts support the outcome; implementation,
  conversion, presentation, or BFF work belongs to engineering, not an approval
  queue. A requested XLSX download is not a missing backend endpoint merely
  because the API returns JSON if valid client-side conversion meets the need.
- **Unrun QA or operational risk:** distinguish remaining evidence collection,
  deployment/security/backup/purge/lifecycle concerns from a missing operation.
  Keep them as side notes unless evidence makes them an actual prerequisite for
  the requested behavior. Do not downgrade a genuinely required safety contract.
- **Obsolete or false assumption:** recommend withdrawal, with dated contrary
  evidence; never relabel it as fixed or implemented.

Do not infer unsupported constraints. For example, one camera per gate does not
imply that a camera cannot serve multiple gates. An API maximum above a PRD
maximum may already support the requirement. An available implementation path is
not automatically an approved change to required behavior: state any limitations
and obtain a decision if it changes the outcome.

Only real missing operations/contracts and product decisions belong in the
primary decision queue. Keep actionable engineering and nonblocking risks
separate. If no genuine question remains, explain the correction and recommended
withdrawal instead of manufacturing a choice. Do not ask the human for facts
available from repository files, existing answers, or authorized evidence.

## 3. Present one conversational brief per round

Select the next material issue within the human's scope. Usually write about
150–250 words, but do not pad or cut essential evidence to satisfy a quota. Use
plain language and a compact flow, not repeated headings, scoring, forced option
sets, abstract architecture jargon, or a bibliography dump.

Give the human enough to recognize and decide the issue:

- Stable issue ID, first-recorded date, and current review date; preserve the
  original proposed date when known, otherwise explicitly mark it unknown.
- Actual product route, screen, and named control/action affected.
- What the requirement says, what the current contract or implementation says,
  and the concrete difference. Separate documented from observed facts.
- What cannot be done, user impact, what already works, and independent work
  that remains possible. Do not imply that the whole feature is blocked.
- Your recommendation and a short reason, followed by **one actionable question**
  for the authority who can make it. Name that authority from project evidence;
  do not assume the current user owns every decision.

If the human cannot decide, provide the same concise brief with a forwardable
question addressed to the appropriate product or API-contract owner. Do not ask
the human to guess the contract or decide on someone else's behalf. If ownership
is unknown, say so and ask who has authority rather than inventing a role label.
Do not initiate external contact yourself. Wait for the answer before the next
round; a review request is not permission for an endless automatic interview.

### Precise, minimal evidence links

Place locators beside the claim they establish, using only the necessary few:

- **API:** HTTP method and full documented URL, including the relevant path;
  request/response field, enum, schema or definition, plus the actual source
  location. Resolve the server/base URL from evidence, never guess it. If it is
  unavailable, show the verified method/path and explicitly say the full URL is
  unavailable. If the endpoint is missing, say “no documented endpoint for
  <operation> in <reviewed baseline/scope>”; do not fabricate a hypothetical URL
  or claim an exhaustive absence from an incomplete search. Omit credentials.
- **PRD:** linked file and verified page/section/description number, control, and
  a short exact quote. Identify printed-page versus PDF-page numbering when they
  differ. For noncontiguous references, cite each location separately. If PDF
  extraction is ambiguous, inspect the rendered pages when available; otherwise
  disclose the uncertainty and do not invent a page number or join unrelated
  text into a quote.
- **Product:** route and actual visible control/action, not just a feature name.
- **Code:** file and symbol only when they help resolve the decision; line ranges
  only if verified against the current source. Do not flood a product question
  with implementation details.
- **History:** prior issue/decision ID, answer date, and verified record link.

Never invent a link, anchor, page, line, URL, quotation, or observation. If a
locator cannot be resolved, state exactly which source detail is missing.
Include baseline/version and freshness limitations where they affect the choice.
A nearby document title is not a locator for a specific requirement.

## 4. Interpret answers without manufacturing approval

Track who said what, when, and with what authority. Preserve the substance and
scope, using a short exact quote when useful:

- “I left a note for the owner” means **pending external answer**, not approval.
- “Yes, the documents disagree” acknowledges the discrepancy, not the proposed
  solution. The actual behavior decision remains unresolved.
- A quoted third-party statement is an attributed report, not automatically the
  human's own decision or a verified contract change. Check project authority.
- An accepted answer resolves only the part it addresses. Keep unanswered parts
  open; ask a follow-up only when necessary to reach an actionable decision.
- A workaround may allow engineering to proceed, but does not silently settle a
  PRD conflict. Record approval only for the exact changed outcome authorized.

Differentiate a recommendation from acceptance, and a decision resolution from
feature completion. Never implement based solely on an answer in this review.
Conclude a round with the actual decision or pending state and its remaining
consequence, not a generic “resolved” label.

## 5. Maintain durable, latest-only unresolved records when authorized

Use the repository's existing dated review-record convention and language; do
not install a competing tracker. If no location is established, propose or
agree on one before writing. The **latest dated review file** owns the complete
unresolved queue. It is not a new implementation-status authority.

Start each recorded item with the same readable decision brief used in chat:
the concrete mismatch, exact source pointers, affected action, recommendation,
and remaining question. Put detailed provenance, prior answers, and migration
history under a separate **Evidence and review history** section (localized to
the project). The human must not read a metadata inventory or reconstruct the
archive to understand the current decision. Avoid repeating the brief in those
supporting notes.

On an authorized rollover or update:

1. Carry **every unresolved item** into the latest file, including unreviewed,
   partially answered, deferred, and pending-external-answer items. Do not carry
   only today's reviewed subset. Preserve stable IDs; do not recycle them.
2. Preserve original proposed date if known, otherwise `unknown`; retain the
   earliest verifiable record date/link separately. A migration date must never
   become a fabricated original date. Keep first-recorded and last-review dates
   distinct. For unreviewed carryovers, retain the real last-review date (or
   unknown), not the rollover date.
3. Each current item retains requirement/operation, current blocked operation
   (or explicit nonblocking classification), evidence and source freshness,
   PRD/API baseline versions and available source hashes, prior answers with
   authority/date, remaining question, decision owner if known, and next action.
   Point to shared baseline metadata rather than repeating large source lists.
4. Preserve resolved decisions and their rationale in the original historical
   file. Replace migrated unresolved bodies there with short stable anchors
   linking forward to the latest item. Keep existing inbound IDs/anchors valid;
   add links rather than deleting history. Older files must not retain duplicate
   active unresolved bodies. Older forward links must still lead to the current
   record, directly or through a verified chain.
5. For mixed items, leave the answered part and its dated evidence in the
   original file, with a short link to the remaining question in the latest file.
   Keep the same issue identity, or use the repository's established sub-ID
   convention when needed; never make the unresolved remainder disappear.
6. Withdraw obsolete/false-conflict items with a dated reason and superseding
   evidence. Preserve original claims as history without pretending a fix was
   delivered. A withdrawal recommendation is not an accepted disposition until
   the repository's decision authority permits it.
7. Keep canonical implementation status separate and honest. “Decision resolved”
   does not mean implemented, tested, or shipped. Do not mark feature completion
   or create a second mutable roadmap. Update a canonical status source only if
   separately authorized and supported by evidence.

Keep latest unresolved bodies usable without reassembling the whole archive;
link history for provenance. Preserve before compacting. If a required move or
history rewrite exceeds documentation authority, leave files untouched and
explain the proposed migration in chat.

## Reference and stopping point

Read [Examples and compact record shape](references/examples.md) when a concrete
brief or record example helps; do not preload it for every round. All examples
are illustrative, not project evidence.

After the scoped issue is decided, pending with a clear handoff, or withdrawn,
stop or move to the next issue only within the human's requested review scope.
Summarize decisions versus remaining questions briefly. Do not switch into
implementation, a broader interview, automated tooling, or publication.
