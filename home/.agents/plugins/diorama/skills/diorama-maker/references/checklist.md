# Review checklist

Run this against the walkthrough data before rendering, and again against the rendered
result on its sheet (`#/<id>/sheet`, described in `walkthrough-schema.md`). Fix every "no" or
state in the handoff why it stands.

This list reviews a step story, the `story` template and the only one today. "Question and
case", "Numbers" and "Facts" hold for every template, as do the lines on stated
simplifications, keyboard use and links; the steps, try steps and word budgets are the
story's. `templates.md` holds the contracts a template follows.

## Question and case

- [ ] `question` is one question a newcomer would ask, with one thing that moves and one number that answers it.
- [ ] The recap answers the question with that number.
- [ ] The walkthrough follows one concrete case from start to finish.

## Arc

- [ ] Step 1 is a problem or a starting situation, not a definition.
- [ ] Each mechanism appears as the answer to something already shown.
- [ ] Around the working case there is too little and too much of one variable, as `Case:` steps or a try step, and nothing else changes.
- [ ] A solution that has a cost is followed by its cost.
- [ ] The last step is a recap with a result in numbers, 3–5 takeaways and a next pointer.
- [ ] 8–14 steps (story), 4–8 stages (procedure), 4–6 phases (trace).

## Try steps

- [ ] At most two, each placed after the idea has been shown working.
- [ ] Every option is a value of the same single variable; together they cover too little, right and too much.
- [ ] The step before choosing shows the variable not yet set; every option changes the stage or a counter.
- [ ] Each verdict agrees with what the stage and the counters show for that option, and its `why` names the number that decided it.
- [ ] You chose every option in the rendered walkthrough, and Reset returned to the starting picture.

## Stage (read on the sheet)

- [ ] The Checks block lists no warnings. Every note is fixed or explained in the handoff.
- [ ] No tile shows objects or labels covering each other (label, tag, gauge, link label, summary card), or a label covering the thing it names.
- [ ] No tile shows text that is cut off or too small to read, a lonely object, or a floor so wide that labels shrink.
- [ ] On every tile the numbers match what the picture shows.
- [ ] No step adds more than two new objects; step 1 shows at most two.
- [ ] No object changes position between steps.
- [ ] Every "what changed" line is visible on the stage, and every visible change is listed.
- [ ] One thing draws the eye in each step: what changed.
- [ ] Each colour means one thing throughout; the legend covers every flow kind used.
- [ ] Trouble, load and failure are drawn on the object (glow, gauge, cross, cut link), not only stated in the text.
- [ ] The final scene makes sense with the text hidden.

## Transitions (step through once)

- [ ] New objects visibly arrive and changed numbers visibly change; nothing else moves.
- [ ] Back, replay and pause work; every step has its own link.
- [ ] The keyboard works and the hint is visible, including `1`–`5` and `0` on a try step.

## Numbers

- [ ] `sources` lists every value the walkthrough relies on, each `data` entry with where it comes from.
- [ ] Every number on the stage, in a counter, in the text and in a verdict is a `sources` claim or follows from them by arithmetic the reader could redo.
- [ ] One derived value was worked out by hand, and the working is in the handoff.
- [ ] Counters are empty until the stage has shown that cost.
- [ ] The total equals the sum of the parts in every step and every option.
- [ ] Every number in the text equals the number on the stage for that step.
- [ ] Invented or rounded values are `assumption` entries; a step that compresses time or scale says so in a tag or in the text.

## Words

- [ ] Body is two paragraphs, each ≤ 40 words.
- [ ] Step title is a statement of about five words; short name is 1–2 words.
- [ ] Question, try prompt, option labels, verdicts and ledger claims are within the budgets in `wording.md`.
- [ ] At most one new term per step, defined where it first appears.
- [ ] At most one callout per step, of the right kind.
- [ ] No sentence could be deleted without losing information.
- [ ] Second person, present tense, plain verbs.
- [ ] Simplifications and omissions are stated.

## Orientation

- [ ] Step count is shown before step 1; time and level are shown when the walkthrough is teaching material.
- [ ] When the walkthrough is teaching material, goals are listed and each points at the step that shows it.

## Newcomer test

- [ ] Someone with no background could say, after step 3, what the walkthrough is about.
- [ ] Reading only the step titles in order tells the story.
- [ ] Reading only the recap gives the rules.
- [ ] Nothing in the walkthrough requires a term that was not introduced in it or in an earlier,
      named walkthrough.

## Facts

- [ ] Every technical claim was checked against the real system, its code or its documentation.
- [ ] Every `data` entry in `sources` says what its named source says.
- [ ] Anything not verified is an `assumption` entry when it is a value, and is listed as unverified in the handoff either way.
