# Wording

The words are short because the stage does the showing. Treat the budgets as limits, not
targets to pad towards. A typical figure is given where it helps to aim below the limit.

## Budgets

| Element | Budget | Typical |
|---|---|---|
| Walkthrough title | 2–5 words | |
| Question | 1 question, ≤ 15 words | |
| Walkthrough summary | 1 sentence, 10–20 words | |
| Step title | about 5 words, never over 8 | 5 |
| Step short name | 1–2 words | one word more often than two |
| Step body | exactly 2 paragraphs | |
| Body paragraph | ≤ 40 words | about 30 |
| Callout | 1–2 sentences | |
| What changed | 1–3 lines | 2 or 3 |
| Try prompt | 1 sentence, ≤ 12 words | |
| Option label | 1–3 words: the value with its unit | |
| Verdict text | ≤ 4 words | |
| Verdict why | 1 sentence, ≤ 20 words | |
| Ledger claim | 1 line, ≤ 15 words, one value with its unit | |
| Goals (teaching material) | 4–6 per walkthrough, 4–8 words each | |
| Part callout (object lab) | title 1–2 words, body ≤ 2 short lines | body about 7 words |
| Lede (object lab) | 2 sentences | about 30 words |
| Feature bullets (object lab) | exactly 3 | |
| Phase caption (trace) | about 5 words | |
| Phase detail (trace) | 3 sentences | about 45 words |
| Facts (trace) | 3 label/value pairs | |
| Field note (trace) | 1 line | about 11 words |
| Sub-step (procedure) | 1 imperative line | about 7 words |

