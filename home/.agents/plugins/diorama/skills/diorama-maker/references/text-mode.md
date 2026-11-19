# Chat mode

The same walkthrough, rendered as a message. Use it when a page would be overkill. Plan the
walkthrough as data first (`walkthrough-schema.md`), then print it in this shape.

## Shape

````markdown
**How a Badge Tap Works** · 9 min · beginner · 10 steps
**Why does the door sometimes hesitate?**
Follow one card tap from the reader to the lock, and find out why the door sometimes hesitates.
Timings are illustrative.

**1 / 10 · Problem — The door takes a moment to open**

You hold your card to the reader. A moment later the lock clicks. To see why there is a gap,
follow one tap and add up what each stop costs.

```
[You 0412] ··tap··> [Reader]
```

**2 / 10 · Technique — The reader reads a number**

The card holds no door rules, only a card number, here `0412`. Reading it takes about 40 ms.

```
[You 0412] ──tap──> [Reader: 0412]
```
+ Card number 0412
+ Read: 40 ms  (total 40 ms)

> Good to know: the reader does not know who you are, only which number it saw.
````

…and so on to the recap.

## Rules

- Header: title, minutes, level, step count; the question on its own line in bold; then
  the one-sentence summary and any note about simplified or invented values.
- Omit minutes and level when the walkthrough is not teaching material.
- Each step: `n / N · Chapter — Title`, the body, the diagram, the "what changed" lines,
  then the callout as a quote starting with its label (Key idea, Good to know, Watch out).
- The diagram is the same picture every time with one thing added. Keep node positions
  fixed across steps so the reader can see the difference. Use a Mermaid block when the
  client renders it, otherwise a text diagram; in a text diagram use only ASCII inside
  boxes if the reader's language uses wide characters, so columns stay aligned.
- In chat, the body may be one paragraph of up to 40 words when the diagram carries the rest.
- Put the running total at the end of the "what changed" lines.
- A try step: after the body print the prompt, then every option as a table row, because a
  message has no buttons. Draw the diagram for the base only.

  ```markdown
  **Try it:** Pick how long the server takes to answer.

  | Option | Result | Why |
  |---|---|---|
  | 60 ms | Opens in time | 110 ms in total, under the 300 ms people notice. |
  | 400 ms | Door hesitates | 450 ms in total, over the 300 ms people notice. |
  ```

  When the step is a prediction and the conversation is live, you may print the prompt and
  the option labels only, wait for the reader's pick, and answer with that row.
- Recap: one sentence with the result in numbers, a small table of the breakdown, 3–5
  takeaways, then what to look at next.
- Sources: after the recap, a "Where this comes from" list, one line per ledger entry:
  `data` or `assumption`, the claim, then where it comes from (a link when there is a URL).
  In a shortened reply keep this list; it is what lets the reader trust the numbers.
- Length: for 8 or more steps, give the first three or four and the recap, and offer to
  continue or to turn it into a page. Do not send a wall of steps unasked.
- If the user asked a narrow question, answer it in a sentence first, then offer the
  walkthrough.
