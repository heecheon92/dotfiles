# Review rubric

What to check in each pass, how severe a miss is, and the shape of the review file.
B = blocker, S = should-fix, C = could-fix.

## Reader

| Check | If it fails |
|---|---|
| By step 3 a newcomer can say what the walkthrough is about | B |
| Step 1 opens on a problem or a situation, not a definition | S |
| No term is used before the step that introduces it, unless an earlier walkthrough in the collection covered it | B |
| Reading only the step titles in order tells the story | S |
| No step required rereading to follow | S |
| The final scene makes sense with the text hidden | S |
| The recap states rules the reader can reuse, not a summary of events | S |

## Stage

| Check | If it fails |
|---|---|
| No console errors or `[diorama]` warnings | B |
| Labels, tags and the summary card do not cover objects or each other in any step | B if it hides information, else S |
| No step adds more than two new objects | S |
| No object changes position between steps | B |
| Every "what changed" line is visible on the stage, and every visible change is listed | S |
| Trouble, load and failure are drawn on the object, not only stated in the text | S |
| What the picture implies is true: arrows point the way things really flow, a cut link is really cut in that scenario | B |
| Dots show real traffic: direction, round trips, more dots only where there is more traffic | S |
| Each colour means one thing throughout; the legend covers every dot kind used | S |
| Steps 1 and the last one both look deliberate: not one lonely object, not an overfull floor | C |

## Numbers

| Check | If it fails |
|---|---|
| The total equals the sum of its parts in every step | B |
| Every number in the text equals the number on the stage and in the counters for that step | B |
| A counter stays empty until the stage has shown that cost | S |
| Invented or rounded values are labelled as such on the page | B |
| Percentages and comparisons in the text are arithmetically right | B |

## Words

| Check | If it fails |
|---|---|
| Two paragraphs per step, each 40 words or fewer (count them) | S; C if over by three words or fewer |
| Step title is a statement of about five words; short name is one or two words | C |
| At most one new term per step, explained in the same sentence | S |
| At most one callout per step, of the right kind | C |
| Second person, present tense, plain verbs; no filler, no praise | C |
| Simplifications and omissions are stated | S |
| Written in the readers' language; identifiers and units untranslated | S |

## Arc

| Check | If it fails |
|---|---|
| One concrete case from start to finish | B |
| Each mechanism arrives as the answer to something already shown | S |
| At least one step breaks the idea by changing exactly one thing | S |
| A fix that has a cost is followed by its cost | S |
| 8–14 steps; the last is a recap with a result in numbers, 3–5 takeaways and a pointer onward | S |
| In a collection: uses the collection's example world; title and summary match `collection.js`; relies only on earlier items | S |

## Facts

For every claim, one row. A claim is anything a reader would repeat as true about the real
subject, including what the picture shows.

| Result | Meaning | Severity |
|---|---|---|
| verified | you found it in a named source and it matches | — |
| unverified | no source available, or the source does not say | S if labelled on the page as assumed or illustrative; B if presented as fact |
| wrong | a source contradicts it | B |

Illustrative numbers that the page labels as illustrative are not claims. The mechanism
they illustrate is.

## Review file template

```markdown
# Review: <walkthrough title> (`<id>`)

- **Reviewed:** <date from the system clock>
- **Reviewer:** <model and tool>
- **Author:** <model and tool, if known>
- **Independence:** independent | self-review
- **Rendered and stepped through:** yes, in <browser or tool> | no, because <reason>
- **Format checks:** done | skipped, diorama-maker not installed

## Verdict

Ready for the owner | Needs changes. <One sentence saying why.>

## Reader pass

<Three to six lines: where it clicked, where it dragged, what a newcomer would take away.>

## Findings

| # | Severity | Step | Finding | Suggested fix |
|---|---|---|---|---|
| 1 | blocker | 6 | … | … |

<Or: "No findings.">

## Facts

| Claim | Where it appears | Result | Checked against |
|---|---|---|---|
| The reader sends only a card number | step 2 text, step 3 link label | verified | sources/reader-protocol.md §2 |

## For the owner

<What a model could not judge: whether this is the best case, pacing for a real newcomer,
claims with no source, matters of taste.>

## Resolution

<Written by the author after fixing: one line per finding, "fixed", "changed differently:
…" or "kept, because …".>

## Owner decision

<Written when the owner answers: approved, or the changes they asked for, with the date.>
```
