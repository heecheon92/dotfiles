Diorama.walkthrough({
  "id": "sync",
  "title": "Keeping Copies in Sync",
  "summary": "Follow one cancelled card from the office to every door, and see what decides how long that takes.",
  "minutes": 9,
  "level": "beginner",
  "note": "Times are illustrative round numbers, not measurements of a real product.",
  "goals": [
    { "text": "Why a cancelled card can keep working", "step": 2 },
    { "text": "What polling costs and what pushing saves", "step": 4 },
    { "text": "What a cut-off door has to decide alone", "step": 7 },
    { "text": "How an offline door catches up", "step": 8 }
  ],
  "metrics": [
    { "id": "wait", "label": "Waiting", "unit": "s", "icon": "clock" },
    { "id": "send", "label": "Sending", "unit": "s", "icon": "bolt" },
    { "id": "apply", "label": "Applying", "unit": "s", "icon": "gear" },
    { "id": "total", "label": "Until the door knows", "unit": "s", "icon": "shield" }
  ],
  "legend": [
    { "kind": "write", "label": "change" },
    { "kind": "request", "label": "question" },
    { "kind": "response", "label": "answer" }
  ],
  "nodes": {
    "admin": { "type": "device", "x": 0, "y": -16, "color": "gray", "label": "Mina", "sub": "front desk" },
    "server": { "type": "block", "x": 0, "y": -6, "color": "orange", "glyph": "server", "label": "Access server", "sub": "in the office" },
    "rules": { "type": "db", "x": -9, "y": -6, "color": "violet", "glyph": "database", "label": "Rules", "sub": "who may enter" },
    "building": { "type": "zone", "x": 4.5, "y": 7, "w": 19, "h": 13, "color": "gray", "label": "Building 1" },
    "labA": { "type": "block", "x": 0, "y": 5, "color": "blue", "glyph": "door", "label": "Lab A", "sub": "door controller" },
    "lobby": { "type": "block", "x": 9, "y": 5, "color": "blue", "glyph": "door", "label": "Lobby", "sub": "door controller" },
    "backlog": { "type": "queue", "x": 8, "y": -6, "color": "yellow", "label": "Kept for later" }
  },
  "links": {
    "cancel": { "from": "admin", "to": "server", "label": "cancel 0412" },
    "store": { "from": "server", "to": "rules", "label": "save" },
    "sync": { "from": "server", "to": "labA", "label": "sync every 5 min" },
    "syncLobby": { "from": "server", "to": "lobby", "label": "push" },
    "hold": { "from": "server", "to": "backlog", "label": "keep" }
  },
  "steps": [
    {
      "short": "Cancel",
      "chapter": "problem",
      "title": "A lost card must stop working",
      "body": [
        "At 09:00 someone reports card <code>0412</code> lost. Mina cancels it at the front desk, and the access server records the change.",
        "From the last walkthrough you know each door keeps its own copy of the rules. So the real question is: <b>when does the door find out?</b>"
      ],
      "callout": { "kind": "insight", "text": "Changing a rule in one place is easy. The work is getting every copy of it to agree." },
      "metrics": { "wait": null, "send": null, "apply": null, "total": null },
      "scene": {
        "show": ["admin", "server"],
        "state": { "server": { "load": 0.1 } },
        "links": { "cancel": {} },
        "flows": [{ "route": ["cancel"], "kind": "write", "rate": 0.7 }],
        "panel": null
      }
    },
    {
      "short": "Save",
      "chapter": "setup",
      "title": "The server saves the change",
      "body": [
        "The server writes the cancellation into its rules. From this moment the office copy is right: card <code>0412</code> may enter nowhere.",
        "Nothing has left the office yet. The doors are in another building, each with a copy made earlier this morning."
      ],
      "changes": ["+ Rules in the office", "+ 0412 cancelled at 09:00"],
      "metrics": { "wait": null, "send": null, "apply": null, "total": null },
      "scene": {
        "show": ["admin", "server", "rules"],
        "state": {
          "server": { "load": 0.1 },
          "rules": { "load": 0.4, "tags": [{ "text": "0412 · cancelled", "tone": "red" }] }
        },
        "links": { "cancel": {}, "store": {} },
        "flows": [{ "route": ["cancel", "store"], "kind": "write", "rate": 0.7 }],
        "panel": null
      }
    },
    {
      "short": "Old copy",
      "chapter": "problem",
      "title": "The door still has the old copy",
      "body": [
        "Lab A's controller last fetched the rules at 08:58. In its copy card <code>0412</code> is still allowed, so right now the lost card opens the lab.",
        "The controller asks for changes every five minutes. Its next question is due at 09:03, <b>180 seconds</b> away."
      ],
      "callout": { "kind": "warn", "text": "A copy is only as fresh as its last update. Until then it answers confidently with old information." },
      "changes": ["+ Lab A door", "~ Its copy is from 08:58"],
      "metrics": { "wait": 180, "send": null, "apply": null, "total": 180 },
      "scene": {
        "show": ["admin", "server", "rules", "building", "labA"],
        "state": {
          "server": { "load": 0.1 },
          "rules": { "load": 0.4, "tags": [{ "text": "0412 · cancelled", "tone": "red" }] },
          "labA": { "heat": 0.6, "tags": [{ "text": "0412 · still allowed", "tone": "amber", "icon": "clock" }] }
        },
        "links": { "cancel": { "style": "off", "label": "" }, "store": { "style": "off", "label": "" }, "sync": { "style": "dashed" } },
        "flows": [],
        "panel": null
      }
    },
    {
      "short": "Poll",
      "chapter": "technique",
      "title": "The door asks what changed",
      "body": [
        "At 09:03 the controller asks the server: <em>anything new since 08:58?</em> This is <span class=\"term\">polling</span>: the copy asks on a timer.",
        "The answer takes a second to arrive and a second to apply. The lost card stops working <b>182 seconds</b> after Mina cancelled it."
      ],
      "callout": { "kind": "tip", "text": "With polling, the delay is mostly the wait for the next question. Asking more often shortens it but multiplies the traffic." },
      "changes": ["+ Sending: 1 s", "+ Applying: 1 s", "~ Lab A now refuses 0412"],
      "metrics": { "wait": 180, "send": 1, "apply": 1, "total": 182 },
      "scene": {
        "show": ["admin", "server", "rules", "building", "labA"],
        "state": {
          "server": { "load": 0.2 },
          "rules": { "load": 0.4 },
          "labA": { "tags": [{ "text": "0412 · refused", "tone": "green", "icon": "check" }] }
        },
        "links": { "cancel": { "style": "off", "label": "" }, "store": { "style": "off", "label": "" }, "sync": { "label": "anything new?" } },
        "flows": [{ "route": ["~sync"], "kind": "request", "bounce": true, "rate": 0.8 }],
        "panel": null
      }
    },
    {
      "short": "Push",
      "chapter": "solution",
      "title": "Send the change the moment it happens",
      "body": [
        "Turn the direction around. The door keeps a connection open, and the server sends each change down it at once. This is <span class=\"term\">pushing</span>.",
        "There is no wait for a timer. One second to send, one to apply: the card is dead at the lab door after <b>2 seconds</b>."
      ],
      "changes": ["~ Server pushes changes", "~ Waiting 180 → 0 s", "~ Total 182 → 2 s"],
      "metrics": { "wait": 0, "send": 1, "apply": 1, "total": 2 },
      "scene": {
        "show": ["admin", "server", "rules", "building", "labA"],
        "state": {
          "server": { "load": 0.2 },
          "rules": { "load": 0.4 },
          "labA": { "tags": [{ "text": "0412 · refused", "tone": "green", "icon": "check" }] }
        },
        "links": { "cancel": {}, "store": { "style": "off", "label": "" }, "sync": { "label": "push" } },
        "flows": [{ "route": ["cancel", "sync"], "kind": "write", "rate": 0.8 }],
        "panel": null
      }
    },
    {
      "short": "All doors",
      "chapter": "technique",
      "title": "Every door hears at once",
      "body": [
        "The building has more than one door. The server pushes the same change to the lobby controller at the same moment.",
        "Each door applies it by itself, so adding doors adds messages, not delay. Both doors refuse the card 2 seconds after the cancellation."
      ],
      "changes": ["+ Lobby door", "+ One push per door"],
      "metrics": { "wait": 0, "send": 1, "apply": 1, "total": 2 },
      "scene": {
        "show": ["admin", "server", "rules", "building", "labA", "lobby"],
        "state": {
          "server": { "load": 0.3 },
          "rules": { "load": 0.4 },
          "labA": { "tags": [{ "text": "0412 · refused", "tone": "green", "icon": "check" }] },
          "lobby": { "tags": [{ "text": "0412 · refused", "tone": "green", "icon": "check" }] }
        },
        "links": { "cancel": {}, "store": { "style": "off", "label": "" }, "sync": { "label": "push" }, "syncLobby": {} },
        "flows": [
          { "route": ["cancel", "sync"], "kind": "write", "rate": 0.6 },
          { "route": ["syncLobby"], "kind": "write", "rate": 0.6 }
        ],
        "panel": null
      }
    },
    {
      "short": "Offline",
      "chapter": "problem",
      "title": "Case: the lobby door is unplugged",
      "body": [
        "Run it again, but at 08:59 a cleaner knocks out the lobby controller's network cable. The push at 09:00 reaches Lab A and never reaches the lobby.",
        "The server notices and <b>keeps the change</b> for later. Meanwhile the lobby door still trusts its old copy."
      ],
      "callout": { "kind": "warn", "text": "A push only helps a door that is listening. Every push needs a plan for the door that was not." },
      "changes": ["− Connection to the lobby", "+ One change kept for later", "~ Lobby still allows 0412"],
      "metrics": { "wait": null, "send": null, "apply": null, "total": null },
      "scene": {
        "show": ["admin", "server", "rules", "building", "labA", "lobby", "backlog"],
        "state": {
          "server": { "load": 0.3 },
          "rules": { "load": 0.4 },
          "labA": { "tags": [{ "text": "0412 · refused", "tone": "green", "icon": "check" }] },
          "lobby": { "heat": 0.8, "tags": [{ "text": "0412 · still allowed", "tone": "red", "icon": "alert" }] },
          "backlog": { "count": 1 }
        },
        "links": { "cancel": { "style": "off", "label": "" }, "store": { "style": "off", "label": "" }, "sync": { "label": "push" }, "syncLobby": { "style": "cut", "label": "unplugged" }, "hold": {} },
        "flows": [
          { "route": ["sync"], "kind": "write", "rate": 0.6 },
          { "route": ["syncLobby"], "kind": "write", "rate": 0.6, "fail": 1 }
        ],
        "panel": null
      }
    },
    {
      "short": "Alone",
      "chapter": "tradeoff",
      "title": "A door that cannot hear must choose",
      "body": [
        "The lobby controller cannot tell a quiet morning from a broken cable. It can keep opening with its old copy, or refuse everyone after too long without contact.",
        "Keep opening, and a cancelled card works. Refuse, and one loose cable locks out the whole building."
      ],
      "callout": { "kind": "insight", "text": "Decide in advance how old a copy may get before the door stops trusting it. Five minutes suits a lab; a fire exit needs another answer." },
      "changes": ["~ Lobby last heard from the office at 08:58"],
      "metrics": { "wait": null, "send": null, "apply": null, "total": null },
      "scene": {
        "show": ["admin", "server", "rules", "building", "labA", "lobby", "backlog"],
        "state": {
          "server": { "load": 0.2 },
          "rules": { "load": 0.4 },
          "labA": { "dim": true },
          "lobby": { "heat": 0.8, "tags": [{ "text": "last heard 08:58", "tone": "amber", "icon": "clock" }] },
          "backlog": { "count": 1 }
        },
        "links": { "cancel": { "style": "off", "label": "" }, "store": { "style": "off", "label": "" }, "sync": { "style": "off", "label": "" }, "syncLobby": { "style": "cut", "label": "unplugged" }, "hold": { "style": "dashed" } },
        "flows": [],
        "panel": null
      }
    },
    {
      "short": "Catch up",
      "chapter": "solution",
      "title": "On reconnect, the door catches up",
      "body": [
        "At 09:10 the cable goes back in. The controller's first act is to ask: <em>what did I miss since 08:58?</em> The server hands over the kept change.",
        "The lobby door learned of the cancellation <b>602 seconds</b> late: 600 spent offline, then the usual 2."
      ],
      "callout": { "kind": "tip", "text": "Push for speed, and a catch-up question on reconnect for safety. Neither alone covers both cases." },
      "changes": ["+ Connection restored at 09:10", "− Kept change delivered", "~ Lobby now refuses 0412"],
      "metrics": { "wait": 600, "send": 1, "apply": 1, "total": 602 },
      "scene": {
        "show": ["admin", "server", "rules", "building", "labA", "lobby"],
        "state": {
          "server": { "load": 0.3 },
          "rules": { "load": 0.4 },
          "labA": { "tags": [{ "text": "0412 · refused", "tone": "green", "icon": "check" }] },
          "lobby": { "tags": [{ "text": "0412 · refused", "tone": "green", "icon": "check" }] }
        },
        "links": { "cancel": { "style": "off", "label": "" }, "store": { "style": "off", "label": "" }, "sync": { "label": "push" }, "syncLobby": { "label": "what did I miss?" } },
        "flows": [{ "route": ["~syncLobby"], "kind": "request", "bounce": true, "rate": 0.8 }],
        "panel": null
      }
    },
    {
      "short": "Recap",
      "chapter": "recap",
      "title": "How long until every door knows",
      "body": [
        "The same cancellation took <b>182 s</b> with polling, <b>2 s</b> with a push, and 602 s to reach a door that was offline for ten minutes.",
        "<ul class=\"takeaways\"><li>With <b>polling</b>, the delay is the wait for the next question.</li><li>A <b>push</b> removes the wait, for doors that are listening.</li><li>Keep changes for doors that are not, and let them <b>catch up</b> on reconnect.</li><li>Decide how <b>old</b> a copy may get before a door stops trusting it.</li></ul>"
      ],
      "callout": { "kind": "next", "text": "<b>A Morning Rush</b>: what happens to these doors when two hundred people arrive at 08:55." },
      "metrics": { "wait": 0, "send": 1, "apply": 1, "total": 2 },
      "scene": {
        "show": ["admin", "server", "rules", "building", "labA", "lobby"],
        "state": {
          "server": { "load": 0.2 },
          "rules": { "load": 0.4 },
          "labA": { "tags": [{ "text": "2 s", "tone": "green" }] },
          "lobby": { "tags": [{ "text": "2 s · 602 s if offline", "tone": "green" }] }
        },
        "links": { "cancel": {}, "store": { "style": "off", "label": "" }, "sync": { "label": "push" }, "syncLobby": {} },
        "flows": [
          { "route": ["cancel", "sync"], "kind": "write", "rate": 0.6 },
          { "route": ["syncLobby"], "kind": "write", "rate": 0.6 }
        ],
        "panel": {
          "title": "Until the door knows",
          "lines": ["Polling, next question at 09:03   182 s", "Push                               2 s", "! Offline 10 min, then catch-up   602 s", "# all for the same cancelled card"]
        }
      }
    }
  ]
});
