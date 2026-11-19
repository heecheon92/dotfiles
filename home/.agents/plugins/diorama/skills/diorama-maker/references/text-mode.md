# Chat mode

The same walkthrough, rendered as a message. Use it when a page would be overkill. Plan the
walkthrough as data first (`walkthrough-schema.md`), then print it in this shape.

## Shape

````markdown
**How a Badge Tap Works** · 9 min · beginner · 10 steps
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

- Header: title, minutes, level, step count, then the one-sentence summary and any note
  about simplified or invented values.
- Omit minutes and level when the walkthrough is not teaching material.
- Each step: `n / N · Chapter — Title`, the body, the diagram, the "what changed" lines,
  then the callout as a quote starting with its label (Key idea, Good to know, Watch out).
- The diagram is the same picture every time with one thing added. Keep node positions
  fixed across steps so the reader can see the difference. Use a Mermaid block when the
  client renders it, otherwise a text diagram; in a text diagram use only ASCII inside
  boxes if the reader's language uses wide characters, so columns stay aligned.
- In chat, the body may be one paragraph of up to 40 words when the diagram carries the rest.
- Put the running total at the end of the "what changed" lines.
- Recap: one sentence with the result in numbers, a small table of the breakdown, 3–5
  takeaways, then what to look at next.
- Length: for 8 or more steps, give the first three or four and the recap, and offer to
  continue or to turn it into a page. Do not send a wall of steps unasked.
- If the user asked a narrow question, answer it in a sentence first, then offer the
  walkthrough.
