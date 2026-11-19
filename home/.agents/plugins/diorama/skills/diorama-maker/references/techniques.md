# Techniques

The techniques that make the format work, each with the reason and how to apply it.
They are grouped by the decision they belong to.

## Choosing what to show

1. **One concrete case, not the general rule.** Follow one page load, one card tap, one
   packet. The rule is stated only in the recap, after the reader has watched it happen.
2. **Start from a complaint or a need.** "Users say the shop feels slow." A problem gives the
   reader a reason to care about the mechanism that follows.
3. **Use a familiar world and keep it.** A shop, a laptop, a home router, Alice and Bob.
   Reuse the same world across walkthroughs so later walkthroughs start on known ground.
4. **Real-looking values.** `shop.example`, `203.0.113.7`, `GET /products`, 3 V, 220 Ω.
   Use reserved example addresses and round numbers that add up in the head.
5. **Draw the thing as itself.** A battery looks like a battery, a database is a cylinder.
   Recognition is free; abstract boxes must be learned.
6. **Turn invisible quantities into characters or motion.** Volt pushes, Ohm squeezes the
   pipe, Amp is what gets through; current is dashes moving along the wire.

## Building the picture

7. **One scene that grows.** Step 1 shows one or two objects. Each step adds at most one or
   two. The reader never has to parse a finished diagram.
8. **Nothing moves unless it changed.** Fixed positions let the eye find the difference.
9. **Say what changed.** A short `+ / ~ / −` list after every step, matching what is visible.
10. **Earn every number.** Counters above the stage start empty and fill in when the stage
    shows the cost. The total is always the sum the reader can check.
11. **Colour is a code.** One colour per role, fixed for the collection; green/amber/red for
    fine/changed/broken. A legend sits under the stage.
12. **Labels live on the objects.** Pills attached to nodes and links, not a separate key
    that the eye must travel to.
13. **Motion shows cause.** A dot travels from the asker to the answerer and back. A queue
    visibly fills. A counter flashes when it changes.
14. **Put a summary table on the stage at the end.** The recap scene carries the breakdown,
    so the final picture can be read without the text.

## Sequencing

15. **Problem and solution alternate.** Each mechanism arrives as the answer to something
    that was just shown going wrong.
16. **Break it on purpose.** After the idea works, change one number (`Case:` steps): the
    query takes 400 ms, the user is in Sydney, the network is down. Keep everything else the
    same so the cause is unmistakable.
17. **Show the cost of the fix.** A `tradeoff` step after a `solution` step keeps the
    explanation honest and prepares the next walkthrough.
18. **Derive the conclusion from the numbers.** "Of 155 ms, only 25 ms was the server." The
    reader has already seen both numbers; the insight is arithmetic, not assertion.
19. **One idea per step.** If a step introduces two terms or needs three paragraphs, split it.
20. **End with rules, then a hook.** Three to five takeaways written as reusable rules, then
    the next walkthrough's question.

## Layers of depth

21. **Plain first, formal last.** Overview → parts → diagram → maths. Each layer is complete
    by itself, so a newcomer can stop early without missing the point.
22. **Metaphor, then formula, in the same words.** After "Ohm squeezes", the formula tab
    says "volt pushes … through 220 Ω" and shows `I = V ÷ R` with the live values.
23. **Several views of one state.** Physical scene, schematic, formula, chart and reading
    all change together. Seeing the same change in two notations is how a notation is learned.
24. **Drill down, don't spread out.** Subject → phase → message → field → bytes. Detail is
    one click deeper, never on the first screen.
25. **Highlight the current row.** In a table of values, tint the row that matches the
    stage right now.

## Interaction

26. **The reader sets the pace.** Next/Back, replay, pause, speed. Nothing important happens
    only once.
27. **Constrained choices.** Click a highlighted part, pick one of four values. No free
    input, so no dead ends and no invalid states.
28. **One variable at a time.** Each control changes one thing; the others hold still.
29. **Immediate, visible consequence.** Opening the switch darkens the bulb, stops the
    dashes, changes the reading to "off" and redraws the schematic symbol.
30. **Always a way back.** Reset on every interactive view; Back on every step.
31. **Tell the reader what to try.** "Click the resistor to try other values." Do not rely
    on discovery.
32. **Run it and narrate it.** For code, a run button plus a log that states each effect in
    plain events: `pinMode(13, OUTPUT)`, `D13 → HIGH`.

## Orientation

33. **Same layout everywhere.** The reader learns the interface once.
34. **Always show where you are.** `6 / 10`, a step strip with names, walkthrough `1 of 3`,
    section progress `1/3`.
35. **Name what is next.** The Next button says `Next: Find address`.
36. **Say the size up front.** Number of steps; minutes and level when the walkthrough is
    teaching material.
37. **State the goals and tick them off.** When the walkthrough is teaching material, use a
    "what you'll learn" list tied to the steps that satisfy each item.
38. **Tag the kind of step.** Problem, technique, solution, recap. The reader knows whether
    to expect trouble or relief.
39. **Point sideways, briefly.** "(see the Indexes lesson)" instead of re-explaining.

## Honesty

40. **Label simplifications on the screen.** "Data ACKs omitted." "Example values; real
    captures differ." "Browsers now try https first; this is the plain version."
41. **Name the convention when it disagrees with physics.** Conventional current versus
    electron drift.
42. **Say when something does nothing.** "Has no job in TLS 1.3."
43. **Mark invented numbers as invented.** A one-line note under the title.

## Friction removed

44. **No account, nothing to install.** Progress is local.
45. **Every step has a link.** A specific moment can be sent to someone.
46. **Keyboard for everything.** ← → R Space, with the hint visible.
47. **The reader's language and theme.** Language switch, light and dark.
48. **Accessible controls.** Real buttons, labelled regions, live announcements of the
    current step, a text alternative for the stage.

## What the format does not do

Known gaps in the source sites; add these when the goal is retention, not first understanding.

- **No check of understanding.** Goals tick when a step is reached, which records exposure
  only. Add a prediction before a `Case:` step ("what will the total be?") or one question
  after the recap.
- **No free practice.** The reader cannot build a design of their own. Add an open task
  after the walkthrough when the skill is doing, not recognising.
- **No spaced return.** Nothing brings the reader back to the idea later.

## When not to use it

- The answer is a fact, a command or a short definition. Just say it.
- The reader already knows the mechanism and needs a reference. Write a table.
- There is nothing that changes over time, has parts, or can be traced. A stage with nothing
  happening on it is decoration.
