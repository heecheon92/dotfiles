Diorama.collection({
  "id": "example",
  "title": "How Door Access Works",
  "summary": "From one badge tap to a building of doors that keep working when the network does not.",
  "note": "An example collection: replace this outline with your own. Timings are illustrative round numbers.",
  "options": { "ordered": true, "progress": true, "showPlanned": true, "showDrafts": true },
  "sections": [
    {
      "id": "one-door",
      "title": "One door",
      "items": [
        {
          "id": "badge-tap",
          "title": "How a Badge Tap Works",
          "summary": "Follow one card tap from the reader to the lock, and find out why the door sometimes hesitates.",
          "status": "approved",
          "minutes": 9,
          "level": "beginner"
        },
        {
          "id": "held-door",
          "title": "When a Door Is Held Open",
          "summary": "Follow one door that stays open too long, from the contact sensor to the alarm at the desk.",
          "status": "planned"
        }
      ]
    },
    {
      "id": "many-doors",
      "title": "Many doors",
      "items": [
        {
          "id": "sync",
          "title": "Keeping Copies in Sync",
          "summary": "Follow one cancelled card from the office to every door, and see what decides how long that takes.",
          "status": "drafted",
          "minutes": 9,
          "level": "beginner"
        },
        {
          "id": "door-groups",
          "title": "Who May Open Which Door",
          "summary": "Follow one new rule from the admin screen to the forty doors it covers.",
          "status": "planned"
        }
      ]
    }
  ]
});
