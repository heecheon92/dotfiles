# Techniques

The techniques that make the format work, each with the reason and how to apply it.
They are grouped by the decision they belong to, in the order the decisions are made.

## The question

1. **Ask a question, not a topic.** State the walkthrough as one question, the one thing
   that moves, and the one number that answers it, before anything else. A topic gives a
   generic picture; a question forces a mechanism.

   | | Request | What you get |
   |---|---|---|
   | Wrong | "Caching" | boxes labelled cache and database, nothing to watch |
   | Right | "Why is the second page load faster than the first?" | one request that moves, a cache it stops at, milliseconds to compare |

   The same holds outside software: "Electronics" is a topic; "Why does a cold blob form
   when you solder?" is a question with something that moves and a number.
2. **Give an abstract subject a body.** Something the stage can draw: a queue that grows, a
   store that fills, dots travelling between named things. "Rate limiting" becomes requests
   bouncing off a gate with a counter on it.
3. **Point the scene at the confusing part.** Ask, or work out, which part confuses
   newcomers most. That part gets the most steps and the number.
4. **When the request is vague, offer three.** Three candidate questions, each with its
   moving thing and its number; say which part confuses newcomers most and recommend one.

## The numbers

5. **Numbers before the stage.** Build the ledger first: each value, its unit, where it
   comes from, and whether it is `data` or an `assumption`. It becomes `sources`
   (`walkthrough-schema.md`). Never invent a number or a source. Illustrative round numbers
   are fine when the entry says `assumption`.
6. **One model.** Every number on the stage, in a counter, in the text and in a verdict
   derives from the ledger by arithmetic the reader could redo, so nothing on the page can
   disagree with anything else.
7. **Check one by hand and show it.** Pick one derived value and write the working in the
   handoff: "Total at step 6: 40 + 10 + 60 + 20 = 130 ms."
8. **Real-looking values.** `shop.example`, `203.0.113.7`, `GET /products`, 3 V, 220 Ω.
   Use reserved example addresses and round numbers that add up in the head.

## Choosing what to show

9. **One concrete case, not the general rule.** Follow one page load, one card tap, one
   packet. The rule is stated only in the recap, after the reader has watched it happen.
10. **Start from a complaint or a need.** "Users say the shop feels slow." A problem gives the
    reader a reason to care about the mechanism that follows.
11. **Use a familiar world and keep it.** A shop, a laptop, a home router, Alice and Bob.
    Reuse the same world across walkthroughs so later walkthroughs start on known ground.
12. **Draw the thing as itself.** A battery looks like a battery, a database is a cylinder.
    Recognition is free; abstract boxes must be learned.
13. **Turn invisible quantities into characters or motion.** Volt pushes, Ohm squeezes the
    pipe, Amp is what gets through; current is dashes moving along the wire.

## Building the picture

14. **One scene that grows.** Step 1 shows one or two objects. Each step adds at most one or
    two. The reader never has to parse a finished diagram.
15. **Nothing moves unless it changed.** Fixed positions let the eye find the difference.
16. **Say what changed.** A short `+ / ~ / −` list after every step, matching what is visible.
17. **Earn every number.** Counters above the stage start empty and fill in when the stage
    shows the cost. The total is always the sum the reader can check.
18. **Give every object room.** Neighbours about 9 grid units apart, so tags and labels do
    not pile up, and no lonely object in a wide empty floor. The reader zooms and pans, so
    do not crowd objects to keep every label large at the first framing.
    `visual-craft.md` gives the numbers.
19. **One highlight per step:** the thing that changed. Two glowing nodes compete; the
    reader looks at neither.
20. **Colour is a code.** One colour per role, fixed for the collection; green/amber/red for
    fine/changed/broken. A legend sits under the stage.
21. **Labels live on the objects.** Pills attached to nodes and links, not a separate key
    that the eye must travel to.
22. **Motion shows cause.** A dot travels from the asker to the answerer and back. A queue
    visibly fills. A counter flashes when it changes.
23. **Put a summary table on the stage at the end.** The recap scene carries the breakdown,
    so the final picture can be read without the text.

## Sequencing

24. **Problem and solution alternate.** Each mechanism arrives as the answer to something
    that was just shown going wrong.
25. **Contrast: too little, right, too much.** After the idea works, change one variable in
    `Case:` steps and show both sides of the working value: one worker and the queue grows,
    three and it holds, ten and most stand idle. Keep everything else the same so the cause
    is unmistakable. A variable that is only bad in one direction (a delay, a distance) gets
    fine, borderline and broken.
26. **One step, one change.** If three values change at once, nobody sees any of them.

    | | Step |
    |---|---|
    | Wrong | "Case: a busy morning" raises the arrivals, slows the database and removes a worker |
    | Right | "Case: 200 people at 08:55" raises the arrivals; the next step slows the database |

    If a step introduces two terms or needs three paragraphs, split it.
27. **Show the cost of the fix.** A `tradeoff` step after a `solution` step keeps the
    explanation honest and prepares the next walkthrough.
