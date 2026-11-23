# Template references

Use these examples when choosing how a reader should explore a subject. They are references for interaction design, not templates bundled with Diorama. The [roadmap](ROADMAP.md) tracks what is planned; link to the original work rather than copying its artwork or code.

## Starting points

- **Story — [Designed to Scale](https://designed-to-scale.vercel.app/#/), Dilum Sanjaya.** Start here when the reader needs to understand *why* a system behaves a certain way. Each system-design idea has an animated diagram the reader steps through; notice what changes between steps and what stays in place.
- **Cause and effect — [Electronics 101: Open and closed circuits](https://electronics-101-six.vercel.app/closed-loop), Dilum Sanjaya.** One switch breaks the loop and current stops everywhere. A useful model for a try step: change one thing and show its consequence across the whole scene.
- **Trace — [Protocol Explorer](https://protocol-explorer-alpha.vercel.app/), Dilum Sanjaya.** Follow one exchange packet by packet, then inspect what a packet contains. Study the shift from the sequence to the selected message; Diorama need not reproduce the byte-level decoder.
- **Lab, 3D stage, self-assembly and contrast — [SIMULAB](https://github.com/ecapri-dev/simulab-skill), @0xKapri.** Watch the [espresso animation](https://raw.githubusercontent.com/ecapri-dev/simulab-skill/main/docs/espresso.gif) for a lab whose readings come from one model. The [sonar image](https://raw.githubusercontent.com/ecapri-dev/simulab-skill/main/docs/lab01-sonar.jpg) shows how to arrange physical parts on a stage; the [Blink still](https://raw.githubusercontent.com/ecapri-dev/simulab-skill/main/docs/blink.jpg) shows the finished assembly. For pacing rather than appearance, see the project's guidance on building the scene piece by piece and explaining it in three chapters: wrong, right, too much.

## References for specific reader actions

- **Inspect a selected message — [Wireshark's main window](https://www.wireshark.org/docs/wsug_html_chunked/ChUseMainWindowSection.html) ([screenshot](https://www.wireshark.org/docs/wsug_html_chunked/images/ws-main.png)).** Selecting a packet connects a row in the exchange to its decoded fields. Borrow that relationship for Trace, not the density of the interface.
- **Look inside a machine — [Mechanical Watch](https://ciechanow.ski/mechanical-watch/), Bartosz Ciechanowski.** Drag to change the viewing angle and use a slider to see inside. For a 3D stage or self-assembly piece, ask which parts must separate for the reader to see how they fit.
- **Compare alternatives — [Sorting Algorithms Animations](https://www.toptal.com/developers/sorting-algorithms).** Play one row to compare different algorithms on the same starting condition. Keeping the input and visual scale fixed makes the effect of the design choice legible.
- **Observe a live system — [Microsimulation of Traffic Flow: Onramp](https://traffic-simulation.de/), Martin Treiber.** Watch vehicles merge on one clock rather than advance one car per authored step. This is a complementary example, not the Nyxera simulator article mentioned in the roadmap; that original link is still unidentified.
