---
name: diorama-reviewer
description: Use when asked to review a Diorama walkthrough before its owner reads it, or as the review step of a collection's queue. Reads the walkthrough as a newcomer would, checks the stage, numbers, wording and facts against the format and the sources, and writes findings to a review file. Does not write or rewrite walkthroughs.
---

# Diorama reviewer

Review one walkthrough so that what reaches its owner has no mechanical problems left and
comes with an honest list of what a model could not judge.

**Requires `diorama-maker`** for the format and rules you review against:
`references/walkthrough-schema.md`, `references/wording.md`, `references/checklist.md`. If it
is not installed, say so; you can still do the reader pass and the fact check, and must
record that the format checks were skipped.

## Independence

A review is worth most when the reviewer did not write the walkthrough.

- If you wrote or edited this walkthrough earlier in this conversation, you are not
  independent. Hand the review to a fresh agent if your tool can start one, giving it only:
  the walkthrough file, the collection's `AGENTS.md`, the sources and this skill.
- If that is not possible, review it yourself in a separate pass and write
  `Independence: self-review` in the review file. Do not present it as independent.
- A different model from the author's is better still. Record which model reviewed.

## What you need

- The walkthrough: `walkthroughs/<id>.js` in a collection, or a single page.
- Who the readers are: the collection's `AGENTS.md`, or ask.
- The sources the facts should match: `sources/`, linked documents, or the code itself.

## Procedure

Do the passes in this order. The first one cannot be repeated once you have read the data.

1. **Reader pass.** Open the rendered walkthrough before reading its data file. Step through
   it once at reading speed as the stated reader. Note the step where you first could say
   what it is about, any step where you had to reread, any term used before it was explained,
   and whether the final scene makes sense without the text.
2. **Stage pass.** Step through again, slowly, watching each transition. Check every item in
   the "Stage" part of `references/rubric.md`. Read the browser console for `[diorama]`
   warnings and errors.
3. **Data pass.** Now read the data file. Check numbers, word budgets and structure with
   the "Numbers", "Words" and "Arc" parts of the rubric. Count words; do not estimate.
4. **Fact pass.** List every factual claim the walkthrough makes about the real subject:
   in the text, in labels and tags, and implied by the picture (what talks to what, in which
   order, what happens on failure). Trace each to a source. Mark it verified, unverified or
   wrong, with where you checked.
5. **Write the review** to `reviews/<id>.md` using the template in the rubric. For a single
   page outside a collection, give the review in the conversation in the same shape.

## Rules

- **Report; do not fix.** Do not edit the walkthrough or `collection.js`. The author
  resolves findings and changes the status. If asked to both review and fix, write the
  review first, then make the changes, then say the fixes were not independently reviewed.
- **Every finding is specific:** the step number, what is wrong, what you saw, and a
  suggested fix. "Step 6: the text says almost half was the round trip; the round trip is
  45 of 130 ms (35%). Say 'the decision' (60 ms) or change the number."
- **Severity is about the reader:** a blocker misleads or stops them; a should-fix makes
  them work harder than needed; a could-fix is polish.
- **Do not pad.** A clean walkthrough gets a short review. Do not invent findings to look
  thorough, and do not soften a blocker to be agreeable.
- **Say what you could not judge.** Whether the case is the best one, whether the pacing
  feels right to a real newcomer, whether a claim with no source is true, and anything about
  taste go under "For the owner", not under findings.
- **Take the date from the system clock,** not from memory.

## Verdict

- **Ready for the owner:** no blockers, facts verified or clearly labelled as unverified.
- **Needs changes:** at least one blocker or a wrong fact.

The verdict is yours. The decision to approve is the owner's alone.