The page reports the budgets it can count as notes (`walkthrough-schema.md`, "What the
page checks"). Count the rest yourself.

## Voice

- Second person, present tense: "You type `shop.example` and press Enter."
- Say "we" only when deciding something together: "So we measure percentiles."
- Plain verbs. The server *asks*, *waits*, *sends back*. The battery *pushes*.
- One new term per step. Mark it once where it is introduced
  (`<span class="term">round trip</span>`) and give its meaning in the same sentence
  ("a round trip — there and back").
- Every claim that can carry a number carries one: "about 20 ms", "40 more files", "1 in 100".
- Tell the reader where to look: "Watch requests wait at the database."
- No praise, no "simply", no "as we know", no rhetorical warm-up. Start with the thing.
- Light humour only through concreteness (a case named after a person in a tunnel), never jokes.

## The body's two paragraphs

Paragraph 1 says what happens and why. Paragraph 2 gives the number or tells the reader what to watch.

> The products don't live in the web server — they live in a database. The server sends a
> query and waits for the rows to come back.
>
> Watch a request travel all the way in and the response all the way out.

## Titles by chapter

| Chapter | Pattern | Examples |
|---|---|---|
| `setup` | the starting state, or "put numbers on it" | "One leader, two followers" · "The brief: a link shortener" · "Put numbers on it" |
| `problem` | a complaint, a failure, or `Case:` + a concrete situation | "Users say the shop feels slow" · "…until Server A dies" · "Case: Bob is in a tunnel" |
| `technique` | a short statement of the action | "Open a connection" · "Add workers to drain it" · "Retry the blips" |
| `solution` | the fix stated as what you now do | "Put copies at the edge" · "Fix it, then prove it" · "Failover in seconds" |
| `insight` | the general truth | "Averages hide the pain" · "Consistency is a spectrum" |
| `tradeoff` | what it costs | "Every index makes writes slower" · "What consensus costs" · "…until you hit the ceiling" |
| `recap` | "Recap", or the question the walkthrough answered | "Where the time went" · "The finished design" |

Devices worth copying:

- **`Case:`** prefix for a step that stress-tests the idea with one concrete change.
- **Leading ellipsis** to continue the previous title: "Way 1 — scale up" then "…until you hit the ceiling" then "…and it's a single point of failure".
- **Numbers in titles**: "One page, forty more requests", "Fifty engineers, one codebase".
- **Named people** (Alice, Bob) and named places (Sydney, Virginia) instead of "a user" and "a region".

## Callouts

One per step at most. Most steps have one; a step that needs none goes without.

| Kind | Label shown | Use for | Example |
|---|---|---|---|
| `insight` | Key idea | the one sentence to remember from this step | "Round-trip time is set by distance and the network, not by how fast your server is." |
| `tip` | Good to know | a practical consequence or a pointer to another walkthrough | "Answers are cached for a time-to-live. For the next few minutes, repeat visits skip this step entirely." |
| `warn` | Watch out | a misconception or a cost | "A compensation is a new action, not a rollback. A refund is not the same as never having charged." |
| `next` | Next up | recap step only | "Next up: **Napkin Math** — estimating how much capacity you need before you build anything." |

Reach for a tip first, an insight when the step holds the one sentence to remember, and a
warning only for a real misconception or cost.

## What changed

A diff of the stage, in the reader's words. Three markers:

```
+ Database                     something appeared
~ DB time 15 → 400 ms          something changed; show before → after
− Server B                     something was removed or failed
```

Write a line only if the reader can see that difference on the stage.

## Question

The question a newcomer would ask, in their words, answerable with one number. It names or
implies the thing that moves. Start with Why, How, What happens when, or How many.

- "Why does the door sometimes hesitate?"
- "Why is the second page load faster than the first?"
- "What happens to orders when the payment service is down?"

Not a topic ("Door access"), not two questions joined by "and", not a promise ("Learn how
doors work"). The summary line that follows it says how the walkthrough will answer.

## Summary line

One sentence that promises a concrete journey or names a tension. Patterns:

- Follow one X step by step, and find out Y: "Follow one page load hop by hop — and find out where the time really goes."
- A predicament, then the choice: "Your one server is melting. Do you buy a bigger one, or more of them?"
- Why the same thing differs: "Why the same query can take two seconds or two milliseconds."
- What it is, and what it gives up: "Tables, documents or plain keys — what each kind of database is good at, and what it gives up."

## Goals

When the walkthrough is teaching material, write each goal as a "what" or "why" clause the
reader can check against themselves, tied to the step that shows it: "What DNS does and why it
is cached" · "Why a connection costs round trips" · "Tell latency and throughput apart". The
last goal usually names the cases.

## Recap step

1. One sentence that restates the result in numbers ("Of 155 ms, only about 25 ms was the
   server and database actually working.").
2. Three to five takeaways, each one line, key noun in bold, written as a rule the reader
   can reuse ("Connections cost **round trips** — reuse them.").
3. A `next` callout: the next walkthrough's name and the question it answers.

## Try step

- **Prompt:** tell the reader what to choose, naming the variable: "Pick how long the
  server takes to answer." For a prediction, the body asks and the prompt invites: "Choose
  a delay and see."
- **Option label:** the value alone, with its unit: "60 ms", "400 ms", "2 s". Not
  "Fast server".
- **Verdict text:** the outcome as the reader would say it: "Opens in time", "Door
  hesitates", "Tap fails". Pick the tone to match: green fine, amber worse, red broken.
- **Why:** one sentence that names the number that decided it: "110 ms in total, under the
  300 ms people notice."

## Sources

A ledger claim is one checkable statement with its value and unit: "Reading a card takes
40 ms", not "Card timing". Name where it comes from precisely enough to find again: a file
and line, a document and section, a named measurement with its date. For an assumption, say
in a few words why the value is reasonable or that it is illustrative.

## Object lab wording

- Lede: sentence 1 says what is on the stage; sentence 2 says what makes it behave.
  "Your first circuit: an LED and a resistor on a breadboard, driven by pin 13. Switching the
  pin on and off with a pause in between makes it blink."
- Three bullets: the idea, then two invitations that start with a verb:
  "Click the resistor to try other values".
- Part callouts say what the part does in this setup, not what it is in general:
  "Bulb — How bright shows how much current." · "Battery — Current leaves its + and comes back to −."
- Metaphor first, formula second, and keep the metaphor's words in the formula tab:
  "Volt pushes: the voltage. Amp is what gets through: the current. Ohm squeezes the pipe: the resistance." then "I = V ÷ R".
- The formula is shown with the live values substituted: "I = 3.0 V ÷ 220 Ω = 14 mA".
- End a maths tab with one line that ties it to ordinary life:
  "Every light switch in your home is a gap like this one, opened and closed."
- State the convention when it conflicts with reality (conventional current versus electron drift).

## Trace wording

- Phase caption is a plain result, not a protocol term: "Finds the server's IP address",
  "Proof, without the password", "Only the missing bytes".
- Field notes answer "what is this for?": "Lets the receiver reassemble the pieces if the
  packet gets split." If a field does nothing, say so: "Has no job in TLS 1.3; sent so
  middleboxes see a familiar handshake."
- Put asides about the real world in brackets at the end:
  "(Browsers now try https:// first; this is the plain version.)"

## Procedure wording

- Sub-steps start with a physical verb: Lay, Put, Cut, Tie, Pour, Mark, Wrap, Stack.
- Include the detail that prevents the common mistake: "Mark the very tip of the shadow with a stone."
- The stage instruction says what to have ready before the risky action:
  "Collect every size of fuel before you strike a match."

## Translating

If a walkthrough will be translated, keep one data file per language: keep sentences short
and literal, avoid idiom, keep identifiers, commands and units untranslated, and re-check
the word budgets in the target language.