28. **Derive the conclusion from the numbers.** "Of 155 ms, only 25 ms was the server." The
    reader has already seen both numbers; the insight is arithmetic, not assertion.
29. **End with rules, then a hook.** Three to five takeaways written as reusable rules, then
    the next walkthrough's question.

## Letting the reader try

A try step (`try` in `walkthrough-schema.md`) is technique 25 handed to the reader.

30. **Every option is a value of the same single variable.** "1 worker", "3 workers",
    "10 workers"; never "add a worker" next to "add a cache".
31. **The options cover too little, right and too much,** so the reader can push it past
    its limit in both directions.
32. **Every choice gets a verdict and a reason.** The verdict says what happened; its `why`
    names the number that decided it: "Queue grows by 4 a second: 6 arrive, 2 are handled."
33. **At most two try steps, placed after the idea works.** A reader cannot judge a choice
    about a mechanism they have not yet seen working.
34. **Or ask for a prediction.** The body asks what will happen ("What will the total be if
    the server takes 400 ms?") and the options let the reader find out.

## Layers of depth

35. **Plain first, formal last.** Overview → parts → diagram → maths. Each layer is complete
    by itself, so a newcomer can stop early without missing the point.
36. **Metaphor, then formula, in the same words.** After "Ohm squeezes", the formula tab
    says "volt pushes … through 220 Ω" and shows `I = V ÷ R` with the live values.
37. **Several views of one state.** Physical scene, schematic, formula, chart and reading
    all change together. Seeing the same change in two notations is how a notation is learned.
38. **Drill down, don't spread out.** Subject → phase → message → field → bytes. Detail is
    one click deeper, never on the first screen.
39. **Highlight the current row.** In a table of values, tint the row that matches the
    stage right now.

## Interaction

40. **The reader sets the pace.** Next/Back, replay, pause, speed. Nothing important happens
    only once.
41. **Constrained choices.** Pick one of a few preset values. No free input, so no dead ends
    and no invalid states.
42. **Immediate, visible consequence.** Opening the switch darkens the bulb, stops the
    dashes, changes the reading to "off" and redraws the schematic symbol.
43. **Always a way back.** Reset on every interactive view; Back on every step.
44. **Tell the reader what to try.** "Click the resistor to try other values." Do not rely
    on discovery.
45. **Run it and narrate it.** For code, a run button plus a log that states each effect in
    plain events: `pinMode(13, OUTPUT)`, `D13 → HIGH`.

## Orientation

46. **Same layout everywhere.** The reader learns the interface once.
47. **Always show where you are.** `6 / 10`, a step strip with names, walkthrough `1 of 3`,
    section progress `1/3`.
48. **Name what is next.** The Next button says `Next: Find address`.
49. **Say the size up front.** Number of steps; minutes and level when the walkthrough is
    teaching material.
50. **State the goals and tick them off.** When the walkthrough is teaching material, use a
    "what you'll learn" list tied to the steps that satisfy each item.
51. **Tag the kind of step.** Problem, technique, solution, recap. The reader knows whether
    to expect trouble or relief.
52. **Point sideways, briefly.** "(see the Indexes lesson)" instead of re-explaining.

## Honesty

53. **Label simplifications on the screen.** "Data ACKs omitted." "Example values; real
    captures differ." "Browsers now try https first; this is the plain version."
54. **Say when time or scale is compressed.** If a step shows an hour in a second, or ten
    dots for ten thousand requests, a tag or the text says so: "1 dot = 1,000 requests".
55. **Name the convention when it disagrees with physics.** Conventional current versus
    electron drift.
56. **Say when something does nothing.** "Has no job in TLS 1.3."
57. **Mark invented numbers as invented.** An `assumption` entry in `sources`, and a
    one-line `note` under the title when most of the values are illustrative.

## Friction removed

58. **No account, nothing to install.** Progress is local.
59. **Every step has a link.** A specific moment can be sent to someone.
60. **Keyboard for everything.** ← → R Space, `1`–`5` and `0` on a try step, `+` `-` `F`
    for the camera, and Tab to reach each object, with the hint visible.
61. **The reader's language and theme.** Language switch, light and dark.
62. **Accessible controls.** Real buttons, labelled regions, live announcements of the
    current step and of each verdict, a text alternative for the stage.

## What the format does not do

Try steps cover constrained practice and prediction: the reader chooses among preset values
and sees the consequence. The rest is still missing; add it separately when the goal is
retention, not first understanding.

- **No free input.** The reader cannot type a value of their own; every outcome is one the
  author prepared.
- **No open practice.** The reader cannot build a design of their own. Add an open task
  after the walkthrough when the skill is doing, not recognising.
- **No spaced return.** Nothing brings the reader back to the idea later. Goals tick when a
  step is reached, which records exposure only.

## When not to use it

- The answer is a fact, a command or a short definition. Just say it.
- The reader already knows the mechanism and needs a reference. Write a table.
- There is nothing that changes over time, has parts, or can be traced. A stage with nothing
  happening on it is decoration.
