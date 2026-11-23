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

Read on the sheet first, then in the walkthrough for transitions.

| Check | If it fails |
|---|---|
| The Checks block lists no warnings, and the console shows no errors | B |
| Each note in Checks | the severity of the matching row under "Words" or "Arc"; S for a note about small labels or too many new objects |
| No tile shows objects or labels covering each other, or a label covering the thing it names | B if it hides information, else S |
| No tile shows text that is cut off or too small to read | S |
| On every tile the numbers match what the picture shows | B |
| No step adds more than two new objects | S |
| No object changes position between steps | B |
| Every "what changed" line is visible on the stage, and every visible change is listed | S |
| Trouble, load and failure are drawn on the object, not only stated in the text | S |
| What the picture implies is true: arrows point the way things really flow, a cut link is really cut in that scenario | B |
| Dots show real traffic: direction, round trips, more dots only where there is more traffic | S |
| Each colour means one thing throughout; the legend covers every dot kind used | S |
| Every tile looks deliberate: not one lonely object, not objects crowded together (neighbours under about 9 grid units apart). Small labels at the default framing are fine: the reader can zoom | C |
| One thing is highlighted per step: what changed | C |
| A step that compresses time or scale says so in a tag or in the text | S |

## Try steps

Choose every option of every try step before judging these.

| Check | If it fails |
|---|---|
| Every option is a value of the same single variable, and nothing else differs between options | S |
| The options cover too little, right and too much | S |
| Each verdict agrees with what the stage and the counters show for that option | B |
| Each verdict's `why` names the number that decided it | S |
| At most two try steps, each after the idea has been shown working | S |

## Question

| Check | If it fails |
|---|---|
| `question` is present and is one question, not a topic | S |
| One thing moves and one number answers the question | S |
| The recap answers the question with that number | S |

## Numbers

| Check | If it fails |
|---|---|
| The total equals the sum of its parts in every step and every try option | B |
| Every number in the text equals the number on the stage and in the counters for that step | B |
| Every number on the stage, in a counter and in a verdict is a `sources` claim or follows from those claims by arithmetic | B |
| One derivation redone by hand gives the number shown (write the working in the review) | B |
| A walkthrough that shows numbers has a `sources` list | S; B if the numbers are presented as real |
| A counter stays empty until the stage has shown that cost | S |
| Invented or rounded values are `assumption` entries, or labelled as such on the page | B |
| Percentages and comparisons in the text are arithmetically right | B |

## Words

| Check | If it fails |
|---|---|
| Two paragraphs per step, each 40 words or fewer (count them) | S; C if over by three words or fewer |
| Step title is a statement of about five words; short name is one or two words | C |
| Question, try prompt, option labels, verdict text and why, and ledger claims are within the budgets in `wording.md` | C |
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
| The working case is shown with too little and too much of one variable, as `Case:` steps or a try step, and nothing else changes | S |
| A fix that has a cost is followed by its cost | S |
| 8–14 steps; the last is a recap with a result in numbers, 3–5 takeaways and a pointer onward | S |
| In a collection: uses the collection's example world; title and summary match `collection.js`; relies only on earlier items | S |

## Facts

For every claim, one row. A claim is anything a reader would repeat as true about the real
subject, including what the picture shows and every entry in `sources`.

| Result | Meaning | Severity |
|---|---|---|
| verified | you found it in a named source and it matches | — |
| unverified | no source is available, or the named one does not say it | S if the entry is an `assumption` or the page labels it as assumed or illustrative; B if it is a `data` entry or presented as fact |
| wrong | a source contradicts it | B |

A `data` entry whose named source you could not open is unverified, not verified. An
illustrative number entered as an `assumption` is not a claim. The mechanism it
illustrates is.

## Review file template

```markdown
# Review: <walkthrough title> (`<id>`)

- **Reviewed:** <date from the system clock>
- **Reviewer:** <model and tool>
- **Author:** <model and tool, if known>
- **Independence:** independent | self-review
- **Rendered and stepped through:** yes, in <browser or tool> | no, because <reason>
- **Sheet read:** yes, <n> warnings and <n> notes in Checks | no, because <reason>
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

## Numbers

<The one derivation you redid by hand, with its working, and whether it matches the page.
Any number on the stage that is not in `sources` and cannot be derived from it.>

## Facts

| Claim | Where it appears | Result | Checked against |
|---|---|---|---|
| The reader sends only a card number | step 2 text, step 3 link label, `sources` entry 1 | verified | sources/reader-protocol.md §2 |

## For the owner

<What a model could not judge: whether this is the best case, pacing for a real newcomer,
claims with no source, matters of taste.>

## Resolution

<Written by the author after fixing: one line per finding, "fixed", "changed differently:
…" or "kept, because …".>

## Owner decision

<Written when the owner answers: approved, or the changes they asked for, with the date.>
```
